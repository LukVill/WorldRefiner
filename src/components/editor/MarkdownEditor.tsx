import React, { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';
import { wikiLinkExtension } from './wikiLinkExtension';
import { useWorldStore } from '../../store/worldStore';

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  nodeId: string;
}

const editorTheme = EditorView.theme({
  '&': {
    fontSize: '0.9rem',
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'transparent',
    height: '100%',
    flex: '1',
  },
  '.cm-content': {
    padding: '1rem',
    caretColor: 'var(--color-primary)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    minHeight: '300px',
  },
  '.cm-line': { padding: '0 4px' },
  '.cm-focused': { outline: 'none' },
  '.cm-editor.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)' },
  '.cm-cursor': { borderLeftColor: 'var(--color-primary)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)' },
  '.cm-gutters': { display: 'none' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' },
});

export function MarkdownEditor({ value, onChange, nodeId }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const nodes = useWorldStore(s => s.world?.nodes ?? {});

  useEffect(() => {
    if (!editorRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          markdown(),
          keymap.of([...defaultKeymap, { key: 'Tab', run: (v) => { v.dispatch(v.state.replaceSelection('  ')); return true; } }]),
          wikiLinkExtension(nodes, nodeId),
          EditorView.updateListener.of(update => {
            if (update.docChanged) onChange(update.state.doc.toString());
          }),
          editorTheme,
          EditorView.lineWrapping,
        ],
      }),
      parent: editorRef.current,
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="flex-1 overflow-auto"
      style={{ minHeight: '300px' }}
    />
  );
}
