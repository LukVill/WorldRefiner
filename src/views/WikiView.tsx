import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { WikiPage } from '../components/wiki/WikiPage';
import { useUIStore } from '../store/uiStore';
import { useWorldStore } from '../store/worldStore';
import { nodeDefaults } from '../utils/nodeDefaults';
import { NodeType } from '../types';

const NODE_TYPES: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

export function WikiView() {
  const activeNodeId = useUIStore(s => s.activeNodeId);
  const world = useWorldStore(s => s.world);
  const node = activeNodeId ? world?.nodes[activeNodeId] : undefined;
  const nodeCount = world ? Object.values(world.nodes).length : 0;
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const createNode = useWorldStore(s => s.createNode);
  const addToast = useUIStore(s => s.addToast);

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8" style={{ color: 'var(--color-text-muted)' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {world?.name ?? 'Your World'}
          </h2>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>{world?.description}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{nodeCount} nodes</p>
        </div>
        {nodeCount === 0 ? (
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Create your first node to get started</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {NODE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const n = createNode(type);
                    setActiveNode(n.id);
                    addToast(`Created ${type}: ${n.title}`, 'success');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  <span>{nodeDefaults[type].icon}</span>
                  <span>New {type}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }}>Select a node from the sidebar to start reading or editing.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <WikiPage key={node.id} node={node} />
      </AnimatePresence>
    </div>
  );
}
