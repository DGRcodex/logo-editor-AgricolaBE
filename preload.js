// Aislado. No exponemos APIs de Node al DOM (más seguro).
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (payload) => ipcRenderer.invoke("save-file", payload),
  loadFile: () => ipcRenderer.invoke("load-file"),
  openSessionsDir: () => ipcRenderer.invoke("open-sessions-dir")
});
