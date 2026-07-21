// Custom renderer for Middle of the Linked List (fast & slow pointers).
//
// Why generic rendering was insufficient (D17 — 2 of 3 criteria met):
// (b) The spatial layout IS the teaching point. The entire algorithm is the
//     WIDENING GAP between two cursors moving at different speeds. A learner who
//     cannot see fast pulling away at exactly double rate has learned nothing.
// (c) The animation logic cannot be expressed through the DSL. The generic
//     `pointers` field glides every pointer one hop per step with identical
//     motion, so slow and fast would render as moving the same way — which
//     actively misrepresents the algorithm. A two-humped arc for fast against a
//     single hump for slow has no DSL expression.
//
// Honors SimulationRules C-4 ("Fast & Slow Pointers: two pointers move at 1x and
// 2x speed as distinct beats"), B-4 linked-list geometry, and the Layer-1/Layer-2
// rule: node fills carry algorithm state, pointer identity lives in the gutter.

"use client";

import type { CustomVisualState } from "@/lib/trace";

// ── Types ────────────────────────────────────────────────────────────────────

interface MiddleOfListVisual extends CustomVisualState {
  componentKey: "middle-of-the-linked-list";
  values: number[] | null;
  links: number[] | null;
  slow: number | null;
  fast: number | null;
  slowFrom: number | null;
  fastFrom: number | null;
  hops: number | null;
  buildIndex: number | null;
  result: number[] | null;
  phase: string | null;
}

// ── Geometry (per Design.md: linked-list node 84x48, 40px gap) ───────────────

const NODE_W = 84;
const VAL_W = 52;
const NODE_H = 48;
const GAP = 40;
const PITCH = NODE_W + GAP;
const NULL_W = 40;

const FAST_LANE_Y = -44; // apex of fast's arcs, above the chain
const SLOW_LANE_Y = NODE_H + 44; // apex of slow's arc, below the chain
const PILL_Y = NODE_H + 76; // pointer pills below everything

const xOf = (i: number) => i * PITCH;
const centerOf = (i: number) => xOf(i) + VAL_W / 2;

// ── Colors (design tokens only — theme-adaptive) ─────────────────────────────

const SLOW_COLOR = "var(--kn-ptr-lo)"; // blue, per shared pointer palette
const FAST_COLOR = "var(--kn-ptr-hi)"; // amber, per shared pointer palette

type NodeState = "idle" | "visited" | "current" | "result";

