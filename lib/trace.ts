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

// ── Stage readout — the chip drawn on the stage (replaces the hardcoded 4Sum sum
//    chip / container area chip). Computed by the tracer from real captured state;
//    the renderer just draws it and knows nothing about specific variable names.
export interface StageReadout {
  /** e.g. "area = 8 × 1 = 8" */
  expr: string;
  /** optional second line, e.g. "best 49" or "> target 0" */
  relation?: string;
  /** token key for the relation color, e.g. "result" | "ptr-lo" | "amber"; never a hex */
  relationColor?: string;
}

// ── VisualState — discriminated union by `type` (MVP: array | linkedList | recursion)
/** A single array cell value: a scalar, or a small tuple (e.g. an interval pair). */
export type ArrayCellValue = number | string | (number | string)[];

export interface ArrayVisualState {
  type: "array";
  values: ArrayCellValue[];
  /** index (string key) -> Layer-1 state */
  cellStates: Record<string, CellState>;
  /** Layer-2 pointer markers, drawn in the gutter — never recolor a cell */
  pointers: { name: string; at: number }[];
  /** translucent range "tray" behind cells */
  window?: { from: number; to: number };
  /** before->after positions -> smooth glide */
  ghosts?: { name: string; from: number; to: number }[];
  /** data-driven stage chip */
  readout?: StageReadout;
}

export interface LinkedListVisualState {
  type: "linkedList";
  nodes: { id: string; value: number | string; state?: CellState }[];
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
  /** data-driven stage chip */
  readout?: StageReadout;
}

// ── Stack (B-5) ──────────────────────────────────────────────────────────────
export interface StackVisualState {
  type: "stack";
  /** items[0] = bottom, items[length-1] = top (TOS) */
  items: { value: number | string; state: CellState }[];
  label?: string;
}

// ── Queue / Deque (B-6) ──────────────────────────────────────────────────────
export interface QueueVisualState {
  type: "queue";
  /** items[0] = front, items[length-1] = rear */
  items: { value: number | string; state: CellState }[];
  label?: string;
}

// ── Hash Map / Hash Set (B-3) ────────────────────────────────────────────────
export interface HashMapEntry {
  key: string | number;
  value: unknown;
  state: CellState;
}
export interface HashMapVisualState {
  type: "hashmap";
  entries: HashMapEntry[];
  /** key chip currently flying / being looked up */
  highlightedKey?: string | number;
  label?: string;
}

// ── Binary Tree (B-8) ────────────────────────────────────────────────────────
export interface TreeNode {
  id: string;
  value: number | string;
  state: CellState;
  /** id of left child (null = no child) */
  left?: string | null;
  /** id of right child (null = no child) */
  right?: string | null;
}
export interface TreeVisualState {
  type: "tree";
  nodes: TreeNode[];
  pointers: { name: string; at: string | null }[];
  /** id of the node currently carrying the traversal cursor ring */
  currentId?: string | null;
}

// ── 2D Grid / Matrix (B-11) ──────────────────────────────────────────────────
export interface GridCell {
  value: number | string;
  state: CellState;
}
export interface GridPointer {
  name: string;
  row: number;
  col: number;
}
export interface GridVisualState {
  type: "grid";
  rows: GridCell[][];
  pointers: GridPointer[];
}

// ── Graph (B-10) ─────────────────────────────────────────────────────────────
export type GraphEdgeState = "idle" | "tree" | "relaxing" | "path" | "rejected";
export interface GraphNode {
  id: string;
  label: string;
  state: CellState;
  /** pre-computed SVG layout position (−1 to 1 normalised, renderer scales) */
  x: number;
  y: number;
}
export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  state: GraphEdgeState;
}
export interface GraphVisualState {
  type: "graph";
  nodes: GraphNode[];
  edges: GraphEdge[];
  pointers: { name: string; at: string | null }[];
}

