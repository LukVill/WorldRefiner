export {};

declare global {
  interface Window {
    electronAPI: {
      saveWorld:      (world: import('./types').World) => Promise<{ ok: boolean }>;
      loadAllWorlds:  () => Promise<import('./types').World[]>;
      loadWorld:      (id: string) => Promise<import('./types').World | null>;
      deleteWorld:    (id: string) => Promise<{ ok: boolean }>;
      saveConfig:     (config: Record<string, unknown>) => Promise<{ ok: boolean }>;
      loadConfig:     () => Promise<Record<string, unknown>>;
    };
  }
}
