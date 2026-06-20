/**
 * Applies a VisualMappingSpec to one raw step → VisualState + phase + counters +
 * keyEvent. All logic is driven by the safe expression DSL (lib/tracer/expr.ts),
 * evaluated against the step's REAL captured variables — so the animation is
 * derived from the execution and cannot drift from the code (D9).
 */
import { evalExpr, evalBool, type Scope } from "./expr";
import type {
  VisualMappingSpec,
  AuxMappingSpec,
  CounterRule,
  KeyEventRule,
  PhaseRule,
  NodeStateRule,
} from "./types";
import type {
  VisualState,
  LeafVisualState,
  CombinedVisualState,
  CellState,
  StepPhase,
  KeyEvent,
  HashMapEntry,
  TreeNode,
  GraphNode,
  GraphEdge,
  GraphEdgeState,
  GridCell,
  GridPointer,
  CallFrame,
} from "@/lib/trace";

const CELL_STATES = new Set<CellState>([
  "idle", "current", "compared", "frontier", "visited", "result",
  "path", "special", "error", "dimmed", "left", "right",
]);

/** Build the evaluation scope for a step: captured vars + *_prev + phase + flags. */
export function buildScope(
  rawVars: Record<string, unknown>,
  prevVars: Record<string, unknown>,
  phase: StepPhase,
  flags?: Record<string, string>
): Scope {
  const scope: Scope = { ...rawVars, phase };
  for (const [k, v] of Object.entries(prevVars)) scope[`${k}_prev`] = v;
  // flags may reference vars + _prev (not idx); evaluate them up front
  if (flags) {
    for (const [name, expr] of Object.entries(flags)) {
      try { scope[name] = evalBool(expr, scope); } catch { scope[name] = false; }
    }
  }
  return scope;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Resolve a phase from the phaseRules (first match by line, optional guard). */
export function computePhase(rules: PhaseRule[] | undefined, lineNo: number, scope: Scope): StepPhase {
  if (rules) {
    for (const r of rules) {
      if (r.lines.includes(lineNo) && (!r.when || evalBool(r.when, scope))) return r.phase;
    }
  }
  return "update";
}

/** Accumulate counters from the previous step + this step's rule matches. */
export function computeCounters(
  rules: CounterRule[] | undefined,
  prev: Record<string, number>,
  lineNo: number,
  scope: Scope
): Record<string, number> {
  const out: Record<string, number> = {};
  // carry forward every author-named counter
  const names = new Set<string>(Object.keys(prev).filter((k) => k !== "timeOps" && k !== "spaceUnits"));
  for (const r of rules ?? []) names.add(r.name);
  for (const n of names) out[n] = prev[n] ?? 0;

  for (const r of rules ?? []) {
    const hit = (r.onLines?.includes(lineNo) ?? false) || (r.when ? evalBool(r.when, scope) : false);
    if (hit) out[r.name] = (out[r.name] ?? 0) + 1;
  }
  out.timeOps = Object.values(out).reduce((a, b) => a + b, 0);
  out.spaceUnits = 1;
  return out;
}

/** First matching key-event rule → descriptor, else undefined. */
export function computeKeyEvent(
  rules: KeyEventRule[] | undefined,
  lineNo: number,
  scope: Scope
): KeyEvent | undefined {
  for (const r of rules ?? []) {
    if (r.line === undefined && r.when === undefined) continue; // would match every step
    const lineOk = r.line === undefined || r.line === lineNo;
    const whenOk = r.when === undefined || evalBool(r.when, scope);
    if (lineOk && whenOk) return { label: r.label, kind: r.kind };
  }
  return undefined;
}

/** Replace {expr} placeholders by evaluating each against the scope. */
export function fillTemplate(tmpl: string, scope: Scope): string {
  return tmpl.replace(/\{([^}]+)\}/g, (_, e) => {
    try {
      const v = evalExpr(e.trim(), scope);
      if (v === null || v === undefined) return "∅";
      if (Array.isArray(v)) return `[${v.join(",")}]`;
      return String(v);
    } catch {
      return "?";
    }
  });
}

