import Link from "next/link";
import { UserRound } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { AdminUserRow } from "@/lib/admin-user-service";
import { RoleBadge, StatusBadge } from "./user-badges";
import { UserRowActions } from "./user-row-actions";

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-kn-border-1 bg-kn-surface-1 px-6 py-14 text-center">
      <UserRound className="h-6 w-6 text-kn-ink-2" aria-hidden />
      <p className="text-sm font-semibold text-kn-ink-0">
        {filtered ? "No users match these filters" : "No users yet"}
      </p>
      <p className="text-xs text-kn-ink-2">
        {filtered
          ? "Try a different search term, or clear the filters."
          : "Accounts appear here as soon as people sign up."}
      </p>
    </div>
  );
}

/**
 * The admin user list. Server component — rows arrive already serialized by
 * lib/admin-user-service.ts (which never projects passwordHash), and the only
 * client code is the per-row action island.
 *
 * Two presentations, per D14: a real table on lg+, stacked cards below. The
 * table is NOT allowed to scroll horizontally on mobile — six columns in a
 * 375px viewport is unusable, so the layout changes instead of the overflow.
 */
export function UserTable({
  rows,
  currentAdminId,
  filtered,
}: {
  rows: AdminUserRow[];
  currentAdminId: string;
  filtered: boolean;
}) {
  if (rows.length === 0) return <EmptyState filtered={filtered} />;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-kn-border-0 bg-kn-surface-0 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-kn-border-0 hover:bg-transparent">
              <TableHead className="h-11 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-kn-ink-2">
                User
              </TableHead>
              <TableHead className="h-11 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-kn-ink-2">
                Email
              </TableHead>
              <TableHead className="h-11 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-kn-ink-2">
                Role
              </TableHead>
              <TableHead className="h-11 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-kn-ink-2">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-kn-ink-2">
                Joined
              </TableHead>
              <TableHead className="h-11 w-12 px-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => (
              <TableRow
                key={user.id}
                // Inactive rows stay visible — deactivation is reversible and an
                // admin needs to find the account again to reactivate it.
                className={cn(
                  "border-kn-border-0",
                  user.status === "inactive" && "opacity-60"
                )}
              >
                <TableCell className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <Avatar className="size-8 shrink-0 bg-kn-compared">
                      <AvatarFallback className="bg-kn-compared text-xs font-bold text-white">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-kn-ink-0 group-hover:text-kn-current">
                        {user.name}
                      </span>
                      <span className="block truncate font-mono text-xs text-kn-ink-2">
                        @{user.username}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs text-kn-ink-1">
                  {user.email}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs tabular-nums text-kn-ink-1">
                  {formatJoined(user.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <UserRowActions
                    user={user}
                    isSelf={user.id === currentAdminId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet cards (D14: no horizontal table scroll) */}
      <ul className="flex flex-col gap-2 lg:hidden">
        {rows.map((user) => (
          <li
            key={user.id}
            className={cn(
              "rounded-xl border border-kn-border-0 bg-kn-surface-0 p-3.5",
              user.status === "inactive" && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="size-9 shrink-0 bg-kn-compared">
                <AvatarFallback className="bg-kn-compared text-sm font-bold text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="block truncate text-sm font-semibold text-kn-ink-0"
                >
                  {user.name}
                </Link>
                <div className="truncate font-mono text-xs text-kn-ink-2">
                  @{user.username}
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-kn-ink-1">
                  {user.email}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                  <span className="font-mono text-[11px] text-kn-ink-2">
                    joined {formatJoined(user.createdAt)}
                  </span>
                </div>
              </div>

              <UserRowActions user={user} isSelf={user.id === currentAdminId} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
