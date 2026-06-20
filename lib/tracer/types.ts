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

/** Per-hashmap-entry state rule; scope includes `k` = the entry key (string | number). */
export interface HighlightRule {
  state: CellState;
  whenKey: string;
}

/** Per-tree-or-graph-node state rule; scope includes `node_id` = the node's id string. */
export interface NodeStateRule {
  state: CellState;
  when: string;
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

/**
 * Spec for one auxiliary structure shown alongside the primary in the stage (D19).
 * Omits pipeline-level fields (phaseRules, counters, keyEvents, flags, readout)
 * since those only apply to the primary.
 */
export interface AuxMappingSpec {
  primitive: "array" | "bar-container" | "hashmap" | "stack" | "queue" | "linkedList" | "tree" | "grid" | "graph" | "recursion";
  /** Human-readable label shown as a divider above the aux visual, e.g. "Stack" */
  label: string;

  // array / bar-container
  valuesFrom?: string;
  pointers?: { name: string; var?: string; rowVar?: string; colVar?: string }[];
  cellStateRules?: CellStateRule[];
  window?: { from: string; to: string };

  // hashmap
  keysFrom?: string;
  highlightRules?: HighlightRule[];
  highlightKeyVar?: string;

  // stack / queue
  itemsFrom?: string;
  topVar?: string;
  frontVar?: string;
  backVar?: string;

  // tree / graph
  nodesFrom?: string;
  edgesFrom?: string;
  nodeStateRules?: NodeStateRule[];
  directed?: boolean;

  // linkedList
  linksFrom?: string;
  changedLinksFrom?: string;

  // grid
  gridFrom?: string;

  // recursion
  framesFrom?: string;
  treeEdgesFrom?: string;
  currentFrameVar?: string;
  currentNodeVar?: string;
}

export interface VisualMappingSpec {
  primitive:
    | "array"
    | "bar-container"
    | "hashmap"
    | "stack"
    | "queue"
    | "tree"
    | "linkedList"
    | "grid"
    | "graph"
    | "recursion"
    | "custom";

  // ── Array / bar-container ─────────────────────────────────────────────────
  /** var name whose value becomes visual.values */
  valuesFrom?: string;
  pointers?: {
    name: string;
    var?: string;      // array / linkedList / tree / graph: var holding index or node-id
    rowVar?: string;   // grid only: var holding the row index
    colVar?: string;   // grid only: var holding the col index
  }[];
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

  // ── Hash map (B-3) ────────────────────────────────────────────────────────
  /** var name of the Python dict to visualize */
  keysFrom?: string;
  /** per-entry state rules; evaluated with `k` = entry key in scope */
  highlightRules?: HighlightRule[];
  /** var name of the key being looked up (shows the flying chip) */
  highlightKeyVar?: string;

  // ── Stack (B-5) / Queue (B-6) ─────────────────────────────────────────────
  /** var name of the list used as stack or queue */
  itemsFrom?: string;
  /** stack: var holding the top index (optional, display only) */
  topVar?: string;
  /** queue: var holding the front index (optional, display only) */
  frontVar?: string;
  /** queue: var holding the back index (optional, display only) */
  backVar?: string;

  // ── Tree (B-8) / Graph (B-10) — shared ───────────────────────────────────
  /** var name of the nodes list: [{id, value, left?, right?, x?, y?, ...}] */
  nodesFrom?: string;
  /** var name of the edges list: [{from, to, weight?, directed?, state?}] */
  edgesFrom?: string;
  /** per-node state rules; evaluated with `node_id` = node's id in scope */
  nodeStateRules?: NodeStateRule[];

  // ── Graph (B-10) ─────────────────────────────────────────────────────────
  /** default directed-ness for edges that omit the `directed` field */
  directed?: boolean;

  // ── Linked List (B-9) ────────────────────────────────────────────────────
  /** var name of the links list: [{from, to}] */
  linksFrom?: string;
  /** var name of the changed-links list (drives animated pointer re-wiring) */
  changedLinksFrom?: string;

  // ── Grid / Matrix (B-11) ─────────────────────────────────────────────────
  /** var name of the 2-D list (rows of rows) to visualize */
  gridFrom?: string;

  // ── Recursion (B-13/B-14) ────────────────────────────────────────────────
  /** var name of the call-frames list: [{id, label, returnValue?, isCurrent?}] */
  framesFrom?: string;
  /** var name of the recursion tree-edges list: [{from, to}] */
  treeEdgesFrom?: string;
  /** var name of the currently-executing frame id */
  currentFrameVar?: string;

  // ── Tree cursor ring ──────────────────────────────────────────────────────
  /** var name holding the current node id (drives the cursor ring) */
  currentNodeVar?: string;

  // ── Multi-structure (D19) ─────────────────────────────────────────────────
  /** Secondary structures to render alongside the primary in the stage. */
  auxMappings?: AuxMappingSpec[];
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
