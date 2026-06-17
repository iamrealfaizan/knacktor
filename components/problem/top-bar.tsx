"use client";

import Link from "next/link";
import { Moon, Sun, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProblemFull } from "@/lib/trace";
import type { Mode } from "./problem-engine";

const MODES: Mode[] = ["Learn", "Focus", "Compare"];

export function TopBar({
  problem,
  mode,
  setMode,
  dark,
  toggleTheme,
}: {
  problem: ProblemFull;
  mode: Mode;
  setMode: (m: Mode) => void;
  dark: boolean;
  toggleTheme: () => void;
}) {
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

      <span className="ml-1.5 text-[13px] text-kn-ink-2 hidden lg:inline">
        {problem.approaches[0]?.summary}
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
