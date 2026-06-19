"use client";

import { useRef, useState } from "react";
import { Plus, Minus, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrayRenderer } from "./array-renderer";
import { BarContainerRenderer } from "./bar-container-renderer";
import { LinkedListRenderer } from "./linked-list-renderer";
import { RecursionRenderer } from "./recursion-renderer";
import { StackRenderer } from "./stack-renderer";
import { QueueRenderer } from "./queue-renderer";
import { HashMapRenderer } from "./hashmap-renderer";
import { TreeRenderer } from "./tree-renderer";
import { GridRenderer } from "./grid-renderer";
import { GraphRenderer } from "./graph-renderer";
import type { VisualState } from "@/lib/trace";

// ── Legend definitions per visual type ─────────────────────────────────────

const LEGENDS: Record<string, { label: string; color: string }[]> = {
  array: [
    { label: "i", color: "var(--kn-ptr-i)" },
    { label: "j", color: "var(--kn-ptr-j)" },
    { label: "lo", color: "var(--kn-ptr-lo)" },
    { label: "hi", color: "var(--kn-ptr-hi)" },
    { label: "match", color: "var(--kn-result)" },
  ],
  "bar-container": [
    { label: "lp", color: "var(--kn-ptr-lo)" },
    { label: "rp", color: "var(--kn-ptr-hi)" },
    { label: "best", color: "var(--kn-result)" },
  ],
  linkedList: [
    { label: "curr", color: "var(--kn-current)" },
    { label: "prev", color: "var(--kn-ptr-lo)" },
    { label: "result", color: "var(--kn-result)" },
  ],
  recursion: [
    { label: "active", color: "var(--kn-current)" },
    { label: "returned", color: "var(--kn-result)" },
    { label: "pending", color: "var(--kn-ptr-lo)" },
  ],
  stack: [
    { label: "top", color: "var(--kn-ptr-i)" },
    { label: "result", color: "var(--kn-result)" },
  ],
  queue: [
    { label: "front", color: "var(--kn-ptr-lo)" },
    { label: "rear", color: "var(--kn-ptr-hi)" },
  ],
  hashmap: [
    { label: "key", color: "var(--kn-special)" },
    { label: "value", color: "var(--kn-result)" },
  ],
  tree: [
    { label: "current", color: "var(--kn-current)" },
    { label: "visited", color: "var(--kn-compared)" },
    { label: "path", color: "var(--kn-gold)" },
    { label: "result", color: "var(--kn-result)" },
  ],
  grid: [
    { label: "curr", color: "var(--kn-current)" },
    { label: "frontier", color: "var(--kn-amber)" },
    { label: "visited", color: "var(--kn-surface-1)" },
    { label: "path", color: "var(--kn-gold)" },
  ],
  graph: [
    { label: "current", color: "var(--kn-current)" },
    { label: "frontier", color: "var(--kn-amber)" },
    { label: "visited", color: "var(--kn-compared)" },
    { label: "path", color: "var(--kn-gold)" },
  ],
};

// ── viewBox sizing per type ──────────────────────────────────────────────────

function getViewBox(visual: VisualState): { x: number; y: number; w: number; h: number } {
  switch (visual.type) {
    case "array": {
      const n = visual.values.length;
      const vbW = Math.max(n * 56 + 200, 520);
      return { x: -vbW / 2, y: -160, w: vbW, h: 380 };
    }
    case "bar-container": {
      const n = visual.values.length;
      const vbW = Math.max(n * 56 + 200, 520);
      return { x: -vbW / 2, y: -220, w: vbW, h: 340 };
    }
    case "linkedList": {
      const n = visual.nodes.length;
      const vbW = Math.max(n * 124 + 200, 600);
      return { x: -vbW / 2, y: -140, w: vbW, h: 360 };
    }
    case "recursion": {
      return { x: -440, y: -260, w: 880, h: 520 };
    }
    case "stack": {
      const n = visual.items.length;
      const vbH = Math.max(n * 48 + 120, 360);
      return { x: -200, y: -vbH / 2, w: 400, h: vbH };
    }
    case "queue": {
      const n = visual.items.length;
      const vbW = Math.max(n * 60 + 200, 500);
      return { x: -vbW / 2, y: -140, w: vbW, h: 280 };
    }
    case "hashmap": {
      const n = visual.entries.length;
      const vbH = Math.max(n * 44 + 100, 300);
      return { x: -200, y: -vbH / 2, w: 450, h: vbH };
    }
    case "tree": {
      return { x: -360, y: -260, w: 720, h: 520 };
    }
    case "grid": {
      const rows = visual.rows.length;
      const cols = rows > 0 ? visual.rows[0].length : 0;
      const vbW = Math.max(cols * 32 + 100, 360);
      const vbH = Math.max(rows * 32 + 100, 300);
      return { x: -vbW / 2, y: -vbH / 2, w: vbW, h: vbH };
    }
    case "graph": {
      return { x: -380, y: -280, w: 760, h: 560 };
    }
    default:
      return { x: -260, y: -180, w: 520, h: 360 };
  }
}

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

  const vb = getViewBox(visual);
  const legend = LEGENDS[visual.type] ?? [];

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
      {legend.length > 0 && (
        <div className="absolute top-2.5 right-3 z-10 flex gap-3 bg-kn-surface-0 border border-kn-border-0 rounded-lg px-3 py-1.5 text-[11px]">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-kn-ink-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}

      {/* SVG canvas */}
      <svg
        className="w-full h-full"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}
          style={{ transition: drag.current ? "none" : "transform 0.15s ease" }}
        >
          {visual.type === "array" && (
            <ArrayRenderer visual={visual} vars={vars} target={target} />
          )}
          {visual.type === "bar-container" && (
            <BarContainerRenderer visual={visual} />
          )}
          {visual.type === "linkedList" && (
            <LinkedListRenderer visual={visual} />
          )}
          {visual.type === "recursion" && (
            <RecursionRenderer visual={visual} />
          )}
          {visual.type === "stack" && (
            <StackRenderer visual={visual} />
          )}
          {visual.type === "queue" && (
            <QueueRenderer visual={visual} />
          )}
          {visual.type === "hashmap" && (
            <HashMapRenderer visual={visual} />
          )}
          {visual.type === "tree" && (
            <TreeRenderer visual={visual} />
          )}
          {visual.type === "grid" && (
            <GridRenderer visual={visual} />
          )}
          {visual.type === "graph" && (
            <GraphRenderer visual={visual} />
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
