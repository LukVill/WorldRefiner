/**
 * Persistence layer.
 * In Electron: all reads/writes go through window.electronAPI → IPC → main process → disk.
 * Falls back to IndexedDB if running in a plain browser (no electronAPI).
 */
import { World } from '../types';

const isElectron = (): boolean =>
  typeof window !== 'undefined' && 'electronAPI' in window;

// ── Electron (file-based) ─────────────────────────────────────────────────────

export async function saveWorld(world: World): Promise<void> {
  if (isElectron()) {
    await window.electronAPI.saveWorld(world);
    return;
  }
  await idbSaveWorld(world);
}

export async function loadWorld(id: string): Promise<World | undefined> {
  if (isElectron()) {
    return (await window.electronAPI.loadWorld(id)) ?? undefined;
  }
  return idbLoadWorld(id);
}

export async function listWorlds(): Promise<World[]> {
  if (isElectron()) {
    return window.electronAPI.loadAllWorlds();
  }
  return idbListWorlds();
}

export async function deleteWorldFromDB(id: string): Promise<void> {
  if (isElectron()) {
    const res = await window.electronAPI.deleteWorld(id);
    // Log result for debugging — open DevTools to see this message when running in Electron.
    try { console.debug('deleteWorld result:', res); } catch {}
    return;
  }
  await idbDeleteWorld(id);
}

export async function saveConfig(config: Record<string, unknown>): Promise<void> {
  if (isElectron()) {
    await window.electronAPI.saveConfig(config);
  }
}

export async function loadConfig(): Promise<Record<string, unknown>> {
  if (isElectron()) {
    return window.electronAPI.loadConfig();
  }
  return {};
}

export function isStorageAvailable(): boolean {
  return true;
}

// ── IndexedDB fallback ────────────────────────────────────────────────────────

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'ttrpg-worldbuilder';
const DB_VERSION = 1;
const STORE_NAME = 'worlds';

let db: IDBPDatabase | null = null;

async function getDB() {
  if (db) return db;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return db;
}

async function idbSaveWorld(world: World): Promise<void> {
  const database = await getDB();
  await database.put(STORE_NAME, world);
}

async function idbLoadWorld(id: string): Promise<World | undefined> {
  const database = await getDB();
  return database.get(STORE_NAME, id);
}

async function idbListWorlds(): Promise<World[]> {
  const database = await getDB();
  return database.getAll(STORE_NAME);
}

async function idbDeleteWorld(id: string): Promise<void> {
  const database = await getDB();
  await database.delete(STORE_NAME, id);
}
