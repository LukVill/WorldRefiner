import React from 'react';
import { motion } from 'framer-motion';
import { WorldNode } from '../../types';
import { WikiHeader } from './WikiHeader';
import { WikiContent } from './WikiContent';
import { BacklinksPanel } from './BacklinksPanel';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { useWorldStore } from '../../store/worldStore';
import { useUIStore } from '../../store/uiStore';

interface WikiPageProps {
  node: WorldNode;
}

export function WikiPage({ node }: WikiPageProps) {
  const updateNode = useWorldStore(s => s.updateNode);
  const createNode = useWorldStore(s => s.createNode);
  const wikiPanelState = useUIStore(s => s.wikiPanelState);
  const setWikiPanelState = useUIStore(s => s.setWikiPanelState);
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const addToast = useUIStore(s => s.addToast);

  const handleLinkClick = (nodeId: string) => {
    setActiveNode(nodeId);
  };

  const handleBrokenLinkClick = (text: string) => {
    const newNode = createNode('concept', text);
    setActiveNode(newNode.id);
    addToast(`Created node: ${text}`, 'success');
  };

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <WikiHeader node={node} />
      <div className="flex gap-0 border-b px-8" style={{ borderColor: 'var(--color-border)' }}>
        <button
          className="px-4 py-2 text-sm border-b-2 transition-colors"
          style={{
            borderColor: wikiPanelState === 'preview' ? 'var(--color-primary)' : 'transparent',
            color: wikiPanelState === 'preview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
          onClick={() => setWikiPanelState('preview')}
        >
          Preview
        </button>
        <button
          className="px-4 py-2 text-sm border-b-2 transition-colors"
          style={{
            borderColor: wikiPanelState === 'editor' ? 'var(--color-primary)' : 'transparent',
            color: wikiPanelState === 'editor' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
          onClick={() => setWikiPanelState('editor')}
        >
          Edit
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {wikiPanelState === 'editor' ? (
          <div className="flex flex-col" style={{ minHeight: '400px', padding: '1rem' }}>
            <MarkdownEditor
              value={node.content}
              onChange={content => updateNode(node.id, { content })}
              nodeId={node.id}
            />
          </div>
        ) : (
          <div className="p-8 pt-4">
            <WikiContent
              node={node}
              onLinkClick={handleLinkClick}
              onBrokenLinkClick={handleBrokenLinkClick}
            />
          </div>
        )}
      </div>
      <BacklinksPanel nodeId={node.id} />
    </motion.div>
  );
}
