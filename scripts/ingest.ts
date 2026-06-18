/**
 * Idempotent seed ingest — run any time to upsert seed data into MongoDB.
 * Usage: npm run ingest
 *
 * What it does:
 *   1. Upserts topics, patterns, problems, sheets from seeds/*.json
 *   2. Computes preset traces via the TypeScript tracers and upserts them
 *      into the `traces` collection — so the app reads from DB, not fixtures.
 *
 * Safe to re-run: all operations use upsert.
 */
import { loadEnvConfig } from "@next/env";
import { MongoClient, type Db } from "mongodb";
import fs from "fs";
import path from "path";

loadEnvConfig(process.cwd());

const SEEDS_DIR = path.join(process.cwd(), "seeds");
const PROBLEMS_DIR = path.join(SEEDS_DIR, "problems");
const DB_NAME = "knacktor";

interface SeedDoc {
  slug: string;
  [key: string]: unknown;
}

async function setupIndexes(db: Db) {
  const problems = db.collection("problems");
  await problems.createIndex({ slug: 1 }, { unique: true });
  await problems.createIndex({ difficulty: 1 });
  await problems.createIndex({ topics: 1 });
  await problems.createIndex({ patterns: 1 });
  await problems.createIndex({ sheets: 1 });
  await problems.createIndex({ title: "text" }, { name: "problems_text_search" });

  for (const col of ["topics", "patterns", "sheets"] as const) {
    await db.collection(col).createIndex({ slug: 1 }, { unique: true });
  }

  // Traces: compound index for exact lookups
  await db.collection("traces").createIndex(
    { problemSlug: 1, approachId: 1, inputId: 1 },
    { unique: true }
  );

  console.log("  ✓ indexes ready");
}

async function ingestFile(db: Db, collectionName: string, file: string): Promise<number> {
  const raw = fs.readFileSync(file, "utf-8");
  const docs: SeedDoc[] = JSON.parse(raw);
  if (!Array.isArray(docs) || docs.length === 0) return 0;

  const now = new Date();
  let count = 0;
  for (const doc of docs) {
    const { slug, ...rest } = doc;
    await db.collection(collectionName).updateOne(
      { slug },
      {
        $set: { ...rest, slug, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    console.log(`  ↑ ${collectionName}/${slug}`);
    count++;
  }
  return count;
}

interface JsonProblemFile {
  slug: string;
  number: number;
  title: string;
  difficulty: string;
  topics: string[];
  patterns: string[];
  statement: string;
  recommendedApproachId: string;
  supportsCompare: boolean;
  supportsCustomInput: boolean;
  approaches: Array<{ id: string; kind: string; [key: string]: unknown }>;
  presetInputs: Array<{ id: string; [key: string]: unknown }>;
  inputConstraints?: unknown;
  traces: Array<{
    approachId: string;
    inputId: string;
    finalResult: unknown;
    keyEventIndices: number[];
    steps: unknown[];
  }>;
}

async function ingestJsonProblems(db: Db): Promise<number> {
  if (!fs.existsSync(PROBLEMS_DIR)) return 0;

  const files = fs.readdirSync(PROBLEMS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) return 0;

  const now = new Date();
  let count = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(PROBLEMS_DIR, file), "utf-8");
    const problem: JsonProblemFile = JSON.parse(raw);

    // Normalize approach kind: "baseline" → "brute"
    const approaches = problem.approaches.map((a) => ({
      ...a,
      kind: a.kind === "baseline" ? "brute" : a.kind,
    }));

    // Upsert full problem document (ProblemFull) into problemsFull collection
    const problemFull = {
      slug: problem.slug,
      number: problem.number,
      title: problem.title,
      difficulty: problem.difficulty,
      topics: problem.topics,
      patterns: problem.patterns,
      statement: problem.statement,
      recommendedApproachId: problem.recommendedApproachId,
      supportsCompare: problem.supportsCompare,
      supportsCustomInput: problem.supportsCustomInput,
      approaches,
      presetInputs: problem.presetInputs,
      inputConstraints: problem.inputConstraints,
      updatedAt: now,
    };

    await db.collection("problemsFull").updateOne(
      { slug: problem.slug },
      { $set: problemFull, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    console.log(`  ↑ problemsFull/${problem.slug}`);
    count++;

    // Upsert each embedded trace
    for (const trace of problem.traces) {
      const traceDoc = {
        problemSlug: problem.slug,
        approachId: trace.approachId,
        inputId: trace.inputId,
        steps: trace.steps,
        keyEventIndices: trace.keyEventIndices,
        finalResult: trace.finalResult,
        traceVersion: "0.1.0",
        updatedAt: now,
      };

      await db.collection("traces").updateOne(
        { problemSlug: problem.slug, approachId: trace.approachId, inputId: trace.inputId },
        { $set: traceDoc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      console.log(`  ↑ traces/${problem.slug}:${trace.approachId}:${trace.inputId} (${trace.steps.length} steps)`);
      count++;
    }
  }

  return count;
}

async function ingestTraces(db: Db) {
  // Dynamically import so tsx resolves the @/ alias via tsconfig paths
  const { TRACERS } = await import("../lib/tracers/index");
  const { FOURSUM_PROBLEM } = await import("../lib/fixtures/4sum");

  // Register all full problem definitions here as the library grows
  const allProblems = [FOURSUM_PROBLEM];

  let count = 0;
  const now = new Date();

  for (const problem of allProblems) {
    for (const approach of problem.approaches) {
      const builder = TRACERS[problem.slug]?.[approach.id];
      if (!builder) {
        console.log(`  — no tracer for ${problem.slug}:${approach.id}, skipping`);
        continue;
      }

      for (const preset of problem.presetInputs) {
        let steps, finalResult;
        try {
          ({ steps, finalResult } = builder(preset.value));
        } catch (err) {
          console.error(
            `  ✗ trace failed for ${problem.slug}:${approach.id}:${preset.id}:`,
            err instanceof Error ? err.message : err
          );
          continue;
        }

        const traceDoc = {
          problemSlug: problem.slug,
          approachId: approach.id,
          inputId: preset.id,
          steps,
          keyEventIndices: steps
            .filter((s: { isKeyEvent?: boolean }) => s.isKeyEvent)
            .map((s: { i: number }) => s.i),
          finalResult,
          traceVersion: "0.1.0",
          updatedAt: now,
        };

        await db.collection("traces").updateOne(
          { problemSlug: problem.slug, approachId: approach.id, inputId: preset.id },
          { $set: traceDoc, $setOnInsert: { createdAt: now } },
          { upsert: true }
        );

        console.log(`  ↑ traces/${problem.slug}:${approach.id}:${preset.id} (${steps.length} steps)`);
        count++;
      }
    }
  }

  return count;
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

  const collections = ["topics", "patterns", "problems", "sheets"] as const;
  let total = 0;

  for (const col of collections) {
    const file = path.join(SEEDS_DIR, `${col}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  — seeds/${col}.json not found, skipping`);
      continue;
    }
    total += await ingestFile(db, col, file);
  }

  console.log("\nIngesting JSON problem files…");
  const jsonCount = await ingestJsonProblems(db);
  total += jsonCount;

  // Setup index for problemsFull collection
  await db.collection("problemsFull").createIndex({ slug: 1 }, { unique: true });

  console.log("\nComputing preset traces (TypeScript tracers)…");
  const traceCount = await ingestTraces(db);
  total += traceCount;

  await client.close();
  console.log(`\n✓ Ingest complete — ${total} document(s) upserted`);
}

main().catch((err) => {
  console.error("✗ Ingest failed:", err);
  process.exit(1);
});
