// Core domain types — mirrors Schema.md contracts (v2.0, _id relationships per D10).
// All fields with dates are ISO strings (serialized at the content-service boundary).
//
// RELATIONSHIP MODEL (D10): the DB stores cross-collection references by Mongo _id
// (`difficultyId`, `topicIds[]`, `patternIds[]`, `sheets.entries[].problemId`). `slug`
// is kept only for routing. The Content Service RESOLVES those _id refs back to slug
// display-fields on read (`difficulty`, `topics[]`, `patterns[]`) so pages stay simple.

export type DifficultySlug = "easy" | "medium" | "hard";
// Back-compat alias — older code imported `Difficulty` as the slug union.
export type Difficulty = DifficultySlug;

/** Difficulty entity (its own collection, D10). */
export interface DifficultyDoc {
  _id?: string;
  slug: DifficultySlug;
  name: string;
  /** ordering: easy=1, medium=2, hard=3 */
  rank: number;
  /** design-token key (e.g. "kn-result"), never a hex */
  color: string;
}

export interface Problem {
  _id?: string;
  slug: string;
  number: number;
  title: string;

  // ── _id relationships (canonical in the DB) ──
  difficultyId?: string;
  topicIds?: string[];
  patternIds?: string[];

  // ── Resolved display fields (attached by the Content Service on read) ──
  /** difficulty slug, resolved from difficultyId */
  difficulty: DifficultySlug;
  /** topic slugs, resolved from topicIds */
  topics: string[];
  /** pattern slugs, resolved from patternIds */
  patterns: string[];

  hasVisualization: boolean;
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pattern {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  mustKnow: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Ordered sheet membership (replaces problemSlugs, D10). */
export interface SheetEntry {
  problemId: string;
  order: number;
  reason?: string;
}

export interface Sheet {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  entries: SheetEntry[];
  createdAt?: string;
  updatedAt?: string;
}

// ── UserProgress (plain/public shapes; ISO-string dates, _id?: string) ─────────
// Raw Mongo docs (ObjectId/Date) stay private in lib/progress-service.ts; these
// are the serialized shapes returned to Server Actions / components.

export type ProgressStatus = "todo" | "attempted" | "solved";

/** One user×problem progress record. */
export interface UserProblemProgress {
  _id?: string;
  userId: string;
  problemId: string;
  status: ProgressStatus;
  bookmarked: boolean;
  note: string;
  firstAttemptedAt: string | null;
  solvedAt: string | null;
  lastActivityAt: string;
}

/** One user×local-day rollup. */
export interface UserDailyActivity {
  _id?: string;
  userId: string;
  date: string; // "YYYY-MM-DD" local
  solves: number;
  attempts: number;
}

/** One per-user streak record (effective values recomputed against today). */
export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastSolveDate: string | null;
  timezone: string;
  freezesAvailable: number;
  freezeWeekAnchor: string;
}

/** Per-difficulty solved / total pair for the progress card bars. */
export interface DifficultyProgress {
  label: DifficultySlug;
  solved: number;
  total: number;
}

/** Progress ring + per-difficulty breakdown for the dashboard. */
export interface ProgressSummary {
  solved: number;
  total: number;
  byDifficulty: DifficultyProgress[];
}

/** One heatmap cell: activity level 0–4 for a given local day. */
export interface HeatmapCell {
  date: string; // "YYYY-MM-DD"
  level: number; // 0 (none) … 4 (most); attempt-only day = 1
}

/** 26-week × 7-day heatmap grid + month column labels. */
export interface Heatmap {
  weeks: HeatmapCell[][];
  months: string[];
}

/** "Continue learning" card payload — most-recent in-progress problem + next. */
export interface ContinueLearning {
  num: string;
  title: string;
  diff: DifficultySlug;
  topic: string;
  pattern: string;
  blurb: string;
  href: string;
  upNext: { num: string; title: string; diff: DifficultySlug; href: string } | null;
}

/** Question-of-the-day: deterministic date-seeded pick. */
export interface Qotd {
  title: string;
  slug: string;
  href: string;
}

export type ProblemSort = "number" | "difficulty" | "title" | "created";
export type SortOrder = "asc" | "desc";

export interface ProblemFilters {
  // Singular filters (back-compat: /problems page, getProblemsBy* wrappers).
  difficulty?: DifficultySlug;
  topicSlug?: string;
  patternSlug?: string;
  // Multi-select filters (home dashboard). Difficulty combines as OR (union);
  // topics/patterns combine as AND (a problem must carry ALL selected slugs).
  difficulties?: DifficultySlug[];
  topicSlugs?: string[];
  patternSlugs?: string[];
  sheetSlug?: string;
  /** restrict to these problem _ids (hex). Empty array = match nothing. Used by
   *  the authenticated browse action to filter by the user's status server-side. */
  includeIds?: string[];
  /** exclude these problem _ids (hex). Used for the "to do" status (= catalog
   *  minus the user's touched problems). */
  excludeIds?: string[];
  search?: string;
  /** sort field for the paginated list path (getProblemsPage); defaults to "number" */
  sort?: ProblemSort;
  /** sort direction; defaults to "asc" */
  order?: SortOrder;
  /** 1-based page number (getProblemsPage) */
  page?: number;
  /** page size (getProblemsPage) */
  limit?: number;
}
