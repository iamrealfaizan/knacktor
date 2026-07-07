"use client";

// LinkedList renderer — per SimulationRules B-4.
// Shape: rounded-rect split into value box + next-pointer box (84×48),
// horizontal chain with 40px gaps, head/tail pills above.
// Pointers (prev/curr/next) glide along their named lanes below the chain.

import type { LinkedListVisualState } from "@/lib/trace";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";
import { PointerPill, ptrColor } from "./shared/pointer-pill";
import { PopIn } from "./shared/atoms";

const NODE_W = 84;      // value box (52) + pointer box (32)
const VAL_W = 52;
const PTR_W = 32;
const NODE_H = 48;
const GAP = 40;         // gap between nodes (room for the arrow)
const PITCH = NODE_W + GAP;

export function LinkedListRenderer({ visual }: { visual: LinkedListVisualState }) {
  const { nodes, links, pointers } = visual;
  const n = nodes.length;
  const rowW = n * NODE_W + (n - 1) * GAP;
  const x0 = -rowW / 2;

  // build link map: from id → to id
  const linkMap: Record<string, string | null> = {};
  links.forEach((lk) => { linkMap[lk.from] = lk.to; });

  // ── Chain-order layout ──────────────────────────────────────────────
  // Place nodes left→right by FOLLOWING the next-links from the head, not by
  // their position in the `nodes` array. This keeps every arrow pointing to the
  // physically-next node (no crossing) even when an algorithm rewires links
  // (reorder / reverse / merge); nodes GLIDE to their new slot on a relink.
  // Head = first node with no incoming link; fall back to nodes[0] for a pure
  // cycle. A visited-guard stops on cycles; unreached nodes append in array order.
  const nodeIds = new Set<string>(nodes.map((nd) => nd.id));
  const targets = new Set<string>();
  links.forEach((lk) => { if (lk.to != null) targets.add(String(lk.to)); });

  let head: string | null = null;
  for (const nd of nodes) { if (!targets.has(nd.id)) { head = nd.id; break; } }
  if (head === null && nodes.length) head = nodes[0].id;

  const order: string[] = [];
  const placed = new Set<string>();
  let walk: string | null = head;
  while (walk != null && nodeIds.has(walk) && !placed.has(walk)) {
    order.push(walk);
    placed.add(walk);
    const nx = linkMap[walk];
    walk = nx == null ? null : String(nx);
  }
  for (const nd of nodes) { if (!placed.has(nd.id)) { order.push(nd.id); placed.add(nd.id); } }

  // id → display slot, and slot → x (left edge)
  const posOf: Record<string, number> = {};
  order.forEach((id, i) => { posOf[id] = i; });
  const xOf = (idOrSlot: string | number) =>
    x0 + (typeof idOrSlot === "number" ? idOrSlot : (posOf[idOrSlot] ?? 0)) * PITCH;

  // build id → index map (kept for any legacy callers; not used for layout)
  const idxOf: Record<string, number> = posOf;

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

      {/* Nodes — rendered before arrows so backward arrows appear on top.
          Keyed by id → positional changes GLIDE; PopIn fires on node creation. */}
      {nodes.map((nd) => {
        const s = cellStateStyle(nd.state);
        const nx = xOf(nd.id);
        const isNull = nd.value === null || nd.value === undefined;
        const hasNext = linkMap[nd.id] !== undefined;
        return (
          <g
            key={nd.id}
            transform={`translate(${nx}, ${-NODE_H / 2})`}
            opacity={s.opacity}
            style={{ transition: `${MOTION.fade}, ${MOTION.glide}` }}
          >
            <PopIn>
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
              strokeDasharray={s.dashed ? "5 4" : undefined}
              className={s.pulse ? "kn-anim-cell-pulse" : undefined}
              style={{ transition: MOTION.flash }}
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
            </PopIn>
          </g>
        );
      })}

      {/* Base link arrows — rendered after nodes so backward arrows show on top */}
      {nodes.map((nd) => {
        const toId = linkMap[nd.id];
        if (toId === undefined || toId === null) return null;
        const i = posOf[nd.id];
        const j = posOf[toId];
        if (i === undefined || j === undefined) return null;
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

      {/* changedLinks — the re-link crux (B-4): the NEW arrow visibly DRAWS
          from source to destination (stroke-dashoffset), green, on top. */}
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
            pathLength={1}
            className="kn-anim-draw-in"
            stroke="var(--kn-result)"
            strokeWidth={2.5}
            fill="none"
            markerEnd="url(#ll-arrow-changed)"
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

      {/* Pointer lanes below nodes (prev/curr/next etc.) — shared pill, fixed identity hues */}
      {pointers.map((p, pi) => {
        const idx = p.at !== null ? idxOf[p.at] : null;
        if (idx === undefined || idx === null) return null;
        const cx = xOf(idx) + NODE_W / 2;
        const pillW = Math.max(28, p.name.length * 6.5 + 12);
        return (
          <g key={p.name} transform={`translate(${cx}, 0)`} style={{ transition: MOTION.pointer }}>
            <PointerPill
              name={p.name}
              color={ptrColor(p.name, pi)}
              caretY={NODE_H / 2 + 10}
              lane={pi}
              pillWidth={pillW}
            />
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
