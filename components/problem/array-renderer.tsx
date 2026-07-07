"use client";

import type { ArrayVisualState } from "@/lib/trace";
import { fitTextSize, formatCellValue } from "./renderer-utils";
import { cellStateStyle } from "./shared/cell-state";
import { MOTION } from "./shared/motion";
import { PointerMarker } from "./shared/pointer-pill";
import { GhostTrail } from "./shared/ghost-trail";
import { IndexLabel, PopIn } from "./shared/atoms";

const CELL = 48;
const GAP = 8;
const PITCH = CELL + GAP;

export interface ArrayRenderProps {
  visual: ArrayVisualState;
  vars: Record<string, unknown>;
  target: number;
}

/** Returns SVG content (a fragment) to be placed inside the Stage camera group. */
export function ArrayRenderer({ visual, vars, target }: ArrayRenderProps) {
  const { values, cellStates, pointers, window: win, ghosts } = visual;
  const n = values.length;
  const rowW = n * CELL + (n - 1) * GAP;
  const x0 = -rowW / 2;
  const xOf = (k: number) => x0 + k * PITCH;

  // Stage chip — prefer the data-driven readout from the tracer; otherwise fall
  // back to the legacy 4-pointer sum derivation (kept for non-bundle traces).
  const readout = visual.readout;
  let sumExpr = "";
  let relation = "";
  let relColor = "var(--kn-ink-1)";
  let showSum = false;
  if (readout) {
    showSum = true;
    sumExpr = readout.expr;
    relation = readout.relation ?? "";
    relColor = readout.relationColor ? `var(--kn-${readout.relationColor})` : "var(--kn-ink-1)";
  } else {
    const s = vars.s;
    showSum =
      typeof s === "number" &&
      ["i", "j", "lo", "hi"].every((p) => pointers.some((q) => q.name === p));
    if (showSum) {
      const sel = ["i", "j", "lo", "hi"].map(
        (p) => values[pointers.find((q) => q.name === p)!.at]
      );
      sumExpr = `${sel.join(" + ")} = ${s}`;
      if (s === target) { relation = `= target ${target}`; relColor = "var(--kn-result)"; }
      else if ((s as number) < target) { relation = `< target ${target}`; relColor = "var(--kn-ptr-lo)"; }
      else { relation = `> target ${target}`; relColor = "var(--kn-ptr-hi)"; }
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
          style={{ transition: MOTION.tray }}
        />
      )}

      {/* Sum chip above the array */}
      {showSum && (
        <g transform={`translate(0, ${-CELL / 2 - 52})`}>
          <SumChip expr={sumExpr} relation={relation} relColor={relColor} />
        </g>
      )}

      {/* Ghost trail (behavior #3) — relocated values fade at their origin
          while the write-pop lands at the destination. */}
      <GhostTrail
        ghosts={ghosts}
        posOf={(k) => ({ x: xOf(k) + CELL / 2, y: 0 })}
        size={CELL}
        labelOf={(g) => (values[g.to] != null ? formatCellValue(values[g.to]) : undefined)}
      />

      {/* Cells (Layer 1). The slot <g> is keyed by index (an array slot IS a
          position); PopIn fires once per slot creation (behavior #1); the inner
          group is keyed by VALUE so a write re-mounts it with a scale-pop
          (behavior #2). */}
      {values.map((v, k) => {
        const st = cellStateStyle(cellStates[String(k)]);
        const label = formatCellValue(v);
        return (
          <g key={k} transform={`translate(${xOf(k)}, 0)`} opacity={st.opacity} style={{ transition: MOTION.fade }}>
            <PopIn>
              <g key={`v-${label}`} className="kn-anim-write-pop">
                <rect
                  className={st.pulse ? "kn-anim-cell-pulse" : undefined}
                  x={0}
                  y={-CELL / 2}
                  width={CELL}
                  height={CELL}
                  rx={6}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={st.strokeWidth}
                  strokeDasharray={st.dashed ? "5 4" : undefined}
                  style={{ transition: MOTION.flash }}
                />
                <text
                  x={CELL / 2}
                  y={2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={fitTextSize(label, CELL)}
                  fontWeight={600}
                  fill="var(--kn-ink-0)"
                >
                  {label}
                </text>
              </g>
            </PopIn>
            <IndexLabel x={CELL / 2} y={CELL / 2 + 14} index={k} />
          </g>
        );
      })}

      {/* Pointers (Layer 2) — shared gliding gutter markers with fixed identity hues */}
      {pointers.map((p, pi) => (
        <PointerMarker
          key={p.name}
          name={p.name}
          x={xOf(p.at) + CELL / 2}
          laneIndex={pi}
          caretY={CELL / 2 + 30}
        />
      ))}
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
