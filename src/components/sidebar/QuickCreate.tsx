import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { NodeType } from '../../types';
import { useWorldStore } from '../../store/worldStore';
import { useUIStore } from '../../store/uiStore';
import { nodeDefaults } from '../../utils/nodeDefaults';
import { NodeBadge } from '../shared/NodeBadge';

const NODE_TYPES: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const createNode = useWorldStore(s => s.createNode);
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const setActiveView = useUIStore(s => s.setActiveView);
  const addToast = useUIStore(s => s.addToast);

  const handleCreate = (type: NodeType) => {
    const node = createNode(type);
    setActiveNode(node.id);
    setActiveView('wiki');
    setOpen(false);
    addToast(`Created ${type}: ${node.title}`, 'success');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80 w-full"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
      >
        <Plus size={14} />
        <span>New Component</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-20"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {NODE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleCreate(type)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-text)' }}
              >
                <span>{nodeDefaults[type].icon}</span>
                <NodeBadge type={type} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
