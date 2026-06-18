"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  ChevronDown, Loader2, RotateCcw, Pencil, Diamond,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Player } from "./use-player";
import type { PresetInput, InputConstraints } from "@/lib/trace";
import type { CustomInputState } from "./problem-engine";

interface ControlDockProps {
  player: Player;
  keyEventIndices: number[];
  /** step index -> semantic key-event descriptor (drives diamond tooltips) */
  keyEvents?: Record<number, { label: string; kind?: string }>;
  presets: PresetInput[];
  activeInputId: string;
  inputConstraints?: InputConstraints;
  customInput: CustomInputState;
  /** D12 — custom input is gated off until re-enabled */
  customInputEnabled?: boolean;
  onSelectPreset: (id: string) => void;
  onToggleCustomInput: () => void;
  onCustomRun: (raw: Record<string, string>) => void;
}

// key-event kind -> token-based diamond color class
const KIND_CLASS: Record<string, string> = {
  match: "bg-kn-result border-kn-result-border",
  best: "bg-kn-amber border-kn-amber-bd",
  result: "bg-kn-result border-kn-result-border",
  boundary: "bg-kn-compared border-kn-compared",
  return: "bg-kn-current border-kn-current-border",
};

export function ControlDock({
  player,
  keyEventIndices,
  keyEvents,
  presets,
  activeInputId,
  inputConstraints,
  customInput,
  customInputEnabled = false,
  onSelectPreset,
  onToggleCustomInput,
  onCustomRun,
}: ControlDockProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(inputConstraints?.fields.map((f) => [f.name, ""]) ?? [])
  );

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function seekFromEvent(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    player.seek(Math.round(f * (player.total - 1)));
  }

  // Draggable scrubber: capture the pointer and seek continuously while dragging.
  const dragging = useRef(false);
  function onTrackPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX);
  }
  function onTrackPointerMove(e: React.PointerEvent) {
    if (dragging.current) seekFromEvent(e.clientX);
  }
  function onTrackPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function handleSelectPreset(id: string) {
    setDropOpen(false);
    onSelectPreset(id);
  }

  function handleOpenCustom() {
    setDropOpen(false);
    onToggleCustomInput();
  }

  function handleFieldChange(name: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleRun() {
    onCustomRun(fieldValues);
  }

  function handleBackToPresets() {
    onSelectPreset(presets[0].id);
  }

  const isCustomActive = activeInputId === "custom";
  const activePreset = presets.find((p) => p.id === activeInputId);
  const selectorLabel = isCustomActive ? "Custom input" : (activePreset?.label ?? "Example");
  const hasConstraints = !!inputConstraints?.fields.length && customInputEnabled;
  const globalError = customInput.errors["_"];

  return (
    <footer className="flex-none border-t border-kn-border-0 bg-kn-surface-0 px-4 pt-3 pb-3 flex flex-col gap-2.5">

      {/* Scrubber (draggable) */}
      <div
        ref={trackRef}
        className="relative h-[18px] cursor-pointer select-none touch-none"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
      >
        <div className="absolute top-1.5 left-0 right-0 h-1.5 rounded bg-kn-track" />
        <div
          className="absolute top-1.5 left-0 h-1.5 rounded bg-kn-current transition-[width] duration-200"
          style={{ width: `${player.progress * 100}%` }}
        />
        {keyEventIndices.map((k) => {
          const ev = keyEvents?.[k];
          const cls = (ev?.kind && KIND_CLASS[ev.kind]) || "bg-kn-amber border-kn-amber-bd";
          return (
            <span
              key={k}
              title={ev ? `${ev.label} · step ${k + 1}` : `Key event · step ${k + 1}`}
              onPointerDown={(e) => { e.stopPropagation(); player.seek(k); }}
              className={`absolute w-2.5 h-2.5 border cursor-pointer ${cls}`}
              style={{ left: `${(k / (player.total - 1)) * 100}%`, top: 3, transform: "translateX(-50%) rotate(45deg)" }}
            />
          );
        })}
        <span
          className="absolute w-4 h-4 rounded-full bg-kn-surface-0 border-[2.5px] border-kn-current transition-[left] duration-200 pointer-events-none"
          style={{ left: `${player.progress * 100}%`, top: -1, transform: "translateX(-50%)" }}
        />
      </div>

      {/* Transport row — left/right are flex; center is absolute so it's always screen-centered */}
      <div className="relative flex items-center min-h-[44px]">

        {/* LEFT — input selector or custom input fields */}
        <div className="flex items-center gap-2 min-w-0 pr-4">

          {/* CUSTOM INPUT FIELDS — shown in place of the selector when custom is open (D12: gated off) */}
          {customInput.open && customInputEnabled ? (
            <div className="flex items-center gap-2 flex-wrap">
              {inputConstraints!.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-0.5">
                  <label className="text-[9.5px] font-semibold text-kn-ink-2 uppercase tracking-wider leading-none px-0.5">
                    {field.label}
                    {field.type === "int[]" && field.maxLen &&
                      <span className="font-normal normal-case ml-1 opacity-60">max {field.maxLen}</span>}
                  </label>
                  <input
                    type="text"
                    value={fieldValues[field.name] ?? ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRun(); }}
                    placeholder={field.placeholder}
                    disabled={customInput.running}
                    className={[
                      "h-8 px-2.5 font-mono text-[12px] rounded-lg border bg-kn-inset text-kn-ink-0",
                      "placeholder:text-kn-ink-2/40 outline-none transition-colors",
                      "focus:border-kn-current/70 disabled:opacity-50",
                      customInput.errors[field.name]
                        ? "border-red-400"
                        : "border-kn-border-0",
                      field.type === "int[]" ? "w-44" : "w-20",
                    ].join(" ")}
                  />
                  {customInput.errors[field.name] && (
                    <span className="text-[9.5px] text-red-500 leading-tight px-0.5">
                      {customInput.errors[field.name]}
                    </span>
                  )}
                </div>
              ))}

              {/* Run button */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9.5px] opacity-0 select-none leading-none">run</span>
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={customInput.running}
                  className="h-8 bg-kn-current text-white hover:bg-kn-current/90 font-semibold text-[12px] px-3 gap-1.5"
                >
                  {customInput.running
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
                    : <>Run <Play className="h-3 w-3 fill-white" /></>}
                </Button>
              </div>

              {/* Back to examples */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9.5px] opacity-0 select-none leading-none">back</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBackToPresets}
                  className="h-8 border-kn-border-0 bg-kn-inset text-kn-ink-1 text-[11px] px-2.5 gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> examples
                </Button>
              </div>

              {/* Global error */}
              {globalError && (
                <span className="text-[11px] text-red-500 self-end pb-1">
                  {globalError}
                </span>
              )}
            </div>
          ) : (
            /* PRESET SELECTOR DROPDOWN */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropOpen((o) => !o)}
                className={[
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg border font-mono text-[12px] font-semibold transition-colors whitespace-nowrap",
                  isCustomActive
                    ? "bg-kn-current/10 border-kn-current/40 text-kn-current"
                    : "bg-kn-inset border-kn-border-0 text-kn-ink-0 hover:border-kn-current/40",
                ].join(" ")}
              >
                {selectorLabel}
                <ChevronDown className={`h-3.5 w-3.5 text-kn-ink-2 transition-transform duration-150 ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown panel — floats above the dock */}
              {dropOpen && (
                <div className="absolute bottom-[calc(100%+6px)] left-0 z-50 min-w-[220px] bg-kn-surface-0 border border-kn-border-0 rounded-xl shadow-lg py-1 overflow-hidden">
                  {/* Preset options */}
                  {presets.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className={[
                        "w-full text-left px-3 py-2 text-[12.5px] flex items-center gap-2 transition-colors",
                        activeInputId === p.id && !isCustomActive
                          ? "bg-kn-current/10 text-kn-current font-semibold"
                          : "text-kn-ink-0 hover:bg-kn-surface-1",
                      ].join(" ")}
                    >
                      <span className="font-mono text-kn-ink-2 text-[11px] w-4 shrink-0">{i + 1}.</span>
                      {p.label}
                      {p.isEdgeCase && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-kn-amber border border-kn-amber/40 rounded px-1">edge</span>
                      )}
                    </button>
                  ))}

                  {/* Custom input option — only if problem supports it */}
                  {hasConstraints && (
                    <>
                      <div className="h-px bg-kn-border-0 mx-2 my-1" />
                      <button
                        onClick={handleOpenCustom}
                        className={[
                          "w-full text-left px-3 py-2 text-[12.5px] flex items-center gap-2 transition-colors",
                          isCustomActive
                            ? "bg-kn-current/10 text-kn-current font-semibold"
                            : "text-kn-ink-1 hover:bg-kn-surface-1",
                        ].join(" ")}
                      >
                        <Pencil className="h-3 w-3" />
                        Custom input…
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER — transport controls, absolutely centered to the full row */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Transport label="First" onClick={player.first}><SkipBack className="h-3.5 w-3.5" /></Transport>
          <Transport label="Prev key event (Shift+←)" onClick={() => player.jumpToKey(-1)}><Diamond className="h-3 w-3 -scale-x-100" /></Transport>
          <Transport label="Step back" onClick={player.prev}><ChevronLeft className="h-4 w-4" /></Transport>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={player.togglePlay}
                  className="w-11 h-11 rounded-full bg-kn-current text-white grid place-items-center shadow-[0_3px_10px_var(--kn-accent-soft)]"
                >
                  {player.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
              }
            />
            <TooltipContent>{player.playing ? "Pause" : "Play"} (space)</TooltipContent>
          </Tooltip>
          <Transport label="Step forward" onClick={player.next}><ChevronRight className="h-4 w-4" /></Transport>
          <Transport label="Next key event (Shift+→)" onClick={() => player.jumpToKey(1)}><Diamond className="h-3 w-3" /></Transport>
          <Transport label="Last" onClick={player.last}><SkipForward className="h-3.5 w-3.5" /></Transport>
        </div>

        {/* RIGHT — speed + step counter */}
        <div className="flex items-center gap-3 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={player.cycleSpeed}
            className="h-8 font-mono text-[12px] font-semibold border-kn-border-0 bg-kn-inset text-kn-ink-0"
          >
            {player.speed}×
          </Button>
          <span className="font-mono text-[13px] font-semibold text-kn-ink-0 whitespace-nowrap">
            Step {player.step} / {player.total}
          </span>
        </div>
      </div>

      {/* Key event caption */}
      <div className="flex items-center gap-1.5 text-[11px] text-kn-ink-2">
        <span className="w-2 h-2 bg-kn-amber border border-kn-amber-bd inline-block" style={{ transform: "rotate(45deg)" }} />
        diamonds mark key moments — hover for details · drag the bar to scrub
      </div>
    </footer>
  );
}

function Transport({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            onClick={onClick}
            className="h-8 w-8 border-kn-border-0 bg-kn-surface-0 text-kn-ink-0"
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
