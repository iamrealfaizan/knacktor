"use client";

/**
 * Small shared SVG atoms used by every renderer: the uppercase structure
 * label, the empty-container placeholder, index labels, and the creation
 * pop-in wrapper (mandated behavior #1 — scale .3→1 + fade on mount).
 */

/** Uppercase mono section label (e.g. "STACK", "QUEUE front→rear"). */
export function StructureLabel({
  x = 0,
  y,
  children,
  anchor = "middle",
}: {
  x?: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily="var(--font-mono)"
      fontSize={10}
      fontWeight={700}
      letterSpacing="0.12em"
      fill="var(--kn-ink-2)"
    >
      {children}
    </text>
  );
}

/** "(empty)" placeholder shown inside a container before population. */
export function EmptyPlaceholder({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="var(--font-mono)"
      fontSize={11}
      fill="var(--kn-ink-2)"
      opacity={0.7}
    >
      (empty)
    </text>
  );
}

/** Index label below a cell. */
export function IndexLabel({
  x,
  y,
  index,
}: {
  x: number;
  y: number;
  index: number | string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-mono)"
      fontSize={11}
      fill="var(--kn-ink-2)"
    >
      {index}
    </text>
  );
}

/**
 * Creation pop-in (mandated behavior #1): wraps children in a group that
 * scales .3→1 + fades on MOUNT. Give it a stable identity key from the parent
 * so it fires exactly when the element is created, not on every step.
 * Reduced-motion users get an instant appearance (globals.css guard).
 */
export function PopIn({
  x = 0,
  y = 0,
  children,
}: {
  x?: number;
  y?: number;
  children: React.ReactNode;
}) {
  // Nested groups: the CSS scale animation must not override the positioning
  // translate (CSS `transform` beats the SVG transform attribute on the same
  // element), so position on the outer <g>, animate the inner one.
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="kn-anim-pop-in">{children}</g>
    </g>
  );
}
