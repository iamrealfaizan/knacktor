import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { listUsers, ADMIN_USERS_PAGE_SIZE } from "@/lib/admin-user-service";
import {
  adminUsersHref,
  isDefaultAdminUsersState,
  parseAdminUsersState,
} from "@/lib/admin-users-url";
import { UserFilters } from "@/components/admin/user-filters";
import { UserTable } from "@/components/admin/user-table";
import { LinkPaginationBar } from "@/components/shared/link-pagination-bar";

export const metadata: Metadata = { title: "Users" };

/**
 * Server-rendered user list. All list state (search / role / status / sort /
 * page) lives in the URL — see lib/admin-users-url.ts — so filters are
 * shareable and the back button behaves.
 *
 * requireAdminPage() is already awaited by app/admin/layout.tsx; calling it here
 * too is not redundant defence, it's how the page learns WHICH admin is looking,
 * so the row actions can disable self-demotion and self-deactivation.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const admin = await requireAdminPage();
  const state = parseAdminUsersState(searchParams);

  const { rows, total, page, pageSize } = await listUsers({
    q: state.q,
    role: state.role,
    status: state.status,
    sort: state.sort,
    page: state.page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-kn-ink-1">
          {total === 1 ? "1 account" : `${total} accounts`}
          {!isDefaultAdminUsersState(state) && " matching these filters"}
        </p>
      </div>

      <div className="mt-4">
        <UserFilters state={state} />
      </div>

      <div className="mt-4">
        <UserTable
          rows={rows}
          currentAdminId={admin.id}
          filtered={!isDefaultAdminUsersState(state)}
        />
      </div>

      <LinkPaginationBar
        total={total}
        page={page}
        pageSize={pageSize}
        hrefForPage={(p) => adminUsersHref(state, { page: p })}
      />
    </div>
  );
}
