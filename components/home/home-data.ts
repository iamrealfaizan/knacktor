import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDot, Circle } from "lucide-react";
import { NAV_LINKS as SITE_NAV_LINKS, SITE_STATS } from "@/lib/site";
import { DIFFICULTY_STYLE as CANONICAL_DIFFICULTY_STYLE } from "@/lib/difficulty";

/**
 * Dashboard content contracts + remaining static mock.
 *
 * DB-backed now (built in app/home/page.tsx from lib/content-service):
 * problem table rows, sidebar filter counts (difficulty/topics/patterns/sheets),
 * and the signed-in user's name/initials (session).
 *
 * Still mock until a UserProgress backend lands: per-problem status, streak,
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

/* ── Greeting ─────────────────────────────────────────────────────────── */
export const WEEKLY_GOAL_REMAINING = 3;

/* ── Continue learning ────────────────────────────────────────────────── */
export const CONTINUE = {
  num: "15",
  title: "3Sum",
  diff: "Medium" as Difficulty,
  topic: "Array",
  pattern: "Two Pointers",
  blurb: "Converging pointers on a sorted array — the core pattern behind dozens of problems.",
  href: "#",
  upNext: { num: "16", title: "3Sum Closest", diff: "Medium" as Difficulty, href: "#" },
};

/* ── Streak + heatmap + problem of the day ────────────────────────────── */
export const STREAK_DAYS = 12;

/**
 * 26 weeks × 7 days of activity levels (0 = none … 4 = most). Precomputed and
 * frozen so server and client render identically (no `Date`/`Math.random`).
 * Rendered as translucent tints of `--kn-current` via `HEAT_MIX` (theme-adaptive).
 */
export const HEAT_LEVELS: number[][] = [
  [0, 0, 0, 2, 3, 4, 0], [1, 0, 4, 4, 0, 2, 0], [3, 0, 0, 2, 0, 2, 3], [3, 0, 0, 0, 4, 2, 2],
  [3, 0, 3, 0, 2, 1, 0], [0, 1, 4, 0, 1, 0, 0], [3, 0, 0, 2, 0, 3, 0], [2, 1, 1, 2, 3, 1, 3],
  [0, 3, 2, 4, 3, 0, 0], [1, 0, 2, 4, 0, 0, 1], [1, 4, 1, 2, 2, 4, 0], [2, 0, 1, 0, 1, 4, 0],
  [3, 2, 0, 0, 1, 1, 3], [2, 0, 0, 1, 4, 4, 0], [1, 0, 1, 0, 0, 2, 2], [2, 3, 0, 2, 2, 2, 2],
  [2, 0, 2, 2, 1, 2, 0], [3, 0, 1, 0, 2, 0, 3], [0, 1, 4, 1, 2, 0, 1], [0, 2, 0, 4, 0, 0, 2],
  [1, 0, 0, 2, 1, 0, 0], [3, 0, 0, 0, 1, 0, 4], [0, 2, 1, 3, 0, 1, 1], [0, 3, 0, 4, 0, 0, 4],
  [3, 3, 3, 4, 3, 4, 0], [3, 4, 3, 3, 3, 2, 3],
];

/** Percentage of `--kn-current` mixed with transparent per level (level 0 → track). */
export const HEAT_MIX: Record<number, number | null> = { 0: null, 1: 30, 2: 52, 3: 74, 4: 100 };

/** One month label per column (blank = same month as the column to its left). */
export const HEAT_MONTHS: string[] = [
  "Jan", "", "", "", "Feb", "", "", "", "Mar", "", "", "", "Apr",
  "", "", "", "May", "", "", "", "Jun", "", "", "", "Jul", "",
];

export const POTD = { title: "Longest Consecutive Sequence", href: "#" };

/* ── Progress ring + per-difficulty bars + next badge ─────────────────── */
// MOCK until auth: `solved` is user-specific; total comes from the shared catalog stat.
export const RING = { solved: 83, total: SITE_STATS.problems, circumference: 270 };

export const DIFF_PROGRESS: {
  label: Difficulty;
  text: string;
  pct: number;
  ink: string;
  bar: string;
}[] = [
  { label: "Easy", text: "42 / 150", pct: 28, ink: DIFFICULTY_STYLE.Easy.dot, bar: DIFFICULTY_STYLE.Easy.bar },
  { label: "Medium", text: "34 / 230", pct: 15, ink: DIFFICULTY_STYLE.Medium.dot, bar: DIFFICULTY_STYLE.Medium.bar },
  { label: "Hard", text: "7 / 100", pct: 7, ink: DIFFICULTY_STYLE.Hard.dot, bar: DIFFICULTY_STYLE.Hard.bar },
];

export const NEXT_BADGE = { remaining: 17, name: "Century Club" };

/* ── Header nav (canonical list from lib/site.ts + dashboard active flag) ── */
export const NAV_LINKS = SITE_NAV_LINKS.map((l) => ({
  ...l,
  active: l.href === "/problems",
}));

/* ── Browse sidebar (filter rows are visual only — no client filtering yet;
      the options + counts themselves are DB-derived in app/home/page.tsx) ─── */
export interface FilterOption {
  label: string;
  count?: number;
  active?: boolean;
  dot?: string; // token text-color class for the difficulty dot
}

export const SORT_OPTIONS = ["#", "Difficulty", "Acceptance", "Frequency"] as const;
