"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminUsersHref,
  isDefaultAdminUsersState,
  type AdminUsersState,
} from "@/lib/admin-users-url";

const SEARCH_DEBOUNCE_MS = 350;

/**
 * The only client island on /admin/users. It doesn't own list state — it pushes
 * a new URL and lets the server re-render, so the address bar stays the single
 * source of truth (deep links, back button, bookmarkable filters).
 *
 * Search is debounced so typing doesn't fire a navigation per keystroke. Any
 * filter change resets to page 1 — staying on page 7 of a narrower result set
 * would otherwise show an empty table.
 */
export function UserFilters({ state }: { state: AdminUsersState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(state.q);

  // Keep the box in sync when the URL changes from elsewhere (back button,
  // "Clear filters"), without clobbering what the admin is mid-way through typing.
  const committed = useRef(state.q);
  useEffect(() => {
    if (state.q !== committed.current) {
      committed.current = state.q;
      setQ(state.q);
    }
  }, [state.q]);

  function push(overrides: Partial<AdminUsersState>) {
    const href = adminUsersHref(state, { page: 1, ...overrides });
    startTransition(() => router.push(href));
  }

  // Debounced search: one navigation once typing settles.
  useEffect(() => {
    if (q === committed.current) return;
    const t = setTimeout(() => {
      committed.current = q;
      startTransition(() =>
        router.push(adminUsersHref(state, { q, page: 1 }))
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // `state` is intentionally read fresh inside the timeout via closure; adding
    // it to deps would restart the debounce on every server re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div
      data-pending={pending ? "" : undefined}
      className="flex flex-wrap items-center gap-2 data-[pending]:opacity-70"
    >
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kn-ink-2"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search users by name, username, or email"
          placeholder="Search name, username, email…"
          className="h-9 pl-9 pr-8"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-kn-ink-2 hover:text-kn-ink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Select
        value={state.role}
        onValueChange={(v) => push({ role: v as AdminUsersState["role"] })}
      >
        <SelectTrigger className="h-9 w-[130px]" aria-label="Filter by role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="admin">Admins</SelectItem>
          <SelectItem value="user">Users</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={state.status}
        onValueChange={(v) => push({ status: v as AdminUsersState["status"] })}
      >
        <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={state.sort}
        onValueChange={(v) => push({ sort: v as AdminUsersState["sort"] })}
      >
        <SelectTrigger className="h-9 w-[150px]" aria-label="Sort users">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="name">Name A–Z</SelectItem>
        </SelectContent>
      </Select>

      {!isDefaultAdminUsersState(state) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            committed.current = "";
            setQ("");
            startTransition(() => router.push("/admin/users"));
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
