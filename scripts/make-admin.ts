/**
 * Promote (or demote) a user by email, straight in the database.
 *
 *   npm run make-admin -- --list          # who exists, and what role they have
 *   npm run make-admin <email>
 *   npm run make-admin <email> -- --demote
 *
 * This is the normal way to create the FIRST admin, before any admin exists to
 * use the panel. The ADMIN_EMAILS env var is the other route: it escalates a
 * matching email to admin at sign-in regardless of this field, so you can never
 * be locked out of your own panel. Env wins — demoting an env-listed account here
 * has no effect until you remove it from ADMIN_EMAILS.
 */
import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const demote = args.includes("--demote");
  const list = args.includes("--list");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (!list && !email) {
    console.error("Usage: npm run make-admin <email> [-- --demote]");
    console.error("       npm run make-admin -- --list");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("✗ MONGODB_URI not set");
    process.exit(1);
  }

  const role = demote ? "user" : "admin";
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const users = client.db("knacktor").collection("users");

  if (list) {
    const all = await users
      .find(
        {},
        {
          projection: { name: 1, username: 1, email: 1, role: 1, status: 1 },
          sort: { createdAt: 1 },
        }
      )
      .toArray();
    console.log(`${all.length} account(s):\n`);
    for (const u of all) {
      const r = String(u.role ?? "user").padEnd(6);
      const s = String(u.status ?? "active").padEnd(9);
      console.log(`  ${r} ${s} @${String(u.username).padEnd(20)} ${u.email}`);
    }
    await client.close();
    return;
  }

  const existing = await users.findOne(
    { email },
    { projection: { email: 1, username: 1, name: 1, role: 1, status: 1 } }
  );

  if (!existing) {
    console.error(`✗ no user with email ${email}`);
    console.error("  (the account must sign up first — this only sets a role)");
    await client.close();
    process.exit(1);
  }

  // Refuse to demote the last admin: that would leave the panel unreachable
  // unless ADMIN_EMAILS happens to be set. Same guardrail the UI enforces.
  if (demote) {
    const admins = await users.countDocuments({ role: "admin" });
    if (admins <= 1 && existing.role === "admin") {
      console.error("✗ refusing to demote the last admin");
      console.error("  promote someone else first, or set ADMIN_EMAILS");
      await client.close();
      process.exit(1);
    }
  }

  await users.updateOne(
    { email },
    { $set: { role, roleChangedAt: new Date() } }
  );

  console.log(`✓ ${existing.name} (@${existing.username}) is now: ${role}`);
  if (existing.status === "inactive") {
    console.log("  note: this account is DEACTIVATED and still can't sign in");
  }
  console.log("  they must sign out and back in for the change to take effect");

  await client.close();
}

main().catch((e) => {
  console.error("✗ make-admin failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
