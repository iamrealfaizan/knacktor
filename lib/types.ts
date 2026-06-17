// Core domain types — mirrors Schema.md contracts

export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  _id?: string;
  slug: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  /** Many-to-many: topic slugs this problem belongs to */
  topics: string[];
  /** Many-to-many: pattern slugs this problem demonstrates */
  patterns: string[];
  /** Sheet slugs this problem is included in */
  sheets: string[];
  hasVisualization: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
}

export interface Pattern {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  mustKnow: boolean;
}

export interface Sheet {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  problemSlugs: string[];
}

export interface ProblemFilters {
  difficulty?: Difficulty;
  topicSlug?: string;
  patternSlug?: string;
  sheetSlug?: string;
  search?: string;
}
