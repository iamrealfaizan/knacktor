/**
 * Static DSL linter (Gate B) for mapping.json + narration.json.
 *
 * Two classes of failure, both caught BEFORE a trace is ever built:
 *   1. Grammar: slices `a[i:j]`, python `and/or/not`, `.method()`, `in`, unknown
 *      functions — all rejected by the expr.ts parser (referencedIdents throws).
 *   2. Unknown variables: an expression / template / `...From` field references a
 *      name that never appears in the trace (the "inventing variables" pitfall),
 *      which silently reads as null at runtime and produces wrong visuals.
 *
 * The slot list below MUST mirror exactly what lib/tracer/mapping.ts and
 * lib/tracer/narration.ts evaluate. Keep them in sync when a DSL field is added.
 */
import type {
  VisualMappingSpec,
  NarrationSpec,
  NarrationEntry,
} from "@/lib/tracer/types";
import { referencedIdents } from "@/lib/tracer/expr";

export interface DslIssue {
  slot: string;
  expr: string;
  reason: string;
}

/** Scope names the evaluators inject that are NOT solution variables. */
const INJECTED = ["phase", "idx", "values", "k", "node_id", "node_idx", "r", "c"];
const TEMPLATE_RE = /\{([^}]+)\}/g;

type ExprCheck = (slot: string, expr: string | undefined) => void;
type NameCheck = (slot: string, name: string | undefined) => void;

/**
 * @param traceVars union of every variable name observed across the approach's
 *        traces (from traceApproachCoverage().varNames).
 */
export function lintMappingAndNarration(
  mapping: VisualMappingSpec,
  narration: NarrationSpec,
  traceVars: Set<string>
): DslIssue[] {
  const issues: DslIssue[] = [];

  // The legal name universe: real trace vars + their *_prev forms + injected scope
  // names + author-declared flags (flags become scope names after buildScope).
  const known = new Set<string>(traceVars);
  for (const v of traceVars) known.add(`${v}_prev`);
  for (const n of INJECTED) known.add(n);
  for (const f of Object.keys(mapping.flags ?? {})) known.add(f);

  const checkExpr: ExprCheck = (slot, expr) => {
    if (expr == null || expr === "") return;
    let idents: Set<string>;
    try {
      idents = referencedIdents(expr);
    } catch (e) {
      issues.push({ slot, expr, reason: `syntax: ${(e as Error).message}` });
      return;
    }
    for (const id of idents) {
      if (!known.has(id)) {
        issues.push({
          slot,
          expr,
          reason: `unknown variable '${id}' — not a trace variable, declared flag, or injected scope name (idx/values/k/node_id/node_idx/r/c/phase/<var>_prev)`,
        });
      }
    }
  };

  const checkTemplate: ExprCheck = (slot, tmpl) => {
    if (!tmpl) return;
    let m: RegExpExecArray | null;
    TEMPLATE_RE.lastIndex = 0;
    while ((m = TEMPLATE_RE.exec(tmpl)) !== null) {
      checkExpr(`${slot} {…}`, m[1].trim());
    }
  };

  const checkName: NameCheck = (slot, name) => {
    if (!name) return;
    if (!known.has(name)) {
      issues.push({ slot, expr: name, reason: `references variable '${name}' which never appears in the trace` });
    }
  };

  // Primary + each aux share the same per-primitive field shapes.
  lintPrimitiveFields("mapping", mapping, checkExpr, checkName);
  (mapping.auxMappings ?? []).forEach((aux, i) =>
    lintPrimitiveFields(`mapping.auxMappings[${i}]`, aux as unknown as VisualMappingSpec, checkExpr, checkName)
  );

  // Pipeline-level fields (primary only).
  for (const [name, expr] of Object.entries(mapping.flags ?? {})) checkExpr(`mapping.flags.${name}`, expr);
  (mapping.counters ?? []).forEach((c, i) => checkExpr(`mapping.counters[${i}].when`, c.when));
  (mapping.keyEvents ?? []).forEach((k, i) => checkExpr(`mapping.keyEvents[${i}].when`, k.when));
  (mapping.phaseRules ?? []).forEach((p, i) => checkExpr(`mapping.phaseRules[${i}].when`, p.when));
  if (mapping.readout) {
    checkExpr("mapping.readout.when", mapping.readout.when);
    checkTemplate("mapping.readout.expr", mapping.readout.expr);
    checkTemplate("mapping.readout.relation", mapping.readout.relation);
  }
  if (mapping.derived?.container) {
    const c = mapping.derived.container;
    (["left", "right", "width", "waterHeight", "area"] as const).forEach((f) =>
      checkExpr(`mapping.derived.container.${f}`, c[f])
    );
  }
  (mapping.ghosts?.track ?? []).forEach((v, i) => checkName(`mapping.ghosts.track[${i}]`, v));
  (mapping.showVars ?? []).forEach((v, i) => checkName(`mapping.showVars[${i}]`, v));
  for (const [outKey, varName] of Object.entries(mapping.customVars ?? {}))
    checkName(`mapping.customVars.${outKey}`, varName);

  // Narration.
  for (const [line, entry] of Object.entries(narration.byLine ?? {})) {
    const variants = Array.isArray(entry) ? entry : [entry];
    variants.forEach((v, i) => lintNarrationEntry(`narration.byLine[${line}][${i}]`, v, checkExpr, checkTemplate));
  }
  for (const [phase, entry] of Object.entries(narration.byPhase ?? {}))
    lintNarrationEntry(`narration.byPhase.${phase}`, entry, checkExpr, checkTemplate);

  return issues;
}

