"use client";

import { useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Player } from "./use-player";
import type { PresetInput } from "@/lib/trace";

export function ControlDock({
  player,
  keyEventIndices,
  presets,
  activePresetId,
}: {
  player: Player;
  keyEventIndices: number[];
  presets: PresetInput[];
  activePresetId: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activePreset = presets.find((p) => p.id === activePresetId);

  function seekFromEvent(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    player.seek(Math.round(f * (player.total - 1)));
  }

  return (
    <footer className="flex-none border-t border-kn-border-0 bg-kn-surface-0 px-4 pt-3 pb-3 flex flex-col gap-2.5">
      {/* Scrubber */}
      <div
        ref={trackRef}
        className="relative h-[18px] cursor-pointer"
        onMouseDown={(e) => seekFromEvent(e.clientX)}
      >
        <div className="absolute top-1.5 left-0 right-0 h-1.5 rounded bg-kn-track" />
        <div
          className="absolute top-1.5 left-0 h-1.5 rounded bg-kn-current transition-[width] duration-200"
          style={{ width: `${player.progress * 100}%` }}
        />
        {keyEventIndices.map((k) => (
          <span
            key={k}
            title={`Key event · step ${k + 1}`}
            onMouseDown={(e) => { e.stopPropagation(); player.seek(k); }}
            className="absolute w-2.5 h-2.5 bg-kn-amber border border-kn-amber-bd"
            style={{ left: `${(k / (player.total - 1)) * 100}%`, top: 3, transform: "translateX(-50%) rotate(45deg)" }}
          />
        ))}
        <span
          className="absolute w-4 h-4 rounded-full bg-kn-surface-0 border-[2.5px] border-kn-current transition-[left] duration-200"
          style={{ left: `${player.progress * 100}%`, top: -1, transform: "translateX(-50%)" }}
        />
      </div>

      {/* Transport row */}
      <div className="flex items-center gap-3">
        {/* Example selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-kn-ink-0 border border-kn-border-0 rounded-lg bg-kn-inset px-2.5 py-1.5">
            {activePreset?.label ?? "Example 1"}
          </span>
          <button className="text-[11px] text-kn-ink-2 hover:text-kn-ink-0 flex items-center gap-0.5" title="Custom input (coming in M1.5)">
            <Plus className="h-3 w-3" /> custom input
          </button>
        </div>

        {/* Center transport */}
        <div className="flex items-center gap-2 mx-auto">
          <Transport label="First" onClick={player.first}><SkipBack className="h-3.5 w-3.5" /></Transport>
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
          <Transport label="Last" onClick={player.last}><SkipForward className="h-3.5 w-3.5" /></Transport>
        </div>

        {/* Right: speed + counter */}
        <div className="flex items-center gap-3">
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

      {/* caption */}
      <div className="flex items-center gap-1.5 text-[11px] text-kn-ink-2">
        <span className="w-2 h-2 bg-kn-amber border border-kn-amber-bd inline-block" style={{ transform: "rotate(45deg)" }} />
        diamonds jump to key events — matches &amp; appended answers
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
          <Button size="icon" variant="outline" onClick={onClick} className="h-8 w-8 border-kn-border-0 bg-kn-surface-0 text-kn-ink-0">
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
