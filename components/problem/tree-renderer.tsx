"use client";

// Binary Tree renderer — per SimulationRules B-8.
// Layout: Reingold-Tilford tidy tree (in-order leaf counting).
//   y = depth × levelGap; x = midpoint of children (leaves spread by in-order).
// Shape: circle r=22, value centered, edges as <path>.
// Cursor ring glides between nodes during traversal.
// Covers: BST insert/search/delete, DFS preorder/inorder/postorder, BFS level-order,
//         tree diameter, LCA, path sum, serialize/deserialize.

import type { TreeVisualState, TreeNode, CellState } from "@/lib/trace";

const R = 22;               // node radius
const LEVEL_GAP = 80;       // vertical gap between levels
const LEAF_SPAN = R * 2 + 20; // horizontal space per leaf

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  node: TreeNode;
}

function buildLayout(nodes: TreeNode[]): LayoutNode[] {
  if (!nodes.length) return [];

  const nodeMap: Record<string, TreeNode> = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  // Find root(s): nodes that are not anyone's child
  const isChild = new Set<string>();
  nodes.forEach((n) => {
    if (n.left) isChild.add(n.left);
    if (n.right) isChild.add(n.right);
  });
  const roots = nodes.filter((n) => !isChild.has(n.id));
  const root = roots[0];
  if (!root) return nodes.map((n, i) => ({ id: n.id, x: i * LEAF_SPAN, y: 0, node: n }));

  const layout: LayoutNode[] = [];
  let leafIndex = 0;

  function assign(id: string, depth: number): number {
    const nd = nodeMap[id];
    if (!nd) return 0;
    const hasLeft = nd.left && nodeMap[nd.left];
    const hasRight = nd.right && nodeMap[nd.right];

    if (!hasLeft && !hasRight) {
      const x = leafIndex * LEAF_SPAN;
      leafIndex++;
      layout.push({ id, x, y: depth * LEVEL_GAP, node: nd });
      return x;
    }

    const childXs: number[] = [];
    if (hasLeft) childXs.push(assign(nd.left!, depth + 1));
    if (hasRight) childXs.push(assign(nd.right!, depth + 1));

    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    layout.push({ id, x, y: depth * LEVEL_GAP, node: nd });
    return x;
  }

  assign(root.id, 0);

  // Center the tree
  if (layout.length) {
    const minX = Math.min(...layout.map((n) => n.x));
    const maxX = Math.max(...layout.map((n) => n.x));
    const cx = (minX + maxX) / 2;
    layout.forEach((n) => { n.x -= cx; });
  }

  return layout;
}

function nodeColors(state: CellState): { fill: string; stroke: string; textFill: string; strokeWidth: number } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", textFill: "var(--kn-current)", strokeWidth: 2.5 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", textFill: "var(--kn-ink-0)", strokeWidth: 2.5 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", textFill: "var(--kn-result)", strokeWidth: 2.5 };
    case "path":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-gold)", textFill: "var(--kn-ink-0)", strokeWidth: 2.5 };
    case "frontier":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-amber)", textFill: "var(--kn-ink-0)", strokeWidth: 2 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-compared)", textFill: "var(--kn-ink-1)", strokeWidth: 2 };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", textFill: "var(--kn-special)", strokeWidth: 2.5 };
    case "error":
      return { fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)", textFill: "var(--kn-error)", strokeWidth: 2 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", textFill: "var(--kn-ink-2)", strokeWidth: 1.5 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", textFill: "var(--kn-ink-0)", strokeWidth: 1.5 };
  }
}

