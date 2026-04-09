import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { NodeBadge } from '../shared/NodeBadge';
import { nodeDefaults } from '../../utils/nodeDefaults';

export function HoverCard() {
  const hoverNodeId = useUIStore(s => s.hoverNodeId);
  const hoverAnchor = useUIStore(s => s.hoverAnchor);
  const node = useWorldStore(s => hoverNodeId ? s.world?.nodes[hoverNodeId] : undefined);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hoverNodeId) {
      timerRef.current = setTimeout(() => setVisible(true), 200);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimeout(() => setVisible(false), 150);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [hoverNodeId]);

  if (!node || !hoverAnchor) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(hoverAnchor.x, window.innerWidth - 340),
    top: hoverAnchor.y + 8,
    zIndex: 60,
    maxWidth: 320,
  };

  return (
    <AnimatePresence>
      {visible && node && (
        <motion.div
          style={{
            ...style,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="p-3 shadow-xl pointer-events-none"
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{node.metadata.icon || nodeDefaults[node.type].icon}</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>{node.title}</span>
            <NodeBadge type={node.type} />
          </div>
          {node.excerpt && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{node.excerpt}</p>
          )}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {node.tags.map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-subtle)' }}>{tag}</span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
