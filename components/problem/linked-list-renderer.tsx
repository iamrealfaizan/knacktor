"use client";

// LinkedList renderer — per SimulationRules B-4.
// Shape: rounded-rect split into value box + next-pointer box (84×48),
// horizontal chain with 40px gaps, head/tail pills above.
// Pointers (prev/curr/next) glide along their named lanes below the chain.

import type { LinkedListVisualState, CellState } from "@/lib/trace";

const NODE_W = 84;      // value box (52) + pointer box (32)
const VAL_W = 52;
const PTR_W = 32;
const NODE_H = 48;
const GAP = 40;         // gap between nodes (room for the arrow)
const PITCH = NODE_W + GAP;

const PTR_COLOR: Record<string, string> = {
  prev: "var(--kn-ptr-lo)",
  curr: "var(--kn-ptr-i)",
  current: "var(--kn-ptr-i)",
  next: "var(--kn-ptr-j)",
  slow: "var(--kn-ptr-lo)",
  fast: "var(--kn-ptr-hi)",
  head: "var(--kn-ptr-i)",
  tail: "var(--kn-ptr-hi)",
};
const PTR_PALETTE = [
  "var(--kn-ptr-i)", "var(--kn-ptr-j)", "var(--kn-ptr-lo)",
  "var(--kn-ptr-hi)", "var(--kn-special)", "var(--kn-amber)",
];

function nodeStyle(state: CellState): { fill: string; stroke: string; strokeWidth: number; opacity: number } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", strokeWidth: 2.5, opacity: 1 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", strokeWidth: 2.5, opacity: 1 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", strokeWidth: 2.5, opacity: 1 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-compared)", strokeWidth: 2, opacity: 0.8 };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", strokeWidth: 2.5, opacity: 1 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 0.4 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 1 };
  }
}

