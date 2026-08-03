"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { DEACTIVATED_REASON } from "@/lib/rbac";

/**
 * "Your account was deactivated" banner, shown when requireActiveSession() boots
 * a deactivated account mid-session and redirects to /login?reason=deactivated.
 *
 * Reads the flag on the client rather than from the page's server `searchParams`
 * on purpose: touching searchParams in the page would opt /login out of static
 * rendering entirely. Must be rendered inside a <Suspense> boundary.
 */
export function DeactivatedNotice() {
  if (useSearchParams().get("reason") !== DEACTIVATED_REASON) return null;

  return (
    <div
      role="alert"
      className="mt-5 flex gap-2.5 rounded-lg border border-kn-error-border bg-kn-error-subtle px-3.5 py-3"
    >
      <AlertCircle
        className="mt-px h-4 w-4 shrink-0 text-kn-error"
        aria-hidden
      />
      <p className="text-sm text-kn-ink-1">
        <span className="font-semibold text-kn-ink-0">
          This account has been deactivated.
        </span>{" "}
        Your progress is safe. Contact support if you think this is a mistake.
      </p>
    </div>
  );
}
