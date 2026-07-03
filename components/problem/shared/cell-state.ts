import type { CellState } from "@/lib/trace";

/**
 * THE Layer-1 cell/node appearance map (SimulationRules §A-2.3).
 * Every renderer derives fills/strokes from here — the per-renderer
 * `cellStyle`/`nodeColors`/`bucketStyle` switches this replaces had drifted
 * into 8 near-identical copies.
 *
 * All values are design tokens (never hex) so both themes work automatically.
 */
export interface CellStateStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  /** text/value color inside the element */
  textFill: string;
  /** confirm pulse on entry (result/found) */
  pulse?: boolean;
  /** dashed stroke (error/rejected per spec) */
  dashed?: boolean;
}

const STYLES: Record<CellState | "left" | "right", CellStateStyle> = {
  current: {
    fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  compared: {
    fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  result: {
    fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-result)", pulse: true,
  },
  special: {
    fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-special)",
  },
  frontier: {
    fill: "var(--kn-amber-subtle)", stroke: "var(--kn-amber)",
    strokeWidth: 2, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  visited: {
    fill: "var(--kn-surface-1)", stroke: "var(--kn-compared)",
    strokeWidth: 2, opacity: 0.85, textFill: "var(--kn-ink-1)",
  },
  path: {
    fill: "var(--kn-amber-subtle)", stroke: "var(--kn-gold)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  error: {
    fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-error)", dashed: true,
  },
  dimmed: {
    fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)",
    strokeWidth: 1.5, opacity: 0.45, textFill: "var(--kn-ink-2)",
  },
  idle: {
    fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)",
    strokeWidth: 1.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  // bar-container wall states (B-2): left wall blue, right wall amber
  left: {
    fill: "var(--kn-blue-soft)", stroke: "var(--kn-ptr-lo)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
  right: {
    fill: "var(--kn-amber-subtle)", stroke: "var(--kn-ptr-hi)",
    strokeWidth: 2.5, opacity: 1, textFill: "var(--kn-ink-0)",
  },
};

export function cellStateStyle(state: CellState | "left" | "right" | undefined): CellStateStyle {
  return STYLES[state ?? "idle"] ?? STYLES.idle;
}
