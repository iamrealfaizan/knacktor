/**
 * Liveness analyzer (Phase 4 — fidelity Gate). Knacktor's USP is the simulation, so a
 * structurally-valid trace whose picture barely moves is a product failure. This inspects
 * the built trace's per-step `visual` and blocks static/boring animations.
 *
 * It runs inside dryRunApproach, so BOTH `npm run dry-run` (authoring gate) and
 * `npm run ingest` enforce it — no boring animation reaches the learner.
 *
 * Hard signals (narrow, false-positive-safe) throw outright; two tunable thresholds
 * (staticPct / dead-run) catch milder stalls. Short traces (< MIN_STEPS) are exempt.
 */
import type { Step, VisualState, LeafVisualState, CombinedVisualState } from "@/lib/trace";

// ── Tunable thresholds (calibrated so genuine animations pass) ────────────────
// NOTE: the STAGE legitimately holds still on read/check/compute steps while the code line,
// variables, and narration advance — so static-PERCENT is NOT a defect signal (two-sum's
// optimal hashmap is ~75% stage-static, and a long linked-list traversal can be ~91% yet
// have plenty of real motion). Static-% is biased against long traces, so it's ADVISORY only.
// The real "dead animation" detectors are: too few DISTINCT frames, a long frozen run, an
// empty aux, or a pointer that never moves across any preset.
// The mechanical gate blocks only UNAMBIGUOUS deadness; the human reviews every problem's
// real-frame preview (so subtler weakness — long stalls, high static-%, no explicit highlight —
// is surfaced as ADVISORY in the review sheet, not blocked here).
export const MIN_STEPS = 6;            // min steps for a pointer to count toward motionless
export const DISTINCT_GUARD_STEPS = 10; // only judge distinct-frame floor on runs this long
export const MIN_DISTINCT_FRAMES = 3;   // < 3 distinct pictures over a long run = effectively dead
// Advisory-only (reported, never blocked): a long frozen run is flagged for human attention.
export const DEAD_RUN_ADVISORY = 12;

export interface LivenessReport {
  presetId: string;
  isEdgeCase: boolean;
  steps: number;
  staticSteps: number;
  staticPct: number;
  /** number of DISTINCT frames over the whole run (the real "is anything happening" signal) */
  distinctFrames: number;
  /** longest run of consecutive identical frames (frame count) */
  longestDeadRun: number;
  /** every frame identical to the first — the stage never changes */
  allStatic: boolean;
  /** at least one step highlights something (non-idle state / pointer / window / cursor) */
  focusEver: boolean;
  /** aux structures (combined) empty in every step of this preset */
  emptyAux: string[];
  /** distinct positions each declared pointer occupied in THIS preset (for cross-preset aggregation) */
  pointerPositions: Record<string, string[]>;
  /** how many steps each declared pointer was present in THIS preset */
  pointerCounts: Record<string, number>;
  /** 0–100; 100 = every step changes the picture */
  livenessScore: number;
  /** false when steps < MIN_STEPS (skipped by the soft thresholds) */
  evaluated: boolean;
}

// ── Stable, key-order-independent serialization of a visual (the "frame signature") ──
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + stable(o[k])).join(",") + "}";
}

function primaryOf(v: VisualState): LeafVisualState {
  return v.type === "combined" ? (v as CombinedVisualState).primary : (v as LeafVisualState);
}

