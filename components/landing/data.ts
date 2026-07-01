import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Boxes,
  Eye,
  MessageSquareText,
  Gauge,
  Sprout,
  Zap,
  GraduationCap,
  Layers,
  Shapes,
  Workflow,
  ListChecks,
} from "lucide-react";

/**
 * Curated, aspirational landing content (static — no DB).
 * Colors are expressed as semantic "tones" that map to kn-* design tokens;
 * components never inline hex.
 */
export type Tone = "current" | "compared" | "result" | "amber" | "special";

export const TONES: Record<Tone, { text: string; tint: string; border: string }> = {
  current: { text: "text-kn-current", tint: "bg-kn-current-subtle", border: "border-kn-current-border" },
  compared: { text: "text-kn-compared", tint: "bg-kn-blue-soft", border: "border-kn-border-1" },
  result: { text: "text-kn-result", tint: "bg-kn-result-subtle", border: "border-kn-result-border" },
  amber: { text: "text-kn-amber", tint: "bg-kn-amber-subtle", border: "border-kn-amber-border" },
  special: { text: "text-kn-special", tint: "bg-kn-special-subtle", border: "border-kn-special-border" },
};

export interface Pillar {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: Tone;
}
export const PILLARS: Pillar[] = [
  { icon: Code2, title: "Real code", body: "Actual Python highlights line by line as it runs.", tone: "current" },
  { icon: Boxes, title: "Live structures", body: "Arrays, trees and graphs animate step by step.", tone: "compared" },
  { icon: Eye, title: "Visible state", body: "Variables appear and flash the instant they change.", tone: "special" },
  { icon: MessageSquareText, title: "Narration", body: "Plain-language explanation of what and why.", tone: "result" },
  { icon: Gauge, title: "Live complexity", body: "Counters and meters make Big-O tangible.", tone: "amber" },
];

export interface Persona {
  icon: LucideIcon;
  title: string;
  body: string;
  quote: string;
  tone: Tone;
}
export const PERSONAS: Persona[] = [
  {
    icon: Sprout,
    title: "The beginner",
    body: "Start from zero. Watch each step build intuition before you ever memorize a pattern.",
    quote: "Make me understand this.",
    tone: "result",
  },
  {
    icon: Zap,
    title: "Interview prep",
    body: "Revise patterns fast with compare mode and recognizable problems mapped to techniques.",
    quote: "Help me revise patterns.",
    tone: "current",
  },
  {
    icon: GraduationCap,
    title: "The educator",
    body: "Step to an exact moment and explain it. The visual does the heavy lifting for you.",
    quote: "Let me step through it.",
    tone: "compared",
  },
];

export interface DiscoveryEntry {
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  count: string;
  href: string;
  tone: Tone;
}
export const DISCOVERY: DiscoveryEntry[] = [
  { icon: Layers, title: "All problems", body: "Browse the full catalog, filter by tag and difficulty.", cta: "Browse", count: "480", href: "/problems", tone: "current" },
  { icon: Shapes, title: "Topics", body: "Arrays, trees, graphs, DP and more — by structure.", cta: "Explore", count: "24", href: "/topics", tone: "compared" },
  { icon: Workflow, title: "Patterns", body: "Two pointers, sliding window, backtracking…", cta: "Learn", count: "18", href: "/patterns", tone: "special" },
  { icon: ListChecks, title: "Sheets", body: "Curated interview tracks, goal by goal.", cta: "Start", count: "9", href: "/sheets", tone: "result" },
];

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Status = "solved" | "attempted" | "todo";

export interface FeaturedProblem {
  num: string;
  title: string;
  tags: string[];
  diff: Difficulty;
  status: Status;
  href: string;
}
/** Real seeded slugs link to their pages; aspirational ones fall back to /problems. */
export const FEATURED: FeaturedProblem[] = [
  { num: "01", title: "Two Sum", tags: ["Array", "Hash Map"], diff: "Easy", status: "solved", href: "/problems/two-sum" },
  { num: "11", title: "Container With Most Water", tags: ["Array", "Two Pointers"], diff: "Medium", status: "attempted", href: "/problems/container-with-most-water" },
  { num: "20", title: "Valid Parentheses", tags: ["Stack", "String"], diff: "Easy", status: "solved", href: "/problems/valid-parentheses" },
  { num: "18", title: "4Sum", tags: ["Array", "Two Pointers"], diff: "Medium", status: "todo", href: "/problems/4sum" },
  { num: "102", title: "Binary Tree Level Order", tags: ["Tree", "BFS"], diff: "Medium", status: "todo", href: "/problems" },
  { num: "207", title: "Course Schedule", tags: ["Graph", "Topo Sort"], diff: "Medium", status: "attempted", href: "/problems" },
];

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Learn",
    links: [
      { label: "All problems", href: "/problems" },
      { label: "Topics", href: "/topics" },
      { label: "Patterns", href: "/patterns" },
      { label: "Interview sheets", href: "/sheets" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Visualizer", href: "/problems" },
      { label: "Compare mode", href: "/problems" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export const NAV_LINKS = [
  { label: "Problems", href: "/problems" },
  { label: "Topics", href: "/topics" },
  { label: "Patterns", href: "/patterns" },
  { label: "Sheets", href: "/sheets" },
] as const;
