import { ViewPlugin, DecorationSet, Decoration, ViewUpdate, EditorView, MatchDecorator } from '@codemirror/view';
import { autocompletion, CompletionContext, Completion } from '@codemirror/autocomplete';
import { WorldNode } from '../../types';
import { slugify } from '../../utils/slugify';

export function wikiLinkExtension(
  nodes: Record<string, WorldNode>,
  currentNodeId: string
) {
  const decorator = new MatchDecorator({
    regexp: /\[\[([^\]]+)\]\]/g,
    decoration: (match) => {
      const text = match[1];
      const needle = text.toLowerCase().trim();
      const resolved = Object.values(nodes).find(
        n => n.slug === slugify(text) || n.title.toLowerCase() === needle
      );
      return Decoration.mark({
        class: resolved ? 'cm-wiki-link cm-wiki-link-resolved' : 'cm-wiki-link cm-wiki-link-broken',
        attributes: { 'data-node-id': resolved?.id ?? '', 'data-link-text': text },
      });
    },
  });

  const pluginSpec = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: v => v.decorations }
  );

  const wikiLinkCompletion = autocompletion({
    override: [
      (context: CompletionContext) => {
        const before = context.matchBefore(/\[\[[^\]]*$/);
        if (!before) return null;
        const query = before.text.slice(2).toLowerCase();
        const options: Completion[] = Object.values(nodes)
          .filter(n => n.id !== currentNodeId)
          .filter(n => n.title.toLowerCase().includes(query))
          .map(n => ({
            label: n.title,
            detail: n.type,
            apply: `[[${n.title}]]`,
            boost: n.metadata.pinned ? 1 : 0,
          }));
        const exactMatch = Object.values(nodes).some(
          n => n.title.toLowerCase() === query
        );
        if (!exactMatch && query.length > 0) {
          options.unshift({
            label: `Create "${query}"`,
            detail: 'new node',
            apply: `[[${query}]]`,
            boost: 0,
          });
        }
        return { from: before.from, to: context.pos, options };
      },
    ],
  });

  return [pluginSpec, wikiLinkCompletion];
}
