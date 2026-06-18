/**
 * Content Service — the ONLY layer that touches MongoDB.
 * Pages and the engine import from here, never from lib/mongodb directly.
 *
 * All returned documents are serialized to plain JSON objects so they can be
 * safely passed from Server Components to Client Components without React's
 * "only plain objects" warning (MongoDB ObjectId and Date both have .toJSON).
 *
 * Fallback strategy: if MongoDB is not yet seeded (local dev before first
 * `npm run ingest`), fixture data is returned so the app still works.
 */
import clientPromise from "./mongodb";
import type { Problem, Topic, Pattern, Sheet, ProblemFilters } from "./types";
import type { ProblemFull, Trace } from "./trace";
import { FOURSUM_PROBLEM, FOURSUM_TRACE } from "./fixtures/4sum";

const DB = "knacktor";

// ── Fixture fallbacks (used when MongoDB traces collection is empty) ──────────
const FIXTURE_PROBLEMS: Record<string, ProblemFull> = {
  [FOURSUM_PROBLEM.slug]: FOURSUM_PROBLEM,
};

// Keyed as "slug:approachId:inputId"
const FIXTURE_TRACES: Record<string, Trace> = {
  [`${FOURSUM_TRACE.problemSlug}:${FOURSUM_TRACE.approachId}:${FOURSUM_TRACE.inputId}`]: FOURSUM_TRACE,
};

// Pre-build fixture traces for all presets (used when MongoDB is empty)
function buildFixturePresetTraces(slug: string, approachId: string): Record<string, Trace> {
  const result: Record<string, Trace> = {};
  for (const [key, trace] of Object.entries(FIXTURE_TRACES)) {
    const [s, a] = key.split(":");
    if (s === slug && a === approachId) result[trace.inputId] = trace;
  }
  return result;
}

async function db() {
  return (await clientPromise).db(DB);
}

// Strips ObjectId (.toJSON → hex string) and Date (.toJSON → ISO string)
// so returned objects are plain and safe to pass to Client Components.
function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── Full problem (ProblemFull) ────────────────────────────────────────────────
// Reads from MongoDB `problemsFull` collection (JSON-seeded problems).
// Falls back to in-memory fixtures for legacy TypeScript-tracer problems (4Sum).
export async function getProblemFull(slug: string): Promise<ProblemFull | null> {
  try {
    const collection = (await db()).collection<ProblemFull & { _id: unknown }>("problemsFull");
    const doc = await collection.findOne({ slug });
    if (doc) return toPlain(doc) as ProblemFull;
  } catch {
    // MongoDB unavailable — fall through to fixture
  }
  return FIXTURE_PROBLEMS[slug] ?? null;
}

// ── Preset traces — all presets for a given problem + approach ────────────────
// Reads from MongoDB `traces` collection; falls back to fixtures when empty.
export async function getPresetTraces(
  slug: string,
  approachId: string
): Promise<Record<string, Trace>> {
  try {
    const collection = (await db()).collection<Trace & { _id: unknown }>("traces");
    const docs = await collection
      .find({ problemSlug: slug, approachId })
      .toArray();

    if (docs.length > 0) {
      const result: Record<string, Trace> = {};
      for (const doc of docs) {
        result[doc.inputId] = toPlain(doc) as Trace;
      }
      return result;
    }
  } catch {
    // MongoDB unavailable — fall through to fixture
  }

  return buildFixturePresetTraces(slug, approachId);
}

// ── Single trace lookup (kept for backwards compat with any direct callers) ──
export async function getTrace(
  slug: string,
  approachId: string,
  inputId: string
): Promise<Trace | null> {
  try {
    const collection = (await db()).collection<Trace & { _id: unknown }>("traces");
    const doc = await collection.findOne({ problemSlug: slug, approachId, inputId });
    if (doc) return toPlain(doc) as Trace;
  } catch {
    // fall through
  }

  return FIXTURE_TRACES[`${slug}:${approachId}:${inputId}`] ?? null;
}

async function dbConn() {
  return (await clientPromise).db(DB);
}

// ── Problems ──────────────────────────────────────────────────────────────────

export async function getProblems(filters: ProblemFilters = {}): Promise<Problem[]> {
  const query: Record<string, unknown> = {};
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.topicSlug) query.topics = filters.topicSlug;
  if (filters.patternSlug) query.patterns = filters.patternSlug;
  if (filters.sheetSlug) query.sheets = filters.sheetSlug;
  if (filters.search) query.$text = { $search: filters.search };

  const docs = await (await dbConn())
    .collection<Problem>("problems")
    .find(query)
    .sort({ number: 1 })
    .toArray();

  return toPlain(docs);
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const doc = await (await dbConn()).collection<Problem>("problems").findOne({ slug });
  return toPlain(doc);
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function getTopics(): Promise<Topic[]> {
  const docs = await (await dbConn()).collection<Topic>("topics").find().sort({ name: 1 }).toArray();
  return toPlain(docs);
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const doc = await (await dbConn()).collection<Topic>("topics").findOne({ slug });
  return toPlain(doc);
}

export async function getProblemsByTopic(topicSlug: string): Promise<Problem[]> {
  return getProblems({ topicSlug });
}

// ── Patterns ──────────────────────────────────────────────────────────────────

export async function getPatterns(): Promise<Pattern[]> {
  const docs = await (await dbConn())
    .collection<Pattern>("patterns")
    .find()
    .sort({ mustKnow: -1, name: 1 })
    .toArray();
  return toPlain(docs);
}

export async function getPatternBySlug(slug: string): Promise<Pattern | null> {
  const doc = await (await dbConn()).collection<Pattern>("patterns").findOne({ slug });
  return toPlain(doc);
}

export async function getProblemsByPattern(patternSlug: string): Promise<Problem[]> {
  return getProblems({ patternSlug });
}

// ── Sheets ────────────────────────────────────────────────────────────────────

export async function getSheets(): Promise<Sheet[]> {
  const docs = await (await dbConn()).collection<Sheet>("sheets").find().sort({ name: 1 }).toArray();
  return toPlain(docs);
}

export async function getSheetBySlug(slug: string): Promise<Sheet | null> {
  const doc = await (await dbConn()).collection<Sheet>("sheets").findOne({ slug });
  return toPlain(doc);
}
