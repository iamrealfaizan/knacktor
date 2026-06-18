"use client";

import { useRef, useState } from "react";
import { Plus, Minus, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrayRenderer } from "./array-renderer";
import { BarContainerRenderer } from "./bar-container-renderer";
import type { VisualState } from "@/lib/trace";

const ARRAY_LEGEND = [
  { label: "i", color: "var(--kn-ptr-i)" },
  { label: "j", color: "var(--kn-ptr-j)" },
  { label: "lo", color: "var(--kn-ptr-lo)" },
  { label: "hi", color: "var(--kn-ptr-hi)" },
  { label: "match", color: "var(--kn-result)" },
];

const BAR_CONTAINER_LEGEND = [
  { label: "lp", color: "var(--kn-ptr-lo)" },
  { label: "rp", color: "var(--kn-ptr-hi)" },
  { label: "best", color: "var(--kn-result)" },
];

export function Stage({
  visual,
  vars,
  target,
  caption,
}: {
  visual: VisualState;
  vars: Record<string, unknown>;
  target: number;
  caption: string;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  function onWheel(e: React.WheelEvent) {
    const next = Math.max(0.5, Math.min(2.6, scale - e.deltaY * 0.0012));
    setScale(next);
  }
  function onDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }
  function onMove(e: React.MouseEvent) {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.x) / scale,
      y: drag.current.py + (e.clientY - drag.current.y) / scale,
    });
  }
  function onUp() { drag.current = null; }
  function reset() { setScale(1); setPan({ x: 0, y: 0 }); }

  const n = (visual.type === "array" || visual.type === "bar-container") ? visual.values.length : 6;
  const vbW = Math.max(n * 56 + 200, 520);
  const legend = visual.type === "bar-container" ? BAR_CONTAINER_LEGEND : ARRAY_LEGEND;

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        background: "var(--kn-stage)",
        backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
      onWheel={onWheel}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      {/* caption */}
      <span className="absolute top-3 left-3 z-10 font-mono text-[9.5px] font-bold tracking-widest text-kn-ink-2 pointer-events-none uppercase">
        {caption}
      </span>

      {/* legend */}
      <div className="absolute top-2.5 right-3 z-10 flex gap-3 bg-kn-surface-0 border border-kn-border-0 rounded-lg px-3 py-1.5 text-[11px]">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-kn-ink-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* SVG canvas */}
      <svg
        className="w-full h-full"
        viewBox={`${-vbW / 2} ${visual.type === "bar-container" ? -220 : -160} ${vbW} ${visual.type === "bar-container" ? 340 : 380}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`} style={{ transition: drag.current ? "none" : "transform 0.15s ease" }}>
          {visual.type === "array" && (
            <ArrayRenderer visual={visual} vars={vars} target={target} />
          )}
          {visual.type === "bar-container" && (
            <BarContainerRenderer visual={visual} />
          )}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <Button size="icon" variant="outline" onClick={() => setScale((s) => Math.min(2.6, s + 0.15))} className="h-8 w-8 border-kn-border-0 bg-kn-surface-0">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setScale((s) => Math.max(0.5, s - 0.15))} className="h-8 w-8 border-kn-border-0 bg-kn-surface-0">
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={reset} className="h-8 w-8 border-kn-border-0 bg-kn-surface-0">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* zoom caption */}
      <span className="absolute bottom-3 left-3 z-10 font-mono text-[11px] text-kn-ink-2 pointer-events-none">
        {Math.round(scale * 100)}% · drag to pan · scroll to zoom
      </span>
    </div>
  );
}
