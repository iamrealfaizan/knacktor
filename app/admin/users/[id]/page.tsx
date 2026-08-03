import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";
import { getUserDetail } from "@/lib/admin-user-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { UserProgressPanel } from "@/components/admin/user-progress-panel";

export const metadata: Metadata = { title: "User" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdminPage();
  const detail = await getUserDetail(params.id);
  if (!detail) notFound();

  const { user } = detail;
  const isSelf = user.id === admin.id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm font-medium text-kn-ink-1 hover:text-kn-ink-0"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        All users
      </Link>

      <section className="mt-4 rounded-xl border border-kn-border-0 bg-kn-surface-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className="size-12 shrink-0 bg-kn-compared">
            <AvatarFallback className="bg-kn-compared text-base font-bold text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold tracking-tight text-kn-ink-0">
                {user.name}
              </h2>
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              {isSelf && (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-kn-ink-2">
                  you
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-sm text-kn-ink-2">
              @{user.username}
            </div>
            <div className="truncate font-mono text-sm text-kn-ink-1">
              {user.email}
            </div>
            <div className="mt-1 text-xs text-kn-ink-2">
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <UserRowActions
            user={user}
            isSelf={isSelf}
            showDetailLink={false}
          />
        </div>

        {user.envAdmin && (
          <p className="mt-4 flex gap-2 rounded-lg border border-kn-amber-border bg-kn-amber-subtle px-3 py-2 text-xs text-kn-ink-1">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-kn-amber" aria-hidden />
            <span>
              This account is an admin because its email is listed in the{" "}
              <code className="font-mono font-semibold">ADMIN_EMAILS</code>{" "}
              environment variable. Remove it there to demote — the panel can&apos;t
              override it.
            </span>
          </p>
        )}

        {user.status === "inactive" && (
          <p className="mt-4 flex gap-2 rounded-lg border border-kn-error-border bg-kn-error-subtle px-3 py-2 text-xs text-kn-ink-1">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-kn-error" aria-hidden />
            <span>
              Deactivated — they can&apos;t sign in. All progress below is
              preserved and comes back on reactivation.
            </span>
          </p>
        )}
      </section>

      <div className="mt-4">
        <UserProgressPanel detail={detail} />
      </div>
    </div>
  );
}
