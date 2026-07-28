/**
 * Deactivation enforcement for the learner app.
 *
 * `authorize()` in auth.ts blocks *new* logins for inactive accounts, but
 * sessions are 30-day JWTs — without this, someone already signed in keeps a
 * fully working session for up to a month after being deactivated. So every
 * authenticated entry point calls requireActiveSession(), which pays one
 * indexed `_id` lookup per navigation and boots the user on the next request.
 *
 * This replaces the `auth()` + `redirect("/login")` boilerplate that each of
 * those pages used to repeat.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserAuthState } from "@/lib/user-service";
import { DEACTIVATED_REASON, type UserRole } from "@/lib/rbac";

export interface ActiveSessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * Returns the signed-in, still-active user. Redirects to /login when the caller
 * is anonymous, and to /login?reason=deactivated when the account has been
 * deactivated or deleted while the session was live.
 */
export async function requireActiveSession(): Promise<ActiveSessionUser> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const state = await getUserAuthState(id);
  // No doc → the account was removed under a live session; treat as deactivated.
  if (!state || state.status === "inactive") {
    redirect(`/login?reason=${DEACTIVATED_REASON}`);
  }

  return {
    id,
    name: session.user.name ?? "there",
    username: session.user.username ?? "",
    email: state.email ?? session.user.email ?? "",
    role: state.role,
  };
}
