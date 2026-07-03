/**
 * User Service — the ONLY layer that touches the `users` collection.
 * Mirrors the content-service boundary: auth code imports from here,
 * never from lib/mongodb directly.
 *
 * Email and username are stored lowercased (unique indexes enforce
 * case-insensitive uniqueness); `name` keeps the display casing.
 * `findUserByIdentifier` returns the raw doc (passwordHash included) —
 * it is only ever called server-side from auth.ts, never sent to clients.
 */
import { ObjectId, type Db, MongoServerError } from "mongodb";
import bcrypt from "bcryptjs";
import clientPromise from "./mongodb";

const DB = "knacktor";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  username: string; // lowercased
  email: string; // lowercased
  passwordHash: string;
  createdAt: Date;
}

async function db(): Promise<Db> {
  return (await clientPromise).db(DB);
}

// Lazy, idempotent index setup — cached per process so createUser doesn't
// pay a createIndex round-trip on every signup.
let indexesReady: Promise<void> | undefined;

function ensureUserIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      const users = (await db()).collection<UserDoc>("users");
      await users.createIndex({ email: 1 }, { unique: true });
      await users.createIndex({ username: 1 }, { unique: true });
    })().catch((err) => {
      indexesReady = undefined; // allow retry on transient failure
      throw err;
    });
  }
  return indexesReady;
}

export type CreateUserResult =
  | { ok: true }
  | { ok: false; fieldErrors: Partial<Record<"email" | "username", string>> };

const DUPLICATE_MESSAGES = {
  email: "An account with this email already exists.",
  username: "This username is taken.",
} as const;

export async function createUser(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<CreateUserResult> {
  await ensureUserIndexes();
  const users = (await db()).collection<UserDoc>("users");

  const username = input.username.toLowerCase();
  const email = input.email.toLowerCase();

  // Pre-check for friendly per-field errors (covers both fields at once).
  const existing = await users.findOne(
    { $or: [{ email }, { username }] },
    { projection: { email: 1, username: 1 } }
  );
  if (existing) {
    const fieldErrors: Partial<Record<"email" | "username", string>> = {};
    if (existing.email === email) fieldErrors.email = DUPLICATE_MESSAGES.email;
    if (existing.username === username)
      fieldErrors.username = DUPLICATE_MESSAGES.username;
    return { ok: false, fieldErrors };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    await users.insertOne({
      _id: new ObjectId(),
      name: input.name,
      username,
      email,
      passwordHash,
      createdAt: new Date(),
    });
  } catch (err) {
    // Race with a concurrent signup — the unique index is the real guard.
    if (err instanceof MongoServerError && err.code === 11000) {
      const key = Object.keys(err.keyPattern ?? {})[0];
      if (key === "email" || key === "username") {
        return { ok: false, fieldErrors: { [key]: DUPLICATE_MESSAGES[key] } };
      }
    }
    throw err;
  }

  return { ok: true };
}

export async function findUserByIdentifier(
  identifier: string
): Promise<UserDoc | null> {
  const id = identifier.trim().toLowerCase();
  if (!id) return null;
  const users = (await db()).collection<UserDoc>("users");
  return users.findOne({ $or: [{ email: id }, { username: id }] });
}

export function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
