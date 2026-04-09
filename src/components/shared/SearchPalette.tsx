import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSearch } from '../../hooks/useSearch';
import { NodeBadge } from './NodeBadge';
import { NodeType } from '../../types';
import { nodeDefaults } from '../../utils/nodeDefaults';

const NODE_TYPE_ORDER: NodeType[] = ['character', 'location', 'faction', 'event', 'item', 'concept'];

export function SearchPalette() {
  const searchOpen = useUIStore(s => s.searchOpen);
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchOpen = useUIStore(s => s.setSearchOpen);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const setActiveView = useUIStore(s => s.setActiveView);
  const setGraphFocus = useUIStore(s => s.setGraphFocus);

  const results = useSearch(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayResults = results.slice(0, 12);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSelect = (nodeId: string, openInGraph = false) => {
    if (openInGraph) {
      setActiveView('graph');
      setGraphFocus(nodeId);
    } else {
      setActiveView('wiki');
      setActiveNode(nodeId);
    }
    setSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, displayResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const node = displayResults[selectedIndex];
      if (node) handleSelect(node.id, e.metaKey || e.ctrlKey);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSearchOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.12 }}
            className="relative z-10 w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search nodes..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="hover:opacity-70">
                  <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {displayResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No results found
                </div>
              ) : (
                displayResults.map((node, i) => (
                  <div
                    key={node.id}
                    onClick={() => handleSelect(node.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: i === selectedIndex ? 'var(--color-surface-alt)' : 'transparent',
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="text-lg leading-none mt-0.5">{node.metadata.icon || nodeDefaults[node.type].icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{node.title}</span>
                        <NodeBadge type={node.type} />
                      </div>
                      {node.excerpt && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{node.excerpt}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t flex gap-4 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-subtle)' }}>
              <span>↑↓ navigate</span>
              <span>↵ open wiki</span>
              <span>⌘↵ open graph</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
