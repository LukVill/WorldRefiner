import { useWorldStore } from '../store/worldStore';
import { WorldNode } from '../types';

export function useNode(id: string | null): WorldNode | undefined {
  return useWorldStore(s => id ? s.world?.nodes[id] : undefined);
}
