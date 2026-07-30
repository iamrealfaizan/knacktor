"use server";

/**
 * Server Actions for admin user management — the ONLY mutation entry points for
 * the admin surface. The /api layer stays read-only (D16), so there are no
 * /api/admin/* write routes.
 *
 * Every action begins with requireAdmin(), which re-reads the caller's role from
 * Mongo. This is layer 3 of the /admin defence chain and the one that actually
 * matters: Server Actions are POST endpoints that can be invoked without ever
 * rendering the admin UI, and the JWT role in the session is a sign-in snapshot
 * that may be up to 30 days stale. Hiding a button proves nothing.
 */
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireAdmin, NotAdminError } from "@/lib/admin-guard";
import { setUserRole, setUserStatus } from "@/lib/admin-user-service";
import { isRole, isStatus, type UserRole, type UserStatus } from "@/lib/rbac";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN: AdminActionResult = {
  ok: false,
  error: "You don't have permission to do that.",
};

function revalidateUser(userId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setUserRoleAction(
  userId: string,
  role: UserRole
): Promise<AdminActionResult> {
  let actorId: string;
  try {
    actorId = (await requireAdmin()).id;
  } catch (err) {
    if (err instanceof NotAdminError) return FORBIDDEN;
    throw err;
  }

  if (!ObjectId.isValid(userId)) return { ok: false, error: "Invalid user." };
  if (!isRole(role)) return { ok: false, error: "Invalid role." };

  try {
    const result = await setUserRole(actorId, userId, role);
    if (result.ok) revalidateUser(userId);
    return result;
  } catch {
    return { ok: false, error: "Could not update the role. Try again." };
  }
}

export async function setUserStatusAction(
  userId: string,
  status: UserStatus
): Promise<AdminActionResult> {
  let actorId: string;
  try {
    actorId = (await requireAdmin()).id;
  } catch (err) {
    if (err instanceof NotAdminError) return FORBIDDEN;
    throw err;
  }

  if (!ObjectId.isValid(userId)) return { ok: false, error: "Invalid user." };
  if (!isStatus(status)) return { ok: false, error: "Invalid status." };

  try {
    const result = await setUserStatus(actorId, userId, status);
    if (result.ok) revalidateUser(userId);
    return result;
  } catch {
    return { ok: false, error: "Could not update the account. Try again." };
  }
}
