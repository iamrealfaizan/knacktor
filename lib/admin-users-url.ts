/**
 * URL-state model for /admin/users. Mirrors lib/home-url.ts, but this list is a
 * plain server-rendered table rather than a client island: the filter controls
 * push a new query string, the server re-renders, and the address bar is always
 * the single source of truth. That keeps deep links and the back button honest,
 * and means an admin can bookmark "inactive users, oldest first".
 */
import type { AdminUserSort } from "./admin-user-service";
import type { UserRole, UserStatus } from "./rbac";

const VALID_SORT: AdminUserSort[] = ["newest", "oldest", "name"];

export interface AdminUsersState {
  q: string;
  role: UserRole | "all";
  status: UserStatus | "all";
  sort: AdminUserSort;
  page: number;
}

export const DEFAULT_ADMIN_USERS_STATE: AdminUsersState = {
  q: "",
  role: "all",
  status: "all",
  sort: "newest",
  page: 1,
};

export function isDefaultAdminUsersState(s: AdminUsersState): boolean {
  return !s.q && s.role === "all" && s.status === "all" && s.sort === "newest";
}

type RawParams = Record<string, string | string[] | undefined>;

function toOne(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseAdminUsersState(sp: RawParams = {}): AdminUsersState {
  const roleRaw = toOne(sp.role);
  const statusRaw = toOne(sp.status);
  const sortRaw = toOne(sp.sort);

  return {
    q: toOne(sp.q)?.trim() ?? "",
    role: roleRaw === "admin" || roleRaw === "user" ? roleRaw : "all",
    status:
      statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "all",
    sort: VALID_SORT.includes(sortRaw as AdminUserSort)
      ? (sortRaw as AdminUserSort)
      : "newest",
    page: Math.max(1, Number.parseInt(toOne(sp.page) ?? "1", 10) || 1),
  };
}

/** Serialize back to a query string, omitting defaults to keep URLs clean. */
export function adminUsersStateToQuery(
  state: Partial<AdminUsersState>
): string {
  const s = { ...DEFAULT_ADMIN_USERS_STATE, ...state };
  const p = new URLSearchParams();
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.role !== "all") p.set("role", s.role);
  if (s.status !== "all") p.set("status", s.status);
  if (s.sort !== "newest") p.set("sort", s.sort);
  if (s.page > 1) p.set("page", String(s.page));
  return p.toString();
}

/** Href for a given page, preserving the current filters. */
export function adminUsersHref(
  state: AdminUsersState,
  overrides: Partial<AdminUsersState> = {}
): string {
  const q = adminUsersStateToQuery({ ...state, ...overrides });
  return q ? `/admin/users?${q}` : "/admin/users";
}
