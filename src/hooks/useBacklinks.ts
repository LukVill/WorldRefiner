import { useWorldStore } from '../store/worldStore';
import { WorldNode } from '../types';

export function useBacklinks(nodeId: string | null): WorldNode[] {
  return useWorldStore(s => {
    if (!nodeId || !s.world) return [];
    return Object.values(s.world.nodes).filter(n => n.links.includes(nodeId));
  });
}