/** Per-primitive fields shared by the primary mapping and every aux mapping. */
function lintPrimitiveFields(
  prefix: string,
  spec: VisualMappingSpec,
  checkExpr: ExprCheck,
  checkName: NameCheck
): void {
  // "...From" / *Var fields all reference a real solution variable by name.
  checkName(`${prefix}.valuesFrom`, spec.valuesFrom);
  checkName(`${prefix}.keysFrom`, spec.keysFrom);
  checkName(`${prefix}.highlightKeyVar`, spec.highlightKeyVar);
  checkName(`${prefix}.itemsFrom`, spec.itemsFrom);
  checkName(`${prefix}.topVar`, spec.topVar);
  checkName(`${prefix}.frontVar`, spec.frontVar);
  checkName(`${prefix}.backVar`, spec.backVar);
  checkName(`${prefix}.nodesFrom`, spec.nodesFrom);
  checkName(`${prefix}.edgesFrom`, spec.edgesFrom);
  checkName(`${prefix}.linksFrom`, spec.linksFrom);
  checkName(`${prefix}.changedLinksFrom`, spec.changedLinksFrom);
  checkName(`${prefix}.gridFrom`, spec.gridFrom);
  checkName(`${prefix}.framesFrom`, spec.framesFrom);
  checkName(`${prefix}.treeEdgesFrom`, spec.treeEdgesFrom);
  checkName(`${prefix}.currentFrameVar`, spec.currentFrameVar);
  checkName(`${prefix}.currentNodeVar`, spec.currentNodeVar);

  (spec.pointers ?? []).forEach((p, i) => {
    checkName(`${prefix}.pointers[${i}].var`, p.var);
    checkName(`${prefix}.pointers[${i}].rowVar`, p.rowVar);
    checkName(`${prefix}.pointers[${i}].colVar`, p.colVar);
  });

  (spec.cellStateRules ?? []).forEach((rule, i) => {
    checkExpr(`${prefix}.cellStateRules[${i}].when`, rule.when);
    checkExpr(`${prefix}.cellStateRules[${i}].onlyWhen`, rule.onlyWhen);
  });
  (spec.highlightRules ?? []).forEach((rule, i) => checkExpr(`${prefix}.highlightRules[${i}].whenKey`, rule.whenKey));
  (spec.nodeStateRules ?? []).forEach((rule, i) => checkExpr(`${prefix}.nodeStateRules[${i}].when`, rule.when));

  if (spec.window) {
    checkExpr(`${prefix}.window.from`, spec.window.from);
    checkExpr(`${prefix}.window.to`, spec.window.to);
  }
}

function lintNarrationEntry(
  prefix: string,
  entry: NarrationEntry,
  checkExpr: ExprCheck,
  checkTemplate: ExprCheck
): void {
  checkExpr(`${prefix}.when`, entry.when);
  checkTemplate(`${prefix}.happening`, entry.happening);
  checkTemplate(`${prefix}.why`, entry.why);
  checkTemplate(`${prefix}.invariant`, entry.invariant);
}
