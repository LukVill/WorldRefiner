'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// Allow forcing "production" behavior when running locally by setting
// ELECTRON_FORCE_PROD=1 in the environment. This is useful to run the
// built `dist/` output with Electron without creating a packaged app.
const isForceProd = process.env.ELECTRON_FORCE_PROD === '1';
const isDev = !(app.isPackaged || isForceProd);

// Global config lives in the user's appData so it is accessible before
// we decide where the app's data root should be. This lets users point
// the app at a custom folder where their world JSON files live.
const globalConfigPath = path.join(app.getPath('userData'), 'config.json');

// Load global config (if present) so we can honour an external data path
// before computing `dataRoot`.
let externalDataPath = null;
try {
  if (fs.existsSync(globalConfigPath)) {
    const parsed = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8') || '{}');
    if (parsed && typeof parsed.externalDataPath === 'string' && parsed.externalDataPath.trim()) {
      externalDataPath = parsed.externalDataPath.trim();
    }
  }
} catch (err) {
  console.error('Failed to read global config', err);
}

// Store data in the repo's data/ folder (dev) or userData (packaged),
// but allow overriding via `externalDataPath` from the global config.
const defaultDataRoot = isDev
  ? path.join(process.cwd(), 'data')
  : path.join(app.getPath('userData'), 'data');

const dataRoot = externalDataPath || defaultDataRoot;

const configPath = globalConfigPath;

function getDataRoot() {
  try {
    if (fs.existsSync(globalConfigPath)) {
      const parsed = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8') || '{}');
      if (parsed && typeof parsed.externalDataPath === 'string' && parsed.externalDataPath.trim()) {
        return parsed.externalDataPath.trim();
      }
    }
  } catch (err) {
    console.error('Failed to read global config for dataRoot', err);
  }
  return dataRoot;
}

// Resolve the directory where world JSON files live.
// Rules for a custom externalDataPath:
//   1. If <customPath>/worlds/ exists → use it (honours an existing worlds folder).
//   2. Otherwise → use <customPath> directly (the user pointed at the worlds folder itself).
// For the built-in default path we always use <defaultDataRoot>/worlds/ and create it if needed.
function getWorldsDir() {
  const root = getDataRoot();
  const subworlds = path.join(root, 'worlds');

  // If a 'worlds' subfolder already exists inside the data root, use it.
  if (fs.existsSync(subworlds) && fs.statSync(subworlds).isDirectory()) {
    return subworlds;
  }

  // No 'worlds' subfolder found. Decide based on whether a custom path is active.
  let hasCustomPath = false;
  try {
    if (fs.existsSync(globalConfigPath)) {
      const cfg = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8') || '{}');
      hasCustomPath = !!(cfg && typeof cfg.externalDataPath === 'string' && cfg.externalDataPath.trim());
    }
  } catch {}

  // Custom path with no 'worlds' subfolder → treat the path itself as the worlds directory.
  // Default path → create and use the 'worlds' subfolder as before.
  return hasCustomPath ? root : subworlds;
}

function ensureDirs() {
  fs.mkdirSync(getWorldsDir(), { recursive: true });
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('worlds:save', (_event, world) => {
  ensureDirs();
  const worldsDirNow = getWorldsDir();
  fs.writeFileSync(
    path.join(worldsDirNow, `${world.id}.json`),
    JSON.stringify(world, null, 2),
    'utf-8'
  );
  return { ok: true };
});

ipcMain.handle('worlds:loadAll', () => {
  ensureDirs();
  const worldsDirNow = getWorldsDir();
  if (!fs.existsSync(worldsDirNow)) return [];
  return fs
    .readdirSync(worldsDirNow)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(worldsDirNow, f), 'utf-8'));
      } catch (err) {
        console.error('Failed to parse world file', f, err);
        return null;
      }
    })
    .filter(Boolean);
});

ipcMain.handle('worlds:load', (_event, id) => {
  const worldsDirNow = getWorldsDir();
  const p = path.join(worldsDirNow, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (err) {
    console.error('Failed to load world', id, err);
    return null;
  }
});

ipcMain.handle('worlds:delete', (_event, id) => {
  ensureDirs();
  const worldsDirNow = getWorldsDir();
  const p = path.join(worldsDirNow, `${id}.json`);
  const existed = fs.existsSync(p);
  try {
    if (existed) fs.unlinkSync(p);
    return { ok: true, deleted: existed, path: p };
  } catch (err) {
    console.error('Failed to delete world file', p, err);
    return { ok: false, error: String(err), path: p };
  }
});

ipcMain.handle('config:save', (_event, config) => {
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config || {}, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('Failed to save config', err);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('config:load', () => {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) || {};
  } catch (err) {
    console.error('Failed to load config', err);
    return {};
  }
});

// ── Window ────────────────────────────────────────────────────────────────────

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'World Refiner',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

// If running in dev, ensure the Vite dev server is running. If it's not
// reachable we'll spawn `npm run _vite` in the project root and wait until
// the server responds. This allows launching the whole app with just
// `npx electron .` (or `npm run start:electron`).
let viteProcess = null;

function checkUrl(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      // any response means server is up
      res.destroy();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function ensureDevServer() {
  const url = 'http://localhost:5173';
  if (await checkUrl(url)) return;

  // Spawn vite using the npm script so environment and PATH are correct.
  viteProcess = spawn('npm', ['run', '_vite'], {
    cwd: app.getAppPath(),
    shell: true,
    stdio: 'inherit',
  });

  const start = Date.now();
  const timeout = 30000; // 30s
  // Poll until server is up or we hit timeout
  while (Date.now() - start < timeout) {
    // eslint-disable-next-line no-await-in-loop
    if (await checkUrl(url)) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Timed out waiting for Vite dev server at ' + url);
}

app.whenReady().then(async () => {
  try {
    if (isDev) await ensureDevServer();
  } catch (err) {
    console.error(err);
  }

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (viteProcess && !viteProcess.killed) {
    try {
      viteProcess.kill();
    } catch {
      // ignore
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
