/**
 * Author-facing spec types for the hybrid trace pipeline (D9).
 * See rules/Authoring.md §6–§7 for the authoring contract these mirror.
 */
import type { CellState, KeyEventKind, StepPhase } from "@/lib/trace";

// ── Raw skeleton emitted by tracer/run.py ──────────────────────────────────────
export interface RawStep {
  lineNo: number;
  rawVars: Record<string, unknown>;
  callStack: { label: string }[];
}
export interface RawSkeleton {
  steps: RawStep[];
  finalResult: unknown;
  executableLines: number[];
  sourceLineCount: number;
  entry: string;
  error?: string;
}

// ── Visual-mapping spec (mapping.json) ──────────────────────────────────────────
export interface CellStateRule {
  state: CellState;
  /** expression over (vars, *_prev, idx, values, phase, flags); first match wins */
  when: string;
  /** optional extra guard ANDed with `when` */
  onlyWhen?: string;
}

export interface DerivedContainer {
  left: string;
  right: string;
  width: string;
  waterHeight: string;
  area: string;
}

export interface ReadoutSpec {
  /** template with {placeholders} filled from captured vars */
  expr: string;
  relation?: string;
  relationColor?: string;
  /** only show the chip when this expression is truthy */
  when?: string;
}

export interface CounterRule {
  name: string;
  /** increment when this expression is truthy this step */
  when?: string;
  /** OR increment when the step's lineNo is in this list */
  onLines?: number[];
}

export interface KeyEventRule {
  when?: string;
  line?: number;
  label: string;
  kind?: KeyEventKind;
}

export interface PhaseRule {
  phase: StepPhase;
  lines: number[];
  /** optional guard to disambiguate (e.g. loop-continue vs loop-exit) */
  when?: string;
}

export interface VisualMappingSpec {
  primitive: "array" | "bar-container" | "linkedList" | "recursion" | "custom";
  /** var name whose value becomes visual.values */
  valuesFrom?: string;
  pointers?: { name: string; var: string }[];
  cellStateRules?: CellStateRule[];
  derived?: { container?: DerivedContainer };
  window?: { from: string; to: string };
  ghosts?: { track: string[] };
  readout?: ReadoutSpec;
  flags?: Record<string, string>;
  counters?: CounterRule[];
  phaseRules?: PhaseRule[];
  keyEvents?: KeyEventRule[];
  /** which captured vars to surface in the rail (default: all primitives) */
  showVars?: string[];
}

// ── Narration spec (narration.json) ────────────────────────────────────────────
export interface NarrationEntry {
  /** optional guard; first matching variant wins */
  when?: string;
  happening: string;
  why: string;
  invariant: string;
}
export interface NarrationSpec {
  byLine?: Record<string, NarrationEntry | NarrationEntry[]>;
  byPhase?: Record<string, NarrationEntry>;
}
