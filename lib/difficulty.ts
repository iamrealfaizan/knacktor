import type { DifficultySlug } from "@/lib/types";

/**
 * THE canonical difficulty vocabulary. One type (the lowercase slug from
 * lib/types), one label helper, one token style map — every difficulty pill,
 * bar, and dot in the app derives from here. Never redefine these maps in a
 * component or a section data file.
 *
 * Colors (design tokens only):
 *   easy   → result greens
 *   medium → the dedicated `--kn-med-*` pair (matches the locked prototype)
 *   hard   → error reds
 */

export type { DifficultySlug };

export const DIFFICULTY_LABEL: Record<DifficultySlug, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Normalize any casing ("Easy", "EASY", "easy") to the canonical slug. */
export function toDifficultySlug(value: string): DifficultySlug {
  const v = value.toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  throw new Error(`Unknown difficulty: ${value}`);
}

export interface DifficultyStyle {
  /** pill background */ bg: string;
  /** pill/label text  */ ink: string;
  /** pill border      */ border: string;
  /** progress bar fill */ bar: string;
  /** dot / accent text */ dot: string;
}

export const DIFFICULTY_STYLE: Record<DifficultySlug, DifficultyStyle> = {
  easy: {
    bg: "bg-kn-result-subtle",
    ink: "text-kn-result",
    border: "border-kn-result-border",
    bar: "bg-kn-result",
    dot: "text-kn-result",
  },
  medium: {
    bg: "bg-kn-med-bg",
    ink: "text-kn-med-ink",
    border: "border-transparent",
    bar: "bg-kn-med-ink",
    dot: "text-kn-med-ink",
  },
  hard: {
    bg: "bg-kn-error-subtle",
    ink: "text-kn-error",
    border: "border-kn-error-border",
    bar: "bg-kn-error",
    dot: "text-kn-error",
  },
};
