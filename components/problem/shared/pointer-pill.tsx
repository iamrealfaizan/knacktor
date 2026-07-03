"use client";

import { MOTION } from "./motion";

/**
 * Layer-2 pointer identity (SimulationRules §A-3): named pointers keep one
 * fixed hue for the whole run; unknown names get a stable palette color by
 * lane index. Replaces per-renderer PTR_COLOR/PTR_PALETTE copies (and the
 * tree/graph renderers that hardcoded every pill to --kn-ptr-i).
 */
const PTR_COLOR: Record<string, string> = {
  i: "var(--kn-ptr-i)",
  lo: "var(--kn-ptr-lo)",
  lp: "var(--kn-ptr-lo)",
  left: "var(--kn-ptr-lo)",
  slow: "var(--kn-ptr-lo)",
  prev: "var(--kn-ptr-lo)",
  j: "var(--kn-ptr-j)",
  next: "var(--kn-ptr-j)",
  hi: "var(--kn-ptr-hi)",
  rp: "var(--kn-ptr-hi)",
  right: "var(--kn-ptr-hi)",
  fast: "var(--kn-ptr-hi)",
  tail: "var(--kn-ptr-hi)",
  mid: "var(--kn-special)",
  curr: "var(--kn-ptr-i)",
  current: "var(--kn-ptr-i)",
  head: "var(--kn-ptr-i)",
};
const PTR_PALETTE = [
  "var(--kn-ptr-i)", "var(--kn-ptr-j)", "var(--kn-ptr-lo)",
  "var(--kn-ptr-hi)", "var(--kn-special)", "var(--kn-amber)",
];

export function ptrColor(name: string, laneIndex: number): string {
  return PTR_COLOR[name] ?? PTR_PALETTE[laneIndex % PTR_PALETTE.length];
}

/**
 * The caret + connector + label pill marker, positioned by the PARENT via a
 * translated <g> (so the whole marker glides with `MOTION.pointer`).
 * `caretY` is where the caret tip row sits (e.g. below a cell); `lane` stacks
 * multiple pills without overlap.
 */
export function PointerPill({
  name,
  color,
  caretY,
  lane = 0,
  pillWidth = 30,
}: {
  name: string;
  color: string;
  caretY: number;
  lane?: number;
  pillWidth?: number;
}) {
  const pillY = caretY + lane * 22;
  return (
    <>
      {lane > 0 && (
        <line x1={0} y1={caretY} x2={0} y2={pillY} stroke={color} strokeWidth={1} opacity={0.5} />
      )}
      <path d={`M 0 ${caretY - 8} L -6 ${caretY} L 6 ${caretY} Z`} fill={color} />
      <g transform={`translate(0, ${pillY})`}>
        <rect x={-pillWidth / 2} y={0} width={pillWidth} height={18} rx={9} fill={color} />
        <text
          x={0}
          y={10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fontWeight={700}
          fill="var(--kn-surface-0)"
        >
          {name}
        </text>
      </g>
    </>
  );
}

/** Convenience: a fully positioned, gliding pointer marker. */
export function PointerMarker({
  name,
  x,
  laneIndex,
  caretY,
  pillWidth,
}: {
  name: string;
  x: number;
  laneIndex: number;
  caretY: number;
  pillWidth?: number;
}) {
  return (
    <g key={name} transform={`translate(${x}, 0)`} style={{ transition: MOTION.pointer }}>
      <PointerPill
        name={name}
        color={ptrColor(name, laneIndex)}
        caretY={caretY}
        lane={laneIndex}
        pillWidth={pillWidth}
      />
    </g>
  );
}
