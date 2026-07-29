/**
 * Admin User Service — the ONLY layer that runs admin queries and mutations
 * against the `users` collection. Mirrors the content-service / user-service /
 * progress-service boundary: the admin pages and Server Actions import from
 * here, never from lib/mongodb directly.
 *
 * Two invariants worth stating up front, because getting either wrong is a
 * security or lockout bug:
 *
 * 1. `passwordHash` is NEVER projected. Admin rows cross the Server→Client
 *    boundary in the RSC payload; a stray projection would ship every hash to
 *    the browser. USER_PROJECTION is the allowlist.
 *
 * 2. Filters test `{ $ne: "inactive" }` / `{ $ne: "admin" }` rather than
 *    `{ status: "active" }` / `{ role: "user" }`. Accounts created before the
 *    admin panel have NO role/status field, so an equality match silently omits
 *    them even after the backfill (a doc could still be inserted by an older
 *    code path). Absent means default — see lib/rbac.ts.
 *
 * All guardrails live in this module, not in the UI. The UI hides impossible
 * actions as a courtesy; these functions are what actually prevent them.
 */
import { ObjectId, type Filter } from "mongodb";
import { usersCollection, type UserDoc } from "./user-service";
import {
  isEnvAdmin,
  normalizeRole,
  normalizeStatus,
  type UserRole,
  type UserStatus,
} from "./rbac";
import {
  getProblemStatusCounts,
  getStreak,
  getUserProgressSummary,
} from "./progress-service";
import { getSiteStats } from "./content-service";
import type { ProgressSummary, UserStreak } from "./types";

export const ADMIN_USERS_PAGE_SIZE = 20;

/** Serialized shape for the admin table/detail — plain JSON, no ObjectId/Date. */
export interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  /**
   * True when this account is an admin because its email is in ADMIN_EMAILS.
   * Such an account cannot be demoted from the panel — the env override would
   * immediately re-escalate it — so the UI must say so instead of offering a
   * button that appears to fail.
   */
  envAdmin: boolean;
}

export type AdminUserSort = "newest" | "oldest" | "name";

export interface ListUsersOptions {
  q?: string;
  role?: UserRole | "all";
  status?: UserStatus | "all";
  sort?: AdminUserSort;
  page?: number;
  pageSize?: number;
}

export interface ListUsersResult {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

// Allowlist projection — passwordHash is excluded by construction, not by omission.
const USER_PROJECTION = {
  name: 1,
  username: 1,
  email: 1,
  role: 1,
  status: 1,
  createdAt: 1,
} as const;

function toRow(doc: Partial<UserDoc> & { _id: ObjectId }): AdminUserRow {
  const email = doc.email ?? "";
  return {
    id: doc._id.toHexString(),
    name: doc.name ?? "",
    username: doc.username ?? "",
    email,
    // The row shows the EFFECTIVE role, so an env-listed account reads as admin
    // in the table even when its DB field still says "user".
    role: isEnvAdmin(email) ? "admin" : normalizeRole(doc.role),
    status: normalizeStatus(doc.status),
    createdAt: (doc.createdAt ?? new Date(0)).toISOString(),
    envAdmin: isEnvAdmin(email),
  };
}

/** Escape user input before it becomes a regex — otherwise "(" throws. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(opts: ListUsersOptions): Filter<UserDoc> {
  const and: Filter<UserDoc>[] = [];

  const q = opts.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    and.push({ $or: [{ name: rx }, { username: rx }, { email: rx }] });
  }

  // $ne, not equality — see the invariant note at the top of this file.
  if (opts.role === "admin") and.push({ role: "admin" });
  else if (opts.role === "user") and.push({ role: { $ne: "admin" } });

  if (opts.status === "inactive") and.push({ status: "inactive" });
  else if (opts.status === "active") and.push({ status: { $ne: "inactive" } });

  return and.length ? { $and: and } : {};
}

const SORTS: Record<AdminUserSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
};

export async function listUsers(
  opts: ListUsersOptions = {}
): Promise<ListUsersResult> {
  const users = await usersCollection();
  const pageSize = opts.pageSize ?? ADMIN_USERS_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const filter = buildFilter(opts);

  const [docs, total] = await Promise.all([
    users
      .find(filter, { projection: USER_PROJECTION })
      .sort(SORTS[opts.sort ?? "newest"])
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    users.countDocuments(filter),
  ]);

  return { rows: docs.map(toRow), total, page, pageSize };
}

export interface AdminUserDetail {
  user: AdminUserRow;
  progress: ProgressSummary;
  counts: { solved: number; attempted: number; bookmarked: number };
  streak: UserStreak;
  /** Catalog size, so "to do" can be derived: total − solved − attempted. */
  catalogTotal: number;
}

