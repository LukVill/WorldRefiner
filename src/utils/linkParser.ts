import { WorldNode } from '../types';

export function extractLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(regex)];
  return [...new Set(matches.map(m => m[1].trim()))];
}

export function resolveSlug(
  text: string,
  nodes: Record<string, WorldNode>
): WorldNode | undefined {
  const needle = text.toLowerCase().trim();
  return Object.values(nodes).find(
    n => n.slug === needle || n.title.toLowerCase() === needle
  );
}
