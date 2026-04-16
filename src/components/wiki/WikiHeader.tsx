import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
  const reorderTimelineNodes = useWorldStore(s => s.reorderTimelineNodes);
  const world = useWorldStore(s => s.world);
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
      {node.type === 'event' && (() => {
        // Build sorted event list to compute this node's position
        const events = world
          ? Object.values(world.nodes)
              .filter(n => n.type === 'event')
              .sort((a, b) => {
                const aHas = a.timelineOrder !== undefined;
                const bHas = b.timelineOrder !== undefined;
                if (aHas && bHas) return a.timelineOrder! - b.timelineOrder!;
                if (aHas) return -1;
                if (bHas) return 1;
                return a.metadata.createdAt.localeCompare(b.metadata.createdAt);
              })
          : [];
        const pos = events.findIndex(e => e.id === node.id);
        if (pos === -1) return null;
        const total = events.length;

        const moveUp = () => {
          if (pos === 0) return;
          const newOrder = [...events];
          [newOrder[pos - 1], newOrder[pos]] = [newOrder[pos], newOrder[pos - 1]];
          reorderTimelineNodes(newOrder.map(e => e.id));
        };
        const moveDown = () => {
          if (pos === total - 1) return;
          const newOrder = [...events];
          [newOrder[pos], newOrder[pos + 1]] = [newOrder[pos + 1], newOrder[pos]];
          reorderTimelineNodes(newOrder.map(e => e.id));
        };

        return (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Timeline position:
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-event)' }}>
              #{pos + 1} of {total}
            </span>
            <button
              onClick={moveUp}
              disabled={pos === 0}
              className="p-0.5 rounded hover:opacity-70 transition-opacity disabled:opacity-25"
              style={{ color: 'var(--color-text-muted)' }}
              title="Move earlier in timeline"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={moveDown}
              disabled={pos === total - 1}
              className="p-0.5 rounded hover:opacity-70 transition-opacity disabled:opacity-25"
              style={{ color: 'var(--color-text-muted)' }}
              title="Move later in timeline"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        );
      })()}
    </div>
  );
}