/**
 * Full detail for one user. Progress numbers come from the same
 * progress-service functions the user's own dashboard uses, so the admin view
 * and the learner view can never disagree.
 */
export async function getUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  if (!ObjectId.isValid(userId)) return null;
  const users = await usersCollection();
  const doc = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: USER_PROJECTION }
  );
  if (!doc) return null;

  const [progress, counts, streak, stats] = await Promise.all([
    getUserProgressSummary(userId),
    getProblemStatusCounts(userId),
    getStreak(userId),
    getSiteStats(),
  ]);

  return {
    user: toRow(doc),
    progress,
    counts,
    streak,
    catalogTotal: stats.problems,
  };
}

/** Admins counted by effective role — env-listed accounts included. */
export async function countAdmins(): Promise<number> {
  const users = await usersCollection();
  const dbAdmins = await users
    .find({ role: "admin" }, { projection: { email: 1 } })
    .toArray();
  const emails = new Set(dbAdmins.map((d) => d.email));

  // An env-listed account that is still role:"user" in Mongo is nonetheless an
  // admin, so it must count toward the last-admin guard.
  const envListed = await users
    .find({ role: { $ne: "admin" } }, { projection: { email: 1 } })
    .toArray();
  for (const d of envListed) if (isEnvAdmin(d.email)) emails.add(d.email);

  return emails.size;
}

export type AdminMutationResult =
  | { ok: true }
  | { ok: false; error: string };

async function findTarget(targetId: string) {
  if (!ObjectId.isValid(targetId)) return null;
  const users = await usersCollection();
  return users.findOne(
    { _id: new ObjectId(targetId) },
    { projection: USER_PROJECTION }
  );
}

/**
 * Promote/demote a user. Guardrails:
 *  - no self role change (an admin cannot demote themselves into a lockout)
 *  - cannot demote the last remaining admin
 *  - cannot demote an ADMIN_EMAILS account (env wins; the change wouldn't stick)
 */
export async function setUserRole(
  actorId: string,
  targetId: string,
  role: UserRole
): Promise<AdminMutationResult> {
  if (actorId === targetId) {
    return {
      ok: false,
      error: "You can't change your own role. Ask another admin.",
    };
  }

  const target = await findTarget(targetId);
  if (!target) return { ok: false, error: "That user no longer exists." };

  const current = isEnvAdmin(target.email)
    ? "admin"
    : normalizeRole(target.role);
  if (current === role) return { ok: true }; // idempotent no-op

  if (role === "user") {
    if (isEnvAdmin(target.email)) {
      return {
        ok: false,
        error:
          "This account is an admin via the ADMIN_EMAILS environment variable. Remove it there to demote.",
      };
    }
    if ((await countAdmins()) <= 1) {
      return {
        ok: false,
        error: "This is the last admin — promote someone else first.",
      };
    }
  }

  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(targetId) },
    { $set: { role, roleChangedAt: new Date() } }
  );
  return { ok: true };
}

/**
 * Deactivate/reactivate a user. Deactivation is SOFT — the doc and all
 * userProblemProgress / userDailyActivity / userStreak rows are preserved, so
 * reactivating restores the account exactly as it was. Guardrails:
 *  - cannot deactivate yourself
 *  - cannot deactivate an admin (demote first) — this is what stops a
 *    "deactivate every admin" path to an org-wide lockout
 */
export async function setUserStatus(
  actorId: string,
  targetId: string,
  status: UserStatus
): Promise<AdminMutationResult> {
  if (actorId === targetId) {
    return { ok: false, error: "You can't deactivate your own account." };
  }

  const target = await findTarget(targetId);
  if (!target) return { ok: false, error: "That user no longer exists." };

  if (normalizeStatus(target.status) === status) return { ok: true };

  const targetRole = isEnvAdmin(target.email)
    ? "admin"
    : normalizeRole(target.role);
  if (status === "inactive" && targetRole === "admin") {
    return {
      ok: false,
      error: "Demote this admin to a user before deactivating them.",
    };
  }

  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(targetId) },
    { $set: { status, statusChangedAt: new Date() } }
  );
  return { ok: true };
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  admins: number;
  newThisWeek: number;
  problems: number;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const users = await usersCollection();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, inactiveUsers, admins, newThisWeek, stats] =
    await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ status: "inactive" }),
      countAdmins(),
      users.countDocuments({ createdAt: { $gte: weekAgo } }),
      getSiteStats(),
    ]);

  return {
    totalUsers,
    activeUsers: totalUsers - inactiveUsers,
    inactiveUsers,
    admins,
    newThisWeek,
    problems: stats.problems,
  };
}
