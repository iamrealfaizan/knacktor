/**
 * Content Service — the ONLY layer that touches MongoDB.
 * Pages and the engine import from here, never from lib/mongodb directly.
 *
 * All returned documents are serialized to plain JSON objects so they can be
 * safely passed from Server Components to Client Components without React's
 * "only plain objects" warning (MongoDB ObjectId and Date both have .toJSON).
 *
 * Relationships are stored by _id (D10); this layer resolves them back to slug
 * display-fields on read so pages stay simple. Traces are gzip-compressed (D11);
 * this layer decompresses them at the boundary so the player/renderer see the
 * plain Trace shape.
 */
import { gunzipSync } from "zlib";
import { GridFSBucket, ObjectId, type Db } from "mongodb";
import clientPromise from "./mongodb";
import type {
  Problem,
  Topic,
  Pattern,
  Sheet,
  ProblemFilters,
  DifficultyDoc,
} from "./types";
import type { ProblemFull, Trace } from "./trace";

const DB = "knacktor";

async function db(): Promise<Db> {
  return (await clientPromise).db(DB);
}

// Strips ObjectId (.toJSON → hex string) and Date (.toJSON → ISO string)
// so returned objects are plain and safe to pass to Client Components.
function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── Taxonomy resolution (id ↔ slug) ───────────────────────────────────────────
// Cached per process; taxonomy is tiny and rarely changes.
type IdSlug = { byId: Map<string, string>; bySlug: Map<string, string> };

async function idSlugMap(col: "difficulties" | "topics" | "patterns"): Promise<IdSlug> {
  const docs = await (await db())
    .collection<{ _id: ObjectId; slug: string }>(col)
    .find({}, { projection: { slug: 1 } })
    .toArray();
  const byId = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const d of docs) {
    const id = d._id.toHexString();
    byId.set(id, d.slug);
    bySlug.set(d.slug, id);
  }
  return { byId, bySlug };
}

type RawProblem = {
  _id: ObjectId;
  slug: string;
  number: number;
  title: string;
  difficultyId?: ObjectId | string;
  topicIds?: (ObjectId | string)[];
  patternIds?: (ObjectId | string)[];
  hasVisualization: boolean;
  isPremium: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function asId(v: ObjectId | string | undefined): string | undefined {
  if (!v) return undefined;
  return typeof v === "string" ? v : v.toHexString();
}

// Resolve a stored problem's _id refs into slug display-fields.
async function resolveProblem(doc: RawProblem): Promise<Problem> {
  const [diff, topics, patterns] = await Promise.all([
    idSlugMap("difficulties"),
    idSlugMap("topics"),
    idSlugMap("patterns"),
  ]);
  const difficultyId = asId(doc.difficultyId);
  return toPlain({
    _id: doc._id.toHexString(),
    slug: doc.slug,
    number: doc.number,
    title: doc.title,
    difficultyId,
    topicIds: (doc.topicIds ?? []).map((x) => asId(x)!).filter(Boolean),
    patternIds: (doc.patternIds ?? []).map((x) => asId(x)!).filter(Boolean),
    difficulty: (difficultyId && diff.byId.get(difficultyId)) || "easy",
    topics: (doc.topicIds ?? [])
      .map((x) => topics.byId.get(asId(x)!))
      .filter((s): s is string => Boolean(s)),
    patterns: (doc.patternIds ?? [])
      .map((x) => patterns.byId.get(asId(x)!))
      .filter((s): s is string => Boolean(s)),
    hasVisualization: doc.hasVisualization,
    isPremium: doc.isPremium,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  }) as Problem;
}

// ── Full problem (ProblemFull) ────────────────────────────────────────────────
export async function getProblemFull(slug: string): Promise<ProblemFull | null> {
  const conn = await db();
  const doc = await conn
    .collection<RawProblem & Record<string, unknown>>("problems")
    .findOne({ slug });
  if (!doc) return null;

  const [diff, topics, patterns] = await Promise.all([
    idSlugMap("difficulties"),
    idSlugMap("topics"),
    idSlugMap("patterns"),
  ]);
  const difficultyId = asId(doc.difficultyId as ObjectId | string | undefined);

  const full: ProblemFull = {
    slug: doc.slug,
    number: doc.number,
    title: doc.title,
    difficulty: ((difficultyId && diff.byId.get(difficultyId)) || "easy") as ProblemFull["difficulty"],
    topics: ((doc.topicIds as (ObjectId | string)[]) ?? [])
      .map((x) => topics.byId.get(asId(x)!))
      .filter((s): s is string => Boolean(s)),
    patterns: ((doc.patternIds as (ObjectId | string)[]) ?? [])
      .map((x) => patterns.byId.get(asId(x)!))
      .filter((s): s is string => Boolean(s)),
    statement: (doc.statement as string) ?? "",
    supportsCustomInput: Boolean(doc.supportsCustomInput),
    inputConstraints: doc.inputConstraints as ProblemFull["inputConstraints"],
    presetInputs: (doc.presetInputs as ProblemFull["presetInputs"]) ?? [],
    approaches: (doc.approaches as ProblemFull["approaches"]) ?? [],
    recommendedApproachId: (doc.recommendedApproachId as string) ?? "",
    supportsCompare: Boolean(doc.supportsCompare),
  };
  return toPlain(full);
}

// ── Trace hydration (decompress at the boundary, D11) ─────────────────────────
type RawTrace = {
  problemId?: ObjectId | string;
  problemSlug: string;
  approachId: string;
  inputId: string;
  keyEventIndices: number[];
  finalResult: unknown;
  traceVersion: string;
  compression?: "gzip" | "none";
  stepsCompressed?: { buffer?: Buffer } | Buffer;
  steps?: unknown[];
  gridfsId?: ObjectId | string;
};

function bufferOf(v: { buffer?: Buffer } | Buffer | undefined): Buffer | null {
  if (!v) return null;
  if (Buffer.isBuffer(v)) return v;
  // mongodb Binary serializes with a `.buffer` property
  if (v.buffer && Buffer.isBuffer(v.buffer)) return v.buffer;
  return Buffer.from(v as unknown as Uint8Array);
}

async function hydrateTrace(conn: Db, doc: RawTrace): Promise<Trace> {
  let steps: unknown[];
  if (doc.steps) {
    steps = doc.steps; // legacy/uncompressed
  } else if (doc.gridfsId) {
    const bucket = new GridFSBucket(conn, { bucketName: "traceSteps" });
    const id = typeof doc.gridfsId === "string" ? new ObjectId(doc.gridfsId) : doc.gridfsId;
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      bucket
        .openDownloadStream(id)
        .on("data", (c: Buffer) => chunks.push(c))
        .on("end", () => resolve())
        .on("error", reject);
    });
    steps = JSON.parse(gunzipSync(Buffer.concat(chunks)).toString("utf-8"));
  } else {
    const buf = bufferOf(doc.stepsCompressed);
    steps = buf ? JSON.parse(gunzipSync(buf).toString("utf-8")) : [];
  }
  return toPlain({
    problemId: asId(doc.problemId),
    problemSlug: doc.problemSlug,
    approachId: doc.approachId,
    inputId: doc.inputId,
    steps,
    keyEventIndices: doc.keyEventIndices ?? [],
    finalResult: doc.finalResult,
    traceVersion: doc.traceVersion,
  }) as Trace;
}

