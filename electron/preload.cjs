const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("funkhubDesktop", {
  installArchive: (payload) => ipcRenderer.invoke("funkhub:installArchive", payload),
  installEngine: (payload) => ipcRenderer.invoke("funkhub:installEngine", payload),
  cancelInstall: (payload) => ipcRenderer.invoke("funkhub:cancelInstall", payload),
  launchEngine: (payload) => ipcRenderer.invoke("funkhub:launchEngine", payload),
  openPath: (payload) => ipcRenderer.invoke("funkhub:openPath", payload),
  pickFolder: (payload) => ipcRenderer.invoke("funkhub:pickFolder", payload),
  getSettings: () => ipcRenderer.invoke("funkhub:getSettings"),
  updateSettings: (payload) => ipcRenderer.invoke("funkhub:updateSettings", payload),
  onInstallProgress: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("funkhub:install-progress", wrapped);
    return () => {
      ipcRenderer.removeListener("funkhub:install-progress", wrapped);
    };
  },
});
