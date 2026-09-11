const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("luffyDesk", {
  listDesktop: () => ipcRenderer.invoke("list-desktop"),
  stealFile: (filePath) => ipcRenderer.invoke("steal-file", filePath),
  spitFiles: () => ipcRenderer.invoke("spit-files"),
  setClickThrough: (ignore) => ipcRenderer.send("click-through", ignore),
  setFocusable: (focusable) => ipcRenderer.send("set-focusable", focusable),
  setLuffyVisible: (visible) => ipcRenderer.send("luffy-visible", visible),
  widgetStatus: () => ipcRenderer.invoke("widget-status"),
  installWidget: () => ipcRenderer.invoke("widget-install"),
  uninstallWidget: () => ipcRenderer.invoke("widget-uninstall"),
  onForceShow: (fn) => ipcRenderer.on("force-show", fn),
  onForceHide: (fn) => ipcRenderer.on("force-hide", fn),
  onOpenSplash: (fn) => ipcRenderer.on("open-splash", fn),
  onWidgetUninstalled: (fn) => ipcRenderer.on("widget-uninstalled", fn),
});
