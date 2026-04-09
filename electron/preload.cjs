'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveWorld:   (world)  => ipcRenderer.invoke('worlds:save', world),
  loadAllWorlds: ()     => ipcRenderer.invoke('worlds:loadAll'),
  loadWorld:   (id)     => ipcRenderer.invoke('worlds:load', id),
  deleteWorld: (id)     => ipcRenderer.invoke('worlds:delete', id),
  saveConfig:  (config) => ipcRenderer.invoke('config:save', config),
  loadConfig:  ()       => ipcRenderer.invoke('config:load'),
});
