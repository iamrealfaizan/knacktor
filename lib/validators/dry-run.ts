/**
 * Per-approach dry-run (Gate C). Runs the full trace pipeline for every preset of
 * ONE approach — buildTrace (which calls validateTrace internally) + No-Line-Left-Behind
 * across the preset union — WITHOUT touching MongoDB. Throws on any contract breach,
 * exactly as ingest would.
 *
 * This is the single source of truth for "trace + validate one approach": scripts/ingest.ts
 * calls it too, then gzips + upserts the returned BuiltTrace[] (so the trace is built once).
 */
import fs from "fs";
import path from "path";
import { buildTrace, type BuiltTrace } from "@/lib/tracer/pipeline";
import { assertLineCoverage } from "./validate-trace";
import { analyzeTrace, assertLiveness, type LivenessReport } from "./liveness";

interface LivenessExemption {
  slug: string;
  approachId: string;
  reason: string;
}

/** Explicit, reviewed list of (slug, approachId) pairs exempt from the liveness gate.
 *  Exemptions are deliberate and logged loudly — new problems are NOT auto-added. */
function livenessExemption(slug: string, approachId: string): LivenessExemption | undefined {
  const file = path.join(process.cwd(), "seeds", "liveness-exempt.json");
  if (!fs.existsSync(file)) return undefined;
  try {
    const list = JSON.parse(fs.readFileSync(file, "utf-8")) as LivenessExemption[];
    return list.find((e) => e.slug === slug && e.approachId === approachId);
  } catch {
    return undefined;
  }
}

export interface ApproachDryRunResult {
  approachId: string;
  /** one BuiltTrace per preset, in preset order — ready for ingest to gzip/upsert */
  builts: { presetId: string; built: BuiltTrace }[];
  executableLines: number[];
  /** union of lines covered across all presets */
  coveredLines: number[];
  /** per-preset liveness (fidelity Gate — already asserted before return) */
  liveness: LivenessReport[];
}

export function dryRunApproach(
  bundleDir: string,
  approachId: string,
  presets: { id: string; expectedOutput: unknown; isEdgeCase?: boolean }[]
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

  const label = `${path.basename(bundleDir)}:${approachId}`;

  // No-Line-Left-Behind is an approach-level guarantee — assert over the union,
  // never per-preset (a single preset need not exercise every branch).
  assertLineCoverage(executable, covered, label);

  // Fidelity Gate — the simulation is the USP, so a static/boring animation is a failure.
  const edge = new Map(presets.map((p) => [p.id, !!p.isEdgeCase]));
  const liveness = builts.map(({ presetId, built }) =>
    analyzeTrace(built.steps, presetId, edge.get(presetId) ?? false)
  );
  const exemption = livenessExemption(path.basename(bundleDir), approachId);
  if (exemption) {
    console.warn(
      `  ⚠ LIVENESS EXEMPT — ${exemption.slug}:${approachId} skips the fidelity gate.\n      reason: ${exemption.reason}`
    );
  } else {
    assertLiveness(liveness, label);
  }

  return {
    approachId,
    builts,
    executableLines: executable,
    coveredLines: [...covered].sort((a, b) => a - b),
    liveness,
  };
}
