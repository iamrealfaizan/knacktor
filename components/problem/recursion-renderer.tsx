"use client";

// Recursion / Call Stack renderer — per SimulationRules B-13 / B-14.
//
// Two synchronized views side by side:
//   LEFT  — Call Stack (B-14): stacked frames, newest on top, TOS brighter + halo.
//   RIGHT — Recursion Tree (B-13): rounded rects ~120×40, built incrementally
//           DFS left→right (shared layoutTidyTree); on return, a green value
//           chip rises up the edge toward the parent.
//
// Panel positions are MEASURED from the tree layout extents (the old fixed
// translate(-220)/translate(60) offsets let wide trees overlap the stack).

import type { RecursionVisualState, CallFrame } from "@/lib/trace";
import { MOTION } from "./shared/motion";
import { layoutTidyTree } from "./shared/layout-tidy-tree";
import { PopIn } from "./shared/atoms";

// Call Stack (B-14): "full-width rounded rect ~64px tall"
const FRAME_W = 180;
const FRAME_H = 64;
const FRAME_GAP = 4;
const FRAME_R = 8;

// Recursion Tree (B-13): "rounded rect ~120×40 (two-line: fib(5) then → 5 on return)"
const NODE_W = 120;
const NODE_H = 40;
const NODE_R = 8;
const TREE_H_GAP = 20;   // horizontal gap between sibling nodes
const TREE_LEVEL_H = 80; // vertical distance between levels
const PANEL_GAP = 70;    // gap between call stack and tree panels

// ─────────────────────────────────────────────────────────────────────────────

export function RecursionRenderer({ visual }: { visual: RecursionVisualState }) {
  const { frames, treeEdges = [] } = visual;

  // Tree layout via the shared tidy-tree (n-ary children from treeEdges).
  const childrenMap: Record<string, string[]> = {};
  treeEdges.forEach((e) => {
    (childrenMap[e.from] ??= []).push(e.to);
  });
  const tidyNodes = frames.map((f) => ({ id: f.id, children: childrenMap[f.id] ?? [] }));
  const { nodes: layout, minY: treeMinY } = layoutTidyTree(tidyNodes, {
    leafSpan: NODE_W + TREE_H_GAP,
    levelGap: TREE_LEVEL_H,
  });

  const frameMap: Record<string, CallFrame> = {};
  frames.forEach((f) => { frameMap[f.id] = f; });

  // Measured extents → panel positions that never overlap.
  const treeHalfW = layout.length
    ? Math.max(...layout.map((n) => Math.abs(n.x))) + NODE_W / 2
    : NODE_W / 2;
  const stackCx = -(treeHalfW + PANEL_GAP + FRAME_W / 2);
  const stackTotalH = frames.length * (FRAME_H + FRAME_GAP);
  const labelY = Math.min(treeMinY - NODE_H / 2, -stackTotalH / 2) - 34;

  return (
    <g>
      {/* Call Stack — left panel */}
      <g transform={`translate(${stackCx}, 0)`}>
        <PanelLabel text="CALL STACK" y={labelY} />
        <CallStackView frames={frames} />
      </g>

      {/* Recursion Tree — right panel (layout already centered at x=0) */}
      <g>
        <PanelLabel text="RECURSION TREE" y={labelY} />
        <RecursionTreeView layout={layout} frameMap={frameMap} edges={treeEdges} />
      </g>
    </g>
  );
}

// ── Call Stack ────────────────────────────────────────────────────────────────

