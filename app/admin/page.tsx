import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminOverviewStats } from "@/lib/admin-user-service";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-kn-ink-1">
        Account and catalog totals at a glance.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          hint={
            stats.newThisWeek === 1
              ? "1 new in the last 7 days"
              : `${stats.newThisWeek} new in the last 7 days`
          }
        />
        <StatCard
          label="Active"
          value={stats.activeUsers}
          tone="positive"
          hint="Can sign in and use the app"
        />
        <StatCard
          label="Inactive"
          value={stats.inactiveUsers}
          tone={stats.inactiveUsers > 0 ? "warning" : "neutral"}
          hint="Deactivated — progress preserved"
        />
        <StatCard
          label="Admins"
          value={stats.admins}
          tone="accent"
          hint="Full access to this panel"
        />
        <StatCard
          label="New this week"
          value={stats.newThisWeek}
          hint="Signups in the last 7 days"
        />
        <StatCard
          label="Problems"
          value={stats.problems}
          hint="Ingested into the catalog"
        />
      </div>

      <Link
        href="/admin/users"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-kn-current hover:underline"
      >
        Manage users
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
