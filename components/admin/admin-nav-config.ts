/**
 * Admin navigation, in one place — mirrors how lib/site.ts owns NAV_LINKS for
 * the learner app. The sidebar and the mobile sheet both render from this list,
 * so adding a section is a one-line change plus a page file.
 *
 * `soon: true` entries render disabled. They are deliberate: the shell's shape
 * is settled now so later sections drop in without a re-layout, and it's honest
 * about what Phase 1 does and doesn't include.
 */
export interface AdminNavItem {
  label: string;
  href: string;
  /** lucide-react icon name, resolved in admin-sidebar.tsx. */
  icon: "gauge" | "users" | "library" | "listChecks";
  soon?: boolean;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: "gauge" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Content", href: "/admin/content", icon: "library", soon: true },
  { label: "Sheets", href: "/admin/sheets", icon: "listChecks", soon: true },
] as const;