/** Bespoke per-problem HTML visualization (D17). Not rendered inside the SVG canvas. */
export interface CustomVisualState {
  type: "custom";
  /** Matches the filename slug in components/problem/custom/<componentKey>-visualizer.tsx */
  componentKey: string;
  [key: string]: unknown;
}

/** All single-primitive states — no nesting. Used as the element type inside CombinedVisualState. */
export type LeafVisualState =
  | ArrayVisualState
  | LinkedListVisualState
  | RecursionVisualState
  | BarContainerVisualState
  | StackVisualState
  | QueueVisualState
  | HashMapVisualState
  | TreeVisualState
  | GridVisualState
  | GraphVisualState
  | CustomVisualState;

/** Two or more primitives shown simultaneously in one stage (D19). */
export interface CombinedVisualState {
  type: "combined";
  primary: LeafVisualState;
  aux: { label: string; visual: LeafVisualState }[];
}

export type VisualState = LeafVisualState | CombinedVisualState;

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

/** Semantic descriptor for a scrubber diamond (drives tooltip + tint). */
export type KeyEventKind = "match" | "best" | "result" | "boundary" | "return";
export interface KeyEvent {
  label: string;
  kind?: KeyEventKind;
}

export interface Step {
  i: number;
  /** resolves to the executed source line number for highlight */
  codeKey: number;
  /** real executed source line (= codeKey for single lines); makes No-Line-Left-Behind checkable */
  lineNo?: number;
  phase: StepPhase;
  narration: StepNarration;
  /** complete variable snapshot (name -> value; null/empty rendered as ∅) */
  vars: Record<string, unknown>;
  /** raw Python locals snapshot from the tracer (source of truth; `vars` is the curated view) */
  capturedVars?: Record<string, unknown>;
  /** names that changed this step -> change-flash + population */
  changedVars: string[];
  /** running real-operation counts -> complexity meters */
  counters: Record<string, number>;
  visual: VisualState;
  op?: string;
  isKeyEvent?: boolean;
  /** semantic key-event descriptor; present whenever isKeyEvent is set */
  keyEvent?: KeyEvent;
  callStack?: CallFrame[];
}

// ── Trace (Schema §2.4) ─────────────────────────────────────────────────────
export interface Trace {
  /** _id ref to the problem (D10); optional on legacy/in-memory traces */
  problemId?: string;
  problemSlug: string;
  approachId: string;
  inputId: string;
  steps: Step[];
  keyEventIndices: number[];
  finalResult: unknown;
  traceVersion: string;
}

// ── ResultSpec — drives the RESULT panel generically (replaces 4Sum hardcoding) ─
export interface ResultSpec {
  /** which variable in step.vars holds the running result */
  varName: string;
  /** section title, e.g. "RESULT SET" | "BEST AREA" */
  label: string;
  /** optional suffix, e.g. "· quadruplets found" */
  suffix?: string;
  /** how to render the value */
  render: "scalar" | "list" | "tuple-list" | "boolean" | "string";
  /** shown when absent/empty (default "…") */
  emptyText?: string;
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
  /** function the tracer calls, e.g. "Solution.maxArea" */
  entrypoint?: string;
  /** lineNo -> algorithm-level explanation (shown in narration panel) */
  lineExplanations: Record<number, string>;
  /** lineNo -> beginner-friendly syntax explanation (shown in hover tooltip) */
  syntaxExplanations?: Record<number, string>;
  primaryPrimitive: string;
  auxStructures: string[];
  /** how the RESULT panel renders for this approach */
  resultSpec?: ResultSpec;
  /** optional varName -> token-key pin so rail colors match stage pointer lanes */
  varColors?: Record<string, string>;
}

// ── PresetInput (Schema §2.3) ───────────────────────────────────────────────
export interface PresetInput {
  id: string;
  label: string;
  value: unknown;
  isEdgeCase: boolean;
  /** validated against the traced finalResult at ingest (D13) */
  expectedOutput?: unknown;
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
