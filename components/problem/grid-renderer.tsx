"use client";

// 2D Grid / Matrix renderer — per SimulationRules B-11.
// Shape: square cells, 1px gridlines, NO rounded corners (must tile).
// Start/end cells carry a glyph (▶ / ◎) in addition to color.
// Covers: number of islands, word search, shortest path, flood fill,
//         rotate image, spiral matrix, set matrix zeroes, game of life.

import type { GridVisualState, CellState } from "@/lib/trace";

const CELL = 28;       // cell size in SVG units
const GRID_LINE = 1;   // gridline width

const PTR_PALETTE = [
  "var(--kn-ptr-i)", "var(--kn-ptr-j)", "var(--kn-ptr-lo)",
  "var(--kn-ptr-hi)", "var(--kn-special)", "var(--kn-amber)",
];

function cellFill(state: CellState): { fill: string; textFill: string; glyph?: string } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", textFill: "var(--kn-current)" };
    case "compared":
      return { fill: "var(--kn-blue-soft)", textFill: "var(--kn-ink-0)" };
    case "frontier":
      return { fill: "var(--kn-amber-subtle)", textFill: "var(--kn-ink-0)" };
    case "visited":
      return { fill: "var(--kn-surface-1)", textFill: "var(--kn-ink-1)" };
    case "result":
      return { fill: "var(--kn-result-subtle)", textFill: "var(--kn-result)", glyph: "◎" };
    case "path":
      return { fill: "var(--kn-amber-subtle)", textFill: "var(--kn-gold)" };
    case "special":
      return { fill: "var(--kn-current-subtle)", textFill: "var(--kn-special)", glyph: "▶" };
    case "error":
      return { fill: "var(--kn-error-subtle)", textFill: "var(--kn-error)" };
    case "dimmed":
      return { fill: "var(--kn-surface-1)", textFill: "var(--kn-ink-2)" };
    // "wall" / "blocked" is often represented by a dark fill
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", textFill: "var(--kn-ink-0)" };
  }
}

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
          const { fill, textFill } = cellFill(cell.state ?? "idle");
          const cx = xOf(ci);
          const cy = yOf(ri);
          const valStr = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";

          return (
            <g key={`${ri}-${ci}`} style={{ transition: "opacity 0.25s ease" }}>
              <rect
                x={cx + GRID_LINE}
                y={cy + GRID_LINE}
                width={CELL - GRID_LINE * 2}
                height={CELL - GRID_LINE * 2}
                rx={0}
                fill={fill}
                style={{ transition: "fill 0.18s ease" }}
              />
              {valStr !== "" && (
                <text
                  x={cx + CELL / 2}
                  y={cy + CELL / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={CELL > 24 ? 12 : 10}
                  fontWeight={500}
                  fill={textFill}
                  style={{ pointerEvents: "none" }}
                >
                  {valStr.length > 3 ? valStr.slice(0, 3) : valStr}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Row + column index labels */}
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

      {/* Pointer overlays — row/col cursor cross-hair */}
      {pointers.map((p, pi) => {
        const color = PTR_PALETTE[pi % PTR_PALETTE.length];
        const cx = xOf(p.col) + CELL / 2;
        const cy = yOf(p.row) + CELL / 2;
        return (
          <g
            key={p.name}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
            transform={`translate(${cx}, ${cy})`}
          >
            {/* Halo on current cell */}
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
              style={{ transition: "all 0.28s ease" }}
            />
            {/* Pointer label pill below */}
            <g transform={`translate(0, ${CELL / 2 + 2 + pi * 20})`}>
              <rect x={-16} y={0} width={32} height={16} rx={8} fill={color} />
              <text
                x={0} y={9}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="var(--font-mono)" fontSize={8} fontWeight={700} fill="#fff"
              >
                {p.name}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
