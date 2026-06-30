"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
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
import type { VisualState, LeafVisualState, CombinedVisualState, CustomVisualState } from "@/lib/trace";

// ── Custom renderer registry (D17) ───────────────────────────────────────────
// Register each custom per-problem component here. Dynamic import keeps them
// out of the main bundle. Custom renderers are HTML-based and bypass the SVG canvas.
const CUSTOM_RENDERERS: Record<string, React.ComponentType<{ visual: CustomVisualState }>> = {
  "merge-two-sorted-lists": dynamic(
    () => import("./custom/merge-two-sorted-lists-visualizer"),
    { loading: () => null }
  ) as React.ComponentType<{ visual: CustomVisualState }>,
};

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

// ── viewBox sizing per leaf type ─────────────────────────────────────────────

export function getLeafViewBox(visual: LeafVisualState): { x: number; y: number; w: number; h: number } {
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

// ── Multi-structure layout (D19) ──────────────────────────────────────────────

const DIVIDER_H = 28;
const SIDE_GAP = 40;

function isHorizontalPrimitive(type: string): boolean {
  return ["array", "bar-container", "linkedList", "queue"].includes(type);
}

function isVerticalPrimitive(type: string): boolean {
  return ["stack", "hashmap", "recursion"].includes(type);
}

interface AuxOffset {
  tx: number;
  ty: number;
  /** y-coord of horizontal divider line (stacked) or x-coord of vertical divider line (side-by-side) */
  dividerCoord: number;
  labelX: number;
  labelY: number;
  label: string;
}

interface CombinedLayout {
  viewBox: { x: number; y: number; w: number; h: number };
  mode: "side-by-side" | "stacked";
  primaryTx: number;
  primaryTy: number;
  auxOffsets: AuxOffset[];
}

export function computeCombinedLayout(
  primary: LeafVisualState,
  aux: { label: string; visual: LeafVisualState }[]
): CombinedLayout {
  const pvb = getLeafViewBox(primary);
  const avbs = aux.map((a) => getLeafViewBox(a.visual));

  const sideBySide =
    isHorizontalPrimitive(primary.type) &&
    aux.length === 1 &&
    isVerticalPrimitive(aux[0].visual.type);

  if (sideBySide) {
    const avb = avbs[0];
    const halfW = (pvb.w + SIDE_GAP + avb.w) / 2;
    const maxH = Math.max(pvb.h, avb.h);

    // Center each component vertically at combined y=0
    const primaryTy = -(pvb.y + pvb.h / 2);
    const auxTy = -(avb.y + avb.h / 2);

    // Place primary left-aligned, aux right-aligned, combined centered at x=0
    const primaryTx = -halfW - pvb.x;
    const auxTx = -halfW + pvb.w + SIDE_GAP - avb.x;

    const dividerX = -halfW + pvb.w + SIDE_GAP / 2;
    // Label centered over aux area, near the top of the combined viewBox
    const auxAreaCenterX = -halfW + pvb.w + SIDE_GAP + avb.w / 2;

    return {
      viewBox: { x: -halfW, y: -maxH / 2, w: halfW * 2, h: maxH },
      mode: "side-by-side",
      primaryTx,
      primaryTy,
      auxOffsets: [
        {
          tx: auxTx,
          ty: auxTy,
          dividerCoord: dividerX,
          labelX: auxAreaCenterX,
          labelY: -maxH / 2 + 14,
          label: aux[0].label,
        },
      ],
    };
  }

  // Stacked: center everything at x=0, stack top-to-bottom.
  // Use per-type content bounds (not full viewbox bounds) to avoid large dead-space gaps.
  const primaryCx = pvb.x + pvb.w / 2;
  const maxW = Math.max(pvb.w, ...avbs.map((v) => v.w));

  // Content bottom: where actual rendered content ends (not viewbox bottom).
  const CONTENT_BOTTOM: Partial<Record<string, number>> = {
    linkedList: 100, array: 80, stack: 80, queue: 44,
  };
  // Content top: where actual rendered content starts inside the aux viewbox.
  const CONTENT_TOP: Partial<Record<string, number>> = {
    array: -36, linkedList: -70, stack: -24, queue: -24,
  };

  let curY = CONTENT_BOTTOM[primary.type] ?? (pvb.y + pvb.h);
  const auxOffsets: AuxOffset[] = [];

  for (let i = 0; i < aux.length; i++) {
    const avb = avbs[i];
    const auxCx = avb.x + avb.w / 2;
    const contentTop = CONTENT_TOP[aux[i].visual.type] ?? avb.y;
    const dividerCoord = curY + DIVIDER_H / 2;
    const ty = curY + DIVIDER_H - contentTop;
    auxOffsets.push({
      tx: -auxCx,
      ty,
      dividerCoord,
      labelX: -maxW / 2 + 12,
      labelY: dividerCoord - 6,
      label: aux[i].label,
    });
    curY = ty + avb.y + avb.h;
  }

  return {
    viewBox: { x: -maxW / 2, y: pvb.y, w: maxW, h: curY - pvb.y },
    mode: "stacked",
    primaryTx: -primaryCx,
    primaryTy: 0,
    auxOffsets,
  };
}

// ── Render a single leaf primitive (SVG elements) ─────────────────────────────

export function LeafRenderer({
  visual,
  vars,
  target,
}: {
  visual: LeafVisualState;
  vars: Record<string, unknown>;
  target: number;
}) {
  if (visual.type === "array")        return <ArrayRenderer visual={visual} vars={vars} target={target} />;
  if (visual.type === "bar-container") return <BarContainerRenderer visual={visual} />;
  if (visual.type === "linkedList")   return <LinkedListRenderer visual={visual} />;
  if (visual.type === "recursion")    return <RecursionRenderer visual={visual} />;
  if (visual.type === "stack")        return <StackRenderer visual={visual} />;
  if (visual.type === "queue")        return <QueueRenderer visual={visual} />;
  if (visual.type === "hashmap")      return <HashMapRenderer visual={visual} />;
  if (visual.type === "tree")         return <TreeRenderer visual={visual} />;
  if (visual.type === "grid")         return <GridRenderer visual={visual} />;
  if (visual.type === "graph")        return <GraphRenderer visual={visual} />;
  return null;
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

  // ── Custom HTML renderer bypass (D17) — skips SVG canvas entirely ─────────
  if (visual.type === "custom") {
    const cvis = visual as CustomVisualState;
    const CustomComp = CUSTOM_RENDERERS[cvis.componentKey];
    return (
      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        style={{
          background: "var(--kn-stage)",
          backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <span className="absolute top-3 left-3 z-10 font-mono text-[9.5px] font-bold tracking-widest text-kn-ink-2 pointer-events-none uppercase">
          {caption}
        </span>
        <div className="w-full h-full flex items-center justify-center p-8">
          {CustomComp
            ? <CustomComp visual={cvis} />
            : <span className="text-kn-ink-2 text-sm font-mono">Renderer not found: {cvis.componentKey}</span>
          }
        </div>
      </div>
    );
  }

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

  const isCombined = visual.type === "combined";
  const combinedLayout = isCombined
    ? computeCombinedLayout(
        (visual as CombinedVisualState).primary,
        (visual as CombinedVisualState).aux
      )
    : null;

  const vb = isCombined
    ? combinedLayout!.viewBox
    : getLeafViewBox(visual as LeafVisualState);

  const legendType = isCombined
    ? (visual as CombinedVisualState).primary.type
    : visual.type;
  const legend = LEGENDS[legendType] ?? [];

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
          {isCombined ? (
            <>
              {/* Primary */}
              <g transform={`translate(${combinedLayout!.primaryTx} ${combinedLayout!.primaryTy})`}>
                <LeafRenderer
                  visual={(visual as CombinedVisualState).primary}
                  vars={vars}
                  target={target}
                />
              </g>

              {/* Each aux structure with divider */}
              {(visual as CombinedVisualState).aux.map((a, i) => {
                const off = combinedLayout!.auxOffsets[i];
                const lyt = combinedLayout!;
                return (
                  <g key={i}>
                    {lyt.mode === "stacked" && (
                      <>
                        <line
                          x1={lyt.viewBox.x}
                          y1={off.dividerCoord}
                          x2={lyt.viewBox.x + lyt.viewBox.w}
                          y2={off.dividerCoord}
                          stroke="var(--kn-border-0)"
                          strokeWidth={1}
                        />
                        <text
                          x={off.labelX}
                          y={off.labelY}
                          fill="var(--kn-ink-2)"
                          fontSize={10}
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="700"
                          letterSpacing="0.1em"
                          textAnchor="start"
                        >
                          {off.label.toUpperCase()}
                        </text>
                      </>
                    )}
                    {lyt.mode === "side-by-side" && (
                      <>
                        <line
                          x1={off.dividerCoord}
                          y1={lyt.viewBox.y}
                          x2={off.dividerCoord}
                          y2={lyt.viewBox.y + lyt.viewBox.h}
                          stroke="var(--kn-border-0)"
                          strokeWidth={1}
                        />
                        <text
                          x={off.labelX}
                          y={off.labelY}
                          fill="var(--kn-ink-2)"
                          fontSize={10}
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="700"
                          letterSpacing="0.1em"
                          textAnchor="middle"
                        >
                          {off.label.toUpperCase()}
                        </text>
                      </>
                    )}
                    <g transform={`translate(${off.tx} ${off.ty})`}>
                      <LeafRenderer visual={a.visual} vars={vars} target={target} />
                    </g>
                  </g>
                );
              })}
            </>
          ) : (
            <LeafRenderer visual={visual as LeafVisualState} vars={vars} target={target} />
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