/**
 * Build the VisualState for this step from the mapping spec + scope.
 * Returns a CombinedVisualState when auxMappings are present (D19).
 */
export function mapVisual(
  spec: VisualMappingSpec,
  scope: Scope,
  prevVars: Record<string, unknown>
): VisualState {
  if (spec.auxMappings?.length) {
    const primary = mapLeaf(spec, scope, prevVars);
    const aux = spec.auxMappings.map((a) => ({
      label: a.label,
      visual: mapAux(a, scope),
    }));
    return { type: "combined", primary, aux } as CombinedVisualState;
  }
  return mapLeaf(spec, scope, prevVars);
}

/** Map the primary primitive to a LeafVisualState (no combined nesting). */
function mapLeaf(
  spec: VisualMappingSpec,
  scope: Scope,
  prevVars: Record<string, unknown>
): LeafVisualState {
  // ── Early dispatch for non-array primitives ─────────────────────────────
  if (spec.primitive === "stack")      return mapStack(spec, scope);
  if (spec.primitive === "queue")      return mapQueue(spec, scope);
  if (spec.primitive === "hashmap")    return mapHashmap(spec, scope);
  if (spec.primitive === "tree")       return mapTree(spec, scope);
  if (spec.primitive === "linkedList") return mapLinkedList(spec, scope);
  if (spec.primitive === "grid")       return mapGrid(spec, scope);
  if (spec.primitive === "graph")      return mapGraph(spec, scope);
  if (spec.primitive === "recursion")  return mapRecursion(spec, scope);

  const valuesRaw = spec.valuesFrom ? scope[spec.valuesFrom] : undefined;
  const values = (Array.isArray(valuesRaw) ? valuesRaw : []) as (number | string)[];
  const n = values.length;

  // pointers
  const pointers: { name: string; at: number }[] = [];
  for (const p of spec.pointers ?? []) {
    if (!p.var) continue;
    const at = scope[p.var];
    if (isNum(at) && at >= 0 && at < n) pointers.push({ name: p.name, at });
  }

  // cellStates (first-match-wins per index)
  const cellStates: Record<string, CellState> = {};
  for (let idx = 0; idx < n; idx++) {
    const cellScope: Scope = { ...scope, idx, values };
    let state: CellState = "idle";
    for (const rule of spec.cellStateRules ?? []) {
      if (!CELL_STATES.has(rule.state)) continue;
      if (evalBool(rule.when, cellScope) && (!rule.onlyWhen || evalBool(rule.onlyWhen, cellScope))) {
        state = rule.state;
        break;
      }
    }
    cellStates[String(idx)] = state;
  }

  // window
  let window: { from: number; to: number } | undefined;
  if (spec.window) {
    const from = evalExpr(spec.window.from, scope);
    const to = evalExpr(spec.window.to, scope);
    if (isNum(from) && isNum(to)) window = { from, to };
  }

  // ghosts (before→after for tracked pointer vars that moved)
  const ghosts: { name: string; from: number; to: number }[] = [];
  for (const varName of spec.ghosts?.track ?? []) {
    const cur = scope[varName];
    const prev = prevVars[varName];
    if (isNum(cur) && isNum(prev) && cur !== prev) {
      const pname = spec.pointers?.find((p) => p.var === varName)?.name ?? varName;
      ghosts.push({ name: pname, from: prev, to: cur });
    }
  }

  // readout chip (optionally gated by `when`)
  const showReadout = spec.readout && (!spec.readout.when || evalBool(spec.readout.when, scope));
  const readout = showReadout
    ? {
        expr: fillTemplate(spec.readout!.expr, scope),
        relation: spec.readout!.relation ? fillTemplate(spec.readout!.relation, scope) : undefined,
        relationColor: spec.readout!.relationColor,
      }
    : undefined;

  if (spec.primitive === "bar-container") {
    const c = spec.derived?.container;
    const container = c
      ? {
          left: num(evalExpr(c.left, scope)),
          right: num(evalExpr(c.right, scope)),
          width: num(evalExpr(c.width, scope)),
          waterHeight: num(evalExpr(c.waterHeight, scope)),
          area: num(evalExpr(c.area, scope)),
        }
      : undefined;
    return {
      type: "bar-container",
      values: values as number[],
      cellStates,
      pointers,
      container,
      readout,
    };
  }

  // default: array
  return {
    type: "array",
    values,
    cellStates,
    pointers,
    window,
    ghosts: ghosts.length ? ghosts : undefined,
    readout,
  };
}

