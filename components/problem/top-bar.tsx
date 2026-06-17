"use client";

import Link from "next/link";
import { Moon, Sun, Code2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  dark,
  toggleTheme,
  approaches,
  activeApproachId,
  onSelectApproach,
}: {
  problem: ProblemFull;
  mode: Mode;
  setMode: (m: Mode) => void;
  dark: boolean;
  toggleTheme: () => void;
  approaches: Approach[];
  activeApproachId: string;
  onSelectApproach: (id: string) => void;
}) {
  const activeApproach = approaches.find((a) => a.id === activeApproachId) ?? approaches[0];
  const onlyOne = approaches.length <= 1;

  return (
    <header className="flex-none h-14 flex items-center gap-3 px-4 border-b border-kn-border-0 bg-kn-surface-0">
      <Link
        href="/problems"
        className="w-7 h-7 rounded-md bg-kn-current grid place-items-center text-white font-mono font-bold text-xs shrink-0"
        title="Back to problems"
      >
        <Code2 className="h-4 w-4" />
      </Link>

      <span className="font-semibold text-base text-kn-ink-0">{problem.title}</span>

      <Badge
        variant="outline"
        className="font-mono text-[10px] tracking-wider uppercase border-transparent bg-kn-med-bg text-kn-med-ink"
      >
        {problem.difficulty}
      </Badge>

      {problem.patterns[0] && (
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider uppercase text-kn-ink-2 border-kn-border-0"
        >
          {problem.patterns[0].replace(/-/g, " ")}
        </Badge>
      )}

      {/* Approach selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={onlyOne}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 font-mono text-[11px] font-semibold rounded-md border border-kn-border-0 bg-kn-inset text-kn-ink-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-kn-surface-1 transition-colors"
        >
          {onlyOne ? "Only approach" : approachLabel(activeApproach)}
          <ChevronDown className="h-3 w-3 opacity-60" />
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

      <span className="ml-1.5 text-[13px] text-kn-ink-2 hidden lg:inline truncate">
        {activeApproach?.summary}
      </span>

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

        {/* Theme toggle */}
        <Button
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          className="h-8 w-8 border-kn-border-0 bg-kn-surface-0 text-kn-ink-0"
          title={dark ? "Switch to light" : "Switch to dark"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
