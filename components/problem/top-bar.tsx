"use client";

import { ChevronDown, Check, FileText, X, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Approach, ProblemFull } from "@/lib/trace";
import type { Mode } from "./problem-engine";

const MODES: Mode[] = ["Learn", "Focus", "Compare"];

function approachLabel(a: Approach): string {
  if (a.kind === "brute") return "Brute Force";
  if (a.kind === "optimal") return "Optimal";
  return a.name;
}

export function TopBar({
  problem,
  mode,
  setMode,
  approaches,
  activeApproachId,
  loadingApproachId = null,
  onSelectApproach,
}: {
  problem: ProblemFull;
  mode: Mode;
  setMode: (m: Mode) => void;
  approaches: Approach[];
  activeApproachId: string;
  /** approach currently lazy-loading its traces (spinner in the selector) */
  loadingApproachId?: string | null;
  onSelectApproach: (id: string) => void;
}) {
  const activeApproach = approaches.find((a) => a.id === activeApproachId) ?? approaches[0];
  const onlyOne = approaches.length <= 1;

  return (
    <header className="flex-none h-14 flex items-center gap-3 px-4 border-b border-kn-border-0 bg-kn-surface-0">
      <Logo variant="tile" href="/problems" />

      <span className="font-semibold text-base text-kn-ink-0">{problem.title}</span>

      <DifficultyBadge difficulty={problem.difficulty} format="upper" />

      {problem.patterns[0] && (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider uppercase text-kn-ink-2 border-kn-border-0"
        >
          {problem.patterns[0].replace(/-/g, " ")}
        </Badge>
      )}

      {/* Problem statement — hidden by default, opens in a side sheet */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 px-2.5 font-mono text-[11px] font-semibold border-kn-border-0 bg-kn-inset text-kn-ink-1 shrink-0"
            >
              <FileText className="h-3.5 w-3.5" /> Problem
            </Button>
          }
        />
        <SheetContent side="right" className="gap-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">
              {problem.number}. {problem.title}
            </SheetTitle>
            <DifficultyBadge difficulty={problem.difficulty} format="upper" />
            <SheetClose
              render={
                <Button size="icon" variant="ghost" className="h-7 w-7 text-kn-ink-2">
                  <X className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          <article className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-kn-ink-1">
            {problem.statement}
          </article>
        </SheetContent>
      </Sheet>

      {/* Approach selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={onlyOne}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 font-mono text-[11px] font-semibold rounded-md border border-kn-border-0 bg-kn-inset text-kn-ink-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-kn-surface-1 transition-colors"
        >
          {onlyOne ? "Only approach" : approachLabel(activeApproach)}
          {loadingApproachId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="font-mono text-[12px] min-w-[160px]">
          {approaches.map((a) => (
            <DropdownMenuItem
              key={a.id}
              onClick={() => onSelectApproach(a.id)}
              className="gap-2 cursor-pointer"
            >
              <Check
                className={cn("h-3 w-3 shrink-0", a.id === activeApproachId ? "opacity-100" : "opacity-0")}
              />
              <span>{approachLabel(a)}</span>
              {a.kind === "optimal" && <span className="ml-auto text-kn-ink-2 text-[10px]">★</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Strategy — full approach summary in a popover (replaces the old clipped inline line) */}
      {activeApproach?.summary && (
        <Popover>
          <PopoverTrigger className="inline-flex items-center gap-1.5 h-7 px-2.5 font-mono text-[11px] font-semibold rounded-md border border-kn-border-0 bg-kn-inset text-kn-ink-1 shrink-0 hover:bg-kn-surface-1 transition-colors outline-none">
            <Lightbulb className="h-3.5 w-3.5" /> Strategy
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 max-w-[min(20rem,calc(100vw-2rem))]">
            <PopoverTitle>Strategy · {approachLabel(activeApproach)}</PopoverTitle>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-kn-ink-1">
              {activeApproach.summary}
            </p>
            {activeApproach.complexity && (
              <div className="mt-3 flex gap-2 font-mono text-[11px]">
                <span className="rounded-md border border-kn-border-0 bg-kn-inset px-2 py-1 text-kn-ink-2">
                  Time <span className="font-bold text-kn-ink-0">{activeApproach.complexity.time}</span>
                </span>
                <span className="rounded-md border border-kn-border-0 bg-kn-inset px-2 py-1 text-kn-ink-2">
                  Space <span className="font-bold text-kn-ink-0">{activeApproach.complexity.space}</span>
                </span>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Mode segmented control */}
        <div className="flex gap-0.5 bg-kn-inset border border-kn-border-0 rounded-lg p-0.5">
          {MODES.map((m) => {
            const disabled = m === "Compare" && !problem.supportsCompare;
            const active = mode === m;
            return (
              <Button
                key={m}
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => setMode(m)}
                className={cn(
                  "h-7 px-2.5 font-mono text-[11px] font-semibold rounded-md",
                  active
                    ? "bg-kn-ink-0 text-kn-surface-0 hover:bg-kn-ink-0"
                    : "text-kn-ink-2 hover:text-kn-ink-0 hover:bg-transparent",
                  disabled && "opacity-30"
                )}
              >
                {m}
              </Button>
            );
          })}
        </div>

        <ThemeToggle size="sm" />
      </div>
    </header>
  );
}
