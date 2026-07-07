/**
 * Edge geometry helpers — endpoints backed off to node boundaries so strokes
 * and arrowheads land on the circle's rim, not its center. Extracted from the
 * duplicated math in graph-renderer (arrowEndpoints) and tree-renderer
 * (TreeEdge / NullStub).
 */
export interface EdgeEndpoints {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  /** total center-to-center distance */
  dist: number;
}

export function edgeEndpoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number = r1
): EdgeEndpoints {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    sx: x1 + (dx / dist) * r1,
    sy: y1 + (dy / dist) * r1,
    ex: x2 - (dx / dist) * r2,
    ey: y2 - (dy / dist) * r2,
    dist,
  };
}

/** SVG path string for a straight boundary-to-boundary edge. */
export function edgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number = r1
): string {
  const { sx, sy, ex, ey } = edgeEndpoints(x1, y1, x2, y2, r1, r2);
  return `M ${sx} ${sy} L ${ex} ${ey}`;
}

/**
 * Orthogonal detour path for a link that skips nodes (linked-list cycle-back,
 * mid-rewire reversal, non-adjacent re-link). Instead of one straight segment
 * that slices through every intervening node, the link rises/drops to a
 * dedicated lane, runs horizontally across, then returns to the row — so it's
 * always clear which node points where.
 *
 * Right-angle segments with small rounded corners for legibility. The endpoints
 * (`x1`,`x2`) are the on-row attach points at baseline `y0`; `laneY` is the
 * signed lane offset the horizontal run sits at (negative = above the row,
 * positive = below). The corner radius is clamped so short detours still bend.
 */
export function orthogonalDetourPath(
  x1: number,
  x2: number,
  y0: number,
  laneY: number,
  radius: number = 8
): string {
  const dir = x2 >= x1 ? 1 : -1;           // horizontal travel direction
  const vSign = laneY >= y0 ? 1 : -1;      // vertical travel direction (down/up)
  const span = Math.abs(x2 - x1);
  const rise = Math.abs(laneY - y0);
  // Clamp the corner radius so it never exceeds half of the shortest leg.
  const r = Math.max(0, Math.min(radius, span / 2, rise / 2));
  if (r < 0.5) {
    // Degenerate (tiny) detour — fall back to crisp right angles.
    return `M ${x1} ${y0} L ${x1} ${laneY} L ${x2} ${laneY} L ${x2} ${y0}`;
  }
  // Up/down out of the row, across the lane, then back down/up into the target.
  return [
    `M ${x1} ${y0}`,
    `L ${x1} ${laneY - vSign * r}`,
    `Q ${x1} ${laneY} ${x1 + dir * r} ${laneY}`,
    `L ${x2 - dir * r} ${laneY}`,
    `Q ${x2} ${laneY} ${x2} ${laneY - vSign * r}`,
    `L ${x2} ${y0}`,
  ].join(" ");
}
