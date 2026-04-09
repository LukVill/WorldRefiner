import React, { useState, useRef, useEffect } from 'react';
import { WorldNode } from '../../types';
import { NodeBadge } from '../shared/NodeBadge';
import { TagInput } from '../shared/TagInput';
import { IconPicker } from '../shared/IconPicker';
import { useWorldStore } from '../../store/worldStore';

interface WikiHeaderProps {
  node: WorldNode;
}

export function WikiHeader({ node }: WikiHeaderProps) {
  const updateNode = useWorldStore(s => s.updateNode);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(node.title);
  }, [node.title]);

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  const commitTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== node.title) {
      updateNode(node.id, { title: trimmed });
    } else {
      setTitleValue(node.title);
    }
    setEditingTitle(false);
  };

  return (
    <div className="flex flex-col gap-3 p-8 pb-4">
      <div className="flex items-start gap-3">
        <IconPicker
          value={node.metadata.icon ?? ''}
          onChange={icon => updateNode(node.id, { metadata: { ...node.metadata, icon } })}
        />
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') { setTitleValue(node.title); setEditingTitle(false); }
              }}
              className="w-full bg-transparent border-b-2 outline-none text-3xl font-bold"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-primary)',
              }}
            />
          ) : (
            <h1
              className="text-3xl font-bold cursor-text hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
              onClick={() => setEditingTitle(true)}
            >
              {node.title}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-2">
            <NodeBadge type={node.type} />
          </div>
        </div>
      </div>
      <TagInput
        tags={node.tags}
        onChange={tags => updateNode(node.id, { tags })}
      />
    </div>
  );
}
