// main.js
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ====== Preferencias simples (recordar última carpeta usada) ======
const prefsPath = path.join(app.getPath('userData'), 'prefs.json');
function readPrefs() {
  try { return JSON.parse(fs.readFileSync(prefsPath, 'utf-8')); }
  catch { return {}; }
}
function writePrefs(prefs) {
  try { fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf-8'); } catch {}
}
let prefs = readPrefs();

// ====== Carpeta “local” por plataforma ======
function getDefaultSessionsDir() {
  if (process.platform === 'win32') {
    // Windows: junto al ejecutable (portable)
    return path.join(path.dirname(process.execPath), 'sesiones');
  } else {
    // macOS: NO escribir dentro del .app. Usamos Documentos del usuario.
    return path.join(app.getPath('documents'), 'AgricolaBE-Sesiones');
  }
}
function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

// ====== Ventana principal ======
function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    backgroundColor: '#ffffff',
    autoHideMenuBar: false, // mostramos menú
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // En dev usa PNG; en empaquetado Forge usará packagerConfig.icon (icns/ico)
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Panel "About" nativo en mac (opcional)
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'Agrícola BE — Editor',
      applicationVersion: app.getVersion(),
      copyright: `© ${new Date().getFullYear()} Sambalab Studios`,
      credits: 'Creado por DGRcodex (Daniel Garcia Rojas) — Sambalab Studios',
      website: 'https://sambalab.pro',
      iconPath: path.join(__dirname, 'assets', 'icon.png')
    });
  }

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Abrir links externos en el navegador
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) { e.preventDefault(); shell.openExternal(url); }
  });
}

// ====== Menú ======
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Sitio Sambalab', click: () => shell.openExternal('https://sambalab.pro') },
        { label: 'GitHub DGRcodex', click: () => shell.openExternal('https://github.com/dgrcodex') }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ====== IPC: Guardar / Cargar sesiones (.json) ======
ipcMain.handle("save-file", async (event, data) => {
  try {
    const baseDir = prefs.lastDir || getDefaultSessionsDir();
    ensureDir(baseDir);

    const safeName = ((data?.name || 'sesion-agricola').toString()).replace(/[\\/:*?"<>|]/g, '-');
    const suggested = safeName + '.json';

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Guardar sesión",
      defaultPath: path.join(baseDir, suggested),
      filters: [{ name: "Sesiones Agrícola BE", extensions: ["json"] }]
    });
    if (canceled || !filePath) return { success: false };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    prefs.lastDir = path.dirname(filePath);
    writePrefs(prefs);
    return { success: true, path: filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("load-file", async () => {
  try {
    const baseDir = prefs.lastDir || getDefaultSessionsDir();
    ensureDir(baseDir);

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Cargar sesión",
      defaultPath: baseDir,
      filters: [{ name: "Sesiones Agrícola BE", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (canceled || !filePaths || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const raw = fs.readFileSync(filePath, "utf-8");
    prefs.lastDir = path.dirname(filePath);
    writePrefs(prefs);
    return JSON.parse(raw);
  } catch {
    return null;
  }
});

// (Opcional) Abrir carpeta de sesiones en Finder/Explorer
ipcMain.handle("open-sessions-dir", async () => {
  const dir = prefs.lastDir || getDefaultSessionsDir();
  ensureDir(dir);
  await shell.openPath(dir);
  return dir;
});
