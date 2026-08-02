"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Gauge,
  Library,
  ListChecks,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ADMIN_NAV, type AdminNavItem } from "./admin-nav-config";

const ICONS: Record<AdminNavItem["icon"], LucideIcon> = {
  gauge: Gauge,
  users: Users,
  library: Library,
  listChecks: ListChecks,
};

/**
 * Persistent admin nav. Rendered inline on lg+ by AdminShell, and inside the
 * mobile sheet below lg — hence `onNavigate`, which the sheet uses to close
 * itself on selection.
 */
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // /admin is an exact match only — otherwise it would light up on every
  // /admin/* route alongside the real section.
  const isActive = (item: AdminNavItem) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <div className="flex h-full w-full flex-col bg-kn-surface-1">
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-kn-border-0 px-5">
        <Logo variant="nav" href="/admin" />
        <span className="rounded border border-kn-current-border bg-kn-current-subtle px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] text-kn-current">
          ADMIN
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {ADMIN_NAV.map((item) => {
          const Icon = ICONS[item.icon];

          if (item.soon) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                title="Coming soon"
                className="flex min-h-10 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-kn-ink-2 opacity-60"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-kn-ink-2">
                  Soon
                </span>
              </div>
            );
          }

          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-kn-surface-2 font-semibold text-kn-ink-0"
                  : "text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-kn-current" : ""
                )}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-kn-border-0 p-3">
        <Link
          href="/home"
          onClick={onNavigate}
          className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-kn-ink-1 transition-colors hover:bg-kn-surface-2 hover:text-kn-ink-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to app
        </Link>
      </div>
    </div>
  );
}
