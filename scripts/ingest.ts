/**
 * Idempotent seed ingest — run any time to (re)build MongoDB.
 * Usage: npm run ingest
 *
 * D10 — relationships by _id. Collections: difficulties, topics, patterns,
 * problems (approaches + presets EMBEDDED), traces (gzip-compressed, D11), sheets.
 * D9  — all traces come from the Python tracer pipeline via seeds/problems/<slug>/ bundles.
 */
import { loadEnvConfig } from "@next/env";
import { MongoClient, ObjectId, type Db } from "mongodb";
import { gzipSync } from "zlib";
import fs from "fs";
import path from "path";

loadEnvConfig(process.cwd());

const SEEDS_DIR = path.join(process.cwd(), "seeds");
const PROBLEMS_DIR = path.join(SEEDS_DIR, "problems");
const DB_NAME = "knacktor";
const TRACE_VERSION = "1.0.0";

interface SeedDoc {
  slug: string;
  [key: string]: unknown;
}

// ── Indexes ────────────────────────────────────────────────────────────────
async function setupIndexes(db: Db) {
  for (const col of ["difficulties", "topics", "patterns", "sheets"] as const) {
    await db.collection(col).createIndex({ slug: 1 }, { unique: true });
  }
  const problems = db.collection("problems");
  await problems.createIndex({ slug: 1 }, { unique: true });
  await problems.createIndex({ difficultyId: 1 });
  await problems.createIndex({ topicIds: 1 });
  await problems.createIndex({ patternIds: 1 });
  await problems.createIndex({ number: 1 });
  await problems.createIndex(
    { title: "text", statement: "text" },
    { name: "problems_text_search" }
  );

  const traces = db.collection("traces");
  await traces.createIndex({ problemId: 1, approachId: 1, inputId: 1 }, { unique: true });
  await traces.createIndex({ problemSlug: 1, approachId: 1 });
  console.log("  ✓ indexes ready");
}

