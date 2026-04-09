import React, { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';

const COMMON_EMOJIS = ['👤', '📍', '⚡', '⚔️', '💎', '💡', '🧙', '🏰', '🐉', '⚗️', '📜', '🗡️', '🛡️', '👑', '🌟', '🔮', '🏔️', '🌊', '🏛️', '🗺️', '🔑', '💀', '🌿', '🦋', '🔥', '❄️', '⚖️', '🎭', '🌙', '☀️'];
const VIEWPORT_PADDING = 12;
const PANEL_GAP = 8;
const PANEL_MAX_WIDTH = 320;
const PANEL_MAX_HEIGHT = 280;
const EMOJI_BUTTON_SIZE = 40;

interface IconPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [columnCount, setColumnCount] = useState(6);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePanelLayout = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const columns = viewportWidth < 360 ? 4 : viewportWidth < 560 ? 5 : 6;
      const desiredWidth = columns * EMOJI_BUTTON_SIZE + (columns - 1) * 4 + 16;
      const width = Math.min(PANEL_MAX_WIDTH, viewportWidth - VIEWPORT_PADDING * 2, desiredWidth);
      const maxHeight = Math.min(PANEL_MAX_HEIGHT, viewportHeight - VIEWPORT_PADDING * 2);

      const left = Math.min(
        Math.max(VIEWPORT_PADDING, rect.left),
        Math.max(VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)
      );

      const canOpenBelow = rect.bottom + PANEL_GAP + Math.min(160, maxHeight) <= viewportHeight - VIEWPORT_PADDING;
      const top = canOpenBelow
        ? Math.min(rect.bottom + PANEL_GAP, viewportHeight - maxHeight - VIEWPORT_PADDING)
        : Math.max(VIEWPORT_PADDING, rect.top - maxHeight - PANEL_GAP);

      setColumnCount(columns);
      setPanelStyle({
        position: 'fixed',
        top,
        left,
        width,
        maxHeight,
        overflowY: 'auto',
        boxSizing: 'border-box',
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    updatePanelLayout();
    window.addEventListener('resize', updatePanelLayout);
    window.addEventListener('scroll', updatePanelLayout, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePanelLayout);
      window.removeEventListener('scroll', updatePanelLayout, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-2xl leading-none transition-transform hover:scale-110 hover:bg-white/5"
        title="Change icon"
      >
        {value || <Smile size={24} style={{ color: 'var(--color-text-muted)' }} />}
      </button>
      {open && (
        <div
          className="z-20 grid gap-1 rounded-lg p-2 shadow-xl"
          style={{
            ...panelStyle,
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onChange(emoji); setOpen(false); }}
              className="flex h-9 w-9 items-center justify-center rounded text-xl transition-transform hover:scale-110 hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}
