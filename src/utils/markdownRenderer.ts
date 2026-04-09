import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { WorldNode } from '../types';
import { resolveSlug } from './linkParser';
import { slugify } from './slugify';

export function renderMarkdown(
  content: string,
  nodes: Record<string, WorldNode>
): string {
  const withLinks = content.replace(/\[\[([^\]]+)\]\]/g, (_, text) => {
    const node = resolveSlug(slugify(text), nodes);
    if (node) {
      return `<span class="wiki-link" data-id="${node.id}" data-text="${text}">${text}</span>`;
    }
    return `<span class="wiki-link broken" data-text="${text}">${text}</span>`;
  });

  const html = marked.parse(withLinks, { async: false }) as string;

  return DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['class', 'data-id', 'data-text', 'href', 'src', 'alt'],
  });
}

export function generateExcerpt(content: string, maxLength = 150): string {
  const stripped = content
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + '…'
    : stripped;
}
