const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, globalShortcut, session, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");
const widget = require("./widget-shortcut");

app.commandLine.appendSwitch("enable-transparent-visuals");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("disable-http-cache");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let win;
let tray;

function desktopDirs() {
  const dirs = [];
  try {
    dirs.push(app.getPath("desktop"));
  } catch (_) {}
  const home = os.homedir();
  dirs.push(path.join(home, "Desktop"));
  dirs.push(path.join(home, "OneDrive", "Desktop"));
  dirs.push("C:\\Users\\Public\\Desktop");
  return [...new Set(dirs.filter((p) => p && fs.existsSync(p)))];
}

function shellDesktop() {
  try {
    const dir = app.getPath("desktop");
    if (dir && fs.existsSync(dir)) return dir;
  } catch (_) {}
  const onedrive = path.join(os.homedir(), "OneDrive", "Desktop");
  if (fs.existsSync(onedrive)) return onedrive;
  return path.join(os.homedir(), "Desktop");
}

function widgetInstallDirs() {
  return [...new Set([shellDesktop(), path.join(os.homedir(), "OneDrive", "Desktop"), path.join(os.homedir(), "Desktop")].filter((p) => p && fs.existsSync(p)))];
}

function widgetIcon() {
  const png = path.join(__dirname, "assets", "tray.png");
  const ico = path.join(app.getPath("userData"), "luffy.ico");
  try {
    if (fs.existsSync(png)) return widget.ensureIco(png, ico);
  } catch (_) {}
  return path.join(__dirname, "node_modules", "electron", "dist", "electron.exe");
}

function createWidgetShortcut() {
  return widget.createWidgetShortcut({
    destDirs: widgetInstallDirs(),
    allDesktopDirs: desktopDirs(),
    bat: process.execPath,
    workdir: __dirname,
    icon: widgetIcon(),
  });
}

function removeWidgetShortcuts() {
  return widget.removeWidgetShortcuts(desktopDirs());
}

function widgetInstalled() {
  return widget.widgetInstalled(widgetInstallDirs());
}

function diskFiles() {
  const seen = new Set();
  const out = [];
  for (const dir of desktopDirs()) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const name = ent.name;
      if (!name || name.startsWith(".") || name === "desktop.ini") continue;
      const full = path.join(dir, name);
      if (isProtected(full)) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        name,
        path: full,
        isDir: ent.isDirectory(),
        kind: kindOf(name, ent.isDirectory()),
      });
    }
  }
  return out;
}

function matchDisk(label, files) {
  const q = String(label || "").trim().toLowerCase();
  if (!q) return null;
  if (/^(cestino|recycle bin|this pc|questo pc|network|rete)$/i.test(q)) return null;
  return (
    files.find((f) => f.name.toLowerCase() === q) ||
    files.find((f) => path.parse(f.name).name.toLowerCase() === q) ||
    files.find((f) => path.parse(f.name).name.toLowerCase().replace(/\s+$/, "") === q)
  );
}

function scanIconPositions() {
  const script = path.join(__dirname, "desktop-scan.ps1");
  try {
    const r = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
      { encoding: "utf8", timeout: 15000, windowsHide: true }
    );
    const text = String(r.stdout || "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < start) return [];
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
}

function kindOf(name, isDir) {
  if (isDir) return "folder";
  const ext = path.extname(name).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".ico"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".mkv", ".avi", ".webm"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".flac", ".ogg", ".m4a"].includes(ext)) return "audio";
  if ([".txt", ".md", ".pdf", ".doc", ".docx"].includes(ext)) return "text";
  if ([".zip", ".rar", ".7z"].includes(ext)) return "archive";
  if ([".js", ".ts", ".html", ".css", ".json", ".py"].includes(ext)) return "code";
  return "file";
}

const HOLD_DIR = path.join(os.tmpdir(), "luffy-holding");
const MANIFEST = path.join(HOLD_DIR, "manifest.json");
let stolen = [];

