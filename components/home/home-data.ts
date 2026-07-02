import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDot, Circle } from "lucide-react";

/**
 * Logged-in dashboard content (static mock — no DB / no auth yet).
 * When auth + a UserProgress backend land, these values (statuses, streak,
 * ring, POTD, continue-learning) get sourced from the real user; the shapes
 * here are the contract the wiring should fill.
 *
 * Colors are expressed only as `--kn-*` Tailwind token classes — never inline
 * hex. Difficulty reuses existing tokens (easy→result, medium→med, hard→error),
 * so no new tokens are introduced.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Status = "solved" | "attempted" | "todo";

/** Difficulty pill tokens. Medium maps to `--kn-med-*` — an exact match to the reference. */
export const DIFFICULTY_STYLE: Record<
  Difficulty,
  { bg: string; ink: string; bar: string; dot: string }
> = {
  Easy: { bg: "bg-kn-result-subtle", ink: "text-kn-result", bar: "bg-kn-result", dot: "text-kn-result" },
  Medium: { bg: "bg-kn-med-bg", ink: "text-kn-med-ink", bar: "bg-kn-med-ink", dot: "text-kn-med-ink" },
  Hard: { bg: "bg-kn-error-subtle", ink: "text-kn-error", bar: "bg-kn-error", dot: "text-kn-error" },
};

/** Solved / attempted / todo — icon (lucide) + token color + label. */
export const STATUS_STYLE: Record<Status, { icon: LucideIcon; color: string; label: string }> = {
  solved: { icon: CheckCircle2, color: "text-kn-result", label: "Solved" },
  attempted: { icon: CircleDot, color: "text-kn-amber", label: "Attempted" },
  todo: { icon: Circle, color: "text-kn-ink-2", label: "To do" },
};

/** Problem numbers with a real seeded slug link to their page; the rest stay inert (#). */
const REAL_SLUGS: Record<number, string> = {
  1: "two-sum",
  11: "container-with-most-water",
  18: "4sum",
  20: "valid-parentheses",
  21: "merge-two-sorted-lists",
  206: "reverse-linked-list",
};
export const hrefForNumber = (num: number): string =>
  REAL_SLUGS[num] ? `/problems/${REAL_SLUGS[num]}` : "#";

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

interface ProblemSeed {
  num: number;
  title: string;
  diff: Difficulty;
  topics: string[];
  patterns: string[];
  status: Status;
  viz?: boolean;
}
const SEED: ProblemSeed[] = [
  { num: 1, title: "Two Sum", diff: "Easy", topics: ["Array", "Hash Map"], patterns: ["Hashing"], status: "solved" },
  { num: 3, title: "Longest Substring Without Repeat", diff: "Medium", topics: ["String", "Hash Map"], patterns: ["Sliding Window"], status: "solved" },
  { num: 11, title: "Container With Most Water", diff: "Medium", topics: ["Array"], patterns: ["Two Pointers"], status: "solved" },
  { num: 15, title: "3Sum", diff: "Medium", topics: ["Array"], patterns: ["Two Pointers"], status: "attempted" },
  { num: 18, title: "4Sum", diff: "Medium", topics: ["Array"], patterns: ["Two Pointers"], status: "attempted" },
  { num: 20, title: "Valid Parentheses", diff: "Easy", topics: ["String", "Stack"], patterns: ["Stack"], status: "solved" },
  { num: 21, title: "Merge Two Sorted Lists", diff: "Easy", topics: ["Linked List"], patterns: ["Two Pointers"], status: "solved" },
  { num: 33, title: "Search in Rotated Sorted Array", diff: "Medium", topics: ["Array"], patterns: ["Binary Search"], status: "todo" },
  { num: 42, title: "Trapping Rain Water", diff: "Hard", topics: ["Array", "Stack"], patterns: ["Two Pointers"], status: "todo" },
  { num: 46, title: "Permutations", diff: "Medium", topics: ["Array"], patterns: ["Backtracking"], status: "todo" },
  { num: 53, title: "Maximum Subarray", diff: "Medium", topics: ["Array", "Dynamic Programming"], patterns: ["Kadane"], status: "solved" },
  { num: 56, title: "Merge Intervals", diff: "Medium", topics: ["Array"], patterns: ["Intervals"], status: "attempted" },
  { num: 70, title: "Climbing Stairs", diff: "Easy", topics: ["Dynamic Programming"], patterns: ["DP"], status: "solved" },
  { num: 76, title: "Minimum Window Substring", diff: "Hard", topics: ["String", "Hash Map"], patterns: ["Sliding Window"], status: "todo" },
  { num: 98, title: "Validate Binary Search Tree", diff: "Medium", topics: ["Tree"], patterns: ["DFS"], status: "todo" },
  { num: 102, title: "Binary Tree Level Order Traversal", diff: "Medium", topics: ["Tree"], patterns: ["BFS"], status: "solved" },
  { num: 104, title: "Maximum Depth of Binary Tree", diff: "Easy", topics: ["Tree"], patterns: ["DFS"], status: "solved" },
  { num: 121, title: "Best Time to Buy and Sell Stock", diff: "Easy", topics: ["Array", "Dynamic Programming"], patterns: ["DP"], status: "solved" },
  { num: 133, title: "Clone Graph", diff: "Medium", topics: ["Graph", "Hash Map"], patterns: ["BFS"], status: "todo" },
  { num: 141, title: "Linked List Cycle", diff: "Easy", topics: ["Linked List"], patterns: ["Fast & Slow"], status: "attempted" },
  { num: 200, title: "Number of Islands", diff: "Medium", topics: ["Graph"], patterns: ["DFS"], status: "todo" },
  { num: 206, title: "Reverse Linked List", diff: "Easy", topics: ["Linked List"], patterns: ["In-place Reversal"], status: "solved" },
  { num: 207, title: "Course Schedule", diff: "Medium", topics: ["Graph"], patterns: ["Topological Sort"], status: "todo" },
  { num: 215, title: "Kth Largest Element", diff: "Medium", topics: ["Array", "Heap"], patterns: ["Top-K"], status: "todo" },
  { num: 238, title: "Product of Array Except Self", diff: "Medium", topics: ["Array"], patterns: ["Prefix Sum"], status: "attempted" },
  { num: 295, title: "Find Median from Data Stream", diff: "Hard", topics: ["Heap"], patterns: ["Two Heaps"], status: "todo" },
  { num: 322, title: "Coin Change", diff: "Medium", topics: ["Dynamic Programming"], patterns: ["DP"], status: "todo" },
  { num: 424, title: "Longest Repeating Character Replacement", diff: "Medium", topics: ["String"], patterns: ["Sliding Window"], status: "todo" },
];