/**
 * Map one AuxMappingSpec to a LeafVisualState.
 * Casts to VisualMappingSpec since all per-primitive fields are structurally identical;
 * pipeline-level fields (phaseRules, counters, keyEvents, flags, readout) are absent
 * but the helpers only touch primitive-specific fields.
 */
function mapAux(aux: AuxMappingSpec, scope: Scope): LeafVisualState {
  const spec = aux as unknown as VisualMappingSpec;
  if (aux.primitive === "stack")      return mapStack(spec, scope);
  if (aux.primitive === "queue")      return mapQueue(spec, scope);
  if (aux.primitive === "hashmap")    return mapHashmap(spec, scope);
  if (aux.primitive === "tree")       return mapTree(spec, scope);
  if (aux.primitive === "linkedList") return mapLinkedList(spec, scope);
  if (aux.primitive === "grid")       return mapGrid(spec, scope);
  if (aux.primitive === "graph")      return mapGraph(spec, scope);
  if (aux.primitive === "recursion")  return mapRecursion(spec, scope);
  // array / bar-container (no ghosts/readout for aux)
  return mapLeaf(spec, scope, {});
}

function num(v: unknown): number {
  return isNum(v) ? v : 0;
}

// ── Per-primitive mapping helpers ─────────────────────────────────────────────

/** Coerce a JSON key (always string after parse) to number if it looks numeric. */
function coerceKey(k: string): string | number {
  const n = Number(k);
  return Number.isFinite(n) && String(n) === k ? n : k;
}

/** Apply NodeStateRules to a node id; returns first matching state or "idle". */
function resolveNodeState(
  id: string,
  rules: NodeStateRule[] | undefined,
  scope: Scope
): CellState {
  for (const rule of rules ?? []) {
    if (evalBool(rule.when, { ...scope, node_id: id })) return rule.state;
  }
  return "idle";
}

function mapStack(spec: VisualMappingSpec, scope: Scope) {
  const raw = spec.itemsFrom ? scope[spec.itemsFrom] : [];
  const items = (Array.isArray(raw) ? raw : []) as (number | string)[];
  return {
    type: "stack" as const,
    items: items.map((value, idx) => ({
      value,
      state: firstMatchingCell(spec, { ...scope, idx, values: items }),
    })),
    label: spec.itemsFrom,
  };
}

function mapQueue(spec: VisualMappingSpec, scope: Scope) {
  const raw = spec.itemsFrom ? scope[spec.itemsFrom] : [];
  const items = (Array.isArray(raw) ? raw : []) as (number | string)[];
  return {
    type: "queue" as const,
    items: items.map((value, idx) => ({
      value,
      state: firstMatchingCell(spec, { ...scope, idx, values: items }),
    })),
    label: spec.itemsFrom,
  };
}

function mapHashmap(spec: VisualMappingSpec, scope: Scope) {
  const mapVar = spec.keysFrom ? scope[spec.keysFrom] : undefined;
  const entries: HashMapEntry[] = [];

  if (mapVar && typeof mapVar === "object" && !Array.isArray(mapVar)) {
    for (const [rawKey, value] of Object.entries(mapVar as Record<string, unknown>)) {
      const k = coerceKey(rawKey);
      let state: CellState = "idle";
      for (const rule of spec.highlightRules ?? []) {
        if (evalBool(rule.whenKey, { ...scope, k })) { state = rule.state; break; }
      }
      entries.push({ key: k, value, state });
    }
  }

  const highlightedKey = spec.highlightKeyVar
    ? (scope[spec.highlightKeyVar] as string | number | undefined)
    : undefined;

  return {
    type: "hashmap" as const,
    entries,
    highlightedKey,
    label: spec.keysFrom,
  };
}

