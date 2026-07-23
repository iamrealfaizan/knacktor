import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStreak } from "@/lib/progress-service";
import { HomeHeader } from "@/components/home/home-header";

/**
 * Shared chrome for the logged-in concept surfaces (Topics / Patterns / Sheets).
 * Route groups don't affect URLs, so these still live at /topics, /patterns,
 * /sheets. Auth + the full dashboard HomeHeader are handled once here (mirroring
 * app/home/page.tsx) instead of repeating the boilerplate in six pages.
 *
 * Middleware already redirects anonymous users to /login for these routes; the
 * check below is the same defensive fallback /home uses. Calling auth()/getStreak
 * makes this subtree dynamic — intended, since the detail pages render per-user
 * problem status.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "there",
    username: session.user.username,
    email: session.user.email ?? "",
  };
  const streak = session.user.id ? await getStreak(session.user.id) : null;

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader user={user} streakDays={streak?.currentStreak ?? 0} />
      {children}
    </div>
  );
}
