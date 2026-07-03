"use client";

/**
 * Ghost trail (mandated behavior #3, SimulationRules §A-5): when a value
 * relocates, a translucent snapshot stays at the ORIGIN and fades while the
 * real element glides to its destination. Renderers pass `visual.ghosts`
 * (before→after positions) plus a position resolver.
 *
 * Keyed by name+from+to so each move animates exactly once per step; the
 * `kn-anim-ghost-fade` keyframe lives in globals.css and is reduced-motion
 * guarded there.
 */
export function GhostTrail({
  ghosts,
  posOf,
  size = 48,
  radius = 6,
  labelOf,
}: {
  ghosts: { name: string; from: number; to: number }[] | undefined;
  /** index → x center of that slot */
  posOf: (index: number) => { x: number; y: number };
  size?: number;
  radius?: number;
  /** optional value label rendered inside the ghost */
  labelOf?: (g: { name: string; from: number; to: number }) => string | undefined;
}) {
  if (!ghosts?.length) return null;
  return (
    <>
      {ghosts.map((g) => {
        if (g.from === g.to) return null;
        const { x, y } = posOf(g.from);
        const label = labelOf?.(g);
        return (
          <g
            key={`ghost-${g.name}-${g.from}-${g.to}`}
            transform={`translate(${x}, ${y})`}
            className="kn-anim-ghost-fade"
            pointerEvents="none"
          >
            <rect
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              rx={radius}
              fill="var(--kn-accent-soft)"
              stroke="var(--kn-current)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            {label != null && (
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={600}
                fill="var(--kn-current)"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
