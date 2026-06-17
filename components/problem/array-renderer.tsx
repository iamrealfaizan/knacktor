"use client";

import type { ArrayVisualState, CellState } from "@/lib/trace";

const CELL = 48;
const GAP = 8;
const PITCH = CELL + GAP;
const LANES = ["i", "j", "lo", "hi"] as const;

const PTR_COLOR: Record<string, string> = {
  i: "var(--kn-ptr-i)",
  j: "var(--kn-ptr-j)",
  lo: "var(--kn-ptr-lo)",
  hi: "var(--kn-ptr-hi)",
};

// Layer-1 cell appearance per semantic state
function cellStyle(state: CellState): {
  fill: string;
  stroke: string;
  width: number;
  opacity: number;
  pulse?: boolean;
} {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", width: 2.5, opacity: 1 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", width: 2.5, opacity: 1 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", width: 2.5, opacity: 1, pulse: true };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", width: 2.5, opacity: 1 };
    case "frontier":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-amber)", width: 2, opacity: 1 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-compared)", width: 2, opacity: 0.85 };
    case "path":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-gold)", width: 2.5, opacity: 1 };
    case "error":
      return { fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)", width: 2.5, opacity: 1 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", width: 1.5, opacity: 0.45 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", width: 1.5, opacity: 1 };
  }
}

export interface ArrayRenderProps {
  visual: ArrayVisualState;
  vars: Record<string, unknown>;
  target: number;
}

/** Returns SVG content (a fragment) to be placed inside the Stage camera group. */
export function ArrayRenderer({ visual, vars, target }: ArrayRenderProps) {
  const { values, cellStates, pointers, window: win } = visual;
  const n = values.length;
  const rowW = n * CELL + (n - 1) * GAP;
  const x0 = -rowW / 2;
  const xOf = (k: number) => x0 + k * PITCH;

  // Sum chip — derived from the four selected pointers + s
  const s = vars.s;
  const showSum =
    typeof s === "number" &&
    ["i", "j", "lo", "hi"].every((p) => pointers.some((q) => q.name === p));
  let sumExpr = "";
  let relation = "";
  let relColor = "var(--kn-ink-1)";
  if (showSum) {
    const sel = ["i", "j", "lo", "hi"].map(
      (p) => values[pointers.find((q) => q.name === p)!.at]
    );
    sumExpr = `${sel.join(" + ")} = ${s}`;
    if (s === target) {
      relation = `= target ${target}`;
      relColor = "var(--kn-result)";
    } else if ((s as number) < target) {
      relation = `< target ${target}`;
      relColor = "var(--kn-ptr-lo)";
    } else {
      relation = `> target ${target}`;
      relColor = "var(--kn-ptr-hi)";
    }
  }

  return (
    <>
      {/* Window tray (range), behind cells */}
      {win && (
        <rect
          x={xOf(win.from) - 4}
          y={-CELL / 2 - 4}
          width={(win.to - win.from) * PITCH + CELL + 8}
          height={CELL + 8}
          rx={10}
          fill="none"
          stroke="var(--kn-ink-2)"
          strokeWidth={2}
          strokeDasharray="5 4"
          opacity={0.5}
          style={{ transition: "x 0.3s ease, width 0.3s ease" }}
        />
      )}

      {/* Sum chip above the array */}
      {showSum && (
        <g transform={`translate(0, ${-CELL / 2 - 52})`}>
          <SumChip expr={sumExpr} relation={relation} relColor={relColor} />
        </g>
      )}

      {/* Cells (Layer 1) */}
      {values.map((v, k) => {
        const st = cellStyle(cellStates[String(k)] ?? "idle");
        return (
          <g key={k} transform={`translate(${xOf(k)}, 0)`} opacity={st.opacity} style={{ transition: "opacity 0.3s ease" }}>
            <rect
              className={st.pulse ? "kn-anim-cell-pulse" : undefined}
              x={0}
              y={-CELL / 2}
              width={CELL}
              height={CELL}
              rx={6}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth={st.width}
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
            />
            <text
              x={CELL / 2}
              y={2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={18}
              fontWeight={600}
              fill="var(--kn-ink-0)"
            >
              {v}
            </text>
            <text
              x={CELL / 2}
              y={CELL / 2 + 14}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--kn-ink-2)"
            >
              {k}
            </text>
          </g>
        );
      })}

      {/* Pointers (Layer 2) — gutter markers that GLIDE between cells */}
      {pointers.map((p) => {
        const lane = Math.max(0, LANES.indexOf(p.name as (typeof LANES)[number]));
        const color = PTR_COLOR[p.name] ?? "var(--kn-ink-1)";
        const caretY = CELL / 2 + 30;
        const pillY = caretY + lane * 22;
        return (
          <g
            key={p.name}
            transform={`translate(${xOf(p.at) + CELL / 2}, 0)`}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
          >
            {/* connector for lower lanes */}
            {lane > 0 && (
              <line x1={0} y1={caretY} x2={0} y2={pillY} stroke={color} strokeWidth={1} opacity={0.5} />
            )}
            {/* caret */}
            <path d={`M 0 ${caretY - 8} L -6 ${caretY} L 6 ${caretY} Z`} fill={color} />
            {/* label pill */}
            <g transform={`translate(0, ${pillY})`}>
              <rect x={-15} y={0} width={30} height={18} rx={9} fill={color} />
              <text
                x={0}
                y={10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fontWeight={700}
                fill="#fff"
              >
                {p.name}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}

function SumChip({
  expr,
  relation,
  relColor,
}: {
  expr: string;
  relation: string;
  relColor: string;
}) {
  // approximate width from text length (mono ~7.5px/char at 13px)
  const w = Math.max(120, expr.length * 8 + 24);
  return (
    <g>
      <rect
        x={-w / 2}
        y={-14}
        width={w}
        height={28}
        rx={9}
        fill="var(--kn-surface-0)"
        stroke="var(--kn-border-0)"
        strokeWidth={1}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={13}
        fontWeight={600}
        fill="var(--kn-ink-0)"
      >
        {expr}
      </text>
      <text
        x={0}
        y={30}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={13}
        fontWeight={700}
        fill={relColor}
      >
        {relation}
      </text>
    </g>
  );
}
