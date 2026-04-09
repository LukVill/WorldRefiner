import React, { useRef } from 'react';
import { PanelLeft, Settings, ChevronDown } from 'lucide-react';
import { NodeTree } from './NodeTree';
import { QuickCreate } from './QuickCreate';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';

export function Sidebar() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const sidebarWidth = useUIStore(s => s.sidebarWidth);
  const setSidebarWidth = useUIStore(s => s.setSidebarWidth);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const setSettingsOpen = useUIStore(s => s.setSettingsOpen);
  const setWorldManagerOpen = useUIStore(s => s.setWorldManagerOpen);
  const worldName = useWorldStore(s => s.world?.name ?? '');
  const isDirty = useWorldStore(s => s.isDirty);
  const isSaving = useWorldStore(s => s.isSaving);

  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      setSidebarWidth(dragRef.current.startWidth + delta);
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-2 border-r" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <button onClick={toggleSidebar} className="hover:opacity-70 transition-opacity p-1" title="Open sidebar">
          <PanelLeft size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col border-r relative flex-shrink-0"
      style={{ width: sidebarWidth, borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={toggleSidebar} className="hover:opacity-70 transition-opacity" title="Collapse sidebar">
          <PanelLeft size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <button
          onClick={() => setWorldManagerOpen(true)}
          className="flex-1 flex items-center gap-1 min-w-0 hover:opacity-70 transition-opacity text-left"
          title="Switch world"
        >
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
            {worldName}
          </span>
          <ChevronDown size={11} style={{ color: 'var(--color-text-subtle)', flexShrink: 0 }} />
        </button>
        {isSaving && <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>saving…</span>}
        {isDirty && !isSaving && <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>●</span>}
        <button onClick={() => setSettingsOpen(true)} className="hover:opacity-70 transition-opacity" title="Settings">
          <Settings size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
      {/* Quick create */}
      <div className="px-3 py-2">
        <QuickCreate />
      </div>
      {/* Node list */}
      <NodeTree />
      {/* Drag handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
        style={{ background: 'transparent' }}
        onMouseDown={handleDragStart}
      />
    </div>
  );
}
