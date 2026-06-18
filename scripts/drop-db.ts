import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("✗ MONGODB_URI not set");
    process.exit(1);
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  await client.db("knacktor").dropDatabase();
  const cols = await client.db("knacktor").listCollections().toArray();
  console.log("✓ dropped knacktor DB — remaining collections:", cols.map((c) => c.name));
  await client.close();
}

main().catch((e) => {
  console.error("✗ drop failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
