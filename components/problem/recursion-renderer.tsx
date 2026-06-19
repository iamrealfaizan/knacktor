"use client";

// Recursion / Call Stack renderer — per SimulationRules B-13 / B-14.
//
// Two synchronized views side by side:
//   LEFT  — Call Stack (B-14): stacked frames, newest on top, TOS brighter + halo.
//           Frame shape: full-width rounded rect ~64px tall (B-14).
//   RIGHT — Recursion Tree (B-13): nodes are rounded rects ~120×40 (B-13), two-line.
//           Built incrementally DFS left→right; edges are <path> per A-1.
//
// Both views share the same CallFrame data from RecursionVisualState:
//   frames[]     — ordered bottom (oldest) → top (newest/current)
//   treeEdges[]  — parent→child for the tree view

import type { RecursionVisualState, CallFrame } from "@/lib/trace";

// Call Stack (B-14): "full-width rounded rect ~64px tall"
const FRAME_W = 180;
const FRAME_H = 64;     // per B-14: ~64px tall
const FRAME_GAP = 4;
const FRAME_R = 8;

// Recursion Tree (B-13): "rounded rect ~120×40 (two-line: fib(5) then → 5 on return)"
const NODE_W = 120;
const NODE_H = 40;
const NODE_R = 8;
const TREE_H_GAP = 20;   // horizontal gap between sibling nodes
const TREE_LEVEL_H = 80; // vertical distance between levels

// ─────────────────────────────────────────────────────────────────────────────

export function RecursionRenderer({ visual }: { visual: RecursionVisualState }) {
  const { frames, treeEdges = [] } = visual;

  return (
    <g>
      {/* Call Stack — left panel */}
      <g transform="translate(-220, 0)">
        <PanelLabel text="CALL STACK" />
        <CallStackView frames={frames} />
      </g>

      {/* Recursion Tree — right panel */}
      <g transform="translate(60, 0)">
        <PanelLabel text="RECURSION TREE" />
        <RecursionTreeView frames={frames} edges={treeEdges} />
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
            style={{ transition: "transform 0.35s cubic-bezier(.34,1.2,.4,1)" }}
          >
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
        );
      })}
    </g>
  );
}

// ── Recursion Tree ────────────────────────────────────────────────────────────

interface TreeLayout {
  id: string;
  x: number;
  y: number;
  frame: CallFrame;
}

function buildTreeLayout(
  frames: CallFrame[],
  edges: { from: string; to: string }[]
): TreeLayout[] {
  if (!frames.length) return [];

  const children: Record<string, string[]> = {};
  const hasParent = new Set<string>();
  edges.forEach((e) => {
    if (!children[e.from]) children[e.from] = [];
    children[e.from].push(e.to);
    hasParent.add(e.to);
  });

  const frameMap: Record<string, CallFrame> = {};
  frames.forEach((f) => { frameMap[f.id] = f; });

  const roots = frames.filter((f) => !hasParent.has(f.id)).map((f) => f.id);
  if (!roots.length) roots.push(frames[0].id);

  let leafCounter = 0;
  const layout: TreeLayout[] = [];

  function assign(id: string, depth: number): number {
    const kids = children[id] ?? [];
    if (!kids.length) {
      const x = leafCounter * (NODE_W + TREE_H_GAP);
      leafCounter++;
      layout.push({ id, x, y: depth * TREE_LEVEL_H, frame: frameMap[id] });
      return x;
    }
    const childXs = kids.map((k) => assign(k, depth + 1));
    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    layout.push({ id, x, y: depth * TREE_LEVEL_H, frame: frameMap[id] });
    return x;
  }

  roots.forEach((r) => assign(r, 0));

  // Center tree
  if (layout.length) {
    const minX = Math.min(...layout.map((n) => n.x));
    const maxX = Math.max(...layout.map((n) => n.x));
    layout.forEach((n) => { n.x -= (minX + maxX) / 2; });
  }

  return layout;
}

function RecursionTreeView({ frames, edges }: { frames: CallFrame[]; edges: { from: string; to: string }[] }) {
  const layout = buildTreeLayout(frames, edges);
  const nodeMap: Record<string, TreeLayout> = {};
  layout.forEach((n) => { nodeMap[n.id] = n; });

  return (
    <g>
      {/* Edges first — <path> per SimulationRules A-1 (required for stroke-dashoffset draw-in) */}
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
            stroke="var(--kn-border-1)"
            strokeWidth={1.5}
            fill="none"
            style={{ transition: "all 0.35s ease" }}
          />
        );
      })}

      {/* Nodes — rounded rect ~120×40 per B-13 */}
      {layout.map((n) => {
        const f = n.frame;
        const isCurrent = f?.isCurrent;
        const hasReturn = f?.returnValue !== null && f?.returnValue !== undefined;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            style={{ transition: "transform 0.4s cubic-bezier(.34,1.2,.4,1)" }}
          >
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
          </g>
        );
      })}
    </g>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────

function PanelLabel({ text }: { text: string }) {
  return (
    <text
      x={0}
      y={-90}
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
