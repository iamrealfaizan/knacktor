import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Knacktor" },
  robots: { index: false, follow: false },
};

// Every admin view reflects live user state — never cache it.
export const dynamic = "force-dynamic";

/**
 * Layer 2 of the /admin defence chain. auth.config.ts already rejected non-admin
 * JWTs at the edge, but that role is a sign-in snapshot up to 30 days old, so
 * requireAdminPage() re-reads the caller's role and status straight from Mongo.
 * A demoted-or-deactivated admin holding a stale token gets a 404 here.
 *
 * Layer 3 lives in the Server Actions themselves — see app/actions/admin-users.ts.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminPage();

  return (
    <AdminShell
      user={{
        name: admin.name,
        username: admin.username,
        email: admin.email,
      }}
    >
      {children}
    </AdminShell>
  );
}
