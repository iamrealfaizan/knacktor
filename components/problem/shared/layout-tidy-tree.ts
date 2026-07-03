/**
 * Reingold–Tilford tidy-tree layout (in-order leaf counting), extracted from
 * the duplicate implementations in tree-renderer and recursion-renderer.
 * y = depth × levelGap; x = midpoint of children; leaves spread by in-order.
 * Result is centered on x (and returns extents for vertical centering).
 */
export interface TidyNode {
  id: string;
  left?: string | null;
  right?: string | null;
  /** generic n-ary children (recursion trees); used when left/right absent */
  children?: string[];
}

export interface TidyLayout<T extends TidyNode> {
  nodes: { id: string; x: number; y: number; node: T }[];
  minY: number;
  maxY: number;
}

export function layoutTidyTree<T extends TidyNode>(
  nodes: T[],
  { leafSpan, levelGap }: { leafSpan: number; levelGap: number }
): TidyLayout<T> {
  if (!nodes.length) return { nodes: [], minY: 0, maxY: 0 };

  const nodeMap: Record<string, T> = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  const childrenOf = (n: T): string[] => {
    if (n.children?.length) return n.children.filter((c) => nodeMap[c]);
    const out: string[] = [];
    if (n.left && nodeMap[n.left]) out.push(n.left);
    if (n.right && nodeMap[n.right]) out.push(n.right);
    return out;
  };

  // Root(s): nodes that are nobody's child.
  const isChild = new Set<string>();
  nodes.forEach((n) => childrenOf(n).forEach((c) => isChild.add(c)));
  const roots = nodes.filter((n) => !isChild.has(n.id));
  const root = roots[0];
  if (!root) {
    return {
      nodes: nodes.map((n, i) => ({ id: n.id, x: i * leafSpan, y: 0, node: n })),
      minY: 0,
      maxY: 0,
    };
  }

  const layout: { id: string; x: number; y: number; node: T }[] = [];
  let leafIndex = 0;

  function assign(id: string, depth: number): number {
    const nd = nodeMap[id];
    if (!nd) return 0;
    const kids = childrenOf(nd);
    if (!kids.length) {
      const x = leafIndex * leafSpan;
      leafIndex++;
      layout.push({ id, x, y: depth * levelGap, node: nd });
      return x;
    }
    const childXs = kids.map((c) => assign(c, depth + 1));
    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    layout.push({ id, x, y: depth * levelGap, node: nd });
    return x;
  }

  assign(root.id, 0);

  // Center horizontally.
  const minX = Math.min(...layout.map((n) => n.x));
  const maxX = Math.max(...layout.map((n) => n.x));
  const cx = (minX + maxX) / 2;
  layout.forEach((n) => { n.x -= cx; });

  const minY = Math.min(...layout.map((n) => n.y));
  const maxY = Math.max(...layout.map((n) => n.y));
  return { nodes: layout, minY, maxY };
}
