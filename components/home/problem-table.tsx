import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProblemRowSkeleton } from "@/components/skeletons";
import type { Problem } from "./home-data";
import { DIFFICULTY_STYLE, STATUS_STYLE } from "./home-data";

const GRID =
  "grid grid-cols-[36px_40px_1fr_auto] lg:grid-cols-[44px_52px_1fr_96px] gap-2.5 lg:gap-3.5 items-center";

/**
 * Presentational problem table. `rows` is the current page; `pending` dims the
 * list while the parent island fetches the next result set (no layout shift, so
 * scroll position is preserved).
 */
export function ProblemTable({
  rows,
  pending = false,
}: {
  rows: Problem[];
  pending?: boolean;
}) {
  return (
    <section>
      {/* table */}
      <div
        className="border border-kn-border-0 rounded-[14px] bg-kn-surface-0 overflow-hidden"
        aria-busy={pending}
      >
        <div
          className={cn(
            GRID,
            "py-2.5 px-[18px] border-b border-kn-border-0 bg-kn-surface-1 font-mono text-[10px] font-bold tracking-[0.1em] text-kn-ink-2"
          )}
        >
          <span>STATUS</span>
          <span>#</span>
          <span>PROBLEM</span>
          <span className="text-right">LEVEL</span>
        </div>

        {/* While a fetch is in flight, show skeleton rows (keeps height stable). */}
        {pending &&
          Array.from({ length: rows.length || 10 }).map((_, i) => (
            <ProblemRowSkeleton key={`sk-${i}`} />
          ))}

        {!pending && rows.length === 0 && (
          <div className="py-14 text-center text-sm text-kn-ink-2">
            No problems match your search or filters.
          </div>
        )}

        {!pending &&
          rows.map((p) => {
          const s = STATUS_STYLE[p.status];
          const d = DIFFICULTY_STYLE[p.diff];
          const StatusIcon = s.icon;
          return (
            <Link
              key={p.num}
              href={p.href}
              className={cn(
                GRID,
                "py-3 px-[18px] border-b border-kn-border-0 last:border-b-0 hover:bg-kn-surface-1 transition-colors",
                "motion-safe:[animation:kn-rise_.3s_ease]"
              )}
            >
              <span className="grid place-items-center" title={s.label}>
                <StatusIcon className={cn("h-[18px] w-[18px]", s.color)} />
              </span>
              <span className="font-mono text-[13px] font-semibold text-kn-ink-2">
                {String(p.num).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2.5 min-w-0 lg:flex-wrap">
                  <span className="text-[15px] font-semibold text-kn-ink-0 truncate lg:whitespace-normal">{p.title}</span>
                  {p.viz && (
                    <Badge
                      title="Has visualizer"
                      className="hidden lg:inline-flex rounded-full font-mono text-[9px] tracking-[0.06em] bg-kn-result-subtle text-kn-result px-1.5"
                    >
                      ▸ VIZ
                    </Badge>
                  )}
                </span>
                <span className="hidden lg:flex gap-1.5 flex-wrap mt-1.5">
                  {p.topics.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="rounded-full font-mono text-[10.5px] border-kn-border-0 text-kn-ink-2 px-2"
                    >
                      {t}
                    </Badge>
                  ))}
                  {p.patterns.map((t) => (
                    <Badge
                      key={t}
                      className="rounded-full font-mono text-[10.5px] bg-kn-accent-soft text-kn-current px-2"
                    >
                      {t}
                    </Badge>
                  ))}
                </span>
              </span>
              <span className="text-right">
                <Badge
                  className={cn(
                    "rounded-full font-mono text-[9px] tracking-[0.08em] px-2.5 py-1",
                    d.bg,
                    d.ink
                  )}
                >
                  {p.diff.toUpperCase()}
                </Badge>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
