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
import {
  DEFAULT_ROLE,
  DEFAULT_STATUS,
  effectiveRole,
  normalizeRole,
  normalizeStatus,
  type UserRole,
  type UserStatus,
} from "./rbac";

const DB = "knacktor";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  username: string; // lowercased
  email: string; // lowercased
  passwordHash: string;
  createdAt: Date;
  // Added with the admin panel. OPTIONAL on purpose: accounts created before it
  // existed have neither field, so every reader normalizes via lib/rbac.ts
  // (normalizeRole / normalizeStatus) instead of trusting the raw value.
  role?: UserRole;
  status?: UserStatus;
  roleChangedAt?: Date;
  statusChangedAt?: Date;
}

async function db(): Promise<Db> {
  return (await clientPromise).db(DB);
}

export async function usersCollection() {
  return (await db()).collection<UserDoc>("users");
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
      // Admin-panel list/filter/sort paths.
      await users.createIndex({ createdAt: -1 });
      await users.createIndex({ role: 1 });
      await users.createIndex({ status: 1 });
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
      role: DEFAULT_ROLE,
      status: DEFAULT_STATUS,
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

export interface UserAuthState {
  /** Role as stored in Mongo (normalized), ignoring the env override. */
  dbRole: UserRole;
  /** What authorization checks should use: dbRole escalated by ADMIN_EMAILS. */
  role: UserRole;
  status: UserStatus;
  email: string;
}

/**
 * The single per-request authorization read: effective role + status for a user
 * id, or null when the account no longer exists. Deliberately projects only
 * three fields so this stays a cheap `_id` lookup — it runs on every
 * authenticated navigation (see lib/session-guard.ts) and on every admin
 * Server Action (see lib/admin-guard.ts).
 */
export async function getUserAuthState(
  userId: string
): Promise<UserAuthState | null> {
  if (!ObjectId.isValid(userId)) return null;
  const users = await usersCollection();
  const doc = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { role: 1, status: 1, email: 1 } }
  );
  if (!doc) return null;
  return {
    dbRole: normalizeRole(doc.role),
    role: effectiveRole(doc.role, doc.email),
    status: normalizeStatus(doc.status),
    email: doc.email,
  };
}

export function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