function loadManifest() {
  try {
    stolen = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (!Array.isArray(stolen)) stolen = [];
  } catch {
    stolen = [];
  }
}

function saveManifest() {
  fs.mkdirSync(HOLD_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(stolen));
}

function isOnDesktop(filePath) {
  const resolved = path.resolve(filePath);
  return desktopDirs().some((dir) => {
    const d = path.resolve(dir);
    return resolved === d || resolved.startsWith(d + path.sep);
  });
}

function isProtected(filePath) {
  const resolved = path.resolve(filePath);
  const appDir = path.resolve(__dirname);
  const project = path.resolve(__dirname, "..");
  if (resolved === appDir || resolved.startsWith(appDir + path.sep)) return true;
  if (resolved === project || resolved.startsWith(project + path.sep)) return true;
  const bat = path.join(project, "Avvia Luffy.bat");
  if (resolved.toLowerCase() === path.resolve(bat).toLowerCase()) return true;
  if (/^luffy( widget)?\.(lnk|bat|url)$/i.test(path.basename(resolved))) return true;
  return false;
}

function moveItem(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.renameSync(from, to);
  } catch {
    fs.cpSync(from, to, { recursive: true });
    fs.rmSync(from, { recursive: true, force: true });
  }
}

function uniqueHeld(name) {
  fs.mkdirSync(HOLD_DIR, { recursive: true });
  let dest = path.join(HOLD_DIR, name);
  let i = 1;
  while (fs.existsSync(dest)) {
    dest = path.join(HOLD_DIR, `${i}-${name}`);
    i += 1;
  }
  return dest;
}

function freeOriginal(original) {
  if (!fs.existsSync(original)) return original;
  const dir = path.dirname(original);
  const ext = path.extname(original);
  const base = path.basename(original, ext);
  let i = 1;
  let candidate;
  do {
    candidate = path.join(dir, `${base} (risputato ${i})${ext}`);
    i += 1;
  } while (fs.existsSync(candidate));
  return candidate;
}

function stealFile(filePath) {
  const resolved = path.resolve(String(filePath || ""));
  if (!resolved || !isOnDesktop(resolved)) return { ok: false, reason: "not-desktop" };
  if (isProtected(resolved)) return { ok: false, reason: "protected" };
  if (!fs.existsSync(resolved)) return { ok: false, reason: "missing" };
  if (stolen.some((s) => s.original === resolved)) return { ok: true, already: true };
  const held = uniqueHeld(path.basename(resolved));
  moveItem(resolved, held);
  stolen.push({
    original: resolved,
    held,
    name: path.basename(resolved),
  });
  saveManifest();
  return { ok: true, name: path.basename(resolved) };
}

function spitAll() {
  loadManifest();
  const restored = [];
  for (const item of stolen) {
    if (!item?.held || !fs.existsSync(item.held)) continue;
    const dest = freeOriginal(item.original);
    try {
      moveItem(item.held, dest);
      restored.push({ name: item.name, path: dest });
    } catch (err) {
      console.error("spit failed", item, err);
    }
  }
  stolen = [];
  try {
    fs.rmSync(MANIFEST, { force: true });
  } catch (_) {}
  return restored;
}

function toOverlayPos(screenX, screenY) {
  const origin = win ? win.getBounds() : screen.getPrimaryDisplay().workArea;
  return {
    x: Math.round(Number(screenX) - origin.x),
    y: Math.round(Number(screenY) - origin.y),
  };
}

function explorerSort(files) {
  return [...files].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, "it", { numeric: true, sensitivity: "base" });
  });
}

function autoArrange(files) {
  const area = win ? win.getBounds() : screen.getPrimaryDisplay().workArea;
  const colW = 78;
  const rowH = 108;
  const startX = 26;
  const startY = 6;
  const rows = Math.max(1, Math.floor((area.height - 48) / rowH));
  return explorerSort(files).map((file, i) => ({
    id: file.path,
    name: file.name,
    path: file.path,
    isDir: file.isDir,
    kind: file.kind,
    x: startX + Math.floor(i / rows) * colW,
    y: startY + (i % rows) * rowH,
  }));
}

