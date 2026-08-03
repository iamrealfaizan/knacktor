"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ellipsis,
  Eye,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  setUserRoleAction,
  setUserStatusAction,
} from "@/app/actions/admin-users";
import type { AdminUserRow } from "@/lib/admin-user-service";
import { ConfirmDeactivateDialog } from "./confirm-deactivate-dialog";

/**
 * Per-row actions. Every item here is also enforced server-side in
 * lib/admin-user-service.ts — the disabled states below are a courtesy so the
 * admin isn't offered a button that will just fail, NOT the security boundary.
 *
 * `isSelf` disables self role-change and self-deactivation, which are the two
 * paths to locking yourself out.
 */
export function UserRowActions({
  user,
  isSelf,
  showDetailLink = true,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  showDetailLink?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  const isAdmin = user.role === "admin";
  const isInactive = user.status === "inactive";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${user.username}`}
              disabled={pending}
            />
          }
        >
          <Ellipsis className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[220px]">
          {showDetailLink && (
            <>
              <DropdownMenuItem
                render={<Link href={`/admin/users/${user.id}`} />}
              >
                <Eye />
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isAdmin ? (
            <DropdownMenuItem
              disabled={isSelf || user.envAdmin}
              onClick={() =>
                run(
                  () => setUserRoleAction(user.id, "user"),
                  `${user.name} is now a user.`
                )
              }
            >
              <ShieldOff />
              {user.envAdmin
                ? "Admin via ADMIN_EMAILS"
                : isSelf
                  ? "Can't demote yourself"
                  : "Demote to user"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isSelf}
              onClick={() =>
                run(
                  () => setUserRoleAction(user.id, "admin"),
                  `${user.name} is now an admin.`
                )
              }
            >
              <ShieldCheck />
              Promote to admin
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isInactive ? (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setUserStatusAction(user.id, "active"),
                  `${user.name} was reactivated.`
                )
              }
            >
              <UserCheck />
              Reactivate account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              disabled={isSelf || isAdmin}
              onClick={() => setConfirmOpen(true)}
            >
              <UserX />
              {isSelf
                ? "Can't deactivate yourself"
                : isAdmin
                  ? "Demote before deactivating"
                  : "Deactivate account"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeactivateDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        username={user.username}
        name={user.name}
        pending={pending}
        onConfirm={() => {
          setConfirmOpen(false);
          run(
            () => setUserStatusAction(user.id, "inactive"),
            `${user.name} was deactivated.`
          );
        }}
      />
    </>
  );
}
