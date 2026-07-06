"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePlayer } from "./use-player";
import { TopBar } from "./top-bar";
import { CodePanel } from "./code-panel";
import { Stage } from "./stage";
import { Narration } from "./narration";
import {
  InsightRail,
  VariablesSection,
  ComplexitySection,
  ResultSection,
  CallStackSection,
  NotesSection,
} from "./insight-rail";
import { ControlDock } from "./control-dock";
import type { ProblemFull, Trace } from "@/lib/trace";
import { CUSTOM_INPUT_ENABLED } from "@/lib/flags";

/** True on desktop (>= lg). Defaults to true for SSR so the flagship desktop
 *  layout renders without a flash; corrects on mount for narrow viewports (D14). */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/** Per-trace ordered variable registry: union of var names in first-seen order. */
function buildVarOrder(trace: Trace): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const s of trace.steps) {
    for (const k of Object.keys(s.vars)) {
      if (!seen.has(k)) { seen.add(k); order.push(k); }
    }
  }
  return order;
}

/** Step index -> key-event descriptor, for labeled scrubber diamonds. */
function buildKeyEvents(trace: Trace): Record<number, { label: string; kind?: string }> {
  const map: Record<number, { label: string; kind?: string }> = {};
  for (const s of trace.steps) {
    if (s.isKeyEvent && s.keyEvent) map[s.i] = s.keyEvent;
  }
  return map;
}

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
  approachTraces: initialApproachTraces,
}: {
  problem: ProblemFull;
  /** approachId -> (inputId -> precomputed Python trace). The server ships
   *  only the recommended approach; others lazy-load on first selection. */
  approachTraces: Record<string, Record<string, Trace>>;
}) {
  const isDesktop = useIsDesktop();
  const [mode, setModeState] = useState<Mode>("Learn");
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [narrOpen, setNarrOpen] = useState(true);
  const [codeW, setCodeW] = useState(330);
  const [railW, setRailW] = useState(320);
  const [approachId, setApproachId] = useState(problem.recommendedApproachId);

  // Trace cache: seeded with the server-shipped recommended approach; other
  // approaches fetched once from /api/problems/[slug]/traces and kept here.
  const [approachTraces, setApproachTraces] =
    useState<Record<string, Record<string, Trace>>>(initialApproachTraces);
  const [approachLoading, setApproachLoading] = useState<string | null>(null);

  // Resolve a precomputed trace for (approach, input); fall back to that
  // approach's first available trace.
  const traceFor = useCallback(
    (aId: string, inputId: string): Trace | undefined => {
      const byInput = approachTraces[aId] ?? {};
      return byInput[inputId] ?? Object.values(byInput)[0];
    },
    [approachTraces]
  );

  // Active trace state — starts with the recommended approach's first preset
  const firstPresetId = problem.presetInputs[0].id;
  const [activeInputId, setActiveInputId] = useState(firstPresetId);
  const [activeTrace, setActiveTrace] = useState<Trace>(
    () => traceFor(problem.recommendedApproachId, firstPresetId)!
  );
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

  const varOrder = useMemo(() => buildVarOrder(activeTrace), [activeTrace]);
  const keyEvents = useMemo(() => buildKeyEvents(activeTrace), [activeTrace]);

  const activePreset = problem.presetInputs.find((p) => p.id === activeInputId);
  const target = (activePreset?.value as { target?: number })?.target ?? 0;

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    setCodeCollapsed(MODE_LAYOUT[m].code);
    setRailCollapsed(MODE_LAYOUT[m].rail);
    setNarrOpen(MODE_LAYOUT[m].narr);
  }, []);

  function swapTrace(newTrace: Trace, newInputId: string) {
    traceNonce.current += 1;
    setActiveTrace(newTrace);
    setActiveInputId(newInputId);
    setTraceKey(`${newInputId}-${traceNonce.current}`);
  }

  async function handleSelectApproach(id: string) {
    // Already cached (recommended approach, or previously fetched) → instant.
    if (approachTraces[id]) {
      setApproachId(id);
      const t = traceFor(id, activeInputId);
      if (t) swapTrace(t, t.inputId);
      return;
    }
    // Lazy-load this approach's preset traces (shipped separately from the page).
    setApproachLoading(id);
    try {
      const res = await fetch(
        `/api/problems/${problem.slug}/traces?approachId=${encodeURIComponent(id)}`
      );
      if (!res.ok) throw new Error(`traces fetch failed: ${res.status}`);
      const { data } = (await res.json()) as { data: Record<string, Trace> };
      if (!data || Object.keys(data).length === 0) throw new Error("no traces");
      setApproachTraces((prev) => ({ ...prev, [id]: data }));
      setApproachId(id);
      const byInput = data;
      const t = byInput[activeInputId] ?? Object.values(byInput)[0];
      if (t) swapTrace(t, t.inputId);
    } catch (err) {
      console.error("[approach switch]", err);
    } finally {
      setApproachLoading(null);
    }
  }

  function handleSelectPreset(presetId: string) {
    const t = traceFor(approachId, presetId);
    if (t) {
      swapTrace(t, presetId);
      setCustomInput((s) => ({ ...s, open: false, errors: {} }));
    }
  }

  function handleToggleCustomInput() {
    setCustomInput((s) => ({ ...s, open: !s.open, errors: {} }));
  }

  // Custom input is deferred (D12); the UI is gated off behind CUSTOM_INPUT_ENABLED.
  // This handler stays as a stub so re-enabling is a one-line flag flip + wiring a
  // sandboxed /api/trace call here.
  function handleCustomRun(_raw: Record<string, string>) {
    setCustomInput((s) => ({ ...s, errors: { _: "Custom input is temporarily disabled." } }));
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
          approaches={problem.approaches}
          activeApproachId={approachId}
          loadingApproachId={approachLoading}
          onSelectApproach={handleSelectApproach}
        />

        {isDesktop ? (
          /* Body — canonical desktop no-scroll 3-column loop (unchanged) */
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
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
                varOrder={varOrder}
                varColors={approach.varColors}
                resultSpec={approach.resultSpec}
              />
            </section>
          </div>
        ) : (
          /* Body — mobile stacked layout (D14): PINNED stage → scrollable content
             column. Mode switching lives in the ⋮ overflow sheet, so the stage
             gets that vertical space. The dock below stays pinned by flex. */
          <>
            {/* Pinned stage — fluid: compact clamp in Learn/Compare, fills in Focus */}
            <div
              className={
                mode === "Focus"
                  ? "flex-1 min-h-0 flex flex-col"
                  : "flex-none h-[clamp(12rem,34dvh,22rem)] flex flex-col"
              }
            >
              <Stage
                visual={step.visual}
                vars={step.vars}
                target={target}
                caption={`animation stage · ${approach.primaryPrimitive} + pointers`}
              />
            </div>

            {/* Scroll body — hidden in Focus (stage-only, matching desktop Focus semantics).
                Compare lanes: when dual-lane Compare lands (CompareAndResponsive.md §2.4),
                this column becomes two stacked lane blocks; single-lane until then. */}
            {mode !== "Focus" && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain cs-scroll flex flex-col bg-kn-surface-0">
                <Narration
                  narration={step.narration}
                  lineExplanation={approach.lineExplanations[step.codeKey] ?? ""}
                  open
                  onToggle={() => {}}
                />
                <div className="border-t border-kn-border-0">
                  <VariablesSection
                    step={step}
                    prevVars={prevVars}
                    idx={player.idx}
                    varOrder={varOrder}
                    varColors={approach.varColors}
                  />
                  <ResultSection step={step} resultSpec={approach.resultSpec} />
                  <CallStackSection step={step} />
                </div>
                <div className="border-t border-kn-border-0">
                  <CodePanel
                    approach={approach}
                    currentLine={step.codeKey}
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    mobileExplanation={
                      approach.syntaxExplanations?.[step.codeKey] ??
                      approach.lineExplanations[step.codeKey] ??
                      ""
                    }
                  />
                </div>
                <div className="border-t border-kn-border-0">
                  <ComplexitySection complexity={approach.complexity} />
                  <NotesSection slug={problem.slug} grow={false} />
                </div>
              </div>
            )}
          </>
        )}

        <ControlDock
          player={player}
          keyEventIndices={activeTrace.keyEventIndices}
          keyEvents={keyEvents}
          presets={problem.presetInputs}
          activeInputId={activeInputId}
          inputConstraints={problem.inputConstraints}
          customInput={customInput}
          customInputEnabled={CUSTOM_INPUT_ENABLED}
          onSelectPreset={handleSelectPreset}
          onToggleCustomInput={handleToggleCustomInput}
          onCustomRun={handleCustomRun}
        />
      </div>
    </TooltipProvider>
  );
}
