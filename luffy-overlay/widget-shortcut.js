"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const WIDGET_NAMES = ["Luffy.lnk", "Luffy.bat", "Luffy Widget.lnk", "Widget Luffy.lnk", "Avvia Luffy.lnk"];
const CANONICAL_NAMES = ["Luffy.lnk", "Luffy.bat"];

function psQuote(value) {
  return "'" + String(value || "").replace(/'/g, "''") + "'";
}

function uniqueExisting(dirs) {
  return [...new Set((dirs || []).filter((p) => p && fs.existsSync(p)))];
}

function defaultPowershell() {
  return path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}

function pngToIco(pngBuf) {
  const width = pngBuf.readUInt32BE(16);
  const height = pngBuf.readUInt32BE(20);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = width >= 256 ? 0 : width;
  entry[1] = height >= 256 ? 0 : height;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
}

function ensureIco(pngPath, icoPath) {
  const png = fs.readFileSync(pngPath);
  fs.mkdirSync(path.dirname(icoPath), { recursive: true });
  fs.writeFileSync(icoPath, pngToIco(png));
  return icoPath;
}

function notifyExplorer(powershell, { created, deleted, dirs } = {}) {
  const scriptPath = path.join(os.tmpdir(), "luffy-widget-notify.ps1");
  const lines = [
    `Add-Type -TypeDefinition @"`,
    `using System;`,
    `using System.Runtime.InteropServices;`,
    `public static class LuffyShellNotify {`,
    `  [DllImport("shell32.dll")] public static extern void SHChangeNotify(int e, uint f, IntPtr d, IntPtr i);`,
    `}`,
    `"@ -ErrorAction SilentlyContinue`,
  ];
  for (const p of created || []) {
    lines.push(`[LuffyShellNotify]::SHChangeNotify(0x2, 0x1005, [System.Runtime.InteropServices.Marshal]::StringToHGlobalUni(${psQuote(p)}), [IntPtr]::Zero)`);
  }
  for (const p of deleted || []) {
    lines.push(`[LuffyShellNotify]::SHChangeNotify(0x4, 0x1005, [System.Runtime.InteropServices.Marshal]::StringToHGlobalUni(${psQuote(p)}), [IntPtr]::Zero)`);
  }
  for (const p of dirs || []) {
    lines.push(`[LuffyShellNotify]::SHChangeNotify(0x1000, 0x1005, [System.Runtime.InteropServices.Marshal]::StringToHGlobalUni(${psQuote(p)}), [IntPtr]::Zero)`);
  }
  lines.push(`[LuffyShellNotify]::SHChangeNotify(0x8000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)`);
  try {
    fs.writeFileSync(scriptPath, lines.join("\r\n"), "utf8");
    spawnSync(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
      windowsHide: true,
      timeout: 8000,
      encoding: "utf8",
    });
  } catch (_) {}
}

function forceUnlink(full) {
  try {
    if (fs.existsSync(full)) fs.chmodSync(full, 0o666);
  } catch (_) {}
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (_) {}
  if (fs.existsSync(full)) {
    spawnSync(
      defaultPowershell(),
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Remove-Item -LiteralPath ${psQuote(full)} -Force -ErrorAction SilentlyContinue`],
      { windowsHide: true, timeout: 8000, encoding: "utf8" }
    );
  }
  return !fs.existsSync(full);
}

function createShortcutLnk({ lnk, target, workdir, icon, powershell }) {
  const scriptPath = path.join(os.tmpdir(), "luffy-widget-shortcut.ps1");
  const iconLocation = icon ? `${icon},0` : "";
  const script = [
    `$ErrorActionPreference = 'Stop'`,
    `$ws = New-Object -ComObject WScript.Shell`,
    `$s = $ws.CreateShortcut(${psQuote(lnk)})`,
    `$s.TargetPath = ${psQuote(target)}`,
    `$s.WorkingDirectory = ${psQuote(workdir)}`,
    `$s.WindowStyle = 1`,
    `$s.Description = "Luffy"`,
    iconLocation ? `$s.IconLocation = ${psQuote(iconLocation)}` : "",
    `$s.Save()`,
    `if (-not (Test-Path -LiteralPath ${psQuote(lnk)})) { throw 'lnk missing after Save' }`,
  ].filter(Boolean).join("\r\n");
  fs.writeFileSync(scriptPath, script, "utf8");
  const r = spawnSync(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
    windowsHide: true,
    timeout: 15000,
    encoding: "utf8",
  });
  const err = [r.error ? String(r.error) : "", r.stderr || "", r.status ? `status ${r.status}` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    ok: fs.existsSync(lnk),
    error: err,
  };
}

function writeFallbackBat(dir, target, workdir) {
  const launcher = path.join(dir, "Luffy.bat");
  fs.writeFileSync(
    launcher,
    `@echo off\r\ncd /d ${JSON.stringify(workdir)}\r\nstart "" ${JSON.stringify(target)}\r\n`,
    "utf8"
  );
  return fs.existsSync(launcher) ? launcher : "";
}

function removeNames(dirs, names, keep) {
  const keepSet = new Set((keep || []).map((p) => path.resolve(p).toLowerCase()));
  const deleted = [];
  const leftover = [];
  for (const dir of uniqueExisting(dirs)) {
    for (const name of names) {
      const full = path.join(dir, name);
      if (keepSet.has(path.resolve(full).toLowerCase())) continue;
      if (!fs.existsSync(full)) continue;
      if (forceUnlink(full)) deleted.push(full);
      else leftover.push(full);
    }
  }
  return { deleted, leftover };
}

function createWidgetShortcut({ destDirs, allDesktopDirs, bat, workdir, icon, powershell }) {
  const ps = powershell || defaultPowershell();
  const dirs = uniqueExisting(destDirs);
  if (!dirs.length) return { ok: false, path: "", files: [], error: "no-desktop" };
  if (!fs.existsSync(bat)) return { ok: false, path: "", files: [], error: "missing-launcher" };

  const errors = [];
  for (const dir of dirs) {
    const lnk = path.join(dir, "Luffy.lnk");
    const made = createShortcutLnk({ lnk, target: bat, workdir, icon, powershell: ps });
    let created = "";
    if (made.ok) created = lnk;
    else {
      if (made.error) errors.push(made.error);
      try {
        created = writeFallbackBat(dir, bat, workdir);
      } catch (err) {
        errors.push(String(err && err.message ? err.message : err));
      }
    }
    if (!created) continue;
    const files = [created];
    removeNames(allDesktopDirs || dirs, WIDGET_NAMES, files);
    notifyExplorer(ps, { created: files, dirs });
    return { ok: true, path: created, files, error: "" };
  }
  return { ok: false, path: "", files: [], error: errors.join("; ") || "create-failed" };
}

function removeWidgetShortcuts(dirs) {
  const { deleted, leftover } = removeNames(dirs, WIDGET_NAMES, []);
  notifyExplorer(defaultPowershell(), { deleted, dirs });
  return { ok: leftover.length === 0, removed: deleted.length, leftover };
}

function shortcutPaths(dirs, names) {
  const out = [];
  for (const dir of uniqueExisting(dirs)) {
    for (const name of names) out.push(path.join(dir, name));
  }
  return out;
}

function widgetInstalled(dirs) {
  return shortcutPaths(dirs, CANONICAL_NAMES).some((p) => fs.existsSync(p));
}

module.exports = {
  WIDGET_NAMES,
  CANONICAL_NAMES,
  pngToIco,
  ensureIco,
  createWidgetShortcut,
  removeWidgetShortcuts,
  widgetInstalled,
  shortcutPaths,
};
