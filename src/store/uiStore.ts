import { create } from 'zustand';
import { NodeType } from '../types';

type ActiveView = 'wiki' | 'graph' | 'timeline';
type PanelState = 'editor' | 'preview';

interface UIStore {
  activeView: ActiveView;
  activeNodeId: string | null;
  navigationHistory: string[];
  setActiveView: (view: ActiveView) => void;
  setActiveNode: (id: string | null) => void;
  goBack: () => void;

  wikiPanelState: PanelState;
  setWikiPanelState: (state: PanelState) => void;

  graphFocusNodeId: string | null;
  graphTypeFilter: NodeType[];
  setGraphFocus: (id: string | null) => void;
  toggleGraphTypeFilter: (type: NodeType) => void;
  clearGraphFilters: () => void;

  sidebarOpen: boolean;
  sidebarWidth: number;
  collapsedTypes: NodeType[];
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleTypeCollapse: (type: NodeType) => void;

  searchOpen: boolean;
  searchQuery: string;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;

  hoverNodeId: string | null;
  hoverAnchor: { x: number; y: number } | null;
  setHoverCard: (id: string | null, anchor?: { x: number; y: number }) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  worldManagerOpen: boolean;
  setWorldManagerOpen: (open: boolean) => void;

  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  activeView: 'wiki',
  activeNodeId: null,
  navigationHistory: [],

  setActiveView: (view) => set({ activeView: view }),

  setActiveNode: (id) => {
    const { activeNodeId, navigationHistory } = get();
    if (activeNodeId && id !== activeNodeId) {
      set({
        activeNodeId: id,
        navigationHistory: [...navigationHistory, activeNodeId].slice(-50),
      });
    } else {
      set({ activeNodeId: id });
    }
  },

  goBack: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length === 0) return;
    const prev = navigationHistory[navigationHistory.length - 1];
    set({
      activeNodeId: prev,
      navigationHistory: navigationHistory.slice(0, -1),
    });
  },

  wikiPanelState: 'preview',
  setWikiPanelState: (state) => set({ wikiPanelState: state }),

  graphFocusNodeId: null,
  graphTypeFilter: [],
  setGraphFocus: (id) => set({ graphFocusNodeId: id }),
  toggleGraphTypeFilter: (type) => {
    const { graphTypeFilter } = get();
    if (graphTypeFilter.includes(type)) {
      set({ graphTypeFilter: graphTypeFilter.filter(t => t !== type) });
    } else {
      set({ graphTypeFilter: [...graphTypeFilter, type] });
    }
  },
  clearGraphFilters: () => set({ graphTypeFilter: [] }),

  sidebarOpen: true,
  sidebarWidth: 256,
  collapsedTypes: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(200, Math.min(400, w)) }),
  toggleTypeCollapse: (type) => {
    const { collapsedTypes } = get();
    if (collapsedTypes.includes(type)) {
      set({ collapsedTypes: collapsedTypes.filter(t => t !== type) });
    } else {
      set({ collapsedTypes: [...collapsedTypes, type] });
    }
  },

  searchOpen: false,
  searchQuery: '',
  setSearchOpen: (open) => set({ searchOpen: open, searchQuery: open ? '' : get().searchQuery }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  hoverNodeId: null,
  hoverAnchor: null,
  setHoverCard: (id, anchor) => set({ hoverNodeId: id, hoverAnchor: anchor ?? null }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  worldManagerOpen: false,
  setWorldManagerOpen: (open) => set({ worldManagerOpen: open }),

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
