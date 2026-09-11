"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  createWidgetShortcut,
  removeWidgetShortcuts,
  widgetInstalled,
  ensureIco,
} = require("./widget-shortcut");

const ROOT = path.join(__dirname, "..");
const bat = path.join(ROOT, "Avvia Luffy.bat");
const png = path.join(__dirname, "assets", "tray.png");
const destDir = fs.mkdtempSync(path.join(os.tmpdir(), "luffy-widget-test-"));
const ico = path.join(destDir, "luffy.ico");
const leftover = path.join(destDir, "Luffy Widget.lnk");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

fs.writeFileSync(leftover, "legacy", "utf8");
ensureIco(png, ico);

const created = createWidgetShortcut({
  destDirs: [destDir],
  allDesktopDirs: [destDir],
  bat,
  workdir: ROOT,
  icon: ico,
});

assert(created.ok, `install failed: ${created.error}`);
assert(fs.existsSync(created.path), "canonical shortcut missing");
assert(path.basename(created.path) === "Luffy.lnk" || path.basename(created.path) === "Luffy.bat", "unexpected name");
assert(widgetInstalled([destDir]), "status should be installed");
assert(!fs.existsSync(leftover), "legacy shortcut should be removed");

const removed = removeWidgetShortcuts([destDir]);
assert(removed.ok, "uninstall failed");
assert(!removed.leftover || removed.leftover.length === 0, "uninstall leftover");
assert(!widgetInstalled([destDir]), "status should be uninstalled");
assert(!fs.existsSync(created.path), "canonical shortcut still present after uninstall");

fs.rmSync(destDir, { recursive: true, force: true });
console.log("ok", created.path);
