/**
 * Per-approach dry-run (Gate C). Runs the full trace pipeline for every preset of
 * ONE approach — buildTrace (which calls validateTrace internally) + No-Line-Left-Behind
 * across the preset union — WITHOUT touching MongoDB. Throws on any contract breach,
 * exactly as ingest would.
 *
 * This is the single source of truth for "trace + validate one approach": scripts/ingest.ts
 * calls it too, then gzips + upserts the returned BuiltTrace[] (so the trace is built once).
 */
import path from "path";
import { buildTrace, type BuiltTrace } from "@/lib/tracer/pipeline";
import { assertLineCoverage } from "./validate-trace";

export interface ApproachDryRunResult {
  approachId: string;
  /** one BuiltTrace per preset, in preset order — ready for ingest to gzip/upsert */
  builts: { presetId: string; built: BuiltTrace }[];
  executableLines: number[];
  /** union of lines covered across all presets */
  coveredLines: number[];
}

export function dryRunApproach(
  bundleDir: string,
  approachId: string,
  presets: { id: string; expectedOutput: unknown }[]
): ApproachDryRunResult {
  const builts: { presetId: string; built: BuiltTrace }[] = [];
  const covered = new Set<number>();
  let executable: number[] = [];

  for (const preset of presets) {
    // buildTrace runs the tracer, applies mapping + narration, and validateTrace's
    // per-trace checks (throws on codeKey/narration/visual/expected-output breach).
    const built = buildTrace(bundleDir, approachId, preset.id, preset.expectedOutput);
    built.coveredLines.forEach((l) => covered.add(l));
    executable = built.executableLines;
    builts.push({ presetId: preset.id, built });
  }

  // No-Line-Left-Behind is an approach-level guarantee — assert over the union,
  // never per-preset (a single preset need not exercise every branch).
  assertLineCoverage(executable, covered, `${path.basename(bundleDir)}:${approachId}`);

  return {
    approachId,
    builts,
    executableLines: executable,
    coveredLines: [...covered].sort((a, b) => a - b),
  };
}
