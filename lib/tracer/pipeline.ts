/**
 * Trace pipeline (D9): raw skeleton (from tracer/run.py) + the bundle's
 * mapping.json & narration.json → a fully-assembled, validated Trace whose
 * Step[] is byte-compatible with lib/trace.ts and renders unchanged in the engine.
 */
import fs from "fs";
import path from "path";
import { runPython } from "./run-python";
import {
  buildScope,
  computePhase,
  computeCounters,
  computeKeyEvent,
  mapVisual,
} from "./mapping";
import { resolveNarration } from "./narration";
import { validateTrace } from "@/lib/validators/validate-trace";
import type { VisualMappingSpec, NarrationSpec } from "./types";
import type { Step, CallFrame } from "@/lib/trace";

export interface BuiltTrace {
  steps: Step[];
  finalResult: unknown;
  keyEventIndices: number[];
  /** lines this preset's run actually executed (for approach-level coverage) */
  coveredLines: number[];
  /** all executable lines of the solution (same across presets of an approach) */
  executableLines: number[];
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function changedKeys(cur: Record<string, unknown>, prev: Record<string, unknown>): string[] {
  const changed: string[] = [];
  for (const k of Object.keys(cur)) {
    if (!(k in prev) || JSON.stringify(prev[k]) !== JSON.stringify(cur[k])) changed.push(k);
  }
  return changed;
}

export function buildTrace(
  bundleDir: string,
  approachId: string,
  presetId: string,
  expectedOutput: unknown
): BuiltTrace {
  const approachDir = path.join(bundleDir, "approaches", approachId);
  const mapping = readJson<VisualMappingSpec>(path.join(approachDir, "mapping.json"));
  const narration = readJson<NarrationSpec>(path.join(approachDir, "narration.json"));

  const skeleton = runPython(bundleDir, approachId, presetId);

  const steps: Step[] = [];
  let prevVars: Record<string, unknown> = {};
  let prevCounters: Record<string, number> = {};

  skeleton.steps.forEach((raw, i) => {
    const phase = computePhase(mapping.phaseRules, raw.lineNo, { ...raw.rawVars });
    const scope = buildScope(raw.rawVars, prevVars, phase, mapping.flags);

    const counters = computeCounters(mapping.counters, prevCounters, raw.lineNo, scope);
    const visual = mapVisual(mapping, scope, prevVars);
    const keyEvent = computeKeyEvent(mapping.keyEvents, raw.lineNo, scope);
    const narr = resolveNarration(narration, raw.lineNo, phase, scope);

    const callStack: CallFrame[] | undefined =
      raw.callStack.length > 1
        ? raw.callStack.map((c, k) => ({
            id: `f${k}`,
            label: c.label,
            returnValue: null,
            isCurrent: k === raw.callStack.length - 1,
          }))
        : undefined;

    steps.push({
      i,
      codeKey: raw.lineNo,
      lineNo: raw.lineNo,
      phase,
      narration: narr ?? { happening: "", why: "", invariant: "" },
      vars: raw.rawVars,
      capturedVars: raw.rawVars,
      changedVars: changedKeys(raw.rawVars, prevVars),
      counters,
      visual,
      isKeyEvent: keyEvent ? true : undefined,
      keyEvent,
      callStack,
    });

    prevVars = raw.rawVars;
    prevCounters = counters;
  });

  const keyEventIndices = steps.filter((s) => s.isKeyEvent).map((s) => s.i);

  // Per-trace validation — throws (aborts ingest) on any contract breach.
  // (No-Line-Left-Behind is asserted at the approach level by the caller.)
  const narrationByLineKeys = new Set(
    Object.keys(narration.byLine ?? {}).map(Number)
  );
  validateTrace({
    steps,
    executableLines: skeleton.executableLines,
    finalResult: skeleton.finalResult,
    expectedOutput,
    label: `${path.basename(bundleDir)}:${approachId}:${presetId}`,
    narrationByLineKeys,
  });

  return {
    steps,
    finalResult: skeleton.finalResult,
    keyEventIndices,
    coveredLines: [...new Set(steps.map((s) => s.codeKey))],
    executableLines: skeleton.executableLines,
  };
}
