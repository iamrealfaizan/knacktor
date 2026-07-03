"use client";

// Queue / Deque renderer — per SimulationRules B-6 + C-6.
// Shape: horizontal cells (48×48), open both ends, front left / rear right.
// items[0] = front, items[length-1] = rear.
// Covers: BFS traversal, sliding window max (monotonic deque), level-order processing.

import type { QueueVisualState } from "@/lib/trace";
import { fitTextSize } from "./renderer-utils";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";

const CELL = 48;    // per SimulationRules A-3: "Queue cell (horizontal) | 48×48"
const GAP = 4;      // per SimulationRules A-3: "Queue cell | 4px gap"
const PITCH = CELL + GAP;
const CELL_R = 6;

export function QueueRenderer({ visual }: { visual: QueueVisualState }) {
  const { items, label } = visual;
  const n = items.length;

  // items[0] = front (left), items[n-1] = rear (right)
  const rowW = Math.max(n, 1) * CELL + Math.max(n - 1, 0) * GAP;
  const x0 = -rowW / 2;
  const xOf = (i: number) => x0 + i * PITCH;

  const PAD = 12;
  const containerW = rowW + PAD * 2;
  const containerH = CELL + PAD * 2;

  return (
    <g>
      {/* Label */}
      {label && (
        <text
          x={0}
          y={-CELL / 2 - PAD - 20}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fontWeight={700}
          letterSpacing={1.5}
          fill="var(--kn-ink-2)"
        >
          {label.toUpperCase()}
        </text>
      )}

      {/* Container rail — open at both ends (top + bottom walls, no left/right) */}
      <line
        x1={-containerW / 2}
        y1={-containerH / 2}
        x2={containerW / 2}
        y2={-containerH / 2}
        stroke="var(--kn-border-1)"
        strokeWidth={1.5}
      />
      <line
        x1={-containerW / 2}
        y1={containerH / 2}
        x2={containerW / 2}
        y2={containerH / 2}
        stroke="var(--kn-border-1)"
        strokeWidth={1.5}
      />

      {/* Cells — keyed by value+occurrence (NOT index) so a dequeue keeps the
          remaining cells' keys stable and they GLIDE left one slot; a new rear
          cell mounts a fresh key and plays the B-6 slide-in-from-right. */}
      {(() => {
        const seen: Record<string, number> = {};
        return items.map((item, i) => {
          const s = cellStateStyle(item.state);
          const v = String(item.value);
          const occ = (seen[v] = (seen[v] ?? 0) + 1);
          const cx = xOf(i) + CELL / 2;
          return (
            <g
              key={`${v}#${occ}`}
              transform={`translate(${cx - CELL / 2}, ${-CELL / 2})`}
              style={{ transition: MOTION.glide, opacity: s.opacity }}
            >
              <g className="kn-anim-queue-enter">
                <rect
                  x={0}
                  y={0}
                  width={CELL}
                  height={CELL}
                  rx={CELL_R}
                  fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                  className={s.pulse ? "kn-anim-cell-pulse" : undefined}
                  style={{ transition: MOTION.flash }}
                />
                <text
                  x={CELL / 2}
                  y={CELL / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={fitTextSize(item.value, CELL, 17)}
                  fontWeight={600}
                  fill="var(--kn-ink-0)"
                >
                  {v}
                </text>
              </g>
            </g>
          );
        });
      })()}

      {/* Empty placeholder */}
      {n === 0 && (
        <text
          x={0}
          y={1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontSize={13}
          fill="var(--kn-ink-2)"
        >
          (empty)
        </text>
      )}

      {/* front → pill below-left */}
      {n > 0 && (
        <g transform={`translate(${xOf(0) + CELL / 2}, ${CELL / 2 + 18})`}>
          <rect x={-20} y={0} width={40} height={18} rx={9} fill="var(--kn-ptr-lo)" opacity={0.18} stroke="var(--kn-ptr-lo)" strokeWidth={1} />
          <text
            x={0} y={10}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize={9} fontWeight={700}
            fill="var(--kn-ptr-lo)"
          >
            front
          </text>
          <line x1={0} y1={-2} x2={0} y2={-CELL / 2 - PAD / 2} stroke="var(--kn-ptr-lo)" strokeWidth={1} opacity={0.5} />
        </g>
      )}

      {/* rear pill below-right */}
      {n > 0 && (
        <g transform={`translate(${xOf(n - 1) + CELL / 2}, ${CELL / 2 + 18})`}>
          <rect x={-18} y={0} width={36} height={18} rx={9} fill="var(--kn-ptr-hi)" opacity={0.18} stroke="var(--kn-ptr-hi)" strokeWidth={1} />
          <text
            x={0} y={10}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize={9} fontWeight={700}
            fill="var(--kn-ptr-hi)"
          >
            rear
          </text>
          <line x1={0} y1={-2} x2={0} y2={-CELL / 2 - PAD / 2} stroke="var(--kn-ptr-hi)" strokeWidth={1} opacity={0.5} />
        </g>
      )}

      {/* Direction arrow: enqueue → from right, dequeue ← from left */}
      <text
        x={-containerW / 2 - 30}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--kn-ptr-lo)"
      >
        dequeue ←
      </text>
      <text
        x={containerW / 2 + 36}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--kn-ptr-hi)"
      >
        → enqueue
      </text>
    </g>
  );
}
