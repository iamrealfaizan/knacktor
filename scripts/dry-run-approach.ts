/**
 * Gate C — per-approach dry-run. Runs the full trace pipeline (buildTrace +
 * validateTrace + No-Line-Left-Behind) for an approach WITHOUT touching MongoDB.
 * This is exactly what `npm run ingest` validates, minus the DB write — so a green
 * dry-run means ingest's Gate 1 will pass.
 *
 *   npm run dry-run <bundleDir> [approachId]
 *
 * Needs the full bundle (mapping.json + narration.json must exist).
 * Exits non-zero on the first validation breach.
 */
import fs from "fs";
import path from "path";
import { dryRunApproach } from "../lib/validators/dry-run";

function readPresets(bundleDir: string): { id: string; expectedOutput: unknown }[] {
  return JSON.parse(fs.readFileSync(path.join(bundleDir, "presets.json"), "utf-8"));
}

function approachesWithBundle(bundleDir: string): string[] {
  const dir = path.join(bundleDir, "approaches");
  return fs.readdirSync(dir).filter(
    (d) =>
      fs.existsSync(path.join(dir, d, "mapping.json")) &&
      fs.existsSync(path.join(dir, d, "narration.json"))
  );
}

function main(): number {
  const [, , bundleArg, approachArg] = process.argv;
  if (!bundleArg) {
    console.error("usage: npm run dry-run <bundleDir> [approachId]");
    return 2;
  }
  const bundleDir = path.resolve(bundleArg);
  const approachIds = approachArg ? [approachArg] : approachesWithBundle(bundleDir);
  const presets = readPresets(bundleDir);

  for (const approachId of approachIds) {
    // dryRunApproach throws on any contract breach — let it propagate to the catch.
    const result = dryRunApproach(bundleDir, approachId, presets);
    console.log(`\n━━━ ${approachId} ━━━  ✓ validated (no DB write)`);
    for (const { presetId, built } of result.builts) {
      console.log(
        `  ▸ ${presetId}: ${built.steps.length} steps · ${built.keyEventIndices.length} key event(s) · finalResult = ${JSON.stringify(built.finalResult)}`
      );
    }
    console.log(`  ✓ No Line Left Behind — ${result.executableLines.length} executable lines covered`);
  }
  console.log(`\n✓ dry-run passed for ${approachIds.length} approach(es)`);
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`\n✗ dry-run failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
