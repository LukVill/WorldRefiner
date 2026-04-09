import React, { useEffect, useState } from 'react';
import { BookOpen, Network, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/sidebar/Sidebar';
import { WikiView } from './views/WikiView';
import { GraphView } from './views/GraphView';
import { SearchPalette } from './components/shared/SearchPalette';
import { Toaster } from './components/shared/Toaster';
import { HoverCard } from './components/wiki/HoverCard';
import { WorldManager } from './components/shared/WorldManager';
import { useUIStore } from './store/uiStore';
import { useWorldStore } from './store/worldStore';
import { saveWorld as persistenceSaveWorld, loadConfig as persistenceLoadConfig, saveConfig as persistenceSaveConfig } from './store/persistence';
import { useTheme } from './hooks/useTheme';
import { useKeyboard } from './hooks/useKeyboard';
import { themes } from './themes/index';

function SettingsPanel() {
  const setSettingsOpen = useUIStore(s => s.setSettingsOpen);
  const world = useWorldStore(s => s.world);
  const importWorld = useWorldStore(s => s.importWorld);
  const exportWorld = useWorldStore(s => s.exportWorld);
  const renameWorld = useWorldStore(s => s.renameWorld);
  const addToast = useUIStore(s => s.addToast);
  const updateTheme = useWorldStore(s => s.updateTheme);
  const loadSavedWorlds = useWorldStore(s => s.loadSavedWorlds);
  const setWorldManagerOpen = useUIStore(s => s.setWorldManagerOpen);

  const handleExport = () => {
    const json = exportWorld();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world?.name ?? 'world'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('World exported', 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        const json = ev.target?.result as string;
        importWorld(json);
        await loadSavedWorlds();
        addToast('World imported', 'success');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const [worldNameInput, setWorldNameInput] = useState('');
  useEffect(() => { setWorldNameInput(world?.name ?? ''); }, [world?.name]);

  const handleSaveWorldName = () => {
    if (!world) return;
    const trimmed = worldNameInput.trim();
    if (!trimmed) { addToast('Name cannot be empty', 'error'); return; }
    renameWorld(trimmed);
    addToast('World name updated', 'success');
    setSettingsOpen(false);
  };

  // External data folder setting
  const [externalPath, setExternalPath] = useState<string>('');
  const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isElectron) return;
      try {
        const cfg = await persistenceLoadConfig();
        if (!mounted) return;
        if (cfg && typeof cfg.externalDataPath === 'string') setExternalPath(cfg.externalDataPath);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveExternalPath = async () => {
    try {
      await persistenceSaveConfig({ externalDataPath: externalPath?.trim() || '' });
      await loadSavedWorlds();
      addToast('Data path saved. Reloading app to apply change.', 'success');
      setSettingsOpen(false);
      if (isElectron) {
        // reload the renderer so main picks up the new config and filesystem root
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to save data path', 'error');
    }
  };

  const handleClearExternalPath = async () => {
    try {
      await persistenceSaveConfig({});
      setExternalPath('');
      await loadSavedWorlds();
      addToast('Data path cleared. Reloading app to apply change.', 'success');
      setSettingsOpen(false);
      if (isElectron) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to clear data path', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSettingsOpen(false)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>Settings</h2>
          <button onClick={() => setSettingsOpen(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Theme</h3>
            <div className="flex flex-col gap-2">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className="flex items-center gap-3 p-3 rounded-lg text-sm hover:opacity-80 transition-opacity text-left"
                  style={{
                    background: world?.theme.id === theme.id ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-surface-alt)',
                    border: `1px solid ${world?.theme.id === theme.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    color: 'var(--color-text)',
                  }}
                >
                  <div className="flex gap-1.5">
                    {Object.entries(theme.colors).slice(0, 5).map(([key, color]) => (
                      <div key={key} className="w-3 h-3 rounded-full" style={{ background: color }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{theme.name}</span>
                  {world?.theme.id === theme.id && <span className="ml-auto text-xs" style={{ color: 'var(--color-primary)' }}>Active</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Worlds</h3>
            <div className="flex gap-2 mb-2">
              <input
                value={worldNameInput}
                onChange={e => setWorldNameInput(e.target.value)}
                disabled={!world}
                placeholder={world ? 'World name' : 'No world loaded'}
                className="flex-1 px-3 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={handleSaveWorldName}
                disabled={!world}
                className="px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
              >
                Save
              </button>
            </div>
            <button
              onClick={() => { setSettingsOpen(false); setWorldManagerOpen(true); }}
              className="w-full px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity text-left"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              Manage worlds…
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Data</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                Export JSON
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                Import JSON
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs text-muted" style={{ color: 'var(--color-text-muted)' }}>Custom data folder (optional)</label>
              <div className="flex gap-2">
                <input
                  value={externalPath}
                  onChange={e => setExternalPath(e.target.value)}
                  placeholder={isElectron ? 'C:\\path\\to\\data' : 'Available in Electron only'}
                  className="flex-1 px-3 py-2 rounded text-sm outline-none"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  disabled={!isElectron}
                />
                <button
                  onClick={handleSaveExternalPath}
                  className="px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  disabled={!isElectron}
                >
                  Save
                </button>
                <button
                  onClick={handleClearExternalPath}
                  className="px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  disabled={!isElectron}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const activeView = useUIStore(s => s.activeView);
  const setActiveView = useUIStore(s => s.setActiveView);
  const settingsOpen = useUIStore(s => s.settingsOpen);
  const worldManagerOpen = useUIStore(s => s.worldManagerOpen);
  const setSearchOpen = useUIStore(s => s.setSearchOpen);
  const storageUnavailable = useWorldStore(s => s.storageUnavailable);
  const loadWorldFromDB = useWorldStore(s => s.loadWorldFromDB);
  const world = useWorldStore(s => s.world);
  const loadSavedWorlds = useWorldStore(s => s.loadSavedWorlds);

  useTheme();
  useKeyboard();

  const addToast = useUIStore(s => s.addToast);

  // confirmation flow: first click arms the button, second click within timeout performs save
  const [confirmSave, setConfirmSave] = useState(false);
  const confirmTimeoutMs = 5000;

  const handleSaveClick = async () => {
    if (!world) {
      addToast('No world loaded', 'error');
      return;
    }

    if (!confirmSave) {
      setConfirmSave(true);
      addToast('Click Save again to confirm overwrite', 'info');
      setTimeout(() => setConfirmSave(false), confirmTimeoutMs);
      return;
    }

    // perform save
    try {
      await persistenceSaveWorld(world);
      await loadSavedWorlds();
      setConfirmSave(false);
      addToast('World saved', 'success');
    } catch (e) {
      console.error('Save failed', e);
      addToast('Save failed', 'error');
    }
  };

  useEffect(() => {
    loadWorldFromDB();
  }, [loadWorldFromDB]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--color-background)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
    >
      {storageUnavailable && (
        <div className="px-4 py-2 text-sm text-center" style={{ background: 'color-mix(in srgb, var(--color-accent) 20%, transparent)', color: 'var(--color-accent)' }}>
          Storage unavailable. Your world will not be saved between sessions.
        </div>
      )}
      {/* Top nav */}
      <div className="flex items-center gap-1 px-4 py-2 border-b flex-shrink-0" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-1 mr-4">
          <button
            onClick={() => setActiveView('wiki')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
            style={{
              background: activeView === 'wiki' ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
              color: activeView === 'wiki' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <BookOpen size={14} />
            Wiki
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
            style={{
              background: activeView === 'graph' ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
              color: activeView === 'graph' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <Network size={14} />
            Graph
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:opacity-80 transition-opacity"
            style={{
              background: confirmSave ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'var(--color-surface-alt)',
              color: confirmSave ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
            title={confirmSave ? 'Click to confirm save' : 'Save world'}
          >
            {/* Use the Save label; icon can be added if desired */}
            <span>{confirmSave ? 'Confirm Save' : 'Save'}</span>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:opacity-80 transition-opacity"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            <Search size={14} />
            <span>Search</span>
            <kbd className="text-xs px-1 rounded" style={{ background: 'var(--color-border)' }}>⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {activeView === 'wiki' && <Sidebar />}
        <main className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'wiki' ? (
              <motion.div key="wiki" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="flex-1 flex overflow-hidden">
                <WikiView />
              </motion.div>
            ) : (
              <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="flex-1 flex overflow-hidden">
                <GraphView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <SearchPalette />
      <HoverCard />
      <Toaster />
      <AnimatePresence>
        {settingsOpen && <SettingsPanel />}
      </AnimatePresence>
      <AnimatePresence>
        {worldManagerOpen && <WorldManager />}
      </AnimatePresence>
    </div>
  );
}
