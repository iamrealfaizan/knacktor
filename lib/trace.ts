/**
 * Trace / Step / VisualState contracts — mirrors Schema.md §2.4–§2.6.
 *
 * The PLAYER (M1.4) consumes these. The TRACER (M1.5) will produce them.
 * Every Step is a COMPLETE snapshot so the player can seek anywhere in O(1);
 * the only diff-style fields (changedVars, ghosts, changedLinks) exist purely
 * to drive motion.
 */

// ── Canonical Layer-1 element state vocabulary (SimulationRules §A-2.3) ─────
export type CellState =
  | "idle"
  | "current"
  | "compared"
  | "frontier"
  | "visited"
  | "result"
  | "path"
  | "special"
  | "error"
  | "dimmed"
  | "left"
  | "right";

// ── VisualState — discriminated union by `type` (MVP: array | linkedList | recursion)
export interface ArrayVisualState {
  type: "array";
  values: (number | string)[];
  /** index (string key) -> Layer-1 state */
  cellStates: Record<string, CellState>;
  /** Layer-2 pointer markers, drawn in the gutter — never recolor a cell */
  pointers: { name: string; at: number }[];
  /** translucent range "tray" behind cells */
  window?: { from: number; to: number };
  /** before->after positions -> smooth glide */
  ghosts?: { name: string; from: number; to: number }[];
}

export interface LinkedListVisualState {
  type: "linkedList";
  nodes: { id: string; value: number | string }[];
  links: { from: string; to: string }[];
  pointers: { name: string; at: string | null }[];
  changedLinks?: { from: string; to: string }[];
}

export interface CallFrame {
  id: string;
  label: string;
  returnValue: unknown;
  isCurrent: boolean;
}

export interface RecursionVisualState {
  type: "recursion";
  frames: CallFrame[];
  treeEdges?: { from: string; to: string }[];
}

export interface BarContainerVisualState {
  type: "bar-container";
  values: number[];
  cellStates: Record<string, CellState>;
  pointers: { name: string; at: number }[];
  container?: {
    left: number;
    right: number;
    width: number;
    waterHeight: number;
    area: number;
  };
}

export type VisualState =
  | ArrayVisualState
  | LinkedListVisualState
  | RecursionVisualState
  | BarContainerVisualState;

// ── Step (Schema §2.5) — one per executed source line (D8) ──────────────────
export type StepPhase =
  | "init"
  | "loop"
  | "check"
  | "update"
  | "move"
  | "recurse"
  | "return"
  | "done";

export interface StepNarration {
  happening: string; // "what's happening"
  why: string; // "why it matters"
  invariant: string; // "invariant / goal"
}

export interface Step {
  i: number;
  /** resolves to the executed source line number for highlight */
  codeKey: number;
  phase: StepPhase;
  narration: StepNarration;
  /** complete variable snapshot (name -> value; null/empty rendered as ∅) */
  vars: Record<string, unknown>;
  /** names that changed this step -> change-flash + population */
  changedVars: string[];
  /** running real-operation counts -> complexity meters */
  counters: Record<string, number>;
  visual: VisualState;
  op?: string;
  isKeyEvent?: boolean;
  callStack?: CallFrame[];
}

// ── Trace (Schema §2.4) ─────────────────────────────────────────────────────
export interface Trace {
  problemSlug: string;
  approachId: string;
  inputId: string;
  steps: Step[];
  keyEventIndices: number[];
  finalResult: unknown;
  traceVersion: string;
}

// ── Approach (Schema §2.2) ──────────────────────────────────────────────────
export interface Approach {
  id: string;
  name: string;
  kind: "brute" | "optimal" | "alternative";
  summary: string;
  complexity: { time: string; space: string };
  language: "python";
  source: string;
  /** lineNo -> algorithm-level explanation (shown in narration panel) */
  lineExplanations: Record<number, string>;
  /** lineNo -> beginner-friendly syntax explanation (shown in hover tooltip) */
  syntaxExplanations?: Record<number, string>;
  primaryPrimitive: string;
  auxStructures: string[];
}

// ── PresetInput (Schema §2.3) ───────────────────────────────────────────────
export interface PresetInput {
  id: string;
  label: string;
  value: unknown;
  isEdgeCase: boolean;
}

// ── Input constraints (M1.5 — drives validation for custom input) ────────────
export interface InputField {
  name: string;
  type: "int[]" | "int";
  label: string;
  placeholder: string;
  // numeric range (applies to int, and to each element of int[]):
  min?: number;
  max?: number;
  // length bounds (int[] only):
  minLen?: number;
  maxLen?: number;
}

export interface InputConstraints {
  fields: InputField[];
  /** buildTrace throws if steps exceed this — prevents Vercel timeouts */
  maxSteps: number;
}

// ── ProblemFull — the problem doc joined with its approaches & presets ──────
export interface ProblemFull {
  slug: string;
  number: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  patterns: string[];
  statement: string;
  supportsCustomInput: boolean;
  inputConstraints?: InputConstraints;
  presetInputs: PresetInput[];
  approaches: Approach[];
  recommendedApproachId: string;
  /** whether the Compare mode is offered for this problem */
  supportsCompare: boolean;
}
