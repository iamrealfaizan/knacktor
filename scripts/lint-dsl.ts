/**
 * Gate B — static DSL lint. Checks every expression / template / "...From" field in
 * an approach's mapping.json + narration.json against the expr.ts grammar AND against
 * the real variable universe from the trace. Catches slices, and/or/not, .method(),
 * `in`, unknown functions, and (the common one) invented variable names — before any
 * trace is built.
 *
 *   npm run lint-dsl <bundleDir> [approachId]
 *
 * Needs the full bundle (solution.py + presets.json + mapping.json + narration.json)
 * because it derives the legal variable universe from a real trace.
 * Exits non-zero if any approach has issues.
 */
import fs from "fs";
import path from "path";
import { traceApproachCoverage } from "../lib/tracer/trace-report";
import { lintMappingAndNarration } from "../lib/validators/lint-dsl";
import type { VisualMappingSpec, NarrationSpec } from "../lib/tracer/types";

function presetIdsOf(bundleDir: string): string[] {
  const presets = JSON.parse(fs.readFileSync(path.join(bundleDir, "presets.json"), "utf-8"));
  return (presets as { id: string }[]).map((p) => p.id);
}

function approachesWithMapping(bundleDir: string): string[] {
  const dir = path.join(bundleDir, "approaches");
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "mapping.json")));
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function main(): number {
  const [, , bundleArg, approachArg] = process.argv;
  if (!bundleArg) {
    console.error("usage: npm run lint-dsl <bundleDir> [approachId]");
    return 2;
  }
  const bundleDir = path.resolve(bundleArg);
  const approachIds = approachArg ? [approachArg] : approachesWithMapping(bundleDir);
  const presetIds = presetIdsOf(bundleDir);

  let hadIssues = false;
  for (const approachId of approachIds) {
    const dir = path.join(bundleDir, "approaches", approachId);
    const mapping = readJson<VisualMappingSpec>(path.join(dir, "mapping.json"));
    const narration = readJson<NarrationSpec>(path.join(dir, "narration.json"));

    const cov = traceApproachCoverage(bundleDir, approachId, presetIds);
    const issues = lintMappingAndNarration(mapping, narration, new Set(cov.varNames));

    console.log(`\n━━━ ${approachId} ━━━`);
    if (issues.length === 0) {
      console.log(`  ✓ no DSL issues (${cov.varNames.length} trace vars in scope)`);
    } else {
      hadIssues = true;
      console.log(`  ✗ ${issues.length} issue(s):`);
      for (const it of issues) {
        console.log(`    • ${it.slot}\n        expr:   ${it.expr}\n        reason: ${it.reason}`);
      }
    }
  }
  return hadIssues ? 1 : 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`✗ lint-dsl failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