const NODE_STYLE: Record<NodeState, { fill: string; stroke: string; sw: number; ink: string }> = {
  idle: { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-0)", sw: 1.5, ink: "var(--kn-ink-0)" },
  visited: { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", sw: 2, ink: "var(--kn-ink-1)" },
  current: { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", sw: 2.5, ink: "var(--kn-current)" },
  result: { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", sw: 2.5, ink: "var(--kn-result)" },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function ListNode({ i, value, state }: { i: number; value: number; state: NodeState }) {
  const s = NODE_STYLE[state];
  const x = xOf(i);

  return (
    <g style={{ transition: "opacity 200ms ease" }}>
      {/* value box */}
      <rect
        x={x}
        y={0}
        width={VAL_W}
        height={NODE_H}
        rx={8}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={s.sw}
        style={{ transition: "fill 180ms ease, stroke 180ms ease, stroke-width 180ms ease" }}
      />
      {/* pointer box */}
      <rect
        x={x + VAL_W}
        y={0}
        width={NODE_W - VAL_W}
        height={NODE_H}
        rx={8}
        fill="var(--kn-surface-1)"
        stroke={s.stroke}
        strokeWidth={s.sw}
        style={{ transition: "stroke 180ms ease, stroke-width 180ms ease" }}
      />
      <text
        x={x + VAL_W / 2}
        y={NODE_H / 2 + 6}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={18}
        fontWeight={600}
        fill={s.ink}
        style={{ transition: "fill 180ms ease" }}
      >
        {value}
      </text>
      {/* index label below */}
      <text
        x={x + VAL_W / 2}
        y={NODE_H + 15}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--kn-ink-2)"
      >
        {i}
      </text>
    </g>
  );
}

function NextArrow({ from }: { from: number }) {
  const x1 = xOf(from) + NODE_W;
  const x2 = xOf(from + 1);
  const y = NODE_H / 2;

  return (
    <line
      x1={x1 + 2}
      y1={y}
      x2={x2 - 8}
      y2={y}
      stroke="var(--kn-ink-2)"
      strokeWidth={1.5}
      markerEnd="url(#motl-next)"
      opacity={0.75}
    />
  );
}

function NullTerminal({ atIndex }: { atIndex: number }) {
  const x = xOf(atIndex);
  return (
    <g>
      <rect
        x={x}
        y={NODE_H / 2 - 16}
        width={NULL_W}
        height={32}
        rx={8}
        fill="var(--kn-surface-0)"
        stroke="var(--kn-border-1)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <text
        x={x + NULL_W / 2}
        y={NODE_H / 2 + 5}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={14}
        fill="var(--kn-ink-2)"
        opacity={0.8}
      >
        ∅
      </text>
    </g>
  );
}

/** A single hop arc. `above` puts the hump over the chain (fast), else under (slow). */
function HopArc({
  fromX,
  toX,
  above,
  color,
  dashed,
}: {
  fromX: number;
  toX: number;
  above: boolean;
  color: string;
  dashed?: boolean;
}) {
  const startY = above ? -2 : NODE_H + 2;
  const apexY = above ? FAST_LANE_Y : SLOW_LANE_Y;
  const midX = (fromX + toX) / 2;
  const d = `M ${fromX} ${startY} Q ${midX} ${apexY} ${toX} ${startY}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={above ? "url(#motl-fast-head)" : "url(#motl-slow-head)"}
      className="kn-anim-draw-in"
      pathLength={1}
      opacity={0.95}
    />
  );
}

function PointerPill({
  x,
  label,
  color,
  sublabel,
}: {
  x: number;
  label: string;
  color: string;
  sublabel: string;
}) {
  const W = 74;
  const H = 22;
  return (
    <g style={{ transition: "transform 300ms cubic-bezier(.34,1.2,.4,1)" }} transform={`translate(${x - W / 2}, 0)`}>
      {/* stem up to the node */}
      <line x1={W / 2} y1={-8} x2={W / 2} y2={0} stroke={color} strokeWidth={2} opacity={0.7} />
      <rect x={0} y={0} width={W} height={H} rx={11} fill={color} opacity={0.16} />
      <rect x={0} y={0} width={W} height={H} rx={11} fill="none" stroke={color} strokeWidth={1.5} />
      <text
        x={W / 2}
        y={15}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={11}
        fontWeight={700}
        fill={color}
      >
        {label}
      </text>
      <text
        x={W / 2}
        y={H + 14}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--kn-ink-2)"
      >
        {sublabel}
      </text>
    </g>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function MiddleOfTheLinkedListVisualizer({
  visual,
}: {
  visual: MiddleOfListVisual;
}) {
  const values = visual.values ?? [];
  const links = visual.links ?? [];
  const slow = visual.slow;
  const fast = visual.fast;
  const fastFrom = visual.fastFrom;
  const slowFrom = visual.slowFrom;
  const hops = visual.hops ?? 0;
  const phase = visual.phase ?? "";
  const n = values.length;

  const returning = phase === "return";
  const traversing = slow !== null && fast !== null;

  // During the wiring phase only the links built so far exist.
  const wiredCount = links.length;

  // Index of the ∅ terminal, drawn just past the last node.
  const nullIndex = n;

  // ── Node states (Layer 1 — algorithm state only, never pointer identity) ──
  function stateOf(i: number): NodeState {
    if (returning && slow !== null) return i >= slow ? "result" : "visited";
    if (slow === null) return "idle";
    if (i === slow) return "current";
    if (i < slow) return "visited";
    return "idle";
  }

  // ── Hop arcs, revealed progressively ─────────────────────────────────────
  // An arc is drawn for each hop a cursor has ACTUALLY completed this round, so
  // the learner watches fast's first arc draw, then its second, then slow's
  // single one — rather than the whole round appearing at once. -2 is the
  // "no such node" sentinel, kept distinct from -1 (null / end of list).
  const NONE = -2;
  const linkAt = (i: number | null): number =>
    i !== null && i >= 0 && i < links.length ? links[i] : NONE;

  const terminalX = xOf(nullIndex) + NULL_W / 2;
  const xFor = (i: number) => (i >= 0 ? centerOf(i) : terminalX);

  const fastHop1 = linkAt(fastFrom);
  const fastHop2 = fastHop1 >= 0 ? linkAt(fastHop1) : NONE;
  // How many of fast's two hops have landed.
  const fastDone = fast === null ? 0 : fast === fastHop2 ? 2 : fast === fastHop1 ? 1 : 0;

  const slowHop1 = linkAt(slowFrom);
  const slowDone = slow !== null && slow === slowHop1 ? 1 : 0;

  const showArcs = traversing && (fastDone > 0 || slowDone > 0);

  // ── Camera / viewBox ─────────────────────────────────────────────────────
  const contentW = n * PITCH - GAP + GAP + NULL_W;
  const PAD_X = 28;
  const viewX = -PAD_X;
  const viewY = FAST_LANE_Y - 34;
  const viewW = contentW + PAD_X * 2;
  const viewH = PILL_Y + 46 - viewY;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", maxHeight: "100%" }}
        role="img"
        aria-label="Linked list with slow and fast cursors"
      >
        <defs>
          <marker id="motl-next" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--kn-ink-2)" opacity={0.75} />
          </marker>
          <marker id="motl-fast-head" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={FAST_COLOR} />
          </marker>
          <marker id="motl-slow-head" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={SLOW_COLOR} />
          </marker>
        </defs>

        {/* ── Lane captions ─────────────────────────────────────────────── */}
        {showArcs && (
          <>
            <text
              x={viewX + 6}
              y={FAST_LANE_Y - 12}
              fontFamily="var(--font-mono)"
              fontSize={10}
              fontWeight={700}
              letterSpacing={1.2}
              fill={FAST_COLOR}
            >
              FAST · 2 HOPS
            </text>
            <text
              x={viewX + 6}
              y={SLOW_LANE_Y + 16}
              fontFamily="var(--font-mono)"
              fontSize={10}
              fontWeight={700}
              letterSpacing={1.2}
              fill={SLOW_COLOR}
            >
              SLOW · 1 HOP
            </text>
          </>
        )}

        {/* ── Chain: next-pointer arrows drawn before nodes ─────────────── */}
        {values.map((_, i) => (i < wiredCount ? <NextArrow key={`arw-${i}`} from={i} /> : null))}

        {/* ── Nodes ─────────────────────────────────────────────────────── */}
        {values.map((v, i) => (
          <ListNode key={`node-${i}`} i={i} value={v} state={stateOf(i)} />
        ))}

        {/* ── Null terminal. Rendered as soon as the tail has a link at all,
             so the last node's arrow always lands on something — during the
             one step between wiring the tail (link = n) and nulling it
             (link = -1) the target is the same slot either way. ─────────── */}
        {wiredCount === n && n > 0 && <NullTerminal atIndex={nullIndex} />}

        {/* ── Hop arcs — the whole point of this component ──────────────── */}
        {fastDone >= 1 && fastFrom !== null && (
          <g key={`fast-a-${hops}`}>
            <HopArc fromX={xFor(fastFrom)} toX={xFor(fastHop1)} above color={FAST_COLOR} />
          </g>
        )}
        {fastDone >= 2 && (
          <g key={`fast-b-${hops}`}>
            <HopArc fromX={xFor(fastHop1)} toX={xFor(fastHop2)} above color={FAST_COLOR} />
          </g>
        )}
        {slowDone >= 1 && slowFrom !== null && slow !== null && (
          <g key={`slow-${hops}`}>
            <HopArc fromX={xFor(slowFrom)} toX={xFor(slow)} above={false} color={SLOW_COLOR} />
          </g>
        )}

        {/* ── Pointer pills (Layer 2 — gutter only) ─────────────────────── */}
        <g transform={`translate(0, ${PILL_Y})`}>
          {slow !== null && (
            <PointerPill
              x={centerOf(slow)}
              label="slow"
              color={SLOW_COLOR}
              sublabel={`+1 · moved ${hops}`}
            />
          )}
          {fast !== null && (
            <PointerPill
              x={fast >= 0 ? centerOf(fast) : xOf(nullIndex) + NULL_W / 2}
              label={fast >= 0 ? "fast" : "fast → ∅"}
              color={FAST_COLOR}
              sublabel={`+2 · moved ${hops * 2}`}
            />
          )}
        </g>

        {/* ── Gap badge: the number that makes the algorithm obvious ────── */}
        {traversing && slow !== null && fast !== null && fast >= 0 && fast > slow && (
          <text
            x={(centerOf(slow) + centerOf(fast)) / 2}
            y={SLOW_LANE_Y + 34}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={11}
            fontWeight={700}
            fill="var(--kn-ink-2)"
          >
            gap: {fast - slow} node{fast - slow === 1 ? "" : "s"}
          </text>
        )}
      </svg>
    </div>
  );
}
