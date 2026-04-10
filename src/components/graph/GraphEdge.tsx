import React, { useState, useContext } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { GraphHoverContext } from './GraphHoverContext';

export function GraphEdge({
  id, source, target, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const hoveredNodeId = useContext(GraphHoverContext);

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const showLabel = (hovered || selected) && data?.label;

  const isActive = hoveredNodeId !== null;
  const isConnected = source === hoveredNodeId || target === hoveredNodeId;

  const edgeColor = selected || (isActive && isConnected)
    ? 'var(--color-primary)'
    : 'var(--color-border)';
  const edgeOpacity = isActive && !isConnected ? 0.12 : 1;
  const edgeWidth = selected || (isActive && isConnected) ? 2.5 : 1.5;
  const edgeFilter = isActive && isConnected
    ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--color-primary) 80%, transparent))'
    : undefined;

  const arrowFill = selected || (isActive && isConnected)
    ? 'var(--color-primary)'
    : 'var(--color-border)';

  // helper to render an arrowhead at (x,y) pointing along angle (radians)
  const renderArrow = (x: number, y: number, angle: number, key: string) => {
    const size = 8;
    const points = [
      [0, 0],
      [-size, -size / 2],
      [-size, size / 2],
    ].map(p => `${p[0]},${p[1]}`).join(' ');
    const deg = (angle * 180) / Math.PI;
    return (
      <g key={key} transform={`translate(${x},${y}) rotate(${deg})`}>
        <polygon points={points} fill={arrowFill} />
      </g>
    );
  };

  // compute arrow positions based on straight line between source and target
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);
  const arrowOffset = 12; // px from node
  const targetArrowX = targetX - Math.cos(angle) * arrowOffset;
  const targetArrowY = targetY - Math.sin(angle) * arrowOffset;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          strokeOpacity: edgeOpacity,
          filter: edgeFilter,
          transition: 'stroke 0.2s, stroke-width 0.2s, stroke-opacity 0.2s, filter 0.2s',
        }}
      />
      {/* Invisible thick path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* direction indicators */}
      <g pointerEvents="none" style={{ opacity: edgeOpacity, transition: 'opacity 0.2s' }}>
        {data?.type === 'directed' && renderArrow(targetArrowX, targetArrowY, angle, 'arrow-target')}
        {data?.type === 'bidirectional' && (
          <>
            {renderArrow(labelX + Math.cos(angle) * 7, labelY + Math.sin(angle) * 7, angle, 'arrow-fwd')}
            {renderArrow(labelX - Math.cos(angle) * 7, labelY - Math.sin(angle) * 7, angle + Math.PI, 'arrow-bwd')}
          </>
        )}
      </g>
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
