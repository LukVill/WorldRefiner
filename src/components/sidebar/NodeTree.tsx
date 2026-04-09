import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pin, ExternalLink, Trash2 } from 'lucide-react';
import { NodeType, WorldNode } from '../../types';
import { useWorldStore } from '../../store/worldStore';
import { useUIStore } from '../../store/uiStore';
import { nodeDefaults } from '../../utils/nodeDefaults';
import { ConfirmDialog } from '../shared/ConfirmDialog';

const NODE_TYPE_ORDER: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

export function NodeTree() {
  const nodes = useWorldStore(s => s.world ? Object.values(s.world.nodes) : []);
  const updateNode = useWorldStore(s => s.updateNode);
  const deleteNode = useWorldStore(s => s.deleteNode);
  const activeNodeId = useUIStore(s => s.activeNodeId);
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const setActiveView = useUIStore(s => s.setActiveView);
  const collapsedTypes = useUIStore(s => s.collapsedTypes);
  const toggleTypeCollapse = useUIStore(s => s.toggleTypeCollapse);
  const addToast = useUIStore(s => s.addToast);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const pinnedNodes = nodes.filter(n => n.metadata.pinned).sort((a, b) => a.title.localeCompare(b.title));
  const groupedNodes = NODE_TYPE_ORDER.map(type => ({
    type,
    nodes: nodes.filter(n => n.type === type && !n.metadata.pinned).sort((a, b) => a.title.localeCompare(b.title)),
  }));

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ nodeId, x: e.clientX, y: e.clientY });
  };

  const handlePin = (node: WorldNode) => {
    updateNode(node.id, { metadata: { ...node.metadata, pinned: !node.metadata.pinned } });
    setContextMenu(null);
  };

  const handleOpenInGraph = (nodeId: string) => {
    setActiveView('graph');
    useUIStore.getState().setGraphFocus(nodeId);
    setContextMenu(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    const node = nodes.find(n => n.id === deleteConfirm);
    deleteNode(deleteConfirm);
    if (activeNodeId === deleteConfirm) setActiveNode(null);
    addToast(`Deleted: ${node?.title}`, 'info');
    setDeleteConfirm(null);
  };

  const NodeItem = ({ node }: { node: WorldNode }) => (
    <button
      key={node.id}
      className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-colors text-left"
      style={{
        background: activeNodeId === node.id ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
        color: activeNodeId === node.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
      }}
      onClick={() => { setActiveNode(node.id); setActiveView('wiki'); }}
      onContextMenu={e => handleContextMenu(e, node.id)}
    >
      <span className="text-sm leading-none">{node.metadata.icon || nodeDefaults[node.type].icon}</span>
      <span className="flex-1 truncate">{node.title}</span>
      {node.metadata.pinned && <Pin size={10} style={{ opacity: 0.5, flexShrink: 0 }} />}
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {nodes.length === 0 && (
        <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          No nodes yet. Create your first node!
        </div>
      )}

      {pinnedNodes.length > 0 && (
        <div className="mb-2">
          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>
            Pinned
          </div>
          {pinnedNodes.map(n => <NodeItem key={n.id} node={n} />)}
        </div>
      )}

      {groupedNodes.map(({ type, nodes: typeNodes }) => {
        if (typeNodes.length === 0) return null;
        const collapsed = collapsedTypes.includes(type);
        return (
          <div key={type} className="mb-1">
            <button
              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-subtle)' }}
              onClick={() => toggleTypeCollapse(type)}
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>{type}</span>
              <span className="ml-auto text-xs font-normal rounded-full px-1.5 py-0.5" style={{ background: 'var(--color-surface-alt)' }}>
                {typeNodes.length}
              </span>
            </button>
            {!collapsed && typeNodes.map(n => <NodeItem key={n.id} node={n} />)}
          </div>
        );
      })}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-40 rounded-lg overflow-hidden shadow-xl py-1"
            style={{ left: contextMenu.x, top: contextMenu.y, background: 'var(--color-surface)', border: '1px solid var(--color-border)', minWidth: 160 }}
          >
            {(() => {
              const node = nodes.find(n => n.id === contextMenu.nodeId);
              if (!node) return null;
              return (
                <>
                  <button onClick={() => handlePin(node)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                    <Pin size={14} />
                    {node.metadata.pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                  <button onClick={() => handleOpenInGraph(node.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                    <ExternalLink size={14} />
                    Open in Graph
                  </button>
                  <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />
                  <button
                    onClick={() => { setDeleteConfirm(contextMenu.nodeId); setContextMenu(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Node"
        message="This will permanently delete the node. Any links to this node in other nodes will become broken links."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