function mapTree(spec: VisualMappingSpec, scope: Scope) {
  const rawNodes = spec.nodesFrom ? scope[spec.nodesFrom] : [];
  const nodes: TreeNode[] = (Array.isArray(rawNodes) ? rawNodes : []).map(
    (n: Record<string, unknown>) => ({
      id: String(n.id),
      value: n.value as number | string,
      state: resolveNodeState(String(n.id), spec.nodeStateRules, scope),
      left:  n.left  != null ? String(n.left)  : null,
      right: n.right != null ? String(n.right) : null,
    })
  );

  const pointers = (spec.pointers ?? [])
    .filter((p) => p.var)
    .map((p) => ({
      name: p.name,
      at: scope[p.var!] != null ? String(scope[p.var!]) : null,
    }));

  const currentId = spec.currentNodeVar
    ? (scope[spec.currentNodeVar] != null ? String(scope[spec.currentNodeVar]) : null)
    : null;

  return { type: "tree" as const, nodes, pointers, currentId };
}

function mapLinkedList(spec: VisualMappingSpec, scope: Scope) {
  const rawNodes   = spec.nodesFrom        ? scope[spec.nodesFrom]        : [];
  const rawLinks   = spec.linksFrom        ? scope[spec.linksFrom]        : [];
  const rawChanged = spec.changedLinksFrom ? scope[spec.changedLinksFrom] : [];

  const nodesArr   = Array.isArray(rawNodes)   ? rawNodes   : [];
  const linksArr   = Array.isArray(rawLinks)   ? rawLinks   : [];
  const changedArr = Array.isArray(rawChanged) ? rawChanged : [];

  // Two supported formats:
  //   Flat  (array-based LL): nodes=[val0,val1,...], links=[next0,next1,...] (-1=no next),
  //                           changedLinks=[nodeId,...] (IDs whose link just changed)
  //   Structured:             nodes=[{id,value},...], links=[{from,to},...],
  //                           changedLinks=[{from,to},...]
  // Detection: if the first element is a primitive (not an object), it's the flat format.
  const flatNodes   = nodesArr.length   === 0 || typeof nodesArr[0]   !== "object" || nodesArr[0]   === null;
  const flatLinks   = linksArr.length   === 0 || typeof linksArr[0]   !== "object" || linksArr[0]   === null;
  const flatChanged = changedArr.length === 0 || typeof changedArr[0] !== "object" || changedArr[0] === null;

  const nodes = flatNodes
    ? nodesArr.map((value: unknown, idx: number) => ({
        id:    String(idx),
        value: value as number | string,
        state: resolveNodeState(String(idx), spec.nodeStateRules, scope),
      }))
    : (nodesArr as Array<{ id: string | number; value: number | string; state?: CellState }>).map((n) => {
        const rs = resolveNodeState(String(n.id), spec.nodeStateRules, scope);
        return {
          id:    String(n.id),
          value: n.value,
          state: (rs !== "idle" ? rs : (n.state ?? "idle")) as CellState,
        };
      });

  const links: { from: string; to: string }[] = flatLinks
    ? (linksArr as number[]).flatMap((next, fromIdx) =>
        next !== -1 ? [{ from: String(fromIdx), to: String(next) }] : []
      )
    : (linksArr as Array<{ from: string | number; to: string | number }>).map((lk) => ({
        from: String(lk.from),
        to:   String(lk.to),
      }));

  let changedLinks: { from: string; to: string }[] | undefined;
  if (changedArr.length > 0) {
    if (flatChanged && flatLinks) {
      // Each entry is a node ID whose outgoing link just changed; look up current target.
      changedLinks = (changedArr as number[])
        .filter((nodeId) => isNum(nodeId) && nodeId >= 0)
        .map((nodeId) => ({
          from: String(nodeId),
          to:   String((linksArr as number[])[nodeId] ?? -1),
        }));
    } else {
      changedLinks = (changedArr as Array<{ from: string | number; to: string | number }>).map((lk) => ({
        from: String(lk.from),
        to:   String(lk.to),
      }));
    }
  }

  const pointers = (spec.pointers ?? [])
    .filter((p) => p.var)
    .map((p) => ({
      name: p.name,
      at: scope[p.var!] != null ? String(scope[p.var!]) : null,
    }));

  return { type: "linkedList" as const, nodes, links, pointers, changedLinks };
}

