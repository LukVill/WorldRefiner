import dagre from '@dagrejs/dagre';
import { WorldNode, WorldEdge } from '../types';

export function computeDagreLayout(
  nodes: WorldNode[],
  edges: WorldEdge[],
  nodeWidth = 180,
  nodeHeight = 60
): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });

  nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => {
    const pos = g.node(n.id);
    if (pos) {
      positions[n.id] = { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 };
    }
  });
  return positions;
}
