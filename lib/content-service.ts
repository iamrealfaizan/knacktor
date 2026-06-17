/**
 * Content Service — the ONLY layer that touches MongoDB.
 * Pages and the engine import from here, never from lib/mongodb directly.
 */
import clientPromise from "./mongodb";
import type { Problem, Topic, Pattern, Sheet, ProblemFilters } from "./types";

const DB = "knacktor";

async function db() {
  return (await clientPromise).db(DB);
}

// ── Problems ──────────────────────────────────────────────────────────────

export async function getProblems(
  filters: ProblemFilters = {}
): Promise<Problem[]> {
  const query: Record<string, unknown> = {};
  if (filters.difficulty) query.difficulty = filters.difficulty;
  // Array field contains check — handles many-to-many for topics and patterns
  if (filters.topicSlug) query.topics = filters.topicSlug;
  if (filters.patternSlug) query.patterns = filters.patternSlug;
  if (filters.sheetSlug) query.sheets = filters.sheetSlug;
  if (filters.search) query.$text = { $search: filters.search };

  return (await db())
    .collection<Problem>("problems")
    .find(query)
    .sort({ number: 1 })
    .toArray();
}

export async function getProblemBySlug(
  slug: string
): Promise<Problem | null> {
  return (await db()).collection<Problem>("problems").findOne({ slug });
}

// ── Topics ────────────────────────────────────────────────────────────────

export async function getTopics(): Promise<Topic[]> {
  return (await db()).collection<Topic>("topics").find().sort({ name: 1 }).toArray();
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  return (await db()).collection<Topic>("topics").findOne({ slug });
}

export async function getProblemsByTopic(topicSlug: string): Promise<Problem[]> {
  return getProblems({ topicSlug });
}

// ── Patterns ──────────────────────────────────────────────────────────────

export async function getPatterns(): Promise<Pattern[]> {
  return (await db())
    .collection<Pattern>("patterns")
    .find()
    .sort({ mustKnow: -1, name: 1 })
    .toArray();
}

export async function getPatternBySlug(slug: string): Promise<Pattern | null> {
  return (await db()).collection<Pattern>("patterns").findOne({ slug });
}

export async function getProblemsByPattern(
  patternSlug: string
): Promise<Problem[]> {
  return getProblems({ patternSlug });
}

// ── Sheets ────────────────────────────────────────────────────────────────

export async function getSheets(): Promise<Sheet[]> {
  return (await db()).collection<Sheet>("sheets").find().sort({ name: 1 }).toArray();
}

export async function getSheetBySlug(slug: string): Promise<Sheet | null> {
  return (await db()).collection<Sheet>("sheets").findOne({ slug });
}
