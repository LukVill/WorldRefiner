import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Globe, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { ConfirmDialog } from './ConfirmDialog';

export function WorldManager() {
  const setWorldManagerOpen = useUIStore(s => s.setWorldManagerOpen);
  const setActiveNode = useUIStore(s => s.setActiveNode);
  const addToast = useUIStore(s => s.addToast);

  const world = useWorldStore(s => s.world);
  const savedWorlds = useWorldStore(s => s.savedWorlds);
  const createWorld = useWorldStore(s => s.createWorld);
  const switchWorld = useWorldStore(s => s.switchWorld);
  const deleteWorld = useWorldStore(s => s.deleteWorld);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createWorld(newName.trim(), newDesc.trim());
    setActiveNode(null);
    addToast(`Created: ${newName.trim()}`, 'success');
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleSwitch = async (id: string) => {
    if (id === world?.id) { setWorldManagerOpen(false); return; }
    await switchWorld(id);
    setActiveNode(null);
    setWorldManagerOpen(false);
    addToast('World loaded', 'success');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    const name = savedWorlds.find(w => w.id === deleteConfirmId)?.name ?? 'world';
    await deleteWorld(deleteConfirmId);
    addToast(`Deleted: ${name}`, 'info');
    setDeleteConfirmId(null);
  };

  const sorted = [...savedWorlds].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)' }}
        onClick={() => setWorldManagerOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        className="relative z-10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Globe size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              My Worlds
            </h2>
          </div>
          <button onClick={() => setWorldManagerOpen(false)} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* World list */}
        <div className="max-h-80 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--color-text-subtle)' }}>
              No worlds saved yet.
            </div>
          ) : (
            sorted.map(w => {
              const isActive = w.id === world?.id;
              const date = new Date(w.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0 group"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    background: isActive ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
                  }}
                >
                  <button
                    className="flex-1 flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
                    onClick={() => handleSwitch(w.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                          {w.name}
                        </span>
                        {isActive && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)' }}>
                            active
                          </span>
                        )}
                      </div>
                      {w.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-subtle)' }}>{w.description}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>Updated {date}</p>
                    </div>
                    {!isActive && <ChevronRight size={14} className="mt-1 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(w.id)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--color-accent)' }}
                    title="Delete world"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Create new world */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <AnimatePresence mode="wait">
            {!showCreate ? (
              <motion.button
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                <Plus size={14} style={{ color: 'var(--color-primary)' }} />
                New World
              </motion.button>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex flex-col gap-2"
              >
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName(''); setNewDesc(''); } }}
                  placeholder="World name *"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName(''); setNewDesc(''); } }}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                    className="px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete World"
        message={`Permanently delete "${savedWorlds.find(w => w.id === deleteConfirmId)?.name ?? 'this world'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
