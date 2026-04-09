import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useWorldStore } from '../store/worldStore';
import { WorldNode } from '../types';

export function useSearch(query: string): WorldNode[] {
  const nodes = useWorldStore(s => s.world ? Object.values(s.world.nodes) : []);

  const fuse = useMemo(() => new Fuse(nodes, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'tags', weight: 1 },
      { name: 'content', weight: 0.5 },
    ],
    threshold: 0.35,
    includeMatches: true,
    minMatchCharLength: 1,
  }), [nodes]);

  return useMemo(() => {
    if (!query.trim()) return nodes;
    return fuse.search(query).map(r => r.item);
  }, [query, fuse, nodes]);
}
