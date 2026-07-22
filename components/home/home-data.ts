import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDot, Circle } from "lucide-react";
import { NAV_LINKS as SITE_NAV_LINKS } from "@/lib/site";
import { DIFFICULTY_STYLE as CANONICAL_DIFFICULTY_STYLE } from "@/lib/difficulty";
import type { Problem as DbProblem, DifficultySlug, ProgressStatus, ProblemSort } from "@/lib/types";

/**
 * Dashboard content contracts + remaining static mock.
 *
 * DB-backed now (built in app/home/page.tsx from lib/content-service +
 * lib/progress-service): problem table rows, per-problem status, the STATUS
 * filter counts, sidebar filter counts (difficulty/topics/patterns/sheets),
 * and the signed-in user's name/initials (session).
 *
 * Still mock until the rest of the UserProgress backend lands: streak,
 * heatmap, progress ring, POTD, continue-learning, weekly goal.
 *
 * Colors are expressed only as `--kn-*` Tailwind token classes — never inline
 * hex. Difficulty reuses existing tokens (easy→result, medium→med, hard→error),
 * so no new tokens are introduced.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Status = "solved" | "attempted" | "todo";

/** Difficulty pill tokens — derived from the canonical lib/difficulty map (Title-case display keys). */
export const DIFFICULTY_STYLE: Record<
  Difficulty,
  { bg: string; ink: string; bar: string; dot: string }
> = {
  Easy: CANONICAL_DIFFICULTY_STYLE.easy,
  Medium: CANONICAL_DIFFICULTY_STYLE.medium,
  Hard: CANONICAL_DIFFICULTY_STYLE.hard,
};

/** Solved / attempted / todo — icon (lucide) + token color + label. */
export const STATUS_STYLE: Record<Status, { icon: LucideIcon; color: string; label: string }> = {
  solved: { icon: CheckCircle2, color: "text-kn-result", label: "Solved" },
  attempted: { icon: CircleDot, color: "text-kn-amber", label: "Attempted" },
  todo: { icon: Circle, color: "text-kn-ink-2", label: "To do" },
};

export interface Problem {
  num: number;
  title: string;
  diff: Difficulty;
  topics: string[];
  patterns: string[];
  status: Status;
  viz: boolean;
  href: string;
}

const DIFF_DISPLAY: Record<DifficultySlug, Difficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * Map a resolved DB Problem (slug arrays) into a home table row (display names).
 * Runs on both the server (initial render) and client (after each fetch), so it
 * takes plain name-maps rather than touching the DB. `status` is the user's
 * per-problem progress (from lib/progress-service); it defaults to "todo" for
 * untouched problems and anonymous callers.
 */
export function toHomeRow(
  p: DbProblem,
  topicName: Record<string, string>,
  patternName: Record<string, string>,
  status: ProgressStatus = "todo"
): Problem {
  return {
    num: p.number,
    title: p.title,
    diff: DIFF_DISPLAY[p.difficulty],
    topics: p.topics.map((s) => topicName[s] ?? s),
    patterns: p.patterns.map((s) => patternName[s] ?? s),
    status,
    viz: p.hasVisualization,
    href: `/problems/${p.slug}`,
  };
}

/* ── Greeting (weekly-goal is deferred gamification — static placeholder) ── */
export const WEEKLY_GOAL_REMAINING = 3;

/**
 * Heatmap presentation: percentage of `--kn-current` mixed with transparent per
 * activity level (level 0 → track). Values 0–4 come from real activity now
 * (progress-service `getHeatmap`); this stays here because it's presentational.
 */
export const HEAT_MIX: Record<number, number | null> = { 0: null, 1: 30, 2: 52, 3: 74, 4: 100 };

/* ── Next badge (deferred gamification, decision 11 — static placeholder) ── */
export const NEXT_BADGE = { remaining: 17, name: "Century Club" };

/* ── Header nav (canonical list from lib/site.ts + dashboard active flag) ── */
export const NAV_LINKS = SITE_NAV_LINKS.map((l) => ({
  ...l,
  active: l.href === "/problems",
}));

/* ── Browse sidebar (status + difficulty + topic + pattern rows filter via URL
      params; options + counts are DB-derived in app/home/page.tsx). Study-sheet
      rows stay inert until their backend lands. ─── */
export interface FilterOption {
  label: string;
  /** filter value this row sets (status: "solved"|"attempted"|"todo"); the
   *  "All" reset row has no value. */
  value?: string;
  count?: number;
  active?: boolean;
  dot?: string; // token text-color class for the difficulty dot
}

/** A selectable filter facet: slug value + display label + catalog count. */
export interface FacetOption {
  value: string;
  label: string;
  count: number;
  dot?: string; // token text-color class for the difficulty dot
}

/** Sort bar options → the `sort` URL/query value they set. Order: # is default. */
export const SORT_OPTIONS: { label: string; value: ProblemSort }[] = [
  { label: "#", value: "number" },
  { label: "Difficulty", value: "difficulty" },
  { label: "Title", value: "title" },
  { label: "Created", value: "created" },
];
