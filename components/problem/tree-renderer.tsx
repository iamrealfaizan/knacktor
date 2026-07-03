"use client";

// Binary Tree renderer — per SimulationRules B-8.
// Layout: Reingold-Tilford tidy tree (shared layoutTidyTree).
// Shape: circle r=22, value centered, edges as <path> (boundary-offset).
// Cursor ring glides between nodes; the edge INTO the current node draws in
// progressively (path-tracing, mandated behavior #4).

import type { TreeVisualState, TreeNode } from "@/lib/trace";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";
import { PointerPill, ptrColor } from "./shared/pointer-pill";
import { layoutTidyTree } from "./shared/layout-tidy-tree";
import { edgePath, edgeEndpoints } from "./shared/edge-path";
import { PopIn } from "./shared/atoms";

const R = 22;               // node radius
const LEVEL_GAP = 80;       // vertical gap between levels
const LEAF_SPAN = R * 2 + 20; // horizontal space per leaf

export function TreeRenderer({ visual }: { visual: TreeVisualState }) {
  const { nodes, pointers, currentId } = visual;
  const { nodes: layout, minY, maxY } = layoutTidyTree(nodes, {
    leafSpan: LEAF_SPAN,
    levelGap: LEVEL_GAP,
  });
  const posMap: Record<string, { x: number; y: number }> = {};
  layout.forEach((n) => { posMap[n.id] = { x: n.x, y: n.y }; });

  const nodeMap: Record<string, TreeNode> = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  // Center vertically
  const offsetY = -((minY + maxY) / 2);

  return (
    <g transform={`translate(0, ${offsetY})`}>
      {/* Edges — drawn before nodes so nodes paint over them */}
      {nodes.map((nd) => {
        const from = posMap[nd.id];
        if (!from) return null;
        return (
          <g key={`edges-${nd.id}`}>
            {nd.left && posMap[nd.left] && (
              <TreeEdge
                x1={from.x}
                y1={from.y}
                x2={posMap[nd.left].x}
                y2={posMap[nd.left].y}
                isPath={nodeMap[nd.left]?.state === "path"}
                isActive={nd.left === currentId}
              />
            )}
            {nd.right && posMap[nd.right] && (
              <TreeEdge
                x1={from.x}
                y1={from.y}
                x2={posMap[nd.right].x}
                y2={posMap[nd.right].y}
                isPath={nodeMap[nd.right]?.state === "path"}
                isActive={nd.right === currentId}
              />
            )}
          </g>
        );
      })}

      {/* Null stubs for missing children */}
      {nodes.map((nd) => {
        const from = posMap[nd.id];
        if (!from) return null;
        return (
          <g key={`stubs-${nd.id}`}>
            {!nd.left && nd.right && posMap[nd.right] && (
              <NullStub parentX={from.x} parentY={from.y} side="left" />
            )}
            {nd.left && !nd.right && posMap[nd.left] && (
              <NullStub parentX={from.x} parentY={from.y} side="right" />
            )}
          </g>
        );
      })}

      {/* Nodes — keyed by id (glide on re-layout), PopIn on creation */}
      {layout.map(({ id, x, y, node }) => {
        const c = cellStateStyle(node.state);
        const isCurrent = id === currentId;
        return (
          <g key={id} transform={`translate(${x}, ${y})`} style={{ transition: MOTION.glide }}>
            <PopIn>
              {/* Traversal cursor ring */}
              {isCurrent && (
                <circle
                  cx={0} cy={0} r={R + 6}
                  fill="none"
                  stroke="var(--kn-current)"
                  strokeWidth={2}
                  opacity={0.4}
                  className="kn-anim-cursor-ring"
                />
              )}
              <circle
                cx={0} cy={0} r={R}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={c.strokeWidth}
                strokeDasharray={c.dashed ? "5 4" : undefined}
                className={c.pulse ? "kn-anim-cell-pulse" : undefined}
                style={{ transition: MOTION.flash }}
              />
              <text
                x={0} y={1}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={15}
                fontWeight={700}
                fill={c.textFill}
              >
                {String(node.value)}
              </text>
            </PopIn>
          </g>
        );
      })}

      {/* Pointer pills below their nodes — shared pill, real identity hues */}
      {pointers.map((p, pi) => {
        if (!p.at || !posMap[p.at]) return null;
        const { x, y } = posMap[p.at];
        return (
          <g key={p.name} transform={`translate(${x}, ${y})`} style={{ transition: MOTION.pointer }}>
            <PointerPill
              name={p.name}
              color={ptrColor(p.name, pi)}
              caretY={R + 10}
              lane={pi}
              pillWidth={36}
            />
          </g>
        );
      })}
    </g>
  );
}

function TreeEdge({
  x1, y1, x2, y2, isPath, isActive,
}: { x1: number; y1: number; x2: number; y2: number; isPath: boolean; isActive: boolean }) {
  const d = edgePath(x1, y1, x2, y2, R);
  return (
    <>
      <path
        d={d}
        stroke={isPath ? "var(--kn-gold)" : "var(--kn-border-1)"}
        strokeWidth={isPath ? 2.5 : 1.5}
        fill="none"
        style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
      />
      {/* Progressive edge-draw into the node the cursor just reached (B-8):
          keyed remount re-fires the draw each time this edge becomes active. */}
      {isActive && (
        <path
          key={`active-${x2}-${y2}`}
          d={d}
          pathLength={1}
          className="kn-anim-draw-in"
          stroke="var(--kn-current)"
          strokeWidth={2.5}
          fill="none"
        />
      )}
    </>
  );
}

function NullStub({
  parentX, parentY, side,
}: { parentX: number; parentY: number; side: "left" | "right" }) {
  const offsetX = side === "left" ? -LEAF_SPAN * 0.4 : LEAF_SPAN * 0.4;
  const cx = parentX + offsetX;
  const cy = parentY + LEVEL_GAP;
  const { sx, sy } = edgeEndpoints(parentX, parentY, cx, cy, R, 0);

  return (
    <g opacity={0.35}>
      <line x1={sx} y1={sy} x2={cx} y2={cy - 8} stroke="var(--kn-border-1)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize={11} fill="var(--kn-ink-2)">∅</text>
    </g>
  );
}