export const PROBLEMS: Problem[] = SEED.map((p) => ({
  ...p,
  viz: p.viz ?? true,
  href: hrefForNumber(p.num),
}));

const countBy = (fn: (p: ProblemSeed) => boolean) => SEED.filter(fn).length;

/* ── Greeting ─────────────────────────────────────────────────────────── */
export const USER = { name: "Faizan", initials: "FZ" };
export const WEEKLY_GOAL_REMAINING = 3;

/* ── Continue learning ────────────────────────────────────────────────── */
export const CONTINUE = {
  num: "15",
  title: "3Sum",
  diff: "Medium" as Difficulty,
  topic: "Array",
  pattern: "Two Pointers",
  blurb: "Converging pointers on a sorted array — the core pattern behind dozens of problems.",
  href: hrefForNumber(15),
  upNext: { num: "16", title: "3Sum Closest", diff: "Medium" as Difficulty, href: hrefForNumber(16) },
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
export const RING = { solved: 83, total: 480, circumference: 270 };

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

/* ── Header nav ───────────────────────────────────────────────────────── */
export const NAV_LINKS = [
  { label: "Problems", href: "/problems", active: true },
  { label: "Topics", href: "/topics", active: false },
  { label: "Patterns", href: "/patterns", active: false },
  { label: "Sheets", href: "/sheets", active: false },
] as const;

/* ── Browse sidebar (filters are visual only — no client filtering yet) ─── */
export interface FilterOption {
  label: string;
  count?: number;
  active?: boolean;
  dot?: string; // token text-color class for the difficulty dot
}

export const STATUS_FILTERS: FilterOption[] = [
  { label: "All problems", count: SEED.length, active: true },
  { label: "Solved", count: countBy((p) => p.status === "solved") },
  { label: "Attempted", count: countBy((p) => p.status === "attempted") },
  { label: "To do", count: countBy((p) => p.status === "todo") },
];

export const DIFFICULTY_FILTERS: FilterOption[] = [
  { label: "All", count: SEED.length, active: true, dot: "text-kn-ink-2" },
  { label: "Easy", count: countBy((p) => p.diff === "Easy"), dot: DIFFICULTY_STYLE.Easy.dot },
  { label: "Medium", count: countBy((p) => p.diff === "Medium"), dot: DIFFICULTY_STYLE.Medium.dot },
  { label: "Hard", count: countBy((p) => p.diff === "Hard"), dot: DIFFICULTY_STYLE.Hard.dot },
];

const TOPIC_NAMES = [...new Set(SEED.flatMap((p) => p.topics))].sort();
export const TOPIC_FILTERS: FilterOption[] = [
  { label: "All topics", count: SEED.length, active: true },
  ...TOPIC_NAMES.map((t) => ({ label: t, count: countBy((p) => p.topics.includes(t)) })),
];

const PATTERN_NAMES = [...new Set(SEED.flatMap((p) => p.patterns))].sort();
export const PATTERN_FILTERS: FilterOption[] = [
  { label: "All", active: true },
  ...PATTERN_NAMES.map((t) => ({ label: t })),
];

export const SHEET_FILTERS: { label: string; icon: string; count: number }[] = [
  { label: "Blind 75", icon: "📘", count: 75 },
  { label: "NeetCode 150", icon: "🚀", count: 150 },
  { label: "Top Interview", icon: "⭐", count: 100 },
];

export const SORT_OPTIONS = ["#", "Difficulty", "Acceptance", "Frequency"] as const;

export const RESULT_COUNT = PROBLEMS.length;
