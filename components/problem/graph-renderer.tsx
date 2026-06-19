"use client";

// Graph renderer — per SimulationRules B-10.
// Layout: frozen x/y positions from the tracer (pre-computed for readability).
// Shape: circles for nodes, lines/curves for edges, directional arrowheads.
// Edge states: idle → tree → relaxing → path → rejected.
// Covers: DFS/BFS on graphs, Dijkstra, Bellman-Ford, Prim, Kruskal, topological sort,
//          cycle detection, bipartite check, union-find.

import type { GraphVisualState, GraphNode, CellState, GraphEdgeState } from "@/lib/trace";

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

// Node color per CellState
function nodeStyle(state: CellState): { fill: string; stroke: string; textFill: string; strokeWidth: number } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", textFill: "var(--kn-current)", strokeWidth: 2.5 };
    case "frontier":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-amber)", textFill: "var(--kn-ink-0)", strokeWidth: 2 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-compared)", textFill: "var(--kn-ink-1)", strokeWidth: 2 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", textFill: "var(--kn-ink-0)", strokeWidth: 2 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", textFill: "var(--kn-result)", strokeWidth: 2.5 };
    case "path":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-gold)", textFill: "var(--kn-ink-0)", strokeWidth: 2.5 };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", textFill: "var(--kn-special)", strokeWidth: 2.5 };
    case "error":
      return { fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)", textFill: "var(--kn-error)", strokeWidth: 2 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-0)", textFill: "var(--kn-ink-2)", strokeWidth: 1.5 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", textFill: "var(--kn-ink-0)", strokeWidth: 1.5 };
  }
}

// Arrowhead endpoint — offset to node boundary
function arrowEndpoints(
  x1: number, y1: number, x2: number, y2: number
): { sx: number; sy: number; ex: number; ey: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    sx: x1 + (dx / dist) * NODE_R,
    sy: y1 + (dy / dist) * NODE_R,
    ex: x2 - (dx / dist) * (NODE_R + 6), // +6 for arrowhead clearance
    ey: y2 - (dy / dist) * (NODE_R + 6),
  };
}

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

        const { sx, sy, ex, ey } = arrowEndpoints(from.x, from.y, to.x, to.y);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={ei} style={{ transition: "opacity 0.2s ease" }}>
            {/* <path> per SimulationRules A-1 + B-10: edges must be <path> for stroke-dashoffset draw-in */}
            <path
              d={`M ${sx} ${sy} L ${ex} ${ey}`}
              stroke={es.stroke}
              strokeWidth={es.strokeWidth}
              opacity={es.opacity}
              fill="none"
              strokeDasharray={es.dash}
              markerEnd={edge.directed && hasDirected ? `url(#arrow-${edge.state ?? "idle"})` : undefined}
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
        const ns = nodeStyle(node.state ?? "idle");
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ transition: "transform 0.35s cubic-bezier(.34,1.2,.4,1)" }}
          >
            <circle
              cx={0}
              cy={0}
              r={NODE_R}
              fill={ns.fill}
              stroke={ns.stroke}
              strokeWidth={ns.strokeWidth}
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
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

      {/* Pointer labels */}
      {pointers.map((p, pi) => {
        if (!p.at || !nodeMap[p.at]) return null;
        const n = nodeMap[p.at];
        return (
          <g
            key={p.name}
            transform={`translate(${n.x}, ${n.y})`}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
          >
            <rect
              x={-18}
              y={NODE_R + 6 + pi * 22}
              width={36}
              height={18}
              rx={9}
              fill="var(--kn-ptr-i)"
            />
            <text
              x={0}
              y={NODE_R + 16 + pi * 22}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={9}
              fontWeight={700}
              fill="#fff"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
