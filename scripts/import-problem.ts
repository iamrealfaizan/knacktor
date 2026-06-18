/**
 * Import a single COMBINED problem JSON (filled from tracer/template/problem.combined.json)
 * and split it into the on-disk bundle the tracer/ingest expect.
 *
 * Usage:
 *   npm run import-problem <path/to/filled.json> [--force]
 *
 * Workflow: your team pastes tracer/template/problem.combined.json + the LeetCode
 * problem + ADDING_PROBLEMS.md into any chatbot, gets back a filled combined JSON,
 * and you run this. It writes seeds/problems/<slug>/… then tells you to `npm run ingest`
 * (which validates everything and aborts on any gap).
 *
 * This importer only does shape sanity-checks; the real, loud validation happens at
 * ingest (No-Line-Left-Behind, narration completeness, expected-output match, …).
 */
import fs from "fs";
import path from "path";

const file = process.argv[2];
const force = process.argv.includes("--force");
if (!file) {
  console.error("usage: npm run import-problem <path/to/filled.json> [--force]");
  process.exit(1);
}

function die(msg: string): never {
  console.error(`✗ import failed: ${msg}`);
  process.exit(1);
}

let raw: string;
try {
  raw = fs.readFileSync(file, "utf-8");
} catch {
  die(`cannot read file: ${file}`);
}
let combined: Record<string, unknown>;
try {
  combined = JSON.parse(raw);
} catch (e) {
  die(`not valid JSON: ${e instanceof Error ? e.message : e}`);
}

// Drop _-prefixed note keys.
for (const k of Object.keys(combined)) if (k.startsWith("_")) delete combined[k];

// ── Shape checks ────────────────────────────────────────────────────────────
const req = (cond: unknown, msg: string) => { if (!cond) die(msg); };
const slug = combined.slug as string;
req(typeof slug === "string" && slug && slug !== "REPLACE-url-slug", "missing/placeholder 'slug'");
req(Array.isArray(combined.presets) && (combined.presets as unknown[]).length >= 3, "need >= 3 presets");
const approaches = combined.approaches as Record<string, unknown>[];
req(Array.isArray(approaches) && approaches.length >= 1, "need >= 1 approach");
for (const a of approaches) {
  req(typeof a.id === "string" && a.id, "an approach is missing 'id'");
  req(typeof a.solution === "string" && (a.solution as string).includes("class Solution"), `approach '${a.id}': 'solution' must be the Python source string (with 'class Solution')`);
  req(typeof a.entrypoint === "string", `approach '${a.id}': missing 'entrypoint'`);
  req(a.mapping && typeof a.mapping === "object", `approach '${a.id}': missing 'mapping'`);
  req(a.narration && typeof a.narration === "object", `approach '${a.id}': missing 'narration'`);
}
if ((combined.presets as { expectedOutput?: unknown }[]).some((p) => p.expectedOutput === "REPLACE")) {
  die("a preset still has expectedOutput \"REPLACE\" — fill the real expected outputs");
}

const root = path.join(process.cwd(), "seeds", "problems", slug);
if (fs.existsSync(root) && !force) {
  die(`seeds/problems/${slug} already exists — pass --force to overwrite, or edit it directly.`);
}

function write(rel: string, content: string) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log(`  + ${path.relative(process.cwd(), p)}`);
}
const j = (o: unknown) => JSON.stringify(o, null, 2) + "\n";

// ── problem.json ────────────────────────────────────────────────────────────
write("problem.json", j({
  schemaVersion: combined.schemaVersion ?? "2.0",
  slug,
  number: combined.number ?? 0,
  title: combined.title,
  difficulty: combined.difficulty,
  topics: combined.topics ?? [],
  patterns: combined.patterns ?? [],
  statement: combined.statement ?? "",
  hasVisualization: true,
  isPremium: Boolean(combined.isPremium),
  supportsCustomInput: Boolean(combined.supportsCustomInput),
  supportsCompare: approaches.length >= 2,
  recommendedApproachId: combined.recommendedApproachId ?? approaches[approaches.length - 1].id,
  inputConstraints: combined.inputConstraints,
}));

// ── presets.json ──────────────────────────────────────────────────────────────
write("presets.json", j(combined.presets));

// ── per-approach files ──────────────────────────────────────────────────────
for (const a of approaches) {
  const id = a.id as string;
  write(`approaches/${id}/solution.py`, a.solution as string);
  write(`approaches/${id}/approach.json`, j({
    id,
    name: a.name,
    kind: a.kind,
    summary: a.summary,
    complexity: a.complexity,
    language: a.language ?? "python",
    entrypoint: a.entrypoint,
    primaryPrimitive: a.primaryPrimitive ?? "array",
    auxStructures: a.auxStructures ?? [],
    resultSpec: a.resultSpec,
    varColors: a.varColors ?? {},
    lineExplanations: a.lineExplanations ?? {},
    syntaxExplanations: a.syntaxExplanations ?? {},
  }));
  write(`approaches/${id}/mapping.json`, j(a.mapping));
  write(`approaches/${id}/narration.json`, j(a.narration));
}

console.log(`\n✓ Imported "${slug}" → seeds/problems/${slug} (${approaches.length} approach(es): ${approaches.map((a) => a.id).join(", ")})`);
console.log("\nNext: npm run ingest   (validates everything; fix any reported gap and re-run)");
