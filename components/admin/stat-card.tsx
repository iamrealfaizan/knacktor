import { cn } from "@/lib/utils";

/**
 * One headline number on the admin overview. Value uses JetBrains Mono with
 * tabular figures so a column of cards stays visually aligned (Design.md).
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "accent" | "positive" | "warning";
}) {
  const valueTone = {
    neutral: "text-kn-ink-0",
    accent: "text-kn-current",
    positive: "text-kn-result",
    warning: "text-kn-amber",
  }[tone];

  return (
    <div className="rounded-xl border border-kn-border-0 bg-kn-surface-0 p-4">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-kn-ink-2">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-bold tabular-nums",
          valueTone
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-kn-ink-2">{hint}</div>}
    </div>
  );
}
