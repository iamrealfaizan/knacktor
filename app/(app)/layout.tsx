import { requireActiveSession } from "@/lib/session-guard";
import { getStreak } from "@/lib/progress-service";
import { HomeHeader } from "@/components/home/home-header";

/**
 * Shared chrome for the logged-in concept surfaces (Topics / Patterns / Sheets).
 * Route groups don't affect URLs, so these still live at /topics, /patterns,
 * /sheets. Auth + the full dashboard HomeHeader are handled once here (mirroring
 * app/home/page.tsx) instead of repeating the boilerplate in six pages.
 *
 * Middleware already redirects anonymous users to /login for these routes;
 * requireActiveSession() additionally boots accounts deactivated after their JWT
 * was issued (see lib/session-guard.ts). Calling it makes this subtree dynamic —
 * intended, since the detail pages render per-user problem status.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireActiveSession();

  const user = {
    name: sessionUser.name,
    username: sessionUser.username,
    email: sessionUser.email,
  };
  const streak = sessionUser.id ? await getStreak(sessionUser.id) : null;

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader
        user={user}
        streakDays={streak?.currentStreak ?? 0}
        isAdmin={sessionUser.role === "admin"}
      />
      {children}
    </div>
  );
}
