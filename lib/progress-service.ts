/**
 * Progress Service — the ONLY layer that touches the UserProgress collections
 * (`userProblemProgress`, `userDailyActivity`, `userStreak`). Mirrors the
 * content-service / user-service boundary: Server Actions import from here,
 * never from lib/mongodb directly.
 *
 * Write path only lives behind Server Actions (D16 keeps the /api layer
 * read-only). All returned documents are serialized to plain JSON via toPlain()
 * so they cross the Server→Client boundary safely (ObjectId/Date have .toJSON).
 *
 * Identity: `session.user.id` is a hex string; it is converted to an ObjectId
 * with `new ObjectId(id)` before it touches storage. `userId`/`problemId` are
 * stored as ObjectId (D10 _id relationships).
 */
import { ObjectId, type Db } from "mongodb";
import clientPromise from "./mongodb";
import { auth } from "@/auth";
import {
  getProblemsByIds,
  getProblemFacets,
  getSiteStats,
  getProblemAfterNumber,
} from "./content-service";
import type {
  ProgressStatus,
  ProgressSummary,
  Heatmap,
  HeatmapCell,
  DifficultySlug,
  Problem,
} from "./types";

const DB = "knacktor";

async function db(): Promise<Db> {
  return (await clientPromise).db(DB);
}

// Strips ObjectId (.toJSON → hex) and Date (.toJSON → ISO) so returned objects
// are plain and safe to pass to Client Components.
function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── Raw Mongo doc shapes (ObjectId/Date; private to this layer) ────────────────

/** One doc per user×problem — source of truth for status, bookmark, note. */
interface RawUserProblemProgress {
  _id: ObjectId;
  userId: ObjectId;
  problemId: ObjectId;
  status: ProgressStatus;
  bookmarked: boolean;
  note: string;
  firstAttemptedAt: Date | null;
  solvedAt: Date | null;
  lastActivityAt: Date;
}

/** One doc per user×local-day — O(1) heatmap + streak reads. */
interface RawUserDailyActivity {
  _id: ObjectId;
  userId: ObjectId;
  date: string; // "YYYY-MM-DD" in the user's local timezone
  solves: number;
  attempts: number;
}

/** One doc per user — freeze consumption is not purely derivable. */
interface RawUserStreak {
  _id: ObjectId;
  userId: ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastSolveDate: string | null; // local "YYYY-MM-DD"
  timezone: string;
  freezesAvailable: number; // reset to 1 each week
  freezeWeekAnchor: string; // week key used to reset freezesAvailable
}

// ── Collection accessors ───────────────────────────────────────────────────────

async function progressCol() {
  return (await db()).collection<RawUserProblemProgress>("userProblemProgress");
}
async function dailyCol() {
  return (await db()).collection<RawUserDailyActivity>("userDailyActivity");
}
async function streakCol() {
  return (await db()).collection<RawUserStreak>("userStreak");
}

// ── Lazy, idempotent index setup (mirrors user-service ensureUserIndexes) ───────
let indexesReady: Promise<void> | undefined;

function ensureProgressIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const [progress, daily, streak] = await Promise.all([
        progressCol(),
        dailyCol(),
        streakCol(),
      ]);
      await Promise.all([
        progress.createIndex({ userId: 1, problemId: 1 }, { unique: true }),
        progress.createIndex({ userId: 1, status: 1 }),
        progress.createIndex({ userId: 1, bookmarked: 1 }),
        daily.createIndex({ userId: 1, date: 1 }, { unique: true }),
        streak.createIndex({ userId: 1 }, { unique: true }),
      ]);
    })().catch((err) => {
      indexesReady = undefined; // allow retry on transient failure
      throw err;
    });
  }
  return indexesReady;
}

// Re-exported so business-logic functions (added in later phases) can await the
// index bootstrap before their first read/write.
export { ensureProgressIndexes, progressCol, dailyCol, streakCol, toPlain, db };
export type { RawUserProblemProgress, RawUserDailyActivity, RawUserStreak };

/**
 * The signed-in user's id (hex string), or null when anonymous. Wraps the
 * NextAuth session; never throws — callers degrade gracefully for anon users.
 */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Convert a hex session id to an ObjectId (throws on malformed input). */
export function toUserObjectId(userId: string): ObjectId {
  return new ObjectId(userId);
}

// ── Local-day keying (streak/heatmap "day" = user's local calendar day) ────────

