import React, { useState } from 'react';
import { Smile } from 'lucide-react';

const COMMON_EMOJIS = ['👤', '📍', '⚡', '⚔️', '💎', '💡', '🧙', '🏰', '🐉', '⚗️', '📜', '🗡️', '🛡️', '👑', '🌟', '🔮', '🏔️', '🌊', '🏛️', '🗺️', '🔑', '💀', '🌿', '🦋', '🔥', '❄️', '⚖️', '🎭', '🌙', '☀️'];

interface IconPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-2xl hover:scale-110 transition-transform leading-none"
        title="Change icon"
      >
        {value || <Smile size={24} style={{ color: 'var(--color-text-muted)' }} />}
      </button>
      {open && (
        <div
          className="absolute top-8 left-0 z-20 rounded-lg p-2 shadow-xl grid grid-cols-6 gap-1"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onChange(emoji); setOpen(false); }}
              className="text-xl p-1 rounded hover:scale-110 transition-transform hover:bg-white/10"
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
