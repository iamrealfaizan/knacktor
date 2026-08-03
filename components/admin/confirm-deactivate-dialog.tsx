"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Typed confirmation for deactivation. The action is reversible (soft — progress
 * rows are preserved), but it locks a real person out of their account, so it
 * gets more friction than a one-click dropdown item: the admin must type the
 * username, which forces them to confirm they're acting on the row they think
 * they are.
 */
export function ConfirmDeactivateDialog({
  open,
  onOpenChange,
  username,
  name,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  name: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  function handleOpenChange(next: boolean) {
    if (!next) setTyped(""); // never carry a half-typed confirmation to the next row
    onOpenChange(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won&apos;t be able to sign in, and any active session ends on
            their next page load. Their solved problems, notes, and streak are
            kept — reactivating restores everything.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="confirm-username" className="text-xs text-kn-ink-1">
            Type{" "}
            <span className="font-mono font-semibold text-kn-ink-0">
              {username}
            </span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-username"
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
            placeholder={username}
            className="h-9 font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!matches || pending}
            onClick={() => {
              if (!matches) return;
              onConfirm();
            }}
          >
            {pending ? "Deactivating…" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
