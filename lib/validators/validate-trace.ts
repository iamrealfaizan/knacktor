/**
 * Trace validators (D13) — run at ingest time on every (approach, preset) trace.
 * Any failure THROWS, aborting the whole ingest so a broken problem can never
 * reach the database / the learner.
 */
import type { Step, CellState, VisualState } from "@/lib/trace";

const CELL_STATES = new Set<CellState>([
  "idle", "current", "compared", "frontier", "visited", "result",
  "path", "special", "error", "dimmed", "left", "right",
]);

const BANNED_NARRATION = [/^todo$/i, /^\s*…\s*$/, /^step\s*\d+$/i, /^\s*$/];

export interface ValidateTraceArgs {
  steps: Step[];
  executableLines: number[];
  finalResult: unknown;
  expectedOutput: unknown;
  label: string;
}

function fail(label: string, msg: string): never {
  throw new Error(`✗ trace validation failed [${label}]: ${msg}`);
}

/**
 * No Line Left Behind is an APPROACH-level guarantee: every executable line must
 * be covered by AT LEAST ONE preset (a single preset may not exercise every
 * branch). Call once per approach with the union of covered lines across presets.
 */
export function assertLineCoverage(
  executableLines: number[],
  covered: Set<number>,
  label: string
): void {
  const missing = executableLines.filter((l) => !covered.has(l));
  if (missing.length) {
    fail(
      label,
      `No Line Left Behind — line(s) no preset ever executes: ${missing.join(", ")} ` +
        `(add a preset whose run reaches them)`
    );
  }
}

/** Order-insensitive structural equality for results (lists compared as sets). */
function resultsEqual(a: unknown, b: unknown): boolean {
  const canon = (v: unknown): string => {
    if (Array.isArray(v)) {
      // sort arrays of arrays / primitives so element order doesn't matter
      const parts = v.map(canon);
      parts.sort();
      return `[${parts.join("|")}]`;
    }
    return JSON.stringify(v);
  };
  return canon(a) === canon(b);
}

function isValidVisual(v: VisualState): boolean {
  if (!v || typeof v !== "object") return false;
  if (v.type === "array" || v.type === "bar-container") {
    if (!Array.isArray(v.values)) return false;
    for (const s of Object.values(v.cellStates)) {
      if (!CELL_STATES.has(s)) return false;
    }
    return true;
  }
  return v.type === "linkedList" || v.type === "recursion";
}

export function validateTrace(args: ValidateTraceArgs): void {
  const { steps, executableLines, finalResult, expectedOutput, label } = args;

  if (steps.length === 0) fail(label, "no steps produced");

  // Per-trace checks: codeKey integrity + narration completeness + visual validity.
  // (No-Line-Left-Behind is checked at the approach level via assertLineCoverage,
  //  since a single preset need not exercise every branch.)
  for (const s of steps) {
    if (!executableLines.includes(s.codeKey)) {
      fail(label, `step ${s.i} codeKey ${s.codeKey} is not an executable source line`);
    }
    for (const field of ["happening", "why", "invariant"] as const) {
      const text = s.narration[field];
      if (BANNED_NARRATION.some((re) => re.test(text ?? ""))) {
        fail(label, `step ${s.i} (line ${s.codeKey}): narration.${field} is empty/generic ("${text}")`);
      }
    }
    if (!isValidVisual(s.visual)) {
      fail(label, `step ${s.i} (line ${s.codeKey}): invalid VisualState`);
    }
  }

  // 5) expected output match (order-insensitive for list results)
  if (expectedOutput !== undefined && !resultsEqual(finalResult, expectedOutput)) {
    fail(
      label,
      `traced result ${JSON.stringify(finalResult)} ≠ expectedOutput ${JSON.stringify(expectedOutput)}`
    );
  }
}
