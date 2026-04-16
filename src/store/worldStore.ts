import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { World, WorldNode, WorldEdge, NodeType } from '../types';
import { slugify } from '../utils/slugify';
import { extractLinks } from '../utils/linkParser';
import { generateExcerpt } from '../utils/markdownRenderer';
import { nodeDefaults } from '../utils/nodeDefaults';
import { saveWorld, listWorlds, deleteWorldFromDB } from './persistence';
import { darkFantasy } from '../themes/darkFantasy';
import { seedWorld } from './seedData';

const defaultSettings = {
  autoLink: false,
  graphPhysics: false,
  clusterByType: false,
  defaultNodeType: 'character' as NodeType,
  autoSave: true,
  saveIntervalMs: 500,
};

interface WorldStore {
  world: World | null;
  savedWorlds: Pick<World, 'id' | 'name' | 'description' | 'updatedAt'>[];
  isDirty: boolean;
  isSaving: boolean;
  storageUnavailable: boolean;

  createWorld: (name: string, description?: string) => Promise<void>;
  loadWorldFromDB: () => Promise<void>;
  loadSavedWorlds: () => Promise<void>;
  switchWorld: (id: string) => Promise<void>;
  reloadWorld: () => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  renameWorld: (name: string) => void;
  clearGraphPositions: () => void;
  importWorld: (json: string) => void;
  exportWorld: () => string;

  createNode: (type: NodeType, title?: string) => WorldNode;
  updateNode: (id: string, changes: Partial<Pick<WorldNode, 'title' | 'content' | 'tags' | 'metadata' | 'graphPosition' | 'timelineOrder'>>) => void;
  deleteNode: (id: string) => void;
  reorderTimelineNodes: (orderedIds: string[]) => void;

  createEdge: (source: string, target: string, label?: string, type?: WorldEdge['type']) => WorldEdge;
  updateEdge: (id: string, changes: Partial<WorldEdge>) => void;
  deleteEdge: (id: string) => void;

  getNode: (id: string) => WorldNode | undefined;
  getBacklinks: (nodeId: string) => WorldNode[];
  getNeighborNodes: (nodeId: string) => WorldNode[];
  getEdgesForNode: (nodeId: string) => WorldEdge[];
  resolveSlug: (slug: string) => WorldNode | undefined;
  updateTheme: (themeId: string) => void;

