import React, { useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { Maximize2, RotateCcw, RefreshCw, Plus } from 'lucide-react';
import { NodeType } from '../../types';
import { NodeBadge } from '../shared/NodeBadge';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';

const ALL_TYPES: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

export function GraphControls({ onResetLayout, onNodeCreated }: {
  onResetLayout: () => void;
  onNodeCreated?: (nodeId: string) => void;
}) {
  const { fitView } = useReactFlow();
  const resyncEdgesFromLinks = useWorldStore(s => s.resyncEdgesFromLinks);
  const createNode = useWorldStore(s => s.createNode);
  const graphTypeFilter = useUIStore(s => s.graphTypeFilter);
  const toggleGraphTypeFilter = useUIStore(s => s.toggleGraphTypeFilter);
  const clearGraphFilters = useUIStore(s => s.clearGraphFilters);
  const addToast = useUIStore(s => s.addToast);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCreate = (type: NodeType) => {
    setDropdownOpen(false);
    const node = createNode(type);
    onNodeCreated?.(node.id);
    addToast(`Created ${type}: ${node.title}`, 'success');
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

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
        {/* New node dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs hover:opacity-80 transition-opacity"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            title="Create new node"
          >
            <Plus size={13} />
            New
          </button>
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 50,
                minWidth: 140,
                padding: '4px 0',
              }}
            >
              {ALL_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleCreate(type)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:opacity-70 transition-opacity text-sm"
                  style={{ color: 'var(--color-text)' }}
                >
                  <NodeBadge type={type} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="p-1.5 rounded hover:opacity-70 transition-opacity"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
          title="Fit view"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={() => { try { resyncEdgesFromLinks(); } catch {} }}
          className="p-1.5 rounded hover:opacity-70 transition-opacity"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
          title="Refresh relationships"
        >
          <RefreshCw size={14} />
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