function mapGrid(spec: VisualMappingSpec, scope: Scope) {
  const rawGrid = spec.gridFrom ? scope[spec.gridFrom] : [];
  const grid2d  = Array.isArray(rawGrid) ? (rawGrid as unknown[][]) : [];

  const rows: GridCell[][] = grid2d.map((row, r) =>
    (Array.isArray(row) ? row : []).map((val, c) => ({
      value: val as number | string,
      state: firstMatchingCell(spec, { ...scope, r, c }),
    }))
  );

  const pointers: GridPointer[] = (spec.pointers ?? [])
    .filter((p) => p.rowVar && p.colVar)
    .map((p) => ({
      name: p.name,
      row: num(scope[p.rowVar!]),
      col: num(scope[p.colVar!]),
    }));

  return { type: "grid" as const, rows, pointers };
}

function mapGraph(spec: VisualMappingSpec, scope: Scope) {
  const rawNodes = spec.nodesFrom ? scope[spec.nodesFrom] : [];
  const rawEdges = spec.edgesFrom ? scope[spec.edgesFrom] : [];

  const nodes: GraphNode[] = (Array.isArray(rawNodes) ? rawNodes : []).map(
    (n: Record<string, unknown>) => ({
      id:    String(n.id),
      label: n.label != null ? String(n.label) : String(n.id),
      state: resolveNodeState(String(n.id), spec.nodeStateRules, scope),
      x: isNum(n.x) ? (n.x as number) : 0,
      y: isNum(n.y) ? (n.y as number) : 0,
    })
  );

  const edges: GraphEdge[] = (Array.isArray(rawEdges) ? rawEdges : []).map(
    (e: Record<string, unknown>) => ({
      from:     String(e.from),
      to:       String(e.to),
      weight:   isNum(e.weight) ? (e.weight as number) : undefined,
      directed: e.directed != null ? Boolean(e.directed) : Boolean(spec.directed),
      state:    ((e.state ?? "idle") as GraphEdgeState),
    })
  );

  const pointers = (spec.pointers ?? [])
    .filter((p) => p.var)
    .map((p) => ({
      name: p.name,
      at: scope[p.var!] != null ? String(scope[p.var!]) : null,
    }));

  return { type: "graph" as const, nodes, edges, pointers };
}

function mapRecursion(spec: VisualMappingSpec, scope: Scope) {
  const rawFrames = spec.framesFrom    ? scope[spec.framesFrom]    : [];
  const rawEdges  = spec.treeEdgesFrom ? scope[spec.treeEdgesFrom] : [];
  const currentId = spec.currentFrameVar ? scope[spec.currentFrameVar] : undefined;

  const frames: CallFrame[] = (Array.isArray(rawFrames) ? rawFrames : []).map(
    (f: Record<string, unknown>) => ({
      id:          String(f.id),
      label:       String(f.label),
      returnValue: f.returnValue ?? null,
      isCurrent:   f.id === currentId || Boolean(f.isCurrent),
    })
  );

  const treeEdges = (Array.isArray(rawEdges) ? rawEdges : []).map(
    (e: Record<string, unknown>) => ({ from: String(e.from), to: String(e.to) })
  );

  return { type: "recursion" as const, frames, treeEdges };
}

/** Evaluate cellStateRules in order; returns first matching state or "idle". */
function firstMatchingCell(spec: VisualMappingSpec, cellScope: Scope): CellState {
  for (const rule of spec.cellStateRules ?? []) {
    if (!CELL_STATES.has(rule.state)) continue;
    if (evalBool(rule.when, cellScope) && (!rule.onlyWhen || evalBool(rule.onlyWhen, cellScope))) {
      return rule.state;
    }
  }
  return "idle";
}
