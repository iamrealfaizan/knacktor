"use client";

import { Check, FileText, Lightbulb, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";
import type { Approach, ProblemFull } from "@/lib/trace";
import type { Mode } from "./problem-engine";

const MODES: Mode[] = ["Learn", "Focus", "Compare"];

function approachLabel(a: Approach): string {
  if (a.kind === "brute") return "Brute Force";
  if (a.kind === "optimal") return "Optimal";
  return a.name;
}

/**
 * Mobile 3-dot overflow sheet (D14): re-homes everything the desktop TopBar
 * shows inline — difficulty, topics/patterns, problem statement, approach
 * selector, strategy summary, mode switcher and theme toggle — into a
 * bottom sheet so the mobile top bar stays back · title · ⋮.
 */
export function MobileOverflowSheet({
  open,
  onOpenChange,
  problem,
  mode,
  setMode,
  approaches,
  activeApproachId,
  loadingApproachId,
  onSelectApproach,
  onOpenStatement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: ProblemFull;
  mode: Mode;
  setMode: (m: Mode) => void;
  approaches: Approach[];
  activeApproachId: string;
  loadingApproachId: string | null;
  onSelectApproach: (id: string) => void;
  onOpenStatement: () => void;
}) {
  const activeApproach = approaches.find((a) => a.id === activeApproachId) ?? approaches[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 p-0 pt-2">
        {/* grab handle */}
        <div className="flex justify-center py-1.5">
          <span className="w-9 h-1 rounded-full bg-kn-border-0" />
        </div>

        {/* identity */}
        <div className="px-4 pb-3 border-b border-kn-border-0">
          <SheetTitle className="text-[14px]">
            {problem.number}. {problem.title}
          </SheetTitle>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <DifficultyBadge difficulty={problem.difficulty} format="upper" />
            {[...new Set([...problem.topics, ...problem.patterns])].map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="font-mono text-[10px] tracking-wider uppercase text-kn-ink-2 border-kn-border-0"
              >
                {t.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* problem statement */}
        <button
          onClick={() => { onOpenChange(false); onOpenStatement(); }}
          className="w-full min-h-11 px-4 py-3 flex items-center gap-2.5 text-left border-b border-kn-border-0 hover:bg-kn-surface-1 transition-colors touch-manipulation"
        >
          <FileText className="h-4 w-4 text-kn-ink-2 shrink-0" />
          <span className="text-[13.5px] font-semibold text-kn-ink-0">Problem statement</span>
        </button>

        {/* approach selector */}
        <div className="px-4 py-3 border-b border-kn-border-0">
          <p className="font-mono text-[9px] font-bold tracking-widest text-kn-ink-2 mb-2">APPROACH</p>
          <div className="flex flex-col gap-1">
            {approaches.map((a) => {
              const active = a.id === activeApproachId;
              const loading = a.id === loadingApproachId;
              return (
                <button
                  key={a.id}
                  onClick={() => { onOpenChange(false); onSelectApproach(a.id); }}
                  className={cn(
                    "min-h-11 px-3 rounded-lg border flex items-center gap-2 font-mono text-[12px] font-semibold text-left transition-colors touch-manipulation",
                    active
                      ? "border-kn-current/40 bg-kn-current/10 text-kn-current"
                      : "border-kn-border-0 bg-kn-inset text-kn-ink-1"
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1">{approachLabel(a)}</span>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {a.kind === "optimal" && <span className="text-kn-ink-2 text-[10px]">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* strategy */}
        {activeApproach?.summary && (
          <div className="px-4 py-3 border-b border-kn-border-0">
            <p className="font-mono text-[9px] font-bold tracking-widest text-kn-ink-2 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3" /> STRATEGY · {approachLabel(activeApproach).toUpperCase()}
            </p>
            <p className="text-[13px] leading-relaxed text-kn-ink-1">{activeApproach.summary}</p>
            {activeApproach.complexity && (
              <div className="mt-2.5 flex gap-2 font-mono text-[11px]">
                <span className="rounded-md border border-kn-border-0 bg-kn-inset px-2 py-1 text-kn-ink-2">
                  Time <span className="font-bold text-kn-ink-0">{activeApproach.complexity.time}</span>
                </span>
                <span className="rounded-md border border-kn-border-0 bg-kn-inset px-2 py-1 text-kn-ink-2">
                  Space <span className="font-bold text-kn-ink-0">{activeApproach.complexity.space}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* mode switcher */}
        <div className="px-4 py-3 border-b border-kn-border-0">
          <p className="font-mono text-[9px] font-bold tracking-widest text-kn-ink-2 mb-2">MODE</p>
          <div className="flex gap-1 bg-kn-inset border border-kn-border-0 rounded-lg p-1">
            {MODES.map((m) => {
              const disabled = m === "Compare" && !problem.supportsCompare;
              const active = mode === m;
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => { setMode(m); onOpenChange(false); }}
                  className={cn(
                    "flex-1 min-h-10 rounded-md font-mono text-[12px] font-semibold transition-colors touch-manipulation",
                    active ? "bg-kn-ink-0 text-kn-surface-0" : "text-kn-ink-2",
                    disabled && "opacity-30"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* theme */}
        <div className="px-4 py-3 mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold tracking-widest text-kn-ink-2">THEME</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
