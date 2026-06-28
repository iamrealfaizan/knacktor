/**
 * Trace-only reporting (Gate A). Runs the Python tracer (tracer/run.py) on a
 * solution + presets WITHOUT applying any mapping/narration DSL — so it works on
 * a partial bundle (solution.py + presets.json + a minimal approach.json/problem.json)
 * before mapping.json or narration.json exist.
 *
 * It surfaces the deterministic facts authors must build against: the real
 * executable-line set, per-step variable names + values, the real finalResult,
 * and per-preset / union line coverage. Mongo is never touched.
 */
import { runPython } from "./run-python";

export interface TraceReportStep {
  lineNo: number;
  vars: Record<string, unknown>;
}

export interface TraceReport {
  presetId: string;
  sourceLineCount: number;
  executableLines: number[];
  steps: TraceReportStep[];
  finalResult: unknown;
  /** distinct lines this preset executed */
  coveredLines: number[];
  /** executable lines this preset alone never reached */
  perPresetGap: number[];
}

export interface ApproachCoverage {
  approachId: string;
  reports: TraceReport[];
  executableLines: number[];
  unionCovered: number[];
  /** executable lines NO preset reaches — the coverage gate fails when non-empty */
  unionGap: number[];
  /** every variable name seen across all steps of all presets (the author's name universe) */
  varNames: string[];
}

const asc = (a: number, b: number) => a - b;

/** Run the tracer for ONE preset and shape the raw skeleton into a report. */
export function traceReport(bundleDir: string, approachId: string, presetId: string): TraceReport {
  const sk = runPython(bundleDir, approachId, presetId);
  const coveredLines = [...new Set(sk.steps.map((s) => s.lineNo))].sort(asc);
  const coveredSet = new Set(coveredLines);
  return {
    presetId,
    sourceLineCount: sk.sourceLineCount,
    executableLines: sk.executableLines,
    steps: sk.steps.map((s) => ({ lineNo: s.lineNo, vars: s.rawVars })),
    finalResult: sk.finalResult,
    coveredLines,
    perPresetGap: sk.executableLines.filter((l) => !coveredSet.has(l)),
  };
}

/** Run the tracer for every preset of ONE approach and compute union coverage + var universe. */
export function traceApproachCoverage(
  bundleDir: string,
  approachId: string,
  presetIds: string[]
): ApproachCoverage {
  const reports = presetIds.map((id) => traceReport(bundleDir, approachId, id));
  const executableLines = reports.length ? reports[0].executableLines : [];

  const unionCoveredSet = new Set<number>();
  const varNamesSet = new Set<string>();
  for (const r of reports) {
    r.coveredLines.forEach((l) => unionCoveredSet.add(l));
    for (const s of r.steps) for (const k of Object.keys(s.vars)) varNamesSet.add(k);
  }

  return {
    approachId,
    reports,
    executableLines,
    unionCovered: [...unionCoveredSet].sort(asc),
    unionGap: executableLines.filter((l) => !unionCoveredSet.has(l)),
    varNames: [...varNamesSet].sort(),
  };
}
