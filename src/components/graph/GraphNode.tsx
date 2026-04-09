import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorldNode } from '../../types';
import { nodeDefaults } from '../../utils/nodeDefaults';

export function GraphNode({ data, selected }: NodeProps<WorldNode>) {
  const typeColor = `var(--color-${data.type})`;

  return (
    <div
      style={{
        width: 160,
        height: 56,
        background: 'var(--color-surface)',
        border: `2px solid ${selected ? typeColor : `color-mix(in srgb, ${typeColor} 60%, transparent)`}`,
        borderRadius: 'var(--radius)',
        boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${typeColor} 25%, transparent)` : undefined,
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 10px',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: typeColor, border: 'none', width: 8, height: 8 }} />
      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
        {data.metadata.icon || nodeDefaults[data.type].icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.title}
        </div>
        <div style={{ fontSize: 10, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>
          {data.type}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: typeColor, border: 'none', width: 8, height: 8 }} />
    </div>
  );
}
