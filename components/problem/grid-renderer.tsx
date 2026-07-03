"use client";

// 2D Grid / Matrix renderer — per SimulationRules B-11.
// Shape: square cells, 1px gridlines, NO rounded corners (must tile).
// Start/end cells carry a glyph (▶ / ◎) in addition to color.
// Wavefront: newly-recolored cells stagger by distance from the current cell
// (expanding ripple); `path` cells stagger BACKWARD from the result cell
// (gold traceback, end → start).
// Covers: number of islands, word search, shortest path, flood fill,
//         rotate image, spiral matrix, set matrix zeroes, game of life.

import type { GridVisualState } from "@/lib/trace";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";
import { PointerPill, ptrColor } from "./shared/pointer-pill";

const CELL = 28;       // cell size in SVG units
const GRID_LINE = 1;   // gridline width
const STAGGER_MS = 30; // per SimulationRules B-11: ≥30ms per BFS level
const STAGGER_CAP_MS = 360;

const GLYPHS: Partial<Record<string, string>> = {
  special: "▶", // start
  result: "◎",  // end / found
};

export function GridRenderer({ visual }: { visual: GridVisualState }) {
  const { rows, pointers } = visual;
  const numRows = rows.length;
  const numCols = numRows > 0 ? rows[0].length : 0;

  const gridW = numCols * CELL;
  const gridH = numRows * CELL;

  const x0 = -gridW / 2;
  const y0 = -gridH / 2;

  const xOf = (c: number) => x0 + c * CELL;
  const yOf = (r: number) => y0 + r * CELL;

  // Wavefront origin = the current cell (fallback: first pointer).
  let originR = -1;
  let originC = -1;
  // Traceback origin = the result/end cell (path stagger runs backward from it).
  let endR = -1;
  let endC = -1;
  rows.forEach((row, ri) =>
    row.forEach((cell, ci) => {
      if (cell.state === "current") { originR = ri; originC = ci; }
      if (cell.state === "result") { endR = ri; endC = ci; }
    })
  );
  if (originR < 0 && pointers.length > 0) {
    originR = pointers[0].row;
    originC = pointers[0].col;
  }

  const manhattan = (r1: number, c1: number, r2: number, c2: number) =>
    Math.abs(r1 - r2) + Math.abs(c1 - c2);

  return (
    <g>
      {/* Grid background */}
      <rect
        x={x0 - GRID_LINE}
        y={y0 - GRID_LINE}
        width={gridW + GRID_LINE * 2}
        height={gridH + GRID_LINE * 2}
        fill="var(--kn-border-0)"
        rx={0}
      />

      {/* Cells */}
      {rows.map((row, ri) =>
        row.map((cell, ci) => {
          const state = cell.state ?? "idle";
          const s = cellStateStyle(state);
          const cx = xOf(ci);
          const cy = yOf(ri);
          const valStr = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";
          const isWall = valStr === "#" || valStr === "█";
          const glyph = GLYPHS[state];

          // Discovery ripple: recolors farther from the current cell fire later.
          // Traceback: path cells stagger backward from the END cell instead.
          let delayMs = 0;
          if (state === "path" && endR >= 0) {
            delayMs = Math.min(manhattan(ri, ci, endR, endC) * 40, 500);
          } else if ((state === "frontier" || state === "visited") && originR >= 0) {
            delayMs = Math.min(manhattan(ri, ci, originR, originC) * STAGGER_MS, STAGGER_CAP_MS);
          }

          return (
            <g key={`${ri}-${ci}`}>
              <rect
                x={cx + GRID_LINE}
                y={cy + GRID_LINE}
                width={CELL - GRID_LINE * 2}
                height={CELL - GRID_LINE * 2}
                rx={0}
                fill={isWall ? "var(--kn-ink-2)" : s.fill}
                style={{
                  transition: `fill 0.18s ease ${delayMs}ms`,
                }}
              />
              {glyph && (
                <text
                  x={cx + CELL / 2}
                  y={cy + CELL / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill={s.textFill}
                  style={{ pointerEvents: "none" }}
                >
                  {glyph}
                </text>
              )}
              {!glyph && valStr !== "" && !isWall && (
                <text
                  x={cx + CELL / 2}
                  y={cy + CELL / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={CELL > 24 ? 12 : 10}
                  fontWeight={500}
                  fill={s.textFill}
                  style={{ pointerEvents: "none" }}
                >
                  {valStr.length > 3 ? valStr.slice(0, 3) : valStr}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Column indices */}
      {Array.from({ length: numCols }, (_, ci) => (
        <text
          key={`ci-${ci}`}
          x={xOf(ci) + CELL / 2}
          y={y0 - 8}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--kn-ink-2)"
        >
          {ci}
        </text>
      ))}
      {/* Row indices */}
      {Array.from({ length: numRows }, (_, ri) => (
        <text
          key={`ri-${ri}`}
          x={x0 - 10}
          y={yOf(ri) + CELL / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--kn-ink-2)"
        >
          {ri}
        </text>
      ))}

      {/* Pointer overlays — halo crosshair + shared pill, real identity hues */}
      {pointers.map((p, pi) => {
        const color = ptrColor(p.name, pi);
        const cx = xOf(p.col) + CELL / 2;
        const cy = yOf(p.row) + CELL / 2;
        return (
          <g key={p.name} style={{ transition: MOTION.pointer }} transform={`translate(${cx}, ${cy})`}>
            <rect
              x={-CELL / 2}
              y={-CELL / 2}
              width={CELL}
              height={CELL}
              fill="none"
              stroke={color}
              strokeWidth={2}
              rx={2}
              opacity={0.7}
            />
            <PointerPill name={p.name} color={color} caretY={CELL / 2 + 10} lane={pi} pillWidth={32} />
          </g>
        );
      })}
    </g>
  );
}