/** "YYYY-MM-DD" for `date` in the given IANA timezone (en-CA formats as ISO). */
export function localDayKey(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

/** Increment a day's rollup counter, creating the doc if absent. */
async function bumpDaily(
  userId: ObjectId,
  day: string,
  field: "solves" | "attempts",
  delta: number
): Promise<void> {
  const daily = await dailyCol();
  const other = field === "solves" ? "attempts" : "solves";
  await daily.updateOne(
    { userId, date: day },
    {
      $setOnInsert: { userId, date: day, [other]: 0 },
      $inc: { [field]: delta },
    },
    { upsert: true }
  );
}

// ── Writes ─────────────────────────────────────────────────────────────────────

/**
 * Auto "Attempted" on engagement. Deduped: no-op once a doc has advanced past
 * `todo`, so opening a problem writes at most once. Increments the day's
 * `attempts` only on the first todo→attempted transition.
 */
export async function recordAttempt(
  userId: string,
  problemId: string,
  tz: string
): Promise<void> {
  await ensureProgressIndexes();
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  const col = await progressCol();
  const now = new Date();

  const existing = await col.findOne(
    { userId: uid, problemId: pid },
    { projection: { status: 1, firstAttemptedAt: 1 } }
  );
  if (existing && existing.status !== "todo") return; // already attempted/solved

  const set: Partial<RawUserProblemProgress> = {
    status: "attempted",
    lastActivityAt: now,
  };
  if (!existing || existing.firstAttemptedAt == null) set.firstAttemptedAt = now;

  await col.updateOne(
    { userId: uid, problemId: pid },
    {
      $setOnInsert: {
        userId: uid,
        problemId: pid,
        bookmarked: false,
        note: "",
        solvedAt: null,
      },
      $set: set,
    },
    { upsert: true }
  );

  await bumpDaily(uid, localDayKey(now, tz), "attempts", 1);
}

/** Manual completion. Increments the day's `solves` once per solve. */
export async function markSolved(
  userId: string,
  problemId: string,
  tz: string
): Promise<void> {
  await ensureProgressIndexes();
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  const col = await progressCol();
  const now = new Date();

  const existing = await col.findOne(
    { userId: uid, problemId: pid },
    { projection: { status: 1 } }
  );
  const alreadySolved = existing?.status === "solved";

  await col.updateOne(
    { userId: uid, problemId: pid },
    {
      $setOnInsert: {
        userId: uid,
        problemId: pid,
        bookmarked: false,
        note: "",
        firstAttemptedAt: now,
      },
      $set: { status: "solved", solvedAt: now, lastActivityAt: now },
    },
    { upsert: true }
  );

  if (!alreadySolved) {
    const day = localDayKey(now, tz);
    await bumpDaily(uid, day, "solves", 1);
    await recomputeStreakOnSolve(uid, day, tz);
  }
}

/** Revert a solve back to "attempted"; decrements that day's `solves`. */
export async function unmarkSolved(
  userId: string,
  problemId: string,
  tz: string
): Promise<void> {
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  const col = await progressCol();

  const existing = await col.findOne(
    { userId: uid, problemId: pid },
    { projection: { status: 1, solvedAt: 1 } }
  );
  if (!existing || existing.status !== "solved") return;

  const now = new Date();
  await col.updateOne(
    { userId: uid, problemId: pid },
    { $set: { status: "attempted", solvedAt: null, lastActivityAt: now } }
  );
  await bumpDaily(uid, localDayKey(existing.solvedAt ?? now, tz), "solves", -1);
}

/** Generic status setter. `solved` delegates so daily counts stay accurate. */
export async function setStatus(
  userId: string,
  problemId: string,
  status: ProgressStatus,
  tz: string
): Promise<void> {
  if (status === "solved") return markSolved(userId, problemId, tz);
  await ensureProgressIndexes();
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  const col = await progressCol();
  const now = new Date();

  // Moving off "solved" reuses the decrement path.
  const existing = await col.findOne(
    { userId: uid, problemId: pid },
    { projection: { status: 1, solvedAt: 1 } }
  );
  if (existing?.status === "solved") {
    await bumpDaily(uid, localDayKey(existing.solvedAt ?? now, tz), "solves", -1);
  }

  await col.updateOne(
    { userId: uid, problemId: pid },
    {
      $setOnInsert: {
        userId: uid,
        problemId: pid,
        bookmarked: false,
        note: "",
        firstAttemptedAt: status === "attempted" ? now : null,
      },
      $set: { status, solvedAt: null, lastActivityAt: now },
    },
    { upsert: true }
  );
}

/** Flip the (status-independent) bookmark flag; returns the new value. */
export async function toggleBookmark(
  userId: string,
  problemId: string
): Promise<boolean> {
  await ensureProgressIndexes();
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  const col = await progressCol();

  const existing = await col.findOne(
    { userId: uid, problemId: pid },
    { projection: { bookmarked: 1 } }
  );
  const next = !(existing?.bookmarked ?? false);

  await col.updateOne(
    { userId: uid, problemId: pid },
    {
      $setOnInsert: {
        userId: uid,
        problemId: pid,
        status: "todo",
        note: "",
        firstAttemptedAt: null,
        solvedAt: null,
      },
      $set: { bookmarked: next, lastActivityAt: new Date() },
    },
    { upsert: true }
  );
  return next;
}

// ── Streak (local-tz day boundary + 1 free freeze/week, decision 3 & 4) ────────

/** Whole-day difference b − a between two "YYYY-MM-DD" calendar keys. */
function dayDiff(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / 86_400_000);
}

