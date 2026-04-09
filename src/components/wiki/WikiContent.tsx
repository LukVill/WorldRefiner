import React, { useRef, useEffect, useCallback } from 'react';
import { WorldNode } from '../../types';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { useWorldStore } from '../../store/worldStore';
import { useUIStore } from '../../store/uiStore';

interface WikiContentProps {
  node: WorldNode;
  onLinkClick: (nodeId: string) => void;
  onBrokenLinkClick: (text: string) => void;
}

export function WikiContent({ node, onLinkClick, onBrokenLinkClick }: WikiContentProps) {
  const nodes = useWorldStore(s => s.world?.nodes ?? {});
  const setHoverCard = useUIStore(s => s.setHoverCard);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const html = renderMarkdown(node.content, nodes);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.wiki-link') as HTMLElement | null;
    if (!link) return;
    e.preventDefault();
    if (mouseOutTimerRef.current) {
      clearTimeout(mouseOutTimerRef.current);
      mouseOutTimerRef.current = null;
    }
    setHoverCard(null);
    if (link.classList.contains('broken')) {
      const text = link.dataset.text ?? '';
      if (text) onBrokenLinkClick(text);
    } else {
      const id = link.dataset.id ?? '';
      if (id) onLinkClick(id);
    }
  }, [onLinkClick, onBrokenLinkClick, setHoverCard]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.wiki-link:not(.broken)') as HTMLElement | null;
    if (!link) return;
    // Cancel any pending hide so moving between links keeps the card alive
    if (mouseOutTimerRef.current) {
      clearTimeout(mouseOutTimerRef.current);
      mouseOutTimerRef.current = null;
    }
    const id = link.dataset.id ?? '';
    if (id) {
      const rect = link.getBoundingClientRect();
      setHoverCard(id, { x: rect.left + rect.width / 2, y: rect.bottom + 4 });
    }
  }, [setHoverCard]);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.wiki-link')) {
      mouseOutTimerRef.current = setTimeout(() => {
        mouseOutTimerRef.current = null;
        setHoverCard(null);
      }, 200);
    }
  }, [setHoverCard]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('click', handleClick);
    el.addEventListener('mouseover', handleMouseOver);
    el.addEventListener('mouseout', handleMouseOut);
    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('mouseover', handleMouseOver);
      el.removeEventListener('mouseout', handleMouseOut);
    };
  }, [handleClick, handleMouseOver, handleMouseOut]);

  return (
    <div
      ref={containerRef}
      className="wiki-content prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
