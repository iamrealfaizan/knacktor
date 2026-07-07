"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

// Gap between the primary and an aux structure. GAP_STACK also has to leave
// room for the section label that sits in the whitespace above each aux.
const GAP_SIDE = 40;
const GAP_STACK = 30;

function isHorizontalPrimitive(type: string): boolean {
  return ["array", "bar-container", "linkedList", "queue"].includes(type);
}

function isVerticalPrimitive(type: string): boolean {
  return ["stack", "hashmap", "recursion"].includes(type);
}

/** Side-by-side vs stacked decision (unchanged rule): a horizontal primary with
 *  a single vertical aux sits side-by-side; every other combo stacks. */
function combinedMode(
  primary: LeafVisualState,
  aux: { visual: LeafVisualState }[]
): "side-by-side" | "stacked" {
  return isHorizontalPrimitive(primary.type) &&
    aux.length === 1 &&
    isVerticalPrimitive(aux[0].visual.type)
    ? "side-by-side"
    : "stacked";
}

interface AuxOffset {
  tx: number;
  ty: number;
  labelX: number;
  labelY: number;
}

interface CombinedLayout {
  viewBox: { x: number; y: number; w: number; h: number };
  mode: "side-by-side" | "stacked";
  primaryTx: number;
  primaryTy: number;
  auxOffsets: AuxOffset[];
}

/**
 * Pack the primary + aux structures from their REAL bounding boxes (measured
 * `getBBox` on the client; trimmed estimates on the SSR/first-paint fallback).
 * Because positions derive from actual content extents, structures sit close
 * together with a consistent gap, stay centered, and never overlap — and they
 * re-pack automatically when a structure grows or shrinks between steps.
 */
export function packCombinedLayout(
  mode: "side-by-side" | "stacked",
  primaryBox: Box,
  auxBoxes: Box[]
): CombinedLayout {
  const pb = primaryBox;

  if (mode === "side-by-side") {
    const ab = auxBoxes[0];
    const halfW = (pb.w + GAP_SIDE + ab.w) / 2;
    const maxH = Math.max(pb.h, ab.h);

    // Center each structure vertically at combined y=0.
    const primaryTy = -(pb.y + pb.h / 2);
    const auxTy = -(ab.y + ab.h / 2);
    // Primary left-aligned, aux right-aligned, combined centered at x=0.
    const primaryTx = -halfW - pb.x;
    const auxTx = -halfW + pb.w + GAP_SIDE - ab.x;

    const auxLeft = -halfW + pb.w + GAP_SIDE;
    return {
      viewBox: { x: -halfW, y: -maxH / 2, w: halfW * 2, h: maxH },
      mode: "side-by-side",
      primaryTx,
      primaryTy,
      auxOffsets: [
        { tx: auxTx, ty: auxTy, labelX: auxLeft, labelY: -ab.h / 2 - 8 },
      ],
    };
  }

  // Stacked: center everything horizontally at x=0, pack top→bottom by real
  // content bottoms — no per-type estimate tables, so no dead-space gaps.
  const maxW = Math.max(pb.w, ...auxBoxes.map((v) => v.w));
  const primaryCx = pb.x + pb.w / 2;

  let curY = pb.y + pb.h; // measured bottom of the primary
  const auxOffsets: AuxOffset[] = [];
  for (const ab of auxBoxes) {
    const auxTop = curY + GAP_STACK;             // aux content top sits below the gap
    const ty = auxTop - ab.y;                     // translate so ab.y lands at auxTop
    auxOffsets.push({
      tx: -(ab.x + ab.w / 2),                     // center this aux on x=0
      ty,
      labelX: -maxW / 2,                          // left-aligned label
      labelY: auxTop - 6,                         // in the whitespace just above the aux
    });
    curY = auxTop + ab.h;                          // advance to this aux's bottom
  }

  return {
    viewBox: { x: -maxW / 2, y: pb.y, w: maxW, h: curY - pb.y },
    mode: "stacked",
    primaryTx: -primaryCx,
    primaryTy: 0,
    auxOffsets,
  };
}

/**
 * Trimmed per-type content box for the pre-measurement fallback (SSR + first
 * paint). `getLeafViewBox` reserves fixed over-tall boxes for tree/graph/etc.;
 * these trims keep the fallback frame reasonable until the client re-measures
 * the real `getBBox`. Types not listed use their estimate as-is.
 */
