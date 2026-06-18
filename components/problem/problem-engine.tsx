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
import { TRACERS } from "@/lib/tracers/index";
import { validateCustomInput } from "@/lib/validators/validate-input";

export type Mode = "Learn" | "Focus" | "Compare";

const MODE_LAYOUT: Record<Mode, { code: boolean; rail: boolean; narr: boolean }> = {
  Learn:   { code: false, rail: false, narr: true },
  Focus:   { code: true,  rail: true,  narr: false },
  Compare: { code: true,  rail: false, narr: true },
};

export interface CustomInputState {
  open: boolean;
  running: boolean;
  errors: Record<string, string>;
}

export function ProblemEngine({
  problem,
  presetTraces,
}: {
  problem: ProblemFull;
  presetTraces: Record<string, Trace>;
}) {
  const { dark, toggle } = useTheme();
  const [mode, setModeState] = useState<Mode>("Learn");
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [narrOpen, setNarrOpen] = useState(true);
  const [codeW, setCodeW] = useState(330);
  const [railW, setRailW] = useState(320);
  const [approachId, setApproachId] = useState(problem.recommendedApproachId);

  // Active trace state — starts with first preset
  const firstPresetId = problem.presetInputs[0].id;
  const [activeInputId, setActiveInputId] = useState(firstPresetId);
  const [activeTrace, setActiveTrace] = useState<Trace>(() => {
    const builder = TRACERS[problem.slug]?.[problem.recommendedApproachId];
    if (builder) {
      try {
        const firstPreset = problem.presetInputs[0];
        const { steps, finalResult } = builder(firstPreset.value);
        return {
          problemSlug: problem.slug,
          approachId: problem.recommendedApproachId,
          inputId: firstPreset.id,
          steps,
          keyEventIndices: steps.filter((s) => s.isKeyEvent).map((s) => s.i),
          finalResult,
          traceVersion: "0.1.0",
        };
      } catch { /* fall through to stored trace */ }
    }
    return presetTraces[firstPresetId]!;
  });
  // traceNonce changes on every swap so usePlayer resets correctly
  const traceNonce = useRef(0);
  const [traceKey, setTraceKey] = useState(`${firstPresetId}-0`);

  // Custom input panel state
  const [customInput, setCustomInput] = useState<CustomInputState>({
    open: false,
    running: false,
    errors: {},
  });

  const player = usePlayer(activeTrace.steps.length, activeTrace.keyEventIndices, traceKey);
  const safeIdx = Math.min(player.idx, activeTrace.steps.length - 1);
  const step = activeTrace.steps[safeIdx];
  const prevVars = activeTrace.steps[safeIdx - 1]?.vars ?? {};
  const approach = problem.approaches.find((a) => a.id === approachId) ?? problem.approaches[0];

  const activePreset = problem.presetInputs.find((p) => p.id === activeInputId);
  const target = (activePreset?.value as { target?: number })?.target ?? 0;

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    setCodeCollapsed(MODE_LAYOUT[m].code);
    setRailCollapsed(MODE_LAYOUT[m].rail);
    setNarrOpen(MODE_LAYOUT[m].narr);
  }, []);

  function handleSelectApproach(id: string) {
    setApproachId(id);
    // If the preset trace bundle was built for a different approach, re-run the tracer
    const firstPreset = problem.presetInputs[0];
    const existingTrace = Object.values(presetTraces).find((t) => t.approachId === id);
    if (existingTrace) {
      swapTrace(existingTrace, existingTrace.inputId);
    } else {
      const builder = TRACERS[problem.slug]?.[id];
      if (!builder) return;
      const { steps, finalResult } = builder(firstPreset.value);
      const t: Trace = {
        problemSlug: problem.slug,
        approachId: id,
        inputId: firstPreset.id,
        steps,
        keyEventIndices: steps.filter((s) => s.isKeyEvent).map((s) => s.i),
        finalResult,
        traceVersion: "0.1.0",
      };
      swapTrace(t, firstPreset.id);
    }
  }

  function swapTrace(newTrace: Trace, newInputId: string) {
    traceNonce.current += 1;
    setActiveTrace(newTrace);
    setActiveInputId(newInputId);
    setTraceKey(`${newInputId}-${traceNonce.current}`);
  }

  function handleSelectPreset(presetId: string) {
    const preset = problem.presetInputs.find((p) => p.id === presetId);
    if (!preset) return;
    // Live tracer takes priority — always produces up-to-date steps
    const builder = TRACERS[problem.slug]?.[approachId];
    if (builder) {
      try {
        const { steps, finalResult } = builder(preset.value);
        const newTrace: Trace = {
          problemSlug: problem.slug,
          approachId,
          inputId: presetId,
          steps,
          keyEventIndices: steps.filter((s) => s.isKeyEvent).map((s) => s.i),
          finalResult,
          traceVersion: "0.1.0",
        };
        swapTrace(newTrace, presetId);
        setCustomInput((s) => ({ ...s, open: false, errors: {} }));
        return;
      } catch { /* fall through to stored trace */ }
    }
    // Fallback: use stored MongoDB trace (for problems without a registered tracer)
    const t = presetTraces[presetId];
    if (t) {
      swapTrace(t, presetId);
      setCustomInput((s) => ({ ...s, open: false, errors: {} }));
    }
  }

  function handleToggleCustomInput() {
    setCustomInput((s) => ({ ...s, open: !s.open, errors: {} }));
  }

  function handleCustomRun(raw: Record<string, string>) {
    if (!problem.inputConstraints) return;

    const validation = validateCustomInput(raw, problem.inputConstraints);
    if (!validation.ok) {
      setCustomInput((s) => ({ ...s, errors: validation.errors }));
      return;
    }

    setCustomInput((s) => ({ ...s, errors: {}, running: true }));

    // setTimeout(0) lets React render the loading state before the
    // synchronous tracer blocks the event loop
    setTimeout(() => {
      try {
        const builder = TRACERS[problem.slug]?.[problem.recommendedApproachId];
        if (!builder) throw new Error("No tracer registered for this problem.");

        const { steps, finalResult } = builder(validation.parsed);
        const customTrace: Trace = {
          problemSlug: problem.slug,
          approachId: problem.recommendedApproachId,
          inputId: "custom",
          steps,
          keyEventIndices: steps.filter((s) => s.isKeyEvent).map((s) => s.i),
          finalResult,
          traceVersion: "0.1.0",
        };
        swapTrace(customTrace, "custom");
        setCustomInput((s) => ({ ...s, running: false }));
      } catch (err) {
        setCustomInput((s) => ({
          ...s,
          running: false,
          errors: {
            _: err instanceof Error ? err.message : "Failed to generate trace.",
          },
        }));
      }
    }, 0);
  }

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
      <div className="h-full flex flex-col font-mono">
        <TopBar
          problem={problem}
          mode={mode}
          setMode={setMode}
          dark={dark}
          toggleTheme={toggle}
          approaches={problem.approaches}
          activeApproachId={approachId}
          onSelectApproach={handleSelectApproach}
        />

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Code panel */}
          <section
            className="flex-none border-r border-kn-border-0 min-h-0 relative"
            style={{ width: codeCollapsed ? 48 : codeW }}
          >
            <CodePanel
              approach={approach}
              currentLine={step.codeKey}
              collapsed={codeCollapsed}
              onToggleCollapse={() => setCodeCollapsed((c) => !c)}
            />
            {!codeCollapsed && (
              <div className="absolute top-0 right-[-6px] h-full w-3 cursor-col-resize z-10" onMouseDown={() => startResize("code")} />
            )}
          </section>

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

          {/* Insight rail */}
          <section
            className="flex-none border-l border-kn-border-0 min-h-0 relative"
            style={{ width: railCollapsed ? 48 : railW }}
          >
            {!railCollapsed && (
              <div className="absolute top-0 left-[-6px] h-full w-3 cursor-col-resize z-10" onMouseDown={() => startResize("rail")} />
            )}
            <InsightRail
              step={step}
              prevVars={prevVars}
              idx={player.idx}
              complexity={approach.complexity}
              slug={problem.slug}
              collapsed={railCollapsed}
              onToggleCollapse={() => setRailCollapsed((c) => !c)}
            />
          </section>
        </div>

        <ControlDock
          player={player}
          keyEventIndices={activeTrace.keyEventIndices}
          presets={problem.presetInputs}
          activeInputId={activeInputId}
          inputConstraints={problem.inputConstraints}
          customInput={customInput}
          onSelectPreset={handleSelectPreset}
          onToggleCustomInput={handleToggleCustomInput}
          onCustomRun={handleCustomRun}
        />
      </div>
    </TooltipProvider>
  );
}
