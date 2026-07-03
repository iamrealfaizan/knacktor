"use client";

// Graph renderer — per SimulationRules B-10.
// Layout: frozen x/y positions from the tracer (pre-computed for readability).
// Shape: circles for nodes, lines/curves for edges, directional arrowheads.
// Edge states: idle → tree → relaxing → path → rejected.
// Covers: DFS/BFS on graphs, Dijkstra, Bellman-Ford, Prim, Kruskal, topological sort,
//          cycle detection, bipartite check, union-find.

import type { GraphVisualState, GraphNode, GraphEdgeState } from "@/lib/trace";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";
import { PointerPill, ptrColor } from "./shared/pointer-pill";
import { edgeEndpoints } from "./shared/edge-path";

const NODE_R = 22;

// Edge color per state
function edgeStyle(state: GraphEdgeState): { stroke: string; strokeWidth: number; opacity: number; dash?: string } {
  switch (state) {
    case "tree":
      return { stroke: "var(--kn-current)", strokeWidth: 2.5, opacity: 1 };
    case "relaxing":
      return { stroke: "var(--kn-amber)", strokeWidth: 2, opacity: 1 };
    case "path":
      return { stroke: "var(--kn-gold)", strokeWidth: 3, opacity: 1 };
    case "rejected":
      return { stroke: "var(--kn-error)", strokeWidth: 1.5, opacity: 0.4, dash: "4 3" };
    case "idle":
    default:
      return { stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 0.8 };
  }
}

// Node colors come from the shared cellStateStyle map (see shared/cell-state.ts).

// Auto-layout: if no x/y provided, use circular layout
function applyLayout(nodes: GraphNode[]): GraphNode[] {
  const missingPos = nodes.some((n) => n.x === undefined || n.y === undefined || (n.x === 0 && n.y === 0 && nodes.length > 1));
  if (!missingPos) return nodes;

  const n = nodes.length;
  const radius = Math.max(80, n * 24);
  return nodes.map((node, i) => ({
    ...node,
    x: Math.round(radius * Math.cos((2 * Math.PI * i) / n)),
    y: Math.round(radius * Math.sin((2 * Math.PI * i) / n)),
  }));
}

// Self-loop arc above the node
function SelfLoop({ x, y, stroke, strokeWidth, opacity, dash }: {
  x: number; y: number; stroke: string; strokeWidth: number; opacity: number; dash?: string;
}) {
  const r = NODE_R;
  const loopR = 14;
  return (
    <circle
      cx={x}
      cy={y - r - loopR}
      r={loopR}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      strokeDasharray={dash}
    />
  );
}

export function GraphRenderer({ visual }: { visual: GraphVisualState }) {
  const { edges, pointers } = visual;
  const nodes = applyLayout(visual.nodes);

  const nodeMap: Record<string, GraphNode> = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  // Determine if any edge is directed — if so, render arrowheads
  const hasDirected = edges.some((e) => e.directed);

  // Center the layout
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  const offsetX = -((minX + maxX) / 2);
  const offsetY = -((minY + maxY) / 2);

  return (
    <g transform={`translate(${offsetX}, ${offsetY})`}>
      {/* Arrowhead marker defs */}
      {hasDirected && (
        <defs>
          {(["idle", "tree", "relaxing", "path", "rejected"] as GraphEdgeState[]).map((s) => {
            const es = edgeStyle(s);
            return (
              <marker
                key={s}
                id={`arrow-${s}`}
                markerWidth={8}
                markerHeight={8}
                refX={4}
                refY={3}
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={es.stroke} opacity={es.opacity} />
              </marker>
            );
          })}
        </defs>
      )}

      {/* Edges — drawn first so nodes paint over them */}
      {edges.map((edge, ei) => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];
        if (!from || !to) return null;

        const es = edgeStyle(edge.state ?? "idle");

        // Self-loop
        if (edge.from === edge.to) {
          return (
            <SelfLoop
              key={ei}
              x={from.x}
              y={from.y}
              stroke={es.stroke}
              strokeWidth={es.strokeWidth}
              opacity={es.opacity}
              dash={es.dash}
            />
          );
        }

        const { sx, sy, ex, ey } = edgeEndpoints(from.x, from.y, to.x, to.y, NODE_R, NODE_R + 6);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const state = edge.state ?? "idle";
        // B-10: traversal edges DRAW IN — keying by state remounts the path when
        // an edge activates (idle→tree/relaxing/path), re-firing the animation.
        const drawsIn = state === "tree" || state === "relaxing" || state === "path";

        return (
          <g key={ei} style={{ transition: "opacity 0.2s ease" }}>
            <path
              key={`e-${ei}-${state}`}
              d={`M ${sx} ${sy} L ${ex} ${ey}`}
              pathLength={drawsIn ? 1 : undefined}
              className={drawsIn ? "kn-anim-draw-in" : undefined}
              stroke={es.stroke}
              strokeWidth={es.strokeWidth}
              opacity={es.opacity}
              fill="none"
              strokeDasharray={drawsIn ? undefined : es.dash}
              markerEnd={edge.directed && hasDirected ? `url(#arrow-${state})` : undefined}
              style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
            />
            {/* Weight label */}
            {edge.weight !== undefined && edge.weight !== null && (
              <g>
                <rect
                  x={midX - 12}
                  y={midY - 9}
                  width={24}
                  height={18}
                  rx={4}
                  fill="var(--kn-surface-0)"
                  stroke={es.stroke}
                  strokeWidth={1}
                  opacity={0.9}
                />
                <text
                  x={midX}
                  y={midY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  fontWeight={600}
                  fill={es.stroke}
                >
                  {edge.weight}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const ns = cellStateStyle(node.state);
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ transition: MOTION.glide }}
          >
            <circle
              cx={0}
              cy={0}
              r={NODE_R}
              fill={ns.fill}
              stroke={ns.stroke}
              strokeWidth={ns.strokeWidth}
              strokeDasharray={ns.dashed ? "5 4" : undefined}
              className={ns.pulse ? "kn-anim-cell-pulse" : undefined}
              style={{ transition: MOTION.flash }}
            />
            <text
              x={0}
              y={1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fontWeight={700}
              fill={ns.textFill}
            >
              {node.label ?? node.id}
            </text>
          </g>
        );
      })}

      {/* Pointer pills below their nodes — shared pill, real identity hues */}
      {pointers.map((p, pi) => {
        if (!p.at || !nodeMap[p.at]) return null;
        const n = nodeMap[p.at];
        return (
          <g key={p.name} transform={`translate(${n.x}, ${n.y})`} style={{ transition: MOTION.pointer }}>
            <PointerPill
              name={p.name}
              color={ptrColor(p.name, pi)}
              caretY={NODE_R + 10}
              lane={pi}
              pillWidth={36}
            />
          </g>
        );
      })}
    </g>
  );
}
