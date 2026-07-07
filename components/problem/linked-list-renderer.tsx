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
import { orthogonalDetourPath } from "./shared/edge-path";

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

  // ── Orthogonal detour routing ───────────────────────────────────────
  // Adjacent-forward links (j === i+1) stay as straight horizontal arrows.
  // Any link that SKIPS nodes — a forward jump, a backward/cycle link, or a
  // transient mid-rewire — would slice straight through intervening nodes, so
  // it is routed up/down into a dedicated horizontal lane instead. Lanes are
  // auto-assigned (greedy interval coloring) so overlapping detours never
  // share a lane, and alternate above/below the row to balance the two sides.
  const NODE_TOP = -NODE_H / 2;
  const NODE_BOTTOM = NODE_H / 2;
  const LANE_GAP = 16;   // clearance from the row edge to the first lane
  const LANE_PITCH = 22; // vertical spacing between stacked lanes on a side
  // Reserve a band below the row for the pointer pills (prev/curr/slow/fast…)
  // so below-row detours never collide with them.
  const nPtr = pointers.length;
  const pillBottom = nPtr > 0 ? NODE_BOTTOM + 10 + (nPtr - 1) * 22 + 18 : NODE_BOTTOM;
  const BELOW_RESERVE = (nPtr > 0 ? pillBottom + 14 : NODE_BOTTOM + LANE_GAP);

  const isAdjacentForward = (i: number, j: number) => j === i + 1;

  type Detour = { key: string; lo: number; hi: number };
  const detours: Detour[] = [];
  nodes.forEach((nd) => {
    const toId = linkMap[nd.id];
    if (toId === undefined || toId === null) return;
    const i = posOf[nd.id];
    const j = posOf[String(toId)];
    if (i === undefined || j === undefined) return;
    if (isAdjacentForward(i, j)) return;
    detours.push({ key: `${nd.id}->${toId}`, lo: Math.min(i, j), hi: Math.max(i, j) });
  });

  // Greedy interval coloring → global lane index. A detour joins the lowest
  // lane whose last-placed interval ends strictly before this one begins
  // (strict, so two detours touching at a node column don't overlap verticals).
  const laneEnds: number[] = [];
  const globalLane: Record<string, number> = {};
  [...detours]
    .sort((a, b) => a.lo - b.lo || a.hi - b.hi)
    .forEach((d) => {
      let k = 0;
      for (; k < laneEnds.length; k++) if (d.lo > laneEnds[k]) break;
      laneEnds[k] = d.hi;
      globalLane[d.key] = k;
    });

  // Map a global lane to a concrete horizontal lane Y (even → above, odd → below).
  const laneYForGlobal = (k: number): number => {
    const sub = Math.floor(k / 2);
    return k % 2 === 0
      ? NODE_TOP - LANE_GAP - sub * LANE_PITCH
      : BELOW_RESERVE + sub * LANE_PITCH;
  };

  // Build the routed (or straight) path string for a link from slot i → slot j.
  // `key` selects the assigned lane; a link not in the base set (rare, e.g. a
  // changedLink being cleared) falls back to lane 0 (above).
  const linkPathFor = (i: number, j: number, key: string): string => {
    if (isAdjacentForward(i, j)) {
      return `M ${xOf(i) + NODE_W} 0 L ${xOf(j) - 8} 0`;
    }
    const laneY = laneYForGlobal(globalLane[key] ?? 0);
    const y0 = laneY < 0 ? NODE_TOP : NODE_BOTTOM;
    const sx = xOf(i) + VAL_W + PTR_W / 2; // depart from the source pointer box
    const tx = xOf(j) + NODE_W / 2;        // arrive at the target node center
    return orthogonalDetourPath(sx, tx, y0, laneY);
  };

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

      {/* Base link arrows — rendered after nodes so detour arrows show on top.
          Adjacent-forward links are straight; skip/backward links route through
          an assigned orthogonal lane (see linkPathFor). */}
      {nodes.map((nd) => {
        const toId = linkMap[nd.id];
        if (toId === undefined || toId === null) return null;
        const i = posOf[nd.id];
        const j = posOf[String(toId)];
        if (i === undefined || j === undefined) return null;
        return (
          <path
            key={`arrow-${nd.id}`}
            d={linkPathFor(i, j, `${nd.id}->${toId}`)}
            stroke="var(--kn-ink-2)"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#ll-arrow)"
            style={{ transition: "opacity 0.25s ease" }}
          />
        );
      })}

      {/* changedLinks — the re-link crux (B-4): the NEW arrow visibly DRAWS
          from source to destination (stroke-dashoffset), green, on top. Routes
          through the same assigned lane as its base link when non-adjacent, so
          the draw-in plays along the routed path. */}
      {(visual.changedLinks ?? []).map((lk) => {
        const fi = idxOf[lk.from];
        if (fi === undefined) return null;
        const ti = idxOf[String(lk.to)];
        if (ti === undefined) return null;
        return (
          <path
            key={`changed-arrow-${lk.from}-${lk.to}`}
            d={linkPathFor(fi, ti, `${lk.from}->${lk.to}`)}
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
