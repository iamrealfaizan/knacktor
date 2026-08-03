/**
 * One-time (but idempotent) migration: give every existing user doc an explicit
 * `role` and `status`.
 *
 * Accounts created before the admin panel have neither field. The app is written
 * to tolerate that — lib/rbac.ts normalizes absent → "user"/"active", and the
 * admin filters use $ne rather than equality — but writing the fields makes the
 * data self-describing and lets the role/status indexes actually do work.
 *
 * Safe to re-run: it only touches docs where the field is missing.
 *
 *   npm run backfill-users
 */
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
  const users = client.db("knacktor").collection("users");

  const total = await users.countDocuments({});
  const missingRole = await users.countDocuments({ role: { $exists: false } });
  const missingStatus = await users.countDocuments({
    status: { $exists: false },
  });

  const roleResult = await users.updateMany(
    { role: { $exists: false } },
    { $set: { role: "user" } }
  );
  const statusResult = await users.updateMany(
    { status: { $exists: false } },
    { $set: { status: "active" } }
  );

  // Indexes the admin list relies on (also created lazily by user-service, but
  // this makes a fresh backfill leave the collection fully ready).
  await users.createIndex({ createdAt: -1 });
  await users.createIndex({ role: 1 });
  await users.createIndex({ status: 1 });

  console.log(`  users in collection:    ${total}`);
  console.log(
    `  role backfilled:        ${roleResult.modifiedCount} (${missingRole} were missing)`
  );
  console.log(
    `  status backfilled:      ${statusResult.modifiedCount} (${missingStatus} were missing)`
  );
  console.log("✓ backfill complete — indexes ensured");

  await client.close();
}

main().catch((e) => {
  console.error("✗ backfill failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
