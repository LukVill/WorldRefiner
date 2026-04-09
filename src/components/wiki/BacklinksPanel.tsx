import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Link } from 'lucide-react';
import { useBacklinks } from '../../hooks/useBacklinks';
import { NodeBadge } from '../shared/NodeBadge';
import { nodeDefaults } from '../../utils/nodeDefaults';
import { useUIStore } from '../../store/uiStore';

interface BacklinksPanelProps {
  nodeId: string;
}

export function BacklinksPanel({ nodeId }: BacklinksPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const backlinks = useBacklinks(nodeId);
  const setActiveNode = useUIStore(s => s.setActiveNode);

  return (
    <div
      className="border-t"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        className="w-full flex items-center gap-2 px-8 py-3 text-sm hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
        style={{ color: 'var(--color-text-muted)' }}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Link size={14} />
        <span>Backlinks ({backlinks.length})</span>
      </button>
      {expanded && (
        <div className="px-8 pb-4 flex flex-col gap-2">
          {backlinks.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>No nodes link to this one yet.</p>
          ) : (
            backlinks.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveNode(n.id)}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity text-left"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span>{n.metadata.icon || nodeDefaults[n.type].icon}</span>
                <span className="flex-1 truncate">{n.title}</span>
                <NodeBadge type={n.type} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
