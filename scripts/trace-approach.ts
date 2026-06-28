/**
 * Gate A — trace-only. Runs the Python tracer on a solution + presets and reports
 * the real executable lines, per-step variables, finalResult, and coverage.
 * No mapping/narration needed → use this right after freezing the solution.
 *
 *   npm run trace-approach <bundleDir> [approachId] [presetId]
 *
 * Minimal bundle it accepts:
 *   <bundleDir>/problem.json                  ({} is fine → maxSteps default 2000)
 *   <bundleDir>/presets.json
 *   <bundleDir>/approaches/<id>/solution.py
 *   <bundleDir>/approaches/<id>/approach.json ({"entrypoint":"Solution.method"})
 *
 * Exits non-zero if any approach has executable lines no preset reaches.
 */
import fs from "fs";
import path from "path";
import { traceApproachCoverage } from "../lib/tracer/trace-report";

function presetIdsOf(bundleDir: string): string[] {
  const presets = JSON.parse(fs.readFileSync(path.join(bundleDir, "presets.json"), "utf-8"));
  return (presets as { id: string }[]).map((p) => p.id);
}

function approachesOf(bundleDir: string): string[] {
  const dir = path.join(bundleDir, "approaches");
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "solution.py")));
}

function compactVars(vars: Record<string, unknown>): string {
  return Object.entries(vars)
    .map(([k, v]) => {
      let s = JSON.stringify(v) ?? "undefined";
      if (s.length > 44) s = s.slice(0, 41) + "…";
      return `${k}=${s}`;
    })
    .join("  ");
}

function main(): number {
  const [, , bundleArg, approachArg, presetArg] = process.argv;
  if (!bundleArg) {
    console.error("usage: npm run trace-approach <bundleDir> [approachId] [presetId]");
    return 2;
  }
  const bundleDir = path.resolve(bundleArg);
  const approachIds = approachArg ? [approachArg] : approachesOf(bundleDir);
  const presetIds = presetArg ? [presetArg] : presetIdsOf(bundleDir);

  let hadGap = false;
  for (const approachId of approachIds) {
    const cov = traceApproachCoverage(bundleDir, approachId, presetIds);
    console.log(`\n━━━ ${approachId} ━━━`);
    console.log(`source lines: ${cov.reports[0]?.sourceLineCount ?? "?"} · executable: [${cov.executableLines.join(", ")}]`);

    for (const r of cov.reports) {
      console.log(`\n  ▸ preset "${r.presetId}" — ${r.steps.length} steps · finalResult = ${JSON.stringify(r.finalResult)}`);
      if (r.perPresetGap.length) console.log(`    (this preset alone misses: ${r.perPresetGap.join(", ")})`);
      for (const s of r.steps) {
        console.log(`    L${String(s.lineNo).padStart(2)} │ ${compactVars(s.vars)}`);
      }
    }

    console.log(`\n  variables seen: ${cov.varNames.join(", ") || "(none)"}`);
    if (cov.unionGap.length) {
      console.log(`  ✗ COVERAGE GAP — line(s) no preset executes: ${cov.unionGap.join(", ")} (add a preset that reaches them)`);
      hadGap = true;
    } else {
      console.log(`  ✓ every executable line covered by ≥1 preset`);
    }
  }
  return hadGap ? 1 : 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`✗ trace-approach failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
