/**
 * Applies a VisualMappingSpec to one raw step → VisualState + phase + counters +
 * keyEvent. All logic is driven by the safe expression DSL (lib/tracer/expr.ts),
 * evaluated against the step's REAL captured variables — so the animation is
 * derived from the execution and cannot drift from the code (D9).
 */
import { evalExpr, evalBool, type Scope } from "./expr";
import type {
  VisualMappingSpec,
  CounterRule,
  KeyEventRule,
  PhaseRule,
} from "./types";
import type { VisualState, CellState, StepPhase, KeyEvent } from "@/lib/trace";

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

/** Build the VisualState for this step from the mapping spec + scope. */
export function mapVisual(
  spec: VisualMappingSpec,
  scope: Scope,
  prevVars: Record<string, unknown>
): VisualState {
  const valuesRaw = spec.valuesFrom ? scope[spec.valuesFrom] : undefined;
  const values = (Array.isArray(valuesRaw) ? valuesRaw : []) as (number | string)[];
  const n = values.length;

  // pointers
  const pointers: { name: string; at: number }[] = [];
  for (const p of spec.pointers ?? []) {
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

function num(v: unknown): number {
  return isNum(v) ? v : 0;
}
