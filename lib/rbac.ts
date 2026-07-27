/**
 * Role-based access control primitives.
 *
 * EDGE-SAFE by contract: auth.config.ts (and therefore middleware.ts) imports
 * from here, so this module must never pull in mongodb, bcryptjs, or anything
 * else Node-only. Keep it to pure functions + process.env reads.
 *
 * `role` and `status` are OPTIONAL on the user doc — accounts created before
 * the admin panel existed have neither field. Every read path must funnel
 * through normalizeRole/normalizeStatus so a legacy doc behaves as an active
 * regular user rather than as undefined.
 */

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";

export const USER_ROLES: readonly UserRole[] = ["user", "admin"] as const;
export const USER_STATUSES: readonly UserStatus[] = [
  "active",
  "inactive",
] as const;

export const DEFAULT_ROLE: UserRole = "user";
export const DEFAULT_STATUS: UserStatus = "active";

/**
 * `/login?reason=…` flag that drives the "account deactivated" banner. Lives
 * here rather than in session-guard.ts so the login page can read it without
 * importing the Node-only guard (and mongodb with it).
 */
export const DEACTIVATED_REASON = "deactivated";

export function normalizeRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : DEFAULT_ROLE;
}

export function normalizeStatus(status: unknown): UserStatus {
  return status === "inactive" ? "inactive" : DEFAULT_STATUS;
}

export function isRole(value: unknown): value is UserRole {
  return value === "user" || value === "admin";
}

export function isStatus(value: unknown): value is UserStatus {
  return value === "active" || value === "inactive";
}

export function isAdmin(role: unknown): boolean {
  return normalizeRole(role) === "admin";
}

/**
 * Break-glass admin list from the environment (comma-separated emails).
 * This is an OVERRIDE, not the normal path: the DB `role` field is how admins
 * are managed day-to-day. Env exists so the first admin can bootstrap before
 * any admin exists, and so you can never lock yourself out of your own panel.
 */
const ENV_ADMIN_EMAILS: ReadonlySet<string> = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isEnvAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ENV_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export function hasEnvAdmins(): boolean {
  return ENV_ADMIN_EMAILS.size > 0;
}

/** Effective role = DB role, escalated to admin when the email is env-listed. */
export function effectiveRole(
  dbRole: unknown,
  email: string | null | undefined
): UserRole {
  return isEnvAdmin(email) ? "admin" : normalizeRole(dbRole);
}
