/**
 * Presentation-only visual identity for a concept (topic or pattern), keyed by
 * its DB slug. This is UI chrome — a decorative lucide icon + a semantic tone —
 * NOT content (names/descriptions/counts all come from content-service). It is
 * analogous to the icon+tone maps in components/landing/data.ts, and keeps the
 * concept cards on-brand without inlining hex (tones map to kn-* tokens).
 *
 * One map serves both topics and patterns — overlapping slugs (e.g. two-pointers,
 * sorting, hash-map, dynamic-programming) intentionally share one visual for
 * consistency. Sheet slugs and any unknown/newly-added slug fall back to the
 * default, so nothing ever renders without an icon.
 *
 * Slugs mirror the allowed taxonomy in seeds/problems/CLAUDE.md.
 */
import type { LucideIcon } from "lucide-react";
import {
  Brackets,
  Type,
  Hash,
  Braces,
  ArrowLeftRight,
  ArrowDownWideNarrow,
  Search,
  RectangleHorizontal,
  Link2,
  Layers,
  ListOrdered,
  MoveHorizontal,
  Triangle,
  GitBranch,
  GitFork,
  GitBranchPlus,
  TextSearch,
  Waypoints,
  Merge,
  Table2,
  Undo2,
  Zap,
  Binary,
  Sigma,
  Ruler,
  Grid3x3,
  Shapes,
  Rabbit,
  FoldHorizontal,
  RefreshCw,
  FlipHorizontal2,
  Network,
  Scale,
  Boxes,
  SearchCheck,
  Trophy,
  Combine,
  TrendingUp,
  Flag,
  Expand,
  Repeat,
  Route,
} from "lucide-react";
import type { Tone } from "@/lib/tones";

export interface ConceptVisual {
  icon: LucideIcon;
  tone: Tone;
}

export const CONCEPT_VISUALS: Record<string, ConceptVisual> = {
  /* ── Topics ─────────────────────────────────────────────────────────────── */
  array: { icon: Brackets, tone: "current" },
  string: { icon: Type, tone: "compared" },
  "hash-map": { icon: Hash, tone: "special" },
  "hash-set": { icon: Braces, tone: "special" },
  "two-pointers": { icon: ArrowLeftRight, tone: "current" },
  sorting: { icon: ArrowDownWideNarrow, tone: "amber" },
  "binary-search": { icon: Search, tone: "compared" },
  "sliding-window": { icon: RectangleHorizontal, tone: "current" },
  "linked-list": { icon: Link2, tone: "compared" },
  stack: { icon: Layers, tone: "amber" },
  queue: { icon: ListOrdered, tone: "result" },
  deque: { icon: MoveHorizontal, tone: "result" },
  heap: { icon: Triangle, tone: "special" },
  tree: { icon: GitBranch, tone: "result" },
  "binary-tree": { icon: GitFork, tone: "result" },
  bst: { icon: GitBranchPlus, tone: "result" },
  trie: { icon: TextSearch, tone: "special" },
  graph: { icon: Waypoints, tone: "compared" },
  "union-find": { icon: Merge, tone: "amber" },
  "dynamic-programming": { icon: Table2, tone: "special" },
  backtracking: { icon: Undo2, tone: "amber" },
  greedy: { icon: Zap, tone: "amber" },
  "bit-manipulation": { icon: Binary, tone: "compared" },
  math: { icon: Sigma, tone: "compared" },
  interval: { icon: Ruler, tone: "result" },
  matrix: { icon: Grid3x3, tone: "special" },

  /* ── Patterns (slugs not already covered above) ─────────────────────────── */
  "fast-slow-pointers": { icon: Rabbit, tone: "current" },
  "merge-intervals": { icon: FoldHorizontal, tone: "result" },
  "cyclic-sort": { icon: RefreshCw, tone: "amber" },
  "in-place-reversal": { icon: FlipHorizontal2, tone: "compared" },
  bfs: { icon: Network, tone: "compared" },
  dfs: { icon: GitBranch, tone: "result" },
  "two-heaps": { icon: Scale, tone: "special" },
  subsets: { icon: Boxes, tone: "current" },
  "modified-binary-search": { icon: SearchCheck, tone: "compared" },
  "top-k": { icon: Trophy, tone: "amber" },
  "k-way-merge": { icon: Combine, tone: "result" },
  "topological-sort": { icon: Network, tone: "compared" },
  "prefix-sum": { icon: Sigma, tone: "current" },
  "monotonic-stack": { icon: Layers, tone: "amber" },
  kadane: { icon: TrendingUp, tone: "result" },
  "dutch-flag": { icon: Flag, tone: "amber" },
  "expand-palindrome": { icon: Expand, tone: "special" },
  "floyd-cycle": { icon: Repeat, tone: "current" },
  dijkstra: { icon: Route, tone: "special" },
};

export const DEFAULT_CONCEPT_VISUAL: ConceptVisual = { icon: Shapes, tone: "current" };

/** Visual for a concept slug, falling back to a neutral default for unknown slugs. */
export function conceptVisual(slug: string): ConceptVisual {
  return CONCEPT_VISUALS[slug] ?? DEFAULT_CONCEPT_VISUAL;
}