/** Does this leaf highlight anything (vs. an inert all-idle picture)? */
function leafHasFocus(v: LeafVisualState): boolean {
  switch (v.type) {
    case "array":
    case "bar-container":
      return (
        Object.values(v.cellStates).some((s) => s !== "idle") ||
        v.pointers.length > 0 ||
        ("window" in v && !!(v as { window?: unknown }).window) ||
        ("container" in v && !!(v as { container?: unknown }).container)
      );
    case "stack":
    case "queue":
      return v.items.some((it) => it.state !== "idle");
    case "hashmap":
      return v.entries.some((e) => e.state !== "idle") || v.highlightedKey != null;
    case "linkedList":
      return (
        v.nodes.some((n) => n.state && n.state !== "idle") ||
        v.pointers.some((p) => p.at != null) ||
        (v.changedLinks?.length ?? 0) > 0
      );
    case "tree":
      return v.nodes.some((n) => n.state !== "idle") || v.pointers.some((p) => p.at != null) || v.currentId != null;
    case "grid":
      return v.rows.some((r) => r.some((c) => c.state !== "idle")) || v.pointers.length > 0;
    case "graph":
      return (
        v.nodes.some((n) => n.state !== "idle") ||
        v.edges.some((e) => e.state !== "idle") ||
        v.pointers.some((p) => p.at != null)
      );
    case "recursion":
      return v.frames.length > 0;
    case "custom":
    default:
      return true; // can't introspect custom payloads — assume meaningful
  }
}

function leafIsEmpty(v: LeafVisualState): boolean {
  switch (v.type) {
    case "array":
    case "bar-container":
      return v.values.length === 0;
    case "stack":
    case "queue":
      return v.items.length === 0;
    case "hashmap":
      return v.entries.length === 0;
    case "linkedList":
      return v.nodes.length === 0;
    case "tree":
      return v.nodes.length === 0;
    case "grid":
      return v.rows.length === 0;
    case "graph":
      return v.nodes.length === 0;
    case "recursion":
      return v.frames.length === 0;
    default:
      return false;
  }
}

/** Declared pointers and their serialized position, for movement detection. */
function leafPointers(v: LeafVisualState): { name: string; at: string }[] {
  switch (v.type) {
    case "array":
    case "bar-container":
      return v.pointers.map((p) => ({ name: p.name, at: String(p.at) }));
    case "tree":
    case "graph":
    case "linkedList":
      return v.pointers.map((p) => ({ name: p.name, at: String(p.at) }));
    case "grid":
      return v.pointers.map((p) => ({ name: p.name, at: `${p.row},${p.col}` }));
    default:
      return [];
  }
}