export function LinkedListRenderer({ visual }: { visual: LinkedListVisualState }) {
  const { nodes, links, pointers } = visual;
  const n = nodes.length;
  const rowW = n * NODE_W + (n - 1) * GAP;
  const x0 = -rowW / 2;
  const xOf = (idx: number) => x0 + idx * PITCH; // left edge of node

  // build id → index map for fast lookup
  const idxOf: Record<string, number> = {};
  nodes.forEach((nd, i) => { idxOf[nd.id] = i; });

  // build link map: from id → to id
  const linkMap: Record<string, string | null> = {};
  links.forEach((lk) => { linkMap[lk.from] = lk.to; });

  return (
    <>
      {/* Marker defs */}
      <defs>
        <marker id="ll-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--kn-ink-2)" />
        </marker>
        <marker id="ll-arrow-changed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--kn-result)" />
        </marker>
      </defs>

      {/* Nodes — rendered before arrows so backward arrows appear on top */}
      {nodes.map((nd, i) => {
        const s = nodeStyle(nd.state ?? "idle");
        const nx = xOf(i);
        const isNull = nd.value === null || nd.value === undefined;
        const hasNext = linkMap[nd.id] !== undefined;
        return (
          <g
            key={nd.id}
            transform={`translate(${nx}, ${-NODE_H / 2})`}
            opacity={s.opacity}
            style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}
          >
            {/* Outer border */}
            <rect
              x={0}
              y={0}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth={s.strokeWidth}
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
            />
            {/* Divider between value and pointer fields */}
            <line x1={VAL_W} y1={4} x2={VAL_W} y2={NODE_H - 4} stroke={s.stroke} strokeWidth={1} opacity={0.6} />
            {/* Value */}
            <text
              x={VAL_W / 2}
              y={NODE_H / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={17}
              fontWeight={600}
              fill="var(--kn-ink-0)"
            >
              {isNull ? "∅" : String(nd.value)}
            </text>
            {/* Pointer dot + null label in pointer box */}
            <circle
              cx={VAL_W + PTR_W / 2}
              cy={NODE_H / 2}
              r={5}
              fill={hasNext ? "var(--kn-ink-1)" : "none"}
              stroke="var(--kn-ink-2)"
              strokeWidth={1.5}
            />
            {!hasNext && (
              <text
                x={VAL_W + PTR_W / 2}
                y={NODE_H / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={9}
                fill="var(--kn-ink-2)"
              >
                ∅
              </text>
            )}
          </g>
        );
      })}

      {/* Base link arrows — rendered after nodes so backward arrows show on top */}
      {nodes.map((nd, i) => {
        const toId = linkMap[nd.id];
        if (toId === undefined || toId === null) return null;
        const j = idxOf[toId];
        if (j === undefined) return null;
        const isBackward = j < i;
        const pathD = isBackward
          ? `M ${xOf(i) + NODE_W} 0 L ${xOf(j) + NODE_W + 8} 0`
          : `M ${xOf(i) + NODE_W} 0 L ${xOf(j) - 8} 0`;
        return (
          <path
            key={`arrow-${nd.id}`}
            d={pathD}
            stroke="var(--kn-ink-2)"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#ll-arrow)"
            style={{ transition: "opacity 0.25s ease" }}
          />
        );
      })}

      {/* changedLinks — green overlay, same horizontal style, on top of everything */}
      {(visual.changedLinks ?? []).map((lk) => {
        const fi = idxOf[lk.from];
        if (fi === undefined) return null;
        const ti = idxOf[lk.to];
        if (ti === undefined) return null;
        const isBackward = ti < fi;
        const pathD = isBackward
          ? `M ${xOf(fi) + NODE_W} 0 L ${xOf(ti) + NODE_W + 8} 0`
          : `M ${xOf(fi) + NODE_W} 0 L ${xOf(ti) - 8} 0`;
        return (
          <path
            key={`changed-arrow-${lk.from}-${lk.to}`}
            d={pathD}
            stroke="var(--kn-result)"
            strokeWidth={2.5}
            fill="none"
            markerEnd="url(#ll-arrow-changed)"
            style={{ transition: "all 0.3s ease" }}
          />
        );
      })}

      {/* Head / tail pills above chain */}
      {nodes.length > 0 && (
        <HeadPill x={xOf(0) + NODE_W / 4} />
      )}
      {nodes.length > 1 && (
        <TailPill x={xOf(n - 1) + NODE_W / 4} />
      )}

      {/* Pointer lanes below nodes (prev/curr/next etc.) */}
      {pointers.map((p, pi) => {
        const idx = p.at !== null ? idxOf[p.at] : null;
        if (idx === undefined || idx === null) return null;
        const color = PTR_COLOR[p.name] ?? PTR_PALETTE[pi % PTR_PALETTE.length];
        const cx = xOf(idx) + NODE_W / 2;
        const laneY = NODE_H / 2 + 28 + pi * 22;
        const pillW = Math.max(28, p.name.length * 6.5 + 12);
        return (
          <g
            key={p.name}
            transform={`translate(${cx}, 0)`}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
          >
            <line x1={0} y1={NODE_H / 2 + 4} x2={0} y2={laneY} stroke={color} strokeWidth={1} opacity={0.5} />
            <path d={`M 0 ${NODE_H / 2 + 2} L -5 ${NODE_H / 2 + 10} L 5 ${NODE_H / 2 + 10} Z`} fill={color} />
            <rect x={-pillW / 2} y={laneY} width={pillW} height={18} rx={9} fill={color} />
            <text
              x={0} y={laneY + 10}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="var(--font-mono)" fontSize={10} fontWeight={700} fill="#fff"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </>
  );
}

function HeadPill({ x }: { x: number }) {
  return (
    <g transform={`translate(${x}, -44)`}>
      <rect x={-18} y={0} width={36} height={18} rx={9} fill="var(--kn-ptr-i)" opacity={0.15} stroke="var(--kn-ptr-i)" strokeWidth={1} />
      <text x={0} y={10} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize={9} fontWeight={700} fill="var(--kn-ptr-i)">
        head
      </text>
      <line x1={0} y1={18} x2={0} y2={26} stroke="var(--kn-ptr-i)" strokeWidth={1} opacity={0.5} />
    </g>
  );
}

function TailPill({ x }: { x: number }) {
  return (
    <g transform={`translate(${x}, -44)`}>
      <rect x={-14} y={0} width={28} height={18} rx={9} fill="var(--kn-ptr-hi)" opacity={0.15} stroke="var(--kn-ptr-hi)" strokeWidth={1} />
      <text x={0} y={10} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)" fontSize={9} fontWeight={700} fill="var(--kn-ptr-hi)">
        tail
      </text>
      <line x1={0} y1={18} x2={0} y2={26} stroke="var(--kn-ptr-hi)" strokeWidth={1} opacity={0.5} />
    </g>
  );
}