// ── Preset traces — all presets for a given problem + approach ────────────────
export async function getPresetTraces(
  slug: string,
  approachId: string
): Promise<Record<string, Trace>> {
  const conn = await db();
  const docs = await conn
    .collection<RawTrace>("traces")
    .find({ problemSlug: slug, approachId })
    .toArray();

  const result: Record<string, Trace> = {};
  for (const doc of docs) {
    result[doc.inputId] = await hydrateTrace(conn, doc);
  }
  return result;
}

// ── Single trace lookup ───────────────────────────────────────────────────────
export async function getTrace(
  slug: string,
  approachId: string,
  inputId: string
): Promise<Trace | null> {
  const conn = await db();
  const doc = await conn
    .collection<RawTrace>("traces")
    .findOne({ problemSlug: slug, approachId, inputId });
  if (!doc) return null;
  return hydrateTrace(conn, doc);
}

// ── Problems ──────────────────────────────────────────────────────────────────

export async function getProblems(filters: ProblemFilters = {}): Promise<Problem[]> {
  const conn = await db();
  const query: Record<string, unknown> = {};

  if (filters.difficulty) {
    const id = (await idSlugMap("difficulties")).bySlug.get(filters.difficulty);
    query.difficultyId = id ? new ObjectId(id) : null;
  }
  if (filters.topicSlug) {
    const id = (await idSlugMap("topics")).bySlug.get(filters.topicSlug);
    query.topicIds = id ? new ObjectId(id) : null;
  }
  if (filters.patternSlug) {
    const id = (await idSlugMap("patterns")).bySlug.get(filters.patternSlug);
    query.patternIds = id ? new ObjectId(id) : null;
  }
  if (filters.sheetSlug) {
    const sheet = await conn.collection("sheets").findOne({ slug: filters.sheetSlug });
    const ids = ((sheet?.entries as { problemId: ObjectId }[]) ?? []).map((e) => e.problemId);
    query._id = { $in: ids };
  }
  if (filters.search) query.$text = { $search: filters.search };

  const docs = await conn
    .collection<RawProblem>("problems")
    .find(query)
    .sort({ number: 1 })
    .toArray();

  return Promise.all(docs.map(resolveProblem));
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const doc = await (await db()).collection<RawProblem>("problems").findOne({ slug });
  return doc ? resolveProblem(doc) : null;
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function getTopics(): Promise<Topic[]> {
  const docs = await (await db()).collection<Topic>("topics").find().sort({ name: 1 }).toArray();
  return toPlain(docs);
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const doc = await (await db()).collection<Topic>("topics").findOne({ slug });
  return toPlain(doc);
}

export async function getProblemsByTopic(topicSlug: string): Promise<Problem[]> {
  return getProblems({ topicSlug });
}

// ── Patterns ──────────────────────────────────────────────────────────────────

export async function getPatterns(): Promise<Pattern[]> {
  const docs = await (await db())
    .collection<Pattern>("patterns")
    .find()
    .sort({ mustKnow: -1, name: 1 })
    .toArray();
  return toPlain(docs);
}

export async function getPatternBySlug(slug: string): Promise<Pattern | null> {
  const doc = await (await db()).collection<Pattern>("patterns").findOne({ slug });
  return toPlain(doc);
}

export async function getProblemsByPattern(patternSlug: string): Promise<Problem[]> {
  return getProblems({ patternSlug });
}

// ── Difficulties ──────────────────────────────────────────────────────────────

export async function getDifficulties(): Promise<DifficultyDoc[]> {
  const docs = await (await db())
    .collection<DifficultyDoc>("difficulties")
    .find()
    .sort({ rank: 1 })
    .toArray();
  return toPlain(docs);
}

// ── Sheets ────────────────────────────────────────────────────────────────────

export async function getSheets(): Promise<Sheet[]> {
  const docs = await (await db()).collection<Sheet>("sheets").find().sort({ name: 1 }).toArray();
  return toPlain(docs);
}

export async function getSheetBySlug(slug: string): Promise<Sheet | null> {
  const doc = await (await db()).collection<Sheet>("sheets").findOne({ slug });
  return toPlain(doc);
}
