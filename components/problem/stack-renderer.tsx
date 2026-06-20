"use client";

// Stack renderer — per SimulationRules B-5 + C-5.
// Shape: vertical cells (88×40) in an open-top container with a solid base.
// items[0] = bottom, items[length-1] = TOS.
// Covers: monotonic stack, valid parentheses, expression eval, histogram, backtracking.

import type { StackVisualState, CellState } from "@/lib/trace";
import { fitTextSize } from "./renderer-utils";

const CELL_W = 88;    // per SimulationRules A-3: "Stack cell (vertical) | 88×40"
const CELL_H = 40;
const CELL_GAP = 4;
const CELL_R = 6;
const CONTAINER_PAD = 8;

function cellStyle(state: CellState): { fill: string; stroke: string; strokeWidth: number; opacity: number } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", strokeWidth: 2.5, opacity: 1 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", strokeWidth: 2, opacity: 1 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", strokeWidth: 2.5, opacity: 1 };
    case "frontier":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-amber)", strokeWidth: 2, opacity: 1 };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", strokeWidth: 2.5, opacity: 1 };
    case "error":
      return { fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)", strokeWidth: 2.5, opacity: 1 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 0.7 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 0.35 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 1 };
  }
}

export function StackRenderer({ visual }: { visual: StackVisualState }) {
  const { items, label } = visual;
  const n = items.length;

  // Build from bottom up: item[0] at bottom, item[n-1] (TOS) at top.
  // In SVG, y increases downward, so TOS has the smallest y.
  // We center the stack vertically.
  const totalH = n * CELL_H + Math.max(0, n - 1) * CELL_GAP;
  const containerH = totalH + CONTAINER_PAD * 2 + 20; // +20 for base
  const containerW = CELL_W + CONTAINER_PAD * 2;

  // y of TOS in the stack coord system (top of TOS cell = 0, grows down)
  const yOf = (i: number) => {
    // i=0 is bottom, i=n-1 is TOS
    // TOS is at top of visual; bottom is at bottom
    return (n - 1 - i) * (CELL_H + CELL_GAP);
  };

  return (
    <g transform={`translate(0, ${-containerH / 2 + 10})`}>
      {/* Container walls (open top) */}
      {/* Left wall */}
      <line
        x1={-containerW / 2}
        y1={-4}
        x2={-containerW / 2}
        y2={containerH}
        stroke="var(--kn-border-1)"
        strokeWidth={2}
      />
      {/* Right wall */}
      <line
        x1={containerW / 2}
        y1={-4}
        x2={containerW / 2}
        y2={containerH}
        stroke="var(--kn-border-1)"
        strokeWidth={2}
      />
      {/* Solid base */}
      <line
        x1={-containerW / 2}
        y1={containerH}
        x2={containerW / 2}
        y2={containerH}
        stroke="var(--kn-border-1)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Stack label */}
      {label && (
        <text
          x={0}
          y={-20}
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

      {/* Cells */}
      <g transform={`translate(0, ${CONTAINER_PAD})`}>
        {items.map((item, i) => {
          const s = cellStyle(item.state);
          const y = yOf(i);
          const isTOS = i === n - 1;

          return (
            <g
              key={i}
              transform={`translate(0, ${y})`}
              style={{ transition: "transform 0.3s cubic-bezier(.34,1.2,.4,1)", opacity: s.opacity }}
            >
              <rect
                x={-CELL_W / 2}
                y={0}
                width={CELL_W}
                height={CELL_H}
                rx={CELL_R}
                fill={s.fill}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
              />
              <text
                x={0}
                y={CELL_H / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={fitTextSize(item.value, CELL_W, 16)}
                fontWeight={isTOS ? 700 : 500}
                fill="var(--kn-ink-0)"
              >
                {String(item.value)}
              </text>

              {/* TOS → pill to the right */}
              {isTOS && (
                <g transform={`translate(${CELL_W / 2 + 6}, ${CELL_H / 2})`}>
                  <line x1={0} y1={0} x2={20} y2={0} stroke="var(--kn-ptr-i)" strokeWidth={1.5} />
                  <rect x={20} y={-9} width={28} height={18} rx={9} fill="var(--kn-ptr-i)" />
                  <text
                    x={34} y={1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontFamily="var(--font-mono)" fontSize={9} fontWeight={700} fill="#fff"
                  >
                    top
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Empty stack placeholder */}
        {n === 0 && (
          <text
            x={0}
            y={CELL_H / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
            fontSize={13}
            fill="var(--kn-ink-2)"
          >
            (empty)
          </text>
        )}
      </g>

      {/* Depth label */}
      <text
        x={-containerW / 2 - 12}
        y={containerH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--kn-ink-2)"
        transform={`rotate(-90, ${-containerW / 2 - 12}, ${containerH / 2})`}
      >
        depth: {n}
      </text>
    </g>
  );
}
