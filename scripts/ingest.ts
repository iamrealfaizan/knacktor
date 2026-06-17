/**
 * Idempotent seed ingest — run any time to upsert seed data into MongoDB.
 * Usage: npm run ingest
 *
 * Safe to re-run: uses upsert so existing documents are updated, not duplicated.
 */
import { loadEnvConfig } from "@next/env";
import { MongoClient, type Db } from "mongodb";
import fs from "fs";
import path from "path";

loadEnvConfig(process.cwd());

const SEEDS_DIR = path.join(process.cwd(), "seeds");
const DB_NAME = "knacktor";

interface SeedDoc {
  slug: string;
  [key: string]: unknown;
}

async function setupIndexes(db: Db) {
  // problems
  const problems = db.collection("problems");
  await problems.createIndex({ slug: 1 }, { unique: true });
  await problems.createIndex({ difficulty: 1 });
  await problems.createIndex({ topics: 1 });      // multikey — handles string[]
  await problems.createIndex({ patterns: 1 });    // multikey — handles string[]
  await problems.createIndex({ sheets: 1 });
  await problems.createIndex({ title: "text" }, { name: "problems_text_search" });

  // lookup collections
  for (const col of ["topics", "patterns", "sheets"] as const) {
    await db.collection(col).createIndex({ slug: 1 }, { unique: true });
  }

  console.log("  ✓ indexes ready");
}

async function ingestFile(
  db: Db,
  collectionName: string,
  file: string
): Promise<number> {
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

  // Order matters: topics + patterns before problems (problems reference their slugs)
  const collections = ["topics", "patterns", "problems", "sheets"] as const;
  let total = 0;

  for (const col of collections) {
    const file = path.join(SEEDS_DIR, `${col}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  — seeds/${col}.json not found, skipping`);
      continue;
    }
    const n = await ingestFile(db, col, file);
    total += n;
  }

  await client.close();
  console.log(`\n✓ Ingest complete — ${total} document(s) upserted`);
}

main().catch((err) => {
  console.error("✗ Ingest failed:", err);
  process.exit(1);
});
