/**
 * Resolves a step's narration from the NarrationSpec and fills {placeholders}
 * from the step's captured vars. Resolution order: byLine[lineNo] (first variant
 * whose `when` passes) → byPhase[phase]. Returns null if nothing resolves, which
 * the validator turns into a loud failure (no silent blanks — D13).
 */
import { evalBool, type Scope } from "./expr";
import { fillTemplate } from "./mapping";
import type { NarrationSpec, NarrationEntry } from "./types";
import type { StepNarration, StepPhase } from "@/lib/trace";

export function resolveNarration(
  spec: NarrationSpec,
  lineNo: number,
  phase: StepPhase,
  scope: Scope
): StepNarration | null {
  const byLine = spec.byLine?.[String(lineNo)];
  let entry: NarrationEntry | undefined;

  if (byLine) {
    const variants = Array.isArray(byLine) ? byLine : [byLine];
    entry = variants.find((v) => !v.when || evalBool(v.when, scope)) ?? variants.find((v) => !v.when);
  }
  if (!entry) entry = spec.byPhase?.[phase];
  if (!entry) return null;

  return {
    happening: fillTemplate(entry.happening, scope),
    why: fillTemplate(entry.why, scope),
    invariant: fillTemplate(entry.invariant, scope),
  };
}