/** The user's timezone stored at write time on `userStreak`, or "UTC". */
async function resolveStoredTz(userId: ObjectId): Promise<string> {
  const doc = await (await streakCol()).findOne(
    { userId },
    { projection: { timezone: 1 } }
  );
  return doc?.timezone ?? "UTC";
}

/** Monday-anchored week key ("YYYY-MM-DD" of that week's Monday). */
function weekAnchor(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const deltaToMonday = (d.getUTCDay() + 6) % 7; // 0=Sun → 6, 1=Mon → 0 …
  d.setUTCDate(d.getUTCDate() - deltaToMonday);
  return d.toISOString().slice(0, 10);
}

/**
 * Advance the streak for a solve landing on local `today`. A next-day solve
 * extends it; a single missed day is absorbed by the weekly freeze (auto-reset
 * to 1 each calendar week); a larger gap resets to 1. Idempotent for repeat
 * solves on the same day.
 */
async function recomputeStreakOnSolve(
  userId: ObjectId,
  today: string,
  tz: string
): Promise<void> {
  const col = await streakCol();
  const doc = await col.findOne({ userId });
  const wk = weekAnchor(today);

  if (!doc) {
    await col.updateOne(
      { userId },
      {
        $set: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastSolveDate: today,
          timezone: tz,
          freezesAvailable: 1,
          freezeWeekAnchor: wk,
        },
      },
      { upsert: true }
    );
    return;
  }

  // Weekly freeze reset.
  let freezes =
    doc.freezeWeekAnchor === wk ? doc.freezesAvailable : 1;

  let current = doc.currentStreak;
  if (!doc.lastSolveDate) {
    current = 1;
  } else {
    const gap = dayDiff(doc.lastSolveDate, today);
    if (gap <= 0) {
      // Same day (or clock skew): no change.
      current = doc.currentStreak;
    } else if (gap === 1) {
      current = doc.currentStreak + 1;
    } else if (gap === 2 && freezes >= 1) {
      // One missed day absorbed by a freeze.
      freezes -= 1;
      current = doc.currentStreak + 1;
    } else {
      current = 1;
    }
  }

  await col.updateOne(
    { userId },
    {
      $set: {
        currentStreak: current,
        longestStreak: Math.max(doc.longestStreak ?? 0, current),
        lastSolveDate: today,
        timezone: tz,
        freezesAvailable: freezes,
        freezeWeekAnchor: wk,
      },
    }
  );
}

/**
 * Effective streak as of `today` — a stale doc never shows a phantom streak.
 * Pure read (no writes): if the gap since the last solve has already broken the
 * streak (and a freeze can't cover it), the reported current streak is 0.
 */
export async function getStreak(
  userId: string,
  tz?: string
): Promise<import("./types").UserStreak> {
  const col = await streakCol();
  const doc = await col.findOne({ userId: toUserObjectId(userId) });
  const zone = tz ?? doc?.timezone ?? "UTC";
  const today = localDayKey(new Date(), zone);

  if (!doc) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSolveDate: null,
      timezone: zone,
      freezesAvailable: 1,
      freezeWeekAnchor: weekAnchor(today),
    };
  }

  const wk = weekAnchor(today);
  const freezes = doc.freezeWeekAnchor === wk ? doc.freezesAvailable : 1;

  let current = doc.currentStreak;
  if (doc.lastSolveDate) {
    const gap = dayDiff(doc.lastSolveDate, today);
    if (gap <= 1) {
      current = doc.currentStreak; // solved today or yesterday → still alive
    } else if (gap === 2 && freezes >= 1) {
      current = doc.currentStreak; // one missed day a freeze would absorb
    } else {
      current = 0; // broken
    }
  } else {
    current = 0;
  }

  return {
    currentStreak: current,
    longestStreak: doc.longestStreak ?? 0,
    lastSolveDate: doc.lastSolveDate,
    timezone: doc.timezone ?? zone,
    freezesAvailable: freezes,
    freezeWeekAnchor: wk,
  };
}

