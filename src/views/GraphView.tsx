import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { GraphControls } from '../components/graph/GraphControls';
import { NodeBadge } from '../components/shared/NodeBadge';
import { useUIStore } from '../store/uiStore';
import { useWorldStore } from '../store/worldStore';
import { nodeDefaults } from '../utils/nodeDefaults';
import { X, BookOpen } from 'lucide-react';

export function GraphView() {
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const setActiveView = useUIStore(s => s.setActiveView);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useWorldStore(s => selectedNodeId ? s.world?.nodes[selectedNodeId] : undefined);
  const [layoutKey, setLayoutKey] = useState(0);
  const clearGraphPositions = useWorldStore(s => s.clearGraphPositions);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleOpenInWiki = () => {
    if (!selectedNodeId) return;
    setActiveNode(selectedNodeId);
    setActiveView('wiki');
  };

  const handleResetLayout = () => {
    // clear saved positions so layout will be recomputed and persisted
    clearGraphPositions();
    setLayoutKey(k => k + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--color-background)', overflow: 'hidden' }}>
      <ReactFlowProvider>
        <GraphControls onResetLayout={handleResetLayout} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <GraphCanvas key={layoutKey} onNodeClick={handleNodeClick} />
          {/* Right panel for selected node */}
          {selectedNode && (
            <div
              className="flex-shrink-0 overflow-y-auto p-4 border-l"
              style={{ width: 280, background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{selectedNode.metadata.icon || nodeDefaults[selectedNode.type].icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>{selectedNode.title}</div>
                  <NodeBadge type={selectedNode.type} />
                </div>
                <button onClick={() => setSelectedNodeId(null)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
              {selectedNode.excerpt && (
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{selectedNode.excerpt}</p>
              )}
              {selectedNode.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedNode.tags.map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-subtle)' }}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleOpenInWiki}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <BookOpen size={14} />
                  Open in Wiki
                </button>
              </div>
            </div>
          )}
        </div>
      </ReactFlowProvider>
    </div>
  );
}
