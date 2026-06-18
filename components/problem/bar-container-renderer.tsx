"use client";

import type { BarContainerVisualState, CellState } from "@/lib/trace";

const BAR_W = 36;
const GAP = 12;
const PITCH = BAR_W + GAP;
const MAX_H = 140; // SVG units for the tallest bar

const PTR_COLOR: Record<string, string> = {
  lp: "var(--kn-ptr-lo)",
  rp: "var(--kn-ptr-hi)",
};

function barColor(state: CellState): { fill: string; stroke: string; opacity: number } {
  switch (state) {
    case "left":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-ptr-lo)", opacity: 1 };
    case "right":
      return { fill: "var(--kn-amber-subtle)", stroke: "var(--kn-ptr-hi)", opacity: 1 };
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", opacity: 1 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", opacity: 1 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-border-1)", opacity: 0.6 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", opacity: 0.3 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", opacity: 1 };
  }
}

export function BarContainerRenderer({ visual }: { visual: BarContainerVisualState }) {
  const { values, cellStates, pointers, container } = visual;
  const n = values.length;
  const maxVal = Math.max(...values, 1);

  const rowW = n * BAR_W + (n - 1) * GAP;
  const x0 = -rowW / 2;
  const xOf = (k: number) => x0 + k * PITCH;
  const scaleH = (v: number) => (v / maxVal) * MAX_H;

  return (
    <>
      {/* Water fill between container walls */}
      {container && container.left !== container.right && (
        <rect
          x={xOf(container.left)}
          y={-scaleH(container.waterHeight)}
          width={(container.right - container.left) * PITCH + BAR_W}
          height={scaleH(container.waterHeight)}
          fill="var(--kn-ptr-lo)"
          opacity={0.12}
          style={{ transition: "all 0.3s ease" }}
        />
      )}

      {/* Bars */}
      {values.map((v, k) => {
        const h = scaleH(v);
        const style = barColor(cellStates[String(k)] ?? "idle");
        return (
          <g key={k} style={{ transition: "opacity 0.3s ease" }} opacity={style.opacity}>
            <rect
              x={xOf(k)}
              y={-h}
              width={BAR_W}
              height={h}
              rx={4}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={1.5}
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease, y 0.3s ease, height 0.3s ease" }}
            />
            {/* value label inside bar (if tall enough) */}
            {h > 20 && (
              <text
                x={xOf(k) + BAR_W / 2}
                y={-h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={13}
                fontWeight={700}
                fill="var(--kn-ink-0)"
                style={{ pointerEvents: "none" }}
              >
                {v}
              </text>
            )}
            {/* value label above bar (if bar too short) */}
            {h <= 20 && (
              <text
                x={xOf(k) + BAR_W / 2}
                y={-h - 8}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fontWeight={600}
                fill="var(--kn-ink-1)"
              >
                {v}
              </text>
            )}
            {/* index label below baseline */}
            <text
              x={xOf(k) + BAR_W / 2}
              y={14}
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

      {/* Pointer labels below index labels */}
      {pointers.map((p) => {
        const color = PTR_COLOR[p.name] ?? "var(--kn-ink-1)";
        return (
          <g
            key={p.name}
            transform={`translate(${xOf(p.at) + BAR_W / 2}, 30)`}
            style={{ transition: "transform 0.28s cubic-bezier(.34,1.2,.4,1)" }}
          >
            <rect x={-16} y={0} width={32} height={18} rx={9} fill={color} />
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
        );
      })}

      {/* Area chip above bars */}
      {container && (
        <g transform={`translate(0, ${-MAX_H - 36})`}>
          <AreaChip area={container.area} width={container.width} waterHeight={container.waterHeight} />
        </g>
      )}
    </>
  );
}

function AreaChip({ area, width, waterHeight }: { area: number; width: number; waterHeight: number }) {
  const label = `area = ${width} × ${waterHeight} = ${area}`;
  const w = Math.max(140, label.length * 7.5 + 24);
  return (
    <g>
      <rect x={-w / 2} y={-14} width={w} height={28} rx={9} fill="var(--kn-surface-0)" stroke="var(--kn-border-0)" strokeWidth={1} />
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
        {label}
      </text>
    </g>
  );
}
