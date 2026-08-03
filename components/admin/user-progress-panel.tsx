import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUserDetail } from "@/lib/admin-user-service";

const DIFF_TONE: Record<string, string> = {
  easy: "bg-kn-result",
  medium: "bg-kn-amber",
  hard: "bg-kn-error",
};

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-kn-border-0 bg-kn-surface-1 px-3 py-2.5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-kn-ink-2">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-xl font-bold tabular-nums",
          tone ?? "text-kn-ink-0"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Read-only learner stats for one user. Every number comes from the same
 * progress-service functions that back the user's own /home dashboard
 * (getUserProgressSummary / getProblemStatusCounts / getStreak), so the admin
 * view can never drift from what the learner sees.
 */
export function UserProgressPanel({
  detail,
}: {
  detail: AdminUserDetail;
}) {
  const { counts, progress, streak, catalogTotal } = detail;
  // `todo` is not stored for untouched problems — derive it (see
  // getProblemStatusCounts' contract in lib/progress-service.ts).
  const todo = Math.max(0, catalogTotal - counts.solved - counts.attempted);
  const pct =
    progress.total > 0
      ? Math.round((progress.solved / progress.total) * 100)
      : 0;

  return (
    <section className="rounded-xl border border-kn-border-0 bg-kn-surface-0 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-kn-ink-0">Progress</h2>
        <div
          title="Current streak"
          className="flex items-center gap-1.5 rounded-lg bg-kn-accent-soft px-2.5 py-1"
        >
          <Flame className="h-3.5 w-3.5 text-kn-current" aria-hidden />
          <span className="font-mono text-sm font-bold tabular-nums text-kn-current">
            {streak.currentStreak}
          </span>
          <span className="text-xs text-kn-ink-1">
            day{streak.currentStreak === 1 ? "" : "s"} · longest{" "}
            <b className="font-mono font-semibold tabular-nums">
              {streak.longestStreak}
            </b>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Solved" value={counts.solved} tone="text-kn-result" />
        <Metric
          label="Attempted"
          value={counts.attempted}
          tone="text-kn-amber"
        />
        <Metric label="To do" value={todo} />
        <Metric
          label="Bookmarks"
          value={counts.bookmarked}
          tone="text-kn-compared"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-kn-ink-1">
            Catalog completion
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-kn-ink-0">
            {progress.solved}/{progress.total} · {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-kn-track">
          <div
            className="h-full rounded-full bg-kn-result transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {progress.byDifficulty.map((d) => {
          const dPct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
          return (
            <div key={d.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium capitalize text-kn-ink-1">
                  {d.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-kn-ink-2">
                  {d.solved}/{d.total}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-kn-track">
                <div
                  className={cn(
                    "h-full rounded-full",
                    DIFF_TONE[d.label] ?? "bg-kn-ink-2"
                  )}
                  style={{ width: `${dPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