function CallStackView({ frames }: { frames: CallFrame[] }) {
  // frames[0]=bottom, frames[n-1]=TOS — render reversed so TOS is at the top visually
  const reversed = [...frames].reverse();
  const totalH = frames.length * (FRAME_H + FRAME_GAP);

  return (
    <g transform={`translate(0, ${-totalH / 2 + 20})`}>
      {/* Dashed container outline (open at top) */}
      <rect
        x={-FRAME_W / 2 - 8}
        y={-10}
        width={FRAME_W + 16}
        height={totalH + 18}
        rx={10}
        fill="none"
        stroke="var(--kn-border-0)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.55}
      />
      <text
        x={0}
        y={-22}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--kn-ink-2)"
        letterSpacing={2}
      >
        ▲ TOS
      </text>

      {reversed.map((frame, vi) => {
        const isCurrent = frame.isCurrent;
        const hasReturn = frame.returnValue !== null && frame.returnValue !== undefined;
        const y = vi * (FRAME_H + FRAME_GAP);

        return (
          <g
            key={frame.id}
            transform={`translate(0, ${y})`}
            style={{ transition: MOTION.glide }}
          >
            {/* Push entrance (B-14): frame slides in from the top with spring */}
            <g className="kn-anim-stack-push">
            {/* Halo ring on TOS */}
            {isCurrent && (
              <rect
                x={-FRAME_W / 2 - 4}
                y={-4}
                width={FRAME_W + 8}
                height={FRAME_H + 8}
                rx={FRAME_R + 3}
                fill="none"
                stroke="var(--kn-current)"
                strokeWidth={1.5}
                opacity={0.4}
              />
            )}

            {/* Frame body */}
            <rect
              x={-FRAME_W / 2}
              y={0}
              width={FRAME_W}
              height={FRAME_H}
              rx={FRAME_R}
              fill={isCurrent ? "var(--kn-current-subtle)" : "var(--kn-surface-1)"}
              stroke={isCurrent ? "var(--kn-current)" : "var(--kn-border-0)"}
              strokeWidth={isCurrent ? 2 : 1.5}
              opacity={isCurrent ? 1 : 0.72}
              style={{ transition: "fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease" }}
            />

            {/* Function call label */}
            <text
              x={0}
              y={hasReturn ? FRAME_H / 2 - 10 : FRAME_H / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fontWeight={isCurrent ? 700 : 500}
              fill={isCurrent ? "var(--kn-current)" : "var(--kn-ink-0)"}
            >
              {frame.label}
            </text>

            {/* Return value (green, second line) */}
            {hasReturn && (
              <text
                x={0}
                y={FRAME_H / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fontWeight={600}
                fill="var(--kn-result)"
              >
                → {String(frame.returnValue)}
              </text>
            )}
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ── Recursion Tree ────────────────────────────────────────────────────────────

interface TreeLayoutNode {
  id: string;
  x: number;
  y: number;
}

function RecursionTreeView({
  layout,
  frameMap,
  edges,
}: {
  layout: TreeLayoutNode[];
  frameMap: Record<string, CallFrame>;
  edges: { from: string; to: string }[];
}) {
  const nodeMap: Record<string, TreeLayoutNode> = {};
  layout.forEach((n) => { nodeMap[n.id] = n; });

  return (
    <g>
      {/* Edges first — <path> per SimulationRules A-1 */}
      {edges.map((e) => {
        const from = nodeMap[e.from];
        const to = nodeMap[e.to];
        if (!from || !to) return null;
        // Connect bottom-center of parent rect to top-center of child rect
        const x1 = from.x;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y - NODE_H / 2;
        return (
          <path
            key={`te-${e.from}-${e.to}`}
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            pathLength={1}
            className="kn-anim-draw-in"
            stroke="var(--kn-border-1)"
            strokeWidth={1.5}
            fill="none"
          />
        );
      })}

      {/* Nodes — rounded rect ~120×40 per B-13; PopIn = incremental unfold */}
      {layout.map((n) => {
        const f = frameMap[n.id];
        const isCurrent = f?.isCurrent;
        const hasReturn = f?.returnValue !== null && f?.returnValue !== undefined;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            style={{ transition: MOTION.glide }}
          >
            <PopIn>
            {/* Cursor ring for active node */}
            {isCurrent && (
              <rect
                x={-NODE_W / 2 - 4}
                y={-NODE_H / 2 - 4}
                width={NODE_W + 8}
                height={NODE_H + 8}
                rx={NODE_R + 3}
                fill="none"
                stroke="var(--kn-current)"
                strokeWidth={2}
                opacity={0.4}
                className="kn-anim-cursor-ring"
              />
            )}

            {/* Node body */}
            <rect
              x={-NODE_W / 2}
              y={-NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={NODE_R}
              fill={
                hasReturn
                  ? "var(--kn-result-subtle)"
                  : isCurrent
                  ? "var(--kn-current-subtle)"
                  : "var(--kn-surface-0)"
              }
              stroke={
                hasReturn
                  ? "var(--kn-result)"
                  : isCurrent
                  ? "var(--kn-current)"
                  : "var(--kn-border-1)"
              }
              strokeWidth={isCurrent || hasReturn ? 2.5 : 1.5}
              style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
            />

            {/* Function label (line 1) */}
            <text
              x={0}
              y={hasReturn ? -5 : 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fontWeight={isCurrent ? 700 : 500}
              fill={isCurrent ? "var(--kn-current)" : "var(--kn-ink-0)"}
            >
              {f?.label && f.label.length > 12 ? f.label.slice(0, 11) + "…" : f?.label}
            </text>

            {/* Return value (line 2, green — per B-13 "→ 5 on return") */}
            {hasReturn && (
              <text
                x={0}
                y={10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fontWeight={700}
                fill="var(--kn-result)"
              >
                → {String(f.returnValue)}
              </text>
            )}
            </PopIn>
          </g>
        );
      })}

      {/* Return chips (B-13): when a frame returns, its value chip mounts at
          the edge midpoint and RISES toward the parent's pending slot. Keyed by
          id+value so it fires exactly once per return. */}
      {edges.map((e) => {
        const child = nodeMap[e.to];
        const parent = nodeMap[e.from];
        const f = frameMap[e.to];
        if (!child || !parent || !f) return null;
        const hasReturn = f.returnValue !== null && f.returnValue !== undefined;
        if (!hasReturn) return null;
        const midX = (child.x + parent.x) / 2;
        const midY = (child.y - NODE_H / 2 + parent.y + NODE_H / 2) / 2;
        const label = `→ ${String(f.returnValue)}`;
        const w = Math.max(30, label.length * 7 + 12);
        return (
          <g key={`ret-${e.to}-${String(f.returnValue)}`} transform={`translate(${midX}, ${midY})`}>
            <g className="kn-anim-return-chip">
              <rect x={-w / 2} y={-10} width={w} height={20} rx={10}
                fill="var(--kn-result-subtle)" stroke="var(--kn-result)" strokeWidth={1.5} />
              <text
                x={0} y={1}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="var(--font-mono)" fontSize={10} fontWeight={700}
                fill="var(--kn-result)"
              >
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────

function PanelLabel({ text, y }: { text: string; y: number }) {
  return (
    <text
      x={0}
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-mono)"
      fontSize={10}
      fontWeight={700}
      letterSpacing={1.5}
      fill="var(--kn-ink-2)"
    >
      {text}
    </text>
  );
}
