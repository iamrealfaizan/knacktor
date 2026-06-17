"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "./theme-provider";
import { usePlayer } from "./use-player";
import { TopBar } from "./top-bar";
import { CodePanel } from "./code-panel";
import { Stage } from "./stage";
import { Narration } from "./narration";
import { InsightRail } from "./insight-rail";
import { ControlDock } from "./control-dock";
import type { ProblemFull, Trace } from "@/lib/trace";

export type Mode = "Learn" | "Focus" | "Compare";

const MODE_LAYOUT: Record<Mode, { code: boolean; rail: boolean; narr: boolean }> = {
  // collapsed? -> true means collapsed
  Learn: { code: false, rail: false, narr: true },
  Focus: { code: true, rail: true, narr: false },
  Compare: { code: true, rail: false, narr: true },
};

export function ProblemEngine({
  problem,
  trace,
}: {
  problem: ProblemFull;
  trace: Trace;
}) {
  const { dark, toggle } = useTheme();
  const [mode, setModeState] = useState<Mode>("Learn");
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [narrOpen, setNarrOpen] = useState(true);
  const [codeW, setCodeW] = useState(330);
  const [railW, setRailW] = useState(320);
  const [approachId, setApproachId] = useState(problem.recommendedApproachId);

  const player = usePlayer(trace.steps.length, trace.keyEventIndices);
  const step = trace.steps[player.idx];
  const prevVars = trace.steps[player.idx - 1]?.vars ?? {};
  const approach = problem.approaches.find((a) => a.id === approachId) ?? problem.approaches[0];

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    setCodeCollapsed(MODE_LAYOUT[m].code);
    setRailCollapsed(MODE_LAYOUT[m].rail);
    setNarrOpen(MODE_LAYOUT[m].narr);
  }, []);

  // active preset → input values
  const activePreset = problem.presetInputs.find((p) => p.id === trace.inputId) ?? problem.presetInputs[0];
  const target = (activePreset?.value as { target?: number })?.target ?? 0;

  const maxCounters = trace.steps[trace.steps.length - 1]?.counters ?? {};

  // ── panel resize ──────────────────────────────────────────────────────────
  const resizing = useRef<null | "code" | "rail">(null);
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (resizing.current === "code") {
        setCodeW(Math.max(230, Math.min(500, e.clientX)));
      } else if (resizing.current === "rail") {
        setRailW(Math.max(250, Math.min(520, window.innerWidth - e.clientX)));
      }
    }
    function onUp() {
      resizing.current = null;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startResize(which: "code" | "rail") {
    resizing.current = which;
    document.body.style.userSelect = "none";
  }

  return (
    <TooltipProvider delay={300}>
      <div className="h-full flex flex-col">
        <TopBar problem={problem} mode={mode} setMode={setMode} dark={dark} toggleTheme={toggle} />

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Code panel */}
          <section
            className="flex-none border-r border-kn-border-0 min-h-0"
            style={{ width: codeCollapsed ? 48 : codeW }}
          >
            <CodePanel
              approach={approach}
              approaches={problem.approaches}
              onSelectApproach={setApproachId}
              currentLine={step.codeKey}
              collapsed={codeCollapsed}
              onToggleCollapse={() => setCodeCollapsed((c) => !c)}
            />
          </section>

          {!codeCollapsed && (
            <div className="w-1.5 flex-none cursor-col-resize hover:bg-kn-current/20" onMouseDown={() => startResize("code")} />
          )}

          {/* Center: stage + narration */}
          <section className="flex-1 min-w-0 flex flex-col min-h-0">
            <Stage
              visual={step.visual}
              vars={step.vars}
              target={target}
              caption={`animation stage · ${approach.primaryPrimitive} + pointers`}
            />
            <Narration
              narration={step.narration}
              lineExplanation={approach.lineExplanations[step.codeKey] ?? ""}
              open={narrOpen}
              onToggle={() => setNarrOpen((o) => !o)}
            />
          </section>

          {!railCollapsed && (
            <div className="w-1.5 flex-none cursor-col-resize hover:bg-kn-current/20" onMouseDown={() => startResize("rail")} />
          )}

          {/* Insight rail */}
          <section
            className="flex-none border-l border-kn-border-0 min-h-0"
            style={{ width: railCollapsed ? 48 : railW }}
          >
            <InsightRail
              step={step}
              prevVars={prevVars}
              idx={player.idx}
              maxCounters={maxCounters}
              budgets={approach.complexityBudget}
              slug={problem.slug}
              collapsed={railCollapsed}
              onToggleCollapse={() => setRailCollapsed((c) => !c)}
            />
          </section>
        </div>

        <ControlDock
          player={player}
          keyEventIndices={trace.keyEventIndices}
          presets={problem.presetInputs}
          activePresetId={trace.inputId}
        />
      </div>
    </TooltipProvider>
  );
}
