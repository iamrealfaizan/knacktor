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

export type ProblemSort = "number" | "difficulty" | "title";
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