export function TreeRenderer({ visual }: { visual: TreeVisualState }) {
  const { nodes, pointers, currentId } = visual;
  const layout = buildLayout(nodes);
  const posMap: Record<string, { x: number; y: number }> = {};
  layout.forEach((n) => { posMap[n.id] = { x: n.x, y: n.y }; });

  const nodeMap: Record<string, TreeNode> = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  // Center vertically
  const minY = layout.length ? Math.min(...layout.map((n) => n.y)) : 0;
  const maxY = layout.length ? Math.max(...layout.map((n) => n.y)) : 0;
  const offsetY = -((minY + maxY) / 2);

  return (
    <g transform={`translate(0, ${offsetY})`}>
      {/* Edges — drawn before nodes so nodes paint over them */}
      {nodes.map((nd) => {
        const from = posMap[nd.id];
        if (!from) return null;
        return (
          <>
            {nd.left && posMap[nd.left] && (
              <TreeEdge
                key={`e-${nd.id}-${nd.left}`}
                x1={from.x}
                y1={from.y}
                x2={posMap[nd.left]!.x}
                y2={posMap[nd.left]!.y}
                isPath={nodeMap[nd.left]?.state === "path"}
              />
            )}
            {nd.right && posMap[nd.right] && (
              <TreeEdge
                key={`e-${nd.id}-${nd.right}`}
                x1={from.x}
                y1={from.y}
                x2={posMap[nd.right]!.x}
                y2={posMap[nd.right]!.y}
                isPath={nodeMap[nd.right]?.state === "path"}
              />
            )}
          </>
        );
      })}

      {/* Null stubs for missing children */}
      {nodes.map((nd) => {
        const from = posMap[nd.id];
        if (!from) return null;
        return (
          <>
            {!nd.left && nd.right && posMap[nd.right] && (
              <NullStub key={`null-left-${nd.id}`} parentX={from.x} parentY={from.y} side="left" />
            )}
            {nd.left && !nd.right && posMap[nd.left] && (
              <NullStub key={`null-right-${nd.id}`} parentX={from.x} parentY={from.y} side="right" />
            )}
          </>
        );
      })}

      {/* Nodes */}
      {layout.map(({ id, x, y, node }) => {
        const c = nodeColors(node.state ?? "idle");
        const isCurrent = id === currentId;
        return (
          <g
            key={id}
            transform={`translate(${x}, ${y})`}
            style={{ transition: "transform 0.4s cubic-bezier(.34,1.2,.4,1)" }}
          >
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
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
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
          </g>
        );
      })}

      {/* Pointer pills below tree */}
      {pointers.map((p, pi) => {
        if (!p.at || !posMap[p.at]) return null;
        const { x, y } = posMap[p.at];
        return (
          <g
            key={p.name}
            transform={`translate(${x}, ${y})`}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
          >
            <line x1={0} y1={R + 2} x2={0} y2={R + 22 + pi * 22} stroke="var(--kn-ptr-i)" strokeWidth={1} opacity={0.5} />
            <rect x={-18} y={R + 22 + pi * 22} width={36} height={18} rx={9} fill="var(--kn-ptr-i)" />
            <text
              x={0} y={R + 32 + pi * 22}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="var(--font-mono)" fontSize={9} fontWeight={700} fill="#fff"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function TreeEdge({
  x1, y1, x2, y2, isPath,
}: { x1: number; y1: number; x2: number; y2: number; isPath: boolean }) {
  // Offset endpoints to node boundary
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const sx = x1 + (dx / dist) * R;
  const sy = y1 + (dy / dist) * R;
  const ex = x2 - (dx / dist) * R;
  const ey = y2 - (dy / dist) * R;

  return (
    <path
      d={`M ${sx} ${sy} L ${ex} ${ey}`}
      stroke={isPath ? "var(--kn-gold)" : "var(--kn-border-1)"}
      strokeWidth={isPath ? 2.5 : 1.5}
      fill="none"
      style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
    />
  );
}

function NullStub({
  parentX, parentY, side,
}: { parentX: number; parentY: number; side: "left" | "right" }) {
  const offsetX = side === "left" ? -LEAF_SPAN * 0.4 : LEAF_SPAN * 0.4;
  const cx = parentX + offsetX;
  const cy = parentY + LEVEL_GAP;

  const dx = cx - parentX;
  const dy = cy - parentY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const sx = parentX + (dx / dist) * R;
  const sy = parentY + (dy / dist) * R;

  return (
    <g opacity={0.35}>
      <line x1={sx} y1={sy} x2={cx} y2={cy - 8} stroke="var(--kn-border-1)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize={11} fill="var(--kn-ink-2)">∅</text>
    </g>
  );
}