// ── Generic slug-keyed seed loader; returns slug -> _id map ──────────────────
async function seedCollection(
  db: Db,
  col: string,
  file: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!fs.existsSync(file)) {
    console.log(`  — seeds/${path.basename(file)} not found, skipping`);
    return map;
  }
  const docs: SeedDoc[] = JSON.parse(fs.readFileSync(file, "utf-8"));
  const now = new Date();
  for (const { slug, ...rest } of docs) {
    await db.collection(col).updateOne(
      { slug },
      { $set: { ...rest, slug, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    const doc = await db.collection(col).findOne({ slug }, { projection: { _id: 1 } });
    map.set(slug, (doc!._id as ObjectId).toHexString());
  }
  console.log(`  ↑ ${col}: ${docs.length}`);
  return map;
}

function resolveIds(slugs: string[], map: Map<string, string>, kind: string): ObjectId[] {
  return slugs.map((s) => {
    const id = map.get(s);
    if (!id) throw new Error(`unknown ${kind} slug "${s}" — add it to seeds/${kind}.json`);
    return new ObjectId(id);
  });
}

// ── Bundle path (D9) — metadata from problem.json, traces from the Python pipeline ─
async function ingestBundle(
  db: Db,
  bundleDir: string,
  maps: { diff: Map<string, string>; topic: Map<string, string>; pattern: Map<string, string> }
): Promise<number> {
  const { dryRunApproach } = await import("../lib/validators/dry-run");
  const now = new Date();

  const problem = JSON.parse(fs.readFileSync(path.join(bundleDir, "problem.json"), "utf-8"));
  const presets = JSON.parse(fs.readFileSync(path.join(bundleDir, "presets.json"), "utf-8"));
  const approachesDir = path.join(bundleDir, "approaches");
  const approachIds = fs.readdirSync(approachesDir).filter((d) =>
    fs.existsSync(path.join(approachesDir, d, "approach.json"))
  );

  // Build embedded Approach docs (source injected from solution.py).
  const approaches = approachIds.map((id) => {
    const meta = JSON.parse(fs.readFileSync(path.join(approachesDir, id, "approach.json"), "utf-8"));
    const source = fs.readFileSync(path.join(approachesDir, id, "solution.py"), "utf-8");
    return { ...meta, source };
  });
  // brute first, then optimal, then alternative — stable Compare default
  const order = { brute: 0, optimal: 1, alternative: 2 } as Record<string, number>;
  approaches.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9));

  const difficultyId = resolveIds([problem.difficulty], maps.diff, "difficulties")[0];
  const topicIds = resolveIds(problem.topics, maps.topic, "topics");
  const patternIds = resolveIds(problem.patterns, maps.pattern, "patterns");

  await db.collection("problems").updateOne(
    { slug: problem.slug },
    {
      $set: {
        slug: problem.slug, number: problem.number, title: problem.title,
        difficultyId, topicIds, patternIds, statement: problem.statement,
        hasVisualization: true, isPremium: false,
        supportsCustomInput: !!problem.supportsCustomInput,
        supportsCompare: approaches.length >= 2,
        recommendedApproachId: problem.recommendedApproachId,
        approaches, presetInputs: presets, inputConstraints: problem.inputConstraints,
        schemaVersion: "2.0", updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
  const doc = await db.collection("problems").findOne({ slug: problem.slug }, { projection: { _id: 1 } });
  const problemId = doc!._id as ObjectId;
  console.log(`  ↑ problems/${problem.slug} (bundle, Python tracer)`);

  let traceCount = 0;
  for (const approach of approaches) {
    // Gate C: trace + validate every preset of this approach (No-Line-Left-Behind
    // asserted over the union). Throws on any breach — same path as `npm run dry-run`.
    const result = dryRunApproach(bundleDir, approach.id, presets);
    for (const { presetId, built } of result.builts) {
      const compressed = gzipSync(Buffer.from(JSON.stringify(built.steps), "utf-8"));
      await db.collection("traces").updateOne(
        { problemId, approachId: approach.id, inputId: presetId },
        {
          $set: {
            problemId, problemSlug: problem.slug, approachId: approach.id, inputId: presetId,
            stepCount: built.steps.length, keyEventIndices: built.keyEventIndices,
            finalResult: built.finalResult, compression: "gzip",
            stepsCompressed: compressed, byteSize: compressed.length,
            traceVersion: TRACE_VERSION, updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      console.log(`    ↑ traces/${problem.slug}:${approach.id}:${presetId} (${built.steps.length} steps, ${(compressed.length / 1024).toFixed(1)}KB gz)`);
      traceCount++;
    }
    console.log(`    ✓ ${approach.id}: No Line Left Behind (${result.executableLines.length} lines covered)`);
  }
  return traceCount;
}

// ── Sheets (entries reference problems by _id) ───────────────────────────────
async function seedSheets(db: Db) {
  const file = path.join(SEEDS_DIR, "sheets.json");
  if (!fs.existsSync(file)) return;
  const sheets: Array<{ slug: string; name?: string; description?: string; problemSlugs?: string[] }> =
    JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(sheets) || sheets.length === 0) return;
  const now = new Date();
  for (const sheet of sheets) {
    const entries = [];
    for (const [order, pslug] of (sheet.problemSlugs ?? []).entries()) {
      const p = await db.collection("problems").findOne({ slug: pslug }, { projection: { _id: 1 } });
      if (p) entries.push({ problemId: p._id, order });
    }
    await db.collection("sheets").updateOne(
      { slug: sheet.slug },
      {
        $set: { slug: sheet.slug, name: sheet.name, description: sheet.description, entries, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  }
  console.log(`  ↑ sheets: ${sheets.length}`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI not set — add it to .env.local");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  console.log("✓ Connected to MongoDB");
  const db = client.db(DB_NAME);

  await setupIndexes(db);

  console.log("\nSeeding taxonomy…");
  const diff = await seedCollection(db, "difficulties", path.join(SEEDS_DIR, "difficulties.json"));
  const topic = await seedCollection(db, "topics", path.join(SEEDS_DIR, "topics.json"));
  const pattern = await seedCollection(db, "patterns", path.join(SEEDS_DIR, "patterns.json"));

  // ── Bundles (D9 Python pipeline): subdirs of seeds/problems/ with problem.json
  // Optional CLI slug filters: `npm run ingest -- <slug> [<slug> …]` re-ingests
  // only those bundles (still an idempotent upsert); no args = full ingest.
  const only = new Set(process.argv.slice(2));
  let bundleDirs = fs.existsSync(PROBLEMS_DIR)
    ? fs.readdirSync(PROBLEMS_DIR).filter((d) =>
        fs.existsSync(path.join(PROBLEMS_DIR, d, "problem.json"))
      )
    : [];
  if (only.size) {
    const missing = [...only].filter((s) => !bundleDirs.includes(s));
    if (missing.length) {
      console.error(`✗ No seed bundle found for: ${missing.join(", ")}`);
      process.exit(1);
    }
    bundleDirs = bundleDirs.filter((d) => only.has(d));
    console.log(`Targeting ${bundleDirs.length} bundle(s): ${bundleDirs.join(", ")}`);
  }

  console.log("\nIngesting bundles (Python tracer)…");
  let traces = 0;
  for (const dir of bundleDirs) {
    traces += await ingestBundle(db, path.join(PROBLEMS_DIR, dir), { diff, topic, pattern });
  }

  console.log("\nSeeding sheets…");
  await seedSheets(db);

  await client.close();
  console.log(`\n✓ Ingest complete — ${bundleDirs.length} bundle(s), ${traces} trace(s)`);
}

main().catch((err) => {
  console.error("✗ Ingest failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