function estimateContentBox(v: LeafVisualState): Box {
  const vb = getLeafViewBox(v);
  const TRIM: Partial<Record<string, { top: number; h: number }>> = {
    array: { top: -40, h: 120 },
    linkedList: { top: -72, h: 180 },
    queue: { top: -30, h: 110 },
    tree: { top: -40, h: 280 },
    graph: { top: -40, h: 320 },
  };
  const t = TRIM[v.type];
  return t ? { x: vb.x, y: t.top, w: vb.w, h: t.h } : vb;
}

/** Estimate-based combined layout — the SSR / first-paint fallback. The client
 *  overrides this with a measured layout after mount (see Stage). */
export function computeCombinedLayout(
  primary: LeafVisualState,
  aux: { label: string; visual: LeafVisualState }[]
): CombinedLayout {
  const mode = combinedMode(primary, aux);
  return packCombinedLayout(
    mode,
    estimateContentBox(primary),
    aux.map((a) => estimateContentBox(a.visual))
  );
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

type Box = { x: number; y: number; w: number; h: number };

const FIT_PAD = 44;
/** Ignore sub-pixel center drift so the camera doesn't jitter step-to-step. */
const CAM_DEADZONE = 8;

type Size = { w: number; h: number };
interface Camera {
  /** Auto-center translate: brings the content's center to the viewBox origin. */
  autoT: { x: number; y: number };
  /** Grow-only frame size (governs zoom); viewBox is derived, centered on origin. */
  camSize: Size;
}

/**
 * Compute the next auto-centering camera from the measured content box.
 * - `autoT` tracks the content center (so it stays centered), guarded by a
 *   deadzone so a barely-moving center doesn't cause jitter.
 * - `camSize` is GROW-ONLY per dimension: the frame only widens when content
 *   outgrows it, never snaps tighter — so the zoom level stays stable ("no
 *   breathing"). `reset()` bypasses this to snap to an exact fit.
 * Returns the previous camera unchanged when nothing moved materially.
 */
export function nextCamera(prev: Camera | null, content: Box): Camera {
  const cx = content.x + content.w / 2;
  const cy = content.y + content.h / 2;
  const wantT = { x: -cx, y: -cy };
  const needW = content.w + FIT_PAD * 2;
  const needH = content.h + FIT_PAD * 2;

  if (!prev) return { autoT: wantT, camSize: { w: needW, h: needH } };

  const moved =
    Math.abs(wantT.x - prev.autoT.x) > CAM_DEADZONE ||
    Math.abs(wantT.y - prev.autoT.y) > CAM_DEADZONE;
  const w = Math.max(prev.camSize.w, needW);
  const h = Math.max(prev.camSize.h, needH);
  const grew = w !== prev.camSize.w || h !== prev.camSize.h;

  if (!moved && !grew) return prev;
  return {
    autoT: moved ? wantT : prev.autoT,
    camSize: grew ? { w, h } : prev.camSize,
  };
}

/** viewBox derived from a grow-only frame size, centered on the origin. */
function cameraViewBox(camSize: Size): Box {
  return { x: -camSize.w / 2, y: -camSize.h / 2, w: camSize.w, h: camSize.h };
}

/** Whole-pixel equality of two combined layouts — avoids re-render churn when a
 *  re-measure yields the same geometry. */
function layoutsClose(a: CombinedLayout | null, b: CombinedLayout): boolean {
  if (!a || a.mode !== b.mode || a.auxOffsets.length !== b.auxOffsets.length) return false;
  const r = Math.round;
  const boxEq = (p: Box, q: Box) =>
    r(p.x) === r(q.x) && r(p.y) === r(q.y) && r(p.w) === r(q.w) && r(p.h) === r(q.h);
  if (!boxEq(a.viewBox, b.viewBox)) return false;
  if (r(a.primaryTx) !== r(b.primaryTx) || r(a.primaryTy) !== r(b.primaryTy)) return false;
  return a.auxOffsets.every((o, i) => {
    const p = b.auxOffsets[i];
    return r(o.tx) === r(p.tx) && r(o.ty) === r(p.ty) &&
      r(o.labelX) === r(p.labelX) && r(o.labelY) === r(p.labelY);
  });
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
  // Pointer-event gesture state: 1 active pointer = pan, 2 = pinch-zoom (touch).
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  // ── Measured combined layout ────────────────────────────────────────────
  // Positions of the primary vs aux structures come from their REAL rendered
  // size, not fixed per-type estimates. We measure each leaf's intrinsic
  // getBBox (which ignores the leaf group's own transform, so measurement is
  // independent of the applied layout — no feedback loop), then re-pack so the
  // structures sit close with a consistent gap and never overlap. The estimate
  // layout is only the first-paint fallback until this runs.
  const primaryLeafRef = useRef<SVGGElement | null>(null);
  const auxLeafRefs = useRef<(SVGGElement | null)[]>([]);
  const [measuredLayout, setMeasuredLayout] = useState<CombinedLayout | null>(null);

  useLayoutEffect(() => {
    if (visual.type !== "combined") {
      setMeasuredLayout((prev) => (prev === null ? prev : null));
      return;
    }
    const cv = visual as CombinedVisualState;
    const bboxOf = (el: SVGGElement | null): Box | null => {
      if (!el) return null;
      try {
        const b = el.getBBox();
        if (!isFinite(b.width) || b.width <= 0 || b.height <= 0) return null;
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      } catch {
        return null; // getBBox throws on a detached/hidden SVG
      }
    };
    const pBox = bboxOf(primaryLeafRef.current);
    const aBoxes = cv.aux.map((_, i) => bboxOf(auxLeafRefs.current[i]));
    if (!pBox || aBoxes.some((b) => b === null)) return; // wait for a clean read
    const next = packCombinedLayout(
      combinedMode(cv.primary, cv.aux),
      pBox,
      aBoxes as Box[]
    );
    setMeasuredLayout((prev) => (layoutsClose(prev, next) ? prev : next));
  }, [visual]);

  // ── Auto-centering camera ───────────────────────────────────────────────
  // Each step we measure the real content bbox and glide the camera so the
  // content stays CENTERED. The frame size is grow-only (zoom stays stable —
  // no "breathing"); the recenter is expressed as an animated translate on the
  // camera <g> (its transform is CSS-transitioned). Auto-centering YIELDS once
  // the user pans/zooms (manualCam) until Reset, which snaps to an exact fit.
  const contentRef = useRef<SVGGElement | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const manualCam = useRef(false);

  /** Raw world-space content box (getBBox ignores the group's own transform). */
  const measureContent = (): Box | null => {
    const el = contentRef.current;
    if (!el) return null;
    try {
      const b = el.getBBox();
      if (!isFinite(b.width) || b.width <= 0 || b.height <= 0) return null;
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    } catch {
      return null; // getBBox throws on detached/hidden SVG
    }
  };

  useLayoutEffect(() => {
    if (manualCam.current) return; // user is driving the camera — don't fight them
    const b = measureContent();
    if (!b) return;
    setCamera((prev) => nextCamera(prev, b));
    // Re-measure per step, and again after a combined re-pack settles, so the
    // camera re-centers on the final rendered content.
  }, [visual, measuredLayout]);

  // ── Custom HTML renderer bypass (D17) — skips SVG canvas entirely ─────────
  if (visual.type === "custom") {
    const cvis = visual as CustomVisualState;
    const CustomComp = CUSTOM_RENDERERS[cvis.componentKey];
    return (
      <div
        className="kn-stage-root relative flex-1 min-h-0 overflow-hidden"
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
    manualCam.current = true; // user took the camera — stop auto-centering until Reset
    const next = Math.max(0.5, Math.min(2.6, scale - e.deltaY * 0.0012));
    setScale(next);
  }
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    manualCam.current = true; // drag/pinch = manual camera control
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      pinch.current = null;
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
      drag.current = null;
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) {
        setScale(Math.max(0.5, Math.min(2.6, pinch.current.scale * (dist / pinch.current.dist))));
      }
    } else if (drag.current) {
      setPan({
        x: drag.current.px + (e.clientX - drag.current.x) / scale,
        y: drag.current.py + (e.clientY - drag.current.y) / scale,
      });
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      // pinch ended with one finger still down — resume panning from it
      const [p] = [...pointers.current.values()];
      drag.current = { x: p.x, y: p.y, px: pan.x, py: pan.y };
    } else if (pointers.current.size === 0) {
      drag.current = null;
    }
  }
  function reset() {
    setScale(1);
    setPan({ x: 0, y: 0 });
    manualCam.current = false; // re-enable auto-centering
    // Snap to an EXACT fit of the current content (allowed to shrink here only).
    const b = measureContent();
    if (b) setCamera(nextCamera(null, b));
  }

  const isCombined = visual.type === "combined";
  // Measured layout wins once available; the estimate layout is the
  // SSR/first-paint fallback until the leaves are measured.
  const layout = isCombined
    ? measuredLayout ??
      computeCombinedLayout(
        (visual as CombinedVisualState).primary,
        (visual as CombinedVisualState).aux
      )
    : null;

  // Auto-centering camera wins once measured; heuristic box is the
  // SSR/first-paint estimate (autoT is 0 until the first measure, pre-paint).
  const vb =
    camera
      ? cameraViewBox(camera.camSize)
      : isCombined ? layout!.viewBox : getLeafViewBox(visual as LeafVisualState);
  const autoT = camera?.autoT ?? { x: 0, y: 0 };

  const legendType = isCombined
    ? (visual as CombinedVisualState).primary.type
    : visual.type;
  const legend = LEGENDS[legendType] ?? [];

  return (
    <div
      className="kn-stage-root relative flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      style={{
        background: "var(--kn-stage)",
        backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* caption — truncates on narrow screens so it never runs under the legend */}
      <span className="absolute top-3 left-3 z-10 font-mono text-[9.5px] font-bold tracking-widest text-kn-ink-2 pointer-events-none uppercase max-w-[40%] lg:max-w-none truncate">
        {caption}
      </span>

      {/* legend — compact below lg */}
      {legend.length > 0 && (
        <div className="absolute top-2.5 right-3 z-10 flex gap-2 lg:gap-3 bg-kn-surface-0 border border-kn-border-0 rounded-lg px-2 py-1 lg:px-3 lg:py-1.5 text-[10px] lg:text-[11px]">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1 lg:gap-1.5 text-kn-ink-1">
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
          ref={contentRef}
          transform={`translate(${pan.x} ${pan.y}) scale(${scale}) translate(${autoT.x} ${autoT.y})`}
          style={{ transition: drag.current || pinch.current ? "none" : "transform 0.25s ease" }}
        >
          {isCombined ? (
            <>
              {/* Primary — ref carries the layout translate; getBBox on it
                  ignores that transform, giving the intrinsic content box. */}
              <g
                ref={primaryLeafRef}
                transform={`translate(${layout!.primaryTx} ${layout!.primaryTy})`}
              >
                <LeafRenderer
                  visual={(visual as CombinedVisualState).primary}
                  vars={vars}
                  target={target}
                />
              </g>

              {/* Each aux structure — no drawn divider; a left-aligned label
                  sits in the whitespace just above the structure. */}
              {(visual as CombinedVisualState).aux.map((a, i) => {
                const off = layout!.auxOffsets[i];
                return (
                  <g key={i}>
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
                      {a.label.toUpperCase()}
                    </text>
                    <g
                      ref={(el) => { auxLeafRefs.current[i] = el; }}
                      transform={`translate(${off.tx} ${off.ty})`}
                    >
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

      {/* zoom controls — +/- are desktop-only; mobile zooms via pinch */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <Button size="icon" variant="outline" onClick={() => { manualCam.current = true; setScale((s) => Math.min(2.6, s + 0.15)); }} className="max-lg:hidden h-8 w-8 border-kn-border-0 bg-kn-surface-0 touch-manipulation">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => { manualCam.current = true; setScale((s) => Math.max(0.5, s - 0.15)); }} className="max-lg:hidden h-8 w-8 border-kn-border-0 bg-kn-surface-0 touch-manipulation">
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={reset} className="h-9 w-9 lg:h-8 lg:w-8 border-kn-border-0 bg-kn-surface-0 touch-manipulation">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* zoom caption */}
      <span className="absolute bottom-3 left-3 z-10 font-mono text-[11px] text-kn-ink-2 pointer-events-none">
        {Math.round(scale * 100)}%<span className="max-lg:hidden"> · drag to pan · scroll to zoom</span>
        <span className="lg:hidden"> · pinch to zoom · drag to pan</span>
      </span>
    </div>
  );
}
