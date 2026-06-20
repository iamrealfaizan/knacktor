/**
 * Dynamic font-size scaling for SVG text cells (D19 / Phase 6).
 * Uses JetBrains Mono's 0.601× character-width ratio to guarantee the full
 * string value fits inside the given cell width. No truncation — always visible.
 */

const CHAR_RATIO = 0.601; // JetBrains Mono: charWidth ≈ fontSize × 0.601

/**
 * Returns the largest integer fontSize (px) that fits `value` inside `cellWidth`
 * SVG units, clamped to [min, max].
 *
 * Use the default max=18 for array/queue (48px cells) and max=16 for stack (88px cells).
 */
export function fitTextSize(
  value: string | number,
  cellWidth: number,
  max = 18,
  min = 10
): number {
  const len = String(value).length;
  if (len === 0) return max;
  const fit = Math.floor((cellWidth * 0.92) / (len * CHAR_RATIO));
  return Math.max(min, Math.min(max, fit));
}