function listDesktopFiles() {
  const onDisk = diskFiles();
  const icons = scanIconPositions();
  const used = new Set();
  const out = [];
  for (const icon of icons) {
    const file = matchDisk(icon.name, onDisk);
    if (!file || used.has(file.path)) continue;
    used.add(file.path);
    const pos = toOverlayPos(icon.x, icon.y);
    out.push({
      id: file.path,
      name: file.name,
      path: file.path,
      isDir: file.isDir,
      kind: file.kind,
      x: pos.x,
      y: pos.y,
    });
    if (out.length >= 40) return out;
  }
  if (out.length) return out;
  return autoArrange(onDisk);
}

function trayIcon() {
  const png = path.join(__dirname, "assets", "tray.png");
  if (fs.existsSync(png)) return png;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="20" r="10" fill="#e8c56b"/>
      <ellipse cx="16" cy="12" rx="8" ry="7" fill="#d4b24e"/>
      <rect x="8" y="16" width="16" height="4" rx="1" fill="#c62828"/>
    </svg>`;
  return nativeImage.createFromDataURL(
    "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64")
  );
}

function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    fullscreen: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    focusable: false,
    show: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      v8CacheOptions: "none",
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, "overlay.html"), { query: { v: "47" } });
  win.webContents.on("before-input-event", (_e, input) => {
    if (input.type === "keyDown" && input.key === "Escape") {
      win.webContents.send("force-hide");
    }
  });
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip("Luffy — clicca il cappello o premi F8");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Chiama Luffy",
        click: () => win && win.webContents.send("force-show"),
      },
      {
        label: "Disinstalla widget",
        click: () => {
          removeWidgetShortcuts();
          if (win) win.webContents.send("widget-uninstalled");
        },
      },
      { type: "separator" },
      { label: "Esci", click: () => app.quit() },
    ])
  );
  tray.on("click", () => win && win.webContents.send("force-show"));
}

if (gotLock) {
  app.on("second-instance", () => {
    if (win) win.webContents.send("force-show");
  });

  app.whenReady().then(() => {
    spitAll();
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === "media" || permission === "microphone" || permission === "display-capture");
    });

    const delay = process.platform === "win32" ? 400 : 0;
    setTimeout(() => {
      createWindow();
      createTray();
      globalShortcut.register("CommandOrControl+Shift+L", () => {
        if (win) win.webContents.send("force-show");
      });
      globalShortcut.register("F8", () => {
        if (win) win.webContents.send("force-show");
      });
    }, delay);
  });
}

ipcMain.on("click-through", (_e, ignore) => {
  if (!win) return;
  win.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
});

ipcMain.on("set-focusable", (_e, focusable) => {
  if (!win) return;
  win.setFocusable(Boolean(focusable));
  if (focusable) win.moveTop();
});

ipcMain.on("luffy-visible", (_e, visible) => {
  if (visible) {
    globalShortcut.register("Escape", () => {
      if (win) win.webContents.send("force-hide");
    });
  } else {
    globalShortcut.unregister("Escape");
  }
});

ipcMain.handle("list-desktop", async () => listDesktopFiles());
ipcMain.handle("steal-file", async (_e, filePath) => stealFile(filePath));
ipcMain.handle("spit-files", async () => spitAll());
ipcMain.handle("widget-status", async () => ({ installed: widgetInstalled() }));
ipcMain.handle("widget-install", async () => createWidgetShortcut());
ipcMain.handle("widget-uninstall", async () => removeWidgetShortcuts());

app.on("before-quit", () => {
  spitAll();
});
app.on("will-quit", () => {
  spitAll();
  globalShortcut.unregisterAll();
});
app.on("window-all-closed", (e) => e.preventDefault());
