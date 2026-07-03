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
