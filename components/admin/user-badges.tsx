import { cn } from "@/lib/utils";
import type { UserRole, UserStatus } from "@/lib/rbac";

/**
 * Role and status pills. Both pair color with a text label rather than relying
 * on hue alone (SimulationRules §A-8 rule 5 — the same accessibility rule the
 * stage follows), so they stay readable for colorblind admins and in print.
 */
const PILL =
  "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        PILL,
        role === "admin"
          ? "border-kn-current-border bg-kn-current-subtle text-kn-current"
          : "border-kn-border-0 bg-kn-surface-2 text-kn-ink-2"
      )}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        PILL,
        status === "active"
          ? "border-kn-result-border bg-kn-result-subtle text-kn-result"
          : "border-kn-error-border bg-kn-error-subtle text-kn-error"
      )}
    >
      {status}
    </span>
  );
}