export function analyzeTrace(steps: Step[], presetId: string, isEdgeCase: boolean): LivenessReport {
  const n = steps.length;
  const sigs = steps.map((s) => stable(s.visual));

  let staticSteps = 0;
  let run = 1;
  let longest = 1;
  for (let i = 1; i < n; i++) {
    if (sigs[i] === sigs[i - 1]) {
      staticSteps++;
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  const staticPct = n > 1 ? staticSteps / (n - 1) : 0;
  const allStatic = n > 1 && staticSteps === n - 1;

  const focusEver = steps.some((s) => leafHasFocus(primaryOf(s.visual)));

  // Pointer positions seen this preset (ignoring null/undefined) — aggregated across
  // presets by assertLiveness so an early-return preset doesn't falsely flag a pointer.
  const pos = new Map<string, Set<string>>();
  const count = new Map<string, number>();
  for (const s of steps) {
    for (const p of leafPointers(primaryOf(s.visual))) {
      if (p.at === "null" || p.at === "undefined") continue;
      if (!pos.has(p.name)) {
        pos.set(p.name, new Set());
        count.set(p.name, 0);
      }
      pos.get(p.name)!.add(p.at);
      count.set(p.name, count.get(p.name)! + 1);
    }
  }
  const pointerPositions: Record<string, string[]> = {};
  const pointerCounts: Record<string, number> = {};
  for (const [name, set] of pos) {
    pointerPositions[name] = [...set];
    pointerCounts[name] = count.get(name) ?? 0;
  }

  // Aux emptiness (combined only): empty in EVERY step → useless container.
  const emptyAux: string[] = [];
  const first = steps[0]?.visual;
  if (first && first.type === "combined") {
    (first as CombinedVisualState).aux.forEach((a, idx) => {
      const everNonEmpty = steps.some((s) => {
        if (s.visual.type !== "combined") return false;
        const entry = (s.visual as CombinedVisualState).aux[idx];
        return entry && !leafIsEmpty(entry.visual);
      });
      if (!everNonEmpty) emptyAux.push(a.label);
    });
  }

  return {
    presetId,
    isEdgeCase,
    steps: n,
    staticSteps,
    staticPct,
    distinctFrames: new Set(sigs).size,
    longestDeadRun: longest,
    allStatic,
    focusEver,
    emptyAux,
    pointerPositions,
    pointerCounts,
    livenessScore: Math.round((1 - staticPct) * 100),
    evaluated: n >= MIN_STEPS,
  };
}

function fail(label: string, msg: string): never {
  throw new Error(`✗ liveness failed [${label}]: ${msg}`);
}

/**
 * Throws on the first liveness breach for an approach.
 *
 * - Hard signals (allStatic / no-focus / empty-aux) and the soft thresholds are judged on
 *   NON-edge presets only — edge cases (single element, early return) are legitimately quiet.
 * - Pointer movement is judged at the APPROACH level: a pointer is "motionless" only if it
 *   never moves across ANY preset (so an early-return example can't falsely flag it).
 * - Traces shorter than MIN_STEPS are exempt from the soft thresholds.
 */
export function assertLiveness(reports: LivenessReport[], label: string): void {
  // Approach-level pointer aggregation (across all presets, edge included — more data).
  const aggPos = new Map<string, Set<string>>();
  const aggCount = new Map<string, number>();
  for (const r of reports) {
    for (const [name, positions] of Object.entries(r.pointerPositions)) {
      if (!aggPos.has(name)) aggPos.set(name, new Set());
      positions.forEach((p) => aggPos.get(name)!.add(p));
      aggCount.set(name, (aggCount.get(name) ?? 0) + (r.pointerCounts[name] ?? 0));
    }
  }
  const motionless = [...aggPos.entries()]
    .filter(([name, set]) => (aggCount.get(name) ?? 0) >= MIN_STEPS && set.size === 1)
    .map(([name]) => name);
  if (motionless.length) {
    fail(label, `pointer(s) [${motionless.join(", ")}] never move across ANY preset — they aren't tracking a real cursor (check the pointer var).`);
  }

  // Per-preset BLOCK (non-edge presets only): the only mechanically-unambiguous deadness.
  // Everything subtler (longestDeadRun, staticPct, focusEver) is advisory — see livenessAdvisories().
  for (const r of reports) {
    if (r.isEdgeCase) continue;
    const at = `${label}:${r.presetId}`;
    if (r.emptyAux.length) {
      fail(at, `aux structure(s) [${r.emptyAux.join(", ")}] are empty in every step — fix their itemsFrom/keysFrom or remove them.`);
    }
    if (r.steps >= DISTINCT_GUARD_STEPS && r.distinctFrames < MIN_DISTINCT_FRAMES) {
      fail(at, `the stage shows only ${r.distinctFrames} distinct frame(s) across ${r.steps} steps — effectively dead. Often means a mapping var (framesFrom/itemsFrom/valuesFrom) is empty or unchanging. Make the algorithm's per-step work visible (cellStateRules / moving pointers / growing structure).`);
    }
  }
}

/**
 * Non-blocking fidelity signals for the review sheet — things a human should eyeball even
 * though they aren't egregious enough to auto-block (long stalls, near-static stages, a stage
 * that never marks a `current` element). Returned per preset; empty array = nothing to flag.
 */
export function livenessAdvisories(reports: LivenessReport[]): { presetId: string; notes: string[] }[] {
  return reports.map((r) => {
    const notes: string[] = [];
    if (!r.focusEver) notes.push("stage never marks a current/compared element (only values move) — confirm the highlight reads right");
    if (r.longestDeadRun > DEAD_RUN_ADVISORY) notes.push(`${r.longestDeadRun} consecutive identical frames — the stage stalls in one spot`);
    if (r.evaluated && r.staticPct >= 0.85) notes.push(`${Math.round(r.staticPct * 100)}% of frames repeat the previous one — sparse motion`);
    return { presetId: r.presetId, notes };
  }).filter((a) => a.notes.length > 0);
}