// ── Dashboard reads ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** `day` + `n` calendar days, as a "YYYY-MM-DD" key. */
function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** solves-driven intensity (0–4); an attempt-only day is a faint 1. */
function activityLevel(solves: number, attempts: number): number {
  if (solves >= 3) return 4;
  if (solves === 2) return 3;
  if (solves === 1) return 2;
  if (attempts > 0) return 1;
  return 0;
}

/**
 * GitHub-style activity grid: `weeks` columns × 7 chronological days ending
 * today (user-local), plus one month label per column. Pure read of
 * `userDailyActivity`.
 */
export async function getHeatmap(
  userId: string,
  tz?: string,
  weeks = 26
): Promise<Heatmap> {
  const uid = toUserObjectId(userId);
  const zone = tz ?? (await resolveStoredTz(uid));
  const today = localDayKey(new Date(), zone);
  const totalDays = weeks * 7;
  const start = addDays(today, -(totalDays - 1));

  const daily = await dailyCol();
  const docs = await daily
    .find(
      { userId: uid, date: { $gte: start, $lte: today } },
      { projection: { date: 1, solves: 1, attempts: 1 } }
    )
    .toArray();
  const byDate = new Map(docs.map((d) => [d.date, d]));

  const grid: HeatmapCell[][] = [];
  const months: string[] = [];
  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const hit = byDate.get(date);
      week.push({ date, level: activityLevel(hit?.solves ?? 0, hit?.attempts ?? 0) });
    }
    // Month label = the month of this column's first day, blank if unchanged.
    const m = MONTH_NAMES[new Date(`${week[0].date}T00:00:00Z`).getUTCMonth()];
    months.push(w === 0 || m !== months[months.length - 1] ? m : "");
    grid.push(week);
  }
  // Collapse repeated labels beyond the first occurrence to "" for a clean axis.
  let lastReal = "";
  for (let i = 0; i < months.length; i++) {
    if (months[i] && months[i] === lastReal) months[i] = "";
    else if (months[i]) lastReal = months[i];
  }
  return { weeks: grid, months };
}

/** _id hex list of the user's solved problems. */
async function solvedProblemIds(userId: ObjectId): Promise<string[]> {
  const col = await progressCol();
  const docs = await col
    .find({ userId, status: "solved" }, { projection: { problemId: 1 } })
    .toArray();
  return docs.map((d) => d.problemId.toHexString());
}

/** Progress ring (solved/total) + per-difficulty solved-vs-total bars. */
export async function getUserProgressSummary(
  userId: string
): Promise<ProgressSummary> {
  const uid = toUserObjectId(userId);
  const [solvedIds, facets, stats] = await Promise.all([
    solvedProblemIds(uid),
    getProblemFacets(),
    getSiteStats(),
  ]);
  const solvedProblems = await getProblemsByIds(solvedIds);

  const solvedByDiff: Record<string, number> = {};
  for (const p of solvedProblems) {
    solvedByDiff[p.difficulty] = (solvedByDiff[p.difficulty] ?? 0) + 1;
  }

  const order: DifficultySlug[] = ["easy", "medium", "hard"];
  return {
    solved: solvedIds.length,
    total: stats.problems,
    byDifficulty: order.map((slug) => ({
      label: slug,
      solved: solvedByDiff[slug] ?? 0,
      total: facets.difficulty[slug] ?? 0,
    })),
  };
}

/**
 * Most-recent attempted-but-not-solved problem + the next problem by number.
 * Returns the resolved Problem docs; the home page maps them to display shape
 * (it holds the topic/pattern name maps). Null when nothing is in progress.
 */
