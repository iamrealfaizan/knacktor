/**
 * Layers 2 and 3 of the /admin defence-in-depth chain.
 *
 * Layer 1 (auth.config.ts) rejects non-admin JWTs at the edge — cheap, but the
 * JWT role is a sign-in snapshot that can be up to 30 days stale, and Server
 * Actions are POST endpoints reachable without ever rendering the admin UI.
 * So the real authorization decision is made HERE, against the database:
 *
 *   - requireAdminPage()   → app/admin/layout.tsx (renders 404 for non-admins)
 *   - requireAdmin()       → EVERY admin Server Action, before any write
 *
 * Node-runtime only: imports user-service, which pulls in mongodb.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserAuthState } from "@/lib/user-service";
import type { UserRole } from "@/lib/rbac";

export interface AdminActor {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

export class NotAdminError extends Error {
  constructor() {
    super("Admin privileges are required.");
    this.name = "NotAdminError";
  }
}

/**
 * Resolves the current admin from the session + a fresh DB read, or null if the
 * caller is anonymous, deactivated, deleted, or not an admin. Callers decide how
 * to fail — pages 404, actions return an error result.
 */
async function resolveAdmin(): Promise<AdminActor | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const state = await getUserAuthState(id);
  if (!state) return null; // account deleted out from under a live session
  if (state.status === "inactive") return null;
  if (state.role !== "admin") return null;

  return {
    id,
    name: session.user.name ?? "Admin",
    username: session.user.username ?? "",
    email: state.email,
    role: state.role,
  };
}

/**
 * For admin pages/layouts. Anonymous → /login; authenticated non-admin → 404
 * rather than a redirect, so /admin doesn't confirm its own existence to
 * ordinary users.
 */
export async function requireAdminPage(): Promise<AdminActor> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const admin = await resolveAdmin();
  if (!admin) notFound();
  return admin;
}

/**
 * For admin Server Actions. Throws NotAdminError, which the action layer
 * converts into `{ ok: false, error }` — never leaks a stack to the client.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const admin = await resolveAdmin();
  if (!admin) throw new NotAdminError();
  return admin;
}

/** Non-throwing check, for conditionally rendering admin entry points in nav. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await resolveAdmin()) !== null;
}
