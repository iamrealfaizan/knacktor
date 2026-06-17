/**
 * Content Service — the ONLY layer that touches MongoDB.
 * Pages and the engine import from here, never from lib/mongodb directly.
 *
 * All returned documents are serialized to plain JSON objects so they can be
 * safely passed from Server Components to Client Components without React's
 * "only plain objects" warning (MongoDB ObjectId and Date both have .toJSON).
 */
import clientPromise from "./mongodb";
import type { Problem, Topic, Pattern, Sheet, ProblemFilters } from "./types";

const DB = "knacktor";

async function db() {
  return (await clientPromise).db(DB);
}

// Strips ObjectId (.toJSON → hex string) and Date (.toJSON → ISO string)
// so returned objects are plain and safe to pass to Client Components.
function toPlain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── Problems ──────────────────────────────────────────────────────────────

export async function getProblems(
  filters: ProblemFilters = {}
): Promise<Problem[]> {
  const query: Record<string, unknown> = {};
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.topicSlug) query.topics = filters.topicSlug;
  if (filters.patternSlug) query.patterns = filters.patternSlug;
  if (filters.sheetSlug) query.sheets = filters.sheetSlug;
  if (filters.search) query.$text = { $search: filters.search };

  const docs = await (await db())
    .collection<Problem>("problems")
    .find(query)
    .sort({ number: 1 })
    .toArray();

  return toPlain(docs);
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const doc = await (await db()).collection<Problem>("problems").findOne({ slug });
  return toPlain(doc);
}

// ── Topics ────────────────────────────────────────────────────────────────

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

// ── Patterns ──────────────────────────────────────────────────────────────

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

// ── Sheets ────────────────────────────────────────────────────────────────

export async function getSheets(): Promise<Sheet[]> {
  const docs = await (await db()).collection<Sheet>("sheets").find().sort({ name: 1 }).toArray();
  return toPlain(docs);
}

export async function getSheetBySlug(slug: string): Promise<Sheet | null> {
  const doc = await (await db()).collection<Sheet>("sheets").findOne({ slug });
  return toPlain(doc);
}
