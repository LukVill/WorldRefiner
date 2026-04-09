import React from 'react';
import { NodeType } from '../../types';
import clsx from 'clsx';

const typeLabels: Record<NodeType, string> = {
  character: 'Character',
  location: 'Location',
  event: 'Event',
  faction: 'Faction',
  item: 'Item',
  concept: 'Concept',
};

interface NodeBadgeProps {
  type: NodeType;
  size?: 'sm' | 'md';
  className?: string;
}

export function NodeBadge({ type, size = 'sm', className }: NodeBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded font-medium uppercase tracking-wide',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        className
      )}
      style={{
        color: `var(--color-${type})`,
        background: `color-mix(in srgb, var(--color-${type}) 15%, transparent)`,
        border: `1px solid color-mix(in srgb, var(--color-${type}) 30%, transparent)`,
      }}
    >
      {typeLabels[type]}
    </span>
  );
}
