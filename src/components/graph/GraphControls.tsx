import React from 'react';
import { useReactFlow } from 'reactflow';
import { Maximize2, RotateCcw } from 'lucide-react';
import { NodeType } from '../../types';
import { NodeBadge } from '../shared/NodeBadge';
import { useUIStore } from '../../store/uiStore';

const ALL_TYPES: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

export function GraphControls({ onResetLayout }: { onResetLayout: () => void }) {
  const { fitView } = useReactFlow();
  const graphTypeFilter = useUIStore(s => s.graphTypeFilter);
  const toggleGraphTypeFilter = useUIStore(s => s.toggleGraphTypeFilter);
  const clearGraphFilters = useUIStore(s => s.clearGraphFilters);

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b flex-wrap"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Filter:</span>
      {ALL_TYPES.map(type => {
        const filtered = graphTypeFilter.includes(type);
        return (
          <button
            key={type}
            onClick={() => toggleGraphTypeFilter(type)}
            style={{ opacity: filtered ? 0.35 : 1, transition: 'opacity 0.15s' }}
          >
            <NodeBadge type={type} />
          </button>
        );
      })}
      {graphTypeFilter.length > 0 && (
        <button
          onClick={clearGraphFilters}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Clear
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="p-1.5 rounded hover:opacity-70 transition-opacity"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
          title="Fit view"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={onResetLayout}
          className="p-1.5 rounded hover:opacity-70 transition-opacity"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
          title="Reset layout"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