  _recomputeLinks: (node: WorldNode) => string[];
  _triggerSave: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useWorldStore = create<WorldStore>((set, get) => ({
  world: null,
  savedWorlds: [],
  isDirty: false,
  isSaving: false,
  storageUnavailable: false,

  createWorld: async (name, description = '') => {
    const world: World = {
      id: nanoid(),
      name,
      description,
      nodes: {},
      edges: [],
      theme: darkFantasy,
      settings: { ...defaultSettings },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    set({ world, isDirty: false });
    await saveWorld(world);
    await get().loadSavedWorlds();
  },

  loadWorldFromDB: async () => {
    try {
      const worlds = await listWorlds();
      if (worlds.length > 0) {
        // Load most recently updated world
        const sorted = [...worlds].sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        set({
          world: sorted[0],
          savedWorlds: worlds.map(({ id, name, description, updatedAt }) => ({ id, name, description, updatedAt })),
        });
      } else {
        // First run — load seed data
        set({ world: seedWorld, isDirty: false });
        await saveWorld(seedWorld);
        set({ savedWorlds: [{ id: seedWorld.id, name: seedWorld.name, description: seedWorld.description, updatedAt: seedWorld.updatedAt }] });
      }
    } catch {
      set({ storageUnavailable: true, world: seedWorld, savedWorlds: [] });
    }
  },

  loadSavedWorlds: async () => {
    try {
      const worlds = await listWorlds();
      set({ savedWorlds: worlds.map(({ id, name, description, updatedAt }) => ({ id, name, description, updatedAt })) });
    } catch { /* ignore */ }
  },

  switchWorld: async (id) => {
    const current = get().world;
    if (current?.id === id) return;
    // Save current world first
    if (current) {
      try { await saveWorld(current); } catch { /* ignore */ }
    }
    try {
      const { loadWorld } = await import('./persistence');
      const world = await loadWorld(id);
      if (world) set({ world, isDirty: false });
    } catch { /* ignore */ }
  },

  reloadWorld: async () => {
    try {
      const { world } = get();
      if (!world) return;
      const { loadWorld } = await import('./persistence');
      const fresh = await loadWorld(world.id);
      if (fresh) set({ world: fresh, isDirty: false });
    } catch (err) {
      console.error('Failed to reload world', err);
    }
  },

  renameWorld: (name) => {
    const { world } = get();
    if (!world) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === world.name) return;
    const newWorld = { ...world, name: trimmed, updatedAt: new Date().toISOString() };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
  },

  clearGraphPositions: () => {
    const { world } = get();
    if (!world) return;
    const nodes = Object.fromEntries(
      Object.entries(world.nodes).map(([id, n]) => [id, { ...n, graphPosition: undefined }])
    );
    const newWorld = { ...world, nodes, updatedAt: new Date().toISOString() };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
  },

  deleteWorld: async (id) => {
    try {
      await deleteWorldFromDB(id);
      const { world } = get();
      const worlds = await listWorlds();
      const summary = worlds.map(({ id, name, description, updatedAt }) => ({ id, name, description, updatedAt }));
      if (world?.id === id) {
        // Switch to another world if one exists
        const other = worlds.find(w => w.id !== id);
        set({ world: other ?? null, savedWorlds: summary });
      } else {
        set({ savedWorlds: summary });
      }
    } catch { /* ignore */ }
  },

  importWorld: (json) => {
    try {
      const parsed = JSON.parse(json) as World;
      if (!parsed.id || !parsed.nodes) throw new Error('Invalid world data');
      if (parsed.version > 1) {
        console.warn('Importing world from future schema version:', parsed.version);
      }
      if (!parsed.settings) parsed.settings = { ...defaultSettings };
      if (!parsed.theme) parsed.theme = darkFantasy;
      set({ world: parsed, isDirty: true });
      get()._triggerSave();
    } catch (e) {
      console.error('Import failed:', e);
    }
  },

  exportWorld: () => {
    const { world } = get();
    if (!world) return '';
    return JSON.stringify(world, null, 2);
  },

  createNode: (type, title) => {
    const { world } = get();
    if (!world) throw new Error('No world loaded');
    const defaults = nodeDefaults[type];
    const nodeTitle = title || `New ${type}`;

    // For events, assign the next timelineOrder after the current max
    let timelineOrder: number | undefined;
    if (type === 'event') {
      const maxOrder = Object.values(world.nodes)
        .filter(n => n.type === 'event' && n.timelineOrder !== undefined)
        .reduce((max, n) => Math.max(max, n.timelineOrder!), -1);
      timelineOrder = maxOrder + 1;
    }

    const node: WorldNode = {
      id: nanoid(),
      type,
      title: nodeTitle,
      slug: slugify(nodeTitle),
      content: defaults.template,
      excerpt: '',
      tags: [],
      links: [],
      ...(timelineOrder !== undefined ? { timelineOrder } : {}),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: defaults.icon,
      },
    };
    const newWorld = {
      ...world,
      nodes: { ...world.nodes, [node.id]: node },
      updatedAt: new Date().toISOString(),
    };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
    return node;
  },

  updateNode: (id, changes) => {
    const state = get();
    if (!state.world) return;
    const existing = state.world.nodes[id];
    if (!existing) return;

    const updated: WorldNode = {
      ...existing,
      ...changes,
      metadata: {
        ...existing.metadata,
        ...(changes.metadata || {}),
        updatedAt: new Date().toISOString(),
      },
    };

    if (changes.title && changes.title !== existing.title) {
      updated.slug = slugify(changes.title);
    }

    if (changes.content !== undefined) {
      updated.excerpt = generateExcerpt(changes.content, 150);
      updated.links = get()._recomputeLinks(updated);
    }

    // Sync edges based on updated.links: add directed edges for new links,
    // and remove edges that no longer correspond to links originating from this node.
    let edges = state.world.edges.slice();
    if (changes.content !== undefined) {
      const links = updated.links ?? [];
      // remove edges where this node is the source but target is no longer linked
      edges = edges.filter(e => !(e.source === id && !links.includes(e.target)));
      // add missing edges for each linked target
      links.forEach(targetId => {
        // don't create self-links and ensure target exists
        if (targetId === id) return;
        if (!state.world!.nodes[targetId]) return;
        const exists = edges.find(e => e.source === id && e.target === targetId);
        if (!exists) {
          edges.push({ id: nanoid(), source: id, target: targetId, label: undefined, type: 'directed' });
        }
      });
    }

    const world = {
      ...state.world,
      nodes: { ...state.world.nodes, [id]: updated },
      edges,
      updatedAt: new Date().toISOString(),
    };

    set({ world, isDirty: true });
    get()._triggerSave();
    // Ensure inferred edges/backlinks reflect the updated links immediately
    try { get().resyncEdgesFromLinks(); } catch (err) { console.error('resync failed', err); }
  },

  deleteNode: (id) => {
    const { world } = get();
    if (!world) return;
    const nodes = { ...world.nodes };
    delete nodes[id];
    const edges = world.edges.filter(e => e.source !== id && e.target !== id);
    const newWorld = { ...world, nodes, edges, updatedAt: new Date().toISOString() };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
  },

  reorderTimelineNodes: (orderedIds) => {
    const { world } = get();
    if (!world) return;
    const nodes = { ...world.nodes };
    orderedIds.forEach((id, index) => {
      if (nodes[id]) {
        nodes[id] = {
          ...nodes[id],
          timelineOrder: index,
          metadata: { ...nodes[id].metadata, updatedAt: new Date().toISOString() },
        };
      }
    });
    set({ world: { ...world, nodes, updatedAt: new Date().toISOString() }, isDirty: true });
    get()._triggerSave();
  },

  createEdge: (source, target, label, type = 'directed') => {
    const { world } = get();
    if (!world) throw new Error('No world loaded');
    const edge: WorldEdge = {
      id: nanoid(),
      source,
      target,
      label,
      type,
    };
    const newWorld = {
      ...world,
      edges: [...world.edges, edge],
      updatedAt: new Date().toISOString(),
    };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
    return edge;
  },

  updateEdge: (id, changes) => {
    const { world } = get();
    if (!world) return;
    const edges = world.edges.map(e => e.id === id ? { ...e, ...changes } : e);
    set({ world: { ...world, edges, updatedAt: new Date().toISOString() }, isDirty: true });
    get()._triggerSave();
  },

  deleteEdge: (id) => {
    const { world } = get();
    if (!world) return;
    const edges = world.edges.filter(e => e.id !== id);
    set({ world: { ...world, edges, updatedAt: new Date().toISOString() }, isDirty: true });
    get()._triggerSave();
  },

  getNode: (id) => get().world?.nodes[id],

  getBacklinks: (nodeId) => {
    const { world } = get();
    if (!world) return [];
    return Object.values(world.nodes).filter(n => n.links.includes(nodeId));
  },

  getNeighborNodes: (nodeId) => {
    const { world } = get();
    if (!world) return [];
    const node = world.nodes[nodeId];
    if (!node) return [];
    const neighborIds = new Set([
      ...node.links,
      ...world.edges
        .filter(e => e.source === nodeId || e.target === nodeId)
        .flatMap(e => [e.source, e.target])
        .filter(id => id !== nodeId),
    ]);
    return [...neighborIds].map(id => world.nodes[id]).filter(Boolean);
  },

  getEdgesForNode: (nodeId) => {
    const { world } = get();
    if (!world) return [];
    return world.edges.filter(e => e.source === nodeId || e.target === nodeId);
  },

  // Rebuild edge list from node.links, preserving any existing edges that have labels.
  resyncEdgesFromLinks: () => {
    const { world } = get();
    if (!world) return;

    // desired pairs from node.links
    const desired = new Set<string>();
    Object.values(world.nodes).forEach(n => {
      (n.links || []).forEach(t => {
        if (t && t !== n.id && world.nodes[t]) desired.add(`${n.id}::${t}`);
      });
    });

    const existing = world.edges || [];
    // keep edges that have a label (considered manual) or are desired
    const kept = existing.filter(e => (e.label && e.label.trim()) || desired.has(`${e.source}::${e.target}`));

    // add missing desired edges
    desired.forEach(pair => {
      const [s, t] = pair.split('::');
      const found = kept.find(e => e.source === s && e.target === t);
      if (!found) {
        kept.push({ id: nanoid(), source: s, target: t, label: undefined, type: 'directed' });
      }
    });

    const newWorld = { ...world, edges: kept, updatedAt: new Date().toISOString() };
    set({ world: newWorld, isDirty: true });
    get()._triggerSave();
  },

  resolveSlug: (slug) => {
    const { world } = get();
    if (!world) return undefined;
    const needle = slug.toLowerCase().trim();
    return Object.values(world.nodes).find(
      n => n.slug === needle || n.title.toLowerCase() === needle
    );
  },

  updateTheme: (themeId) => {
    const { world } = get();
    if (!world) return;
    // theme will be passed from themes index
    import('../themes/index').then(({ themes }) => {
      const theme = themes.find(t => t.id === themeId);
      if (!theme) return;
      const newWorld = { ...world, theme, updatedAt: new Date().toISOString() };
      set({ world: newWorld, isDirty: true });
      get()._triggerSave();
    });
  },

  _recomputeLinks: (node) => {
    const state = get();
    if (!state.world) return [];
    const textsFound = extractLinks(node.content);
    return textsFound
      .map(text => {
        const needle = text.toLowerCase().trim();
        return Object.values(state.world!.nodes).find(
          n => n.slug === needle || n.title.toLowerCase() === needle
        )?.id;
      })
      .filter((id): id is string => Boolean(id));
  },

  _triggerSave: () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { world, isSaving } = get();
      if (!world || isSaving) return;
      set({ isSaving: true });
      try {
        await saveWorld(world);
        set({ isSaving: false, isDirty: false });
      } catch {
        set({ isSaving: false });
      }
    }, get().world?.settings.saveIntervalMs ?? 500);
  },
}));
