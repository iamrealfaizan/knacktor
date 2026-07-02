import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_STYLE,
  PROBLEMS,
  RESULT_COUNT,
  SORT_OPTIONS,
  STATUS_STYLE,
} from "./home-data";

const GRID = "grid grid-cols-[44px_52px_1fr_96px] gap-3.5 items-center";

export function ProblemTable() {
  return (
    <section>
      {/* toolbar (search + sort are visual only for now) */}
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="text-sm text-kn-ink-1 whitespace-nowrap">
          <b className="text-kn-ink-0 font-bold">{RESULT_COUNT}</b> problems
        </div>
        <div className="flex-1 flex items-center gap-2 h-[38px] px-3 border border-kn-border-0 rounded-lg bg-kn-surface-0">
          <Search className="h-4 w-4 text-kn-ink-2 shrink-0" />
          <Input
            readOnly
            aria-label="Search problems"
            placeholder="Search problems…"
            className="h-auto flex-1 border-0 bg-transparent p-0 text-sm text-kn-ink-0 placeholder:text-kn-ink-2 focus-visible:ring-0"
          />
          <span className="font-mono text-[10px] font-semibold text-kn-ink-2 border border-kn-border-0 rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2.5">
          <span className="text-xs text-kn-ink-2">Sort</span>
          <div className="flex gap-0.5 bg-kn-inset border border-kn-border-0 rounded-lg p-[3px]">
            {SORT_OPTIONS.map((label, i) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto py-1.5 px-3 rounded-md text-xs font-semibold",
                  i === 0
                    ? "bg-kn-surface-0 text-kn-ink-0 shadow-sm hover:bg-kn-surface-0"
                    : "text-kn-ink-2 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* table */}
      <div className="border border-kn-border-0 rounded-[14px] bg-kn-surface-0 overflow-hidden">
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

        {PROBLEMS.map((p) => {
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
                <span className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-kn-ink-0">{p.title}</span>
                  {p.viz && (
                    <Badge
                      title="Has visualizer"
                      className="rounded-full font-mono text-[9px] tracking-[0.06em] bg-kn-result-subtle text-kn-result px-1.5"
                    >
                      ▸ VIZ
                    </Badge>
                  )}
                </span>
                <span className="flex gap-1.5 flex-wrap mt-1.5">
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