export async function getContinueLearningRaw(
  userId: string
): Promise<{ problem: Problem; upNext: Problem | null } | null> {
  const col = await progressCol();
  const doc = await col.findOne(
    { userId: toUserObjectId(userId), status: "attempted" },
    { projection: { problemId: 1 }, sort: { lastActivityAt: -1 } }
  );
  if (!doc) return null;
  const [problem] = await getProblemsByIds([doc.problemId.toHexString()]);
  if (!problem) return null;
  const upNext = await getProblemAfterNumber(problem.number);
  return { problem, upNext };
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** Status + bookmark for a single problem, or null when untouched. */
export async function getProblemProgress(
  userId: string,
  problemId: string
): Promise<{ status: ProgressStatus; bookmarked: boolean } | null> {
  const col = await progressCol();
  const doc = await col.findOne(
    { userId: toUserObjectId(userId), problemId: new ObjectId(problemId) },
    { projection: { status: 1, bookmarked: 1 } }
  );
  return doc ? { status: doc.status, bookmarked: doc.bookmarked } : null;
}

/** Status for a batch of problem ids (untouched ids are simply absent). */
export async function getProblemStatuses(
  userId: string,
  problemIds: string[]
): Promise<Record<string, ProgressStatus>> {
  if (!problemIds.length) return {};
  const col = await progressCol();
  const docs = await col
    .find(
      {
        userId: toUserObjectId(userId),
        problemId: { $in: problemIds.map((id) => new ObjectId(id)) },
      },
      { projection: { problemId: 1, status: 1 } }
    )
    .toArray();
  const out: Record<string, ProgressStatus> = {};
  for (const d of docs) out[d.problemId.toHexString()] = d.status;
  return out;
}

/** The user's saved note for a problem ("" when none). */
export async function getNote(
  userId: string,
  problemId: string
): Promise<string> {
  const col = await progressCol();
  const doc = await col.findOne(
    { userId: toUserObjectId(userId), problemId: new ObjectId(problemId) },
    { projection: { note: 1 } }
  );
  return doc?.note ?? "";
}

/** Upsert the user's note for a problem (creates a todo doc if none exists). */
export async function setNote(
  userId: string,
  problemId: string,
  note: string
): Promise<void> {
  await ensureProgressIndexes();
  const uid = toUserObjectId(userId);
  const pid = new ObjectId(problemId);
  await (await progressCol()).updateOne(
    { userId: uid, problemId: pid },
    {
      $setOnInsert: {
        userId: uid,
        problemId: pid,
        status: "todo",
        bookmarked: false,
        firstAttemptedAt: null,
        solvedAt: null,
      },
      $set: { note, lastActivityAt: new Date() },
    },
    { upsert: true }
  );
}

/** Problem ids this user has bookmarked. */
export async function getBookmarkedIds(userId: string): Promise<string[]> {
  const col = await progressCol();
  const docs = await col
    .find(
      { userId: toUserObjectId(userId), bookmarked: true },
      { projection: { problemId: 1 } }
    )
    .toArray();
  return docs.map((d) => d.problemId.toHexString());
}

/**
 * Translate a set of selected statuses into an `_id` include/exclude constraint
 * the content service can apply server-side (so status filtering spans the WHOLE
 * catalog + paginates correctly, not just the current page).
 *
 * `todo` isn't stored, so it's expressed as the complement of the user's touched
 * problems. When `todo` is selected we exclude the touched problems whose status
 * is NOT selected; otherwise we include exactly the ids matching the selected
 * (solved/attempted) statuses.
 */
export async function resolveStatusFilterIds(
  userId: string,
  statuses: ProgressStatus[]
): Promise<{ includeIds?: string[]; excludeIds?: string[] }> {
  if (!statuses.length) return {};
  const col = await progressCol();
  const uid = toUserObjectId(userId);
  const wantTodo = statuses.includes("todo");
  const selectedStored = (["solved", "attempted"] as const).filter((s) =>
    statuses.includes(s)
  );

  if (wantTodo) {
    // Exclude touched problems whose status the user did NOT select.
    const excludeStatuses = (["solved", "attempted"] as const).filter(
      (s) => !selectedStored.includes(s)
    );
    if (!excludeStatuses.length) return {}; // todo + solved + attempted = everything
    const docs = await col
      .find(
        { userId: uid, status: { $in: excludeStatuses } },
        { projection: { problemId: 1 } }
      )
      .toArray();
    return { excludeIds: docs.map((d) => d.problemId.toHexString()) };
  }

  // Only stored statuses selected → include exactly those ids ([] = none → empty).
  const docs = await col
    .find(
      { userId: uid, status: { $in: selectedStored } },
      { projection: { problemId: 1 } }
    )
    .toArray();
  return { includeIds: docs.map((d) => d.problemId.toHexString()) };
}

/**
 * Solved / attempted / bookmarked counts. `todo` is NOT stored for untouched
 * problems, so callers derive "to do" = catalogTotal − solved − attempted.
 */
export async function getProblemStatusCounts(
  userId: string
): Promise<{ solved: number; attempted: number; bookmarked: number }> {
  const col = await progressCol();
  const uid = toUserObjectId(userId);
  const rows = await col
    .aggregate<{ _id: ProgressStatus; n: number }>([
      { $match: { userId: uid } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ])
    .toArray();
  const bookmarked = await col.countDocuments({ userId: uid, bookmarked: true });
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r._id] = r.n;
  return {
    solved: byStatus.solved ?? 0,
    attempted: byStatus.attempted ?? 0,
    bookmarked,
  };
}
