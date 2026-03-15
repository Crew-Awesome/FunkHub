const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("funkhubDesktop", {
  installArchive: (payload) => ipcRenderer.invoke("funkhub:installArchive", payload),
  installEngine: (payload) => ipcRenderer.invoke("funkhub:installEngine", payload),
  cancelInstall: (payload) => ipcRenderer.invoke("funkhub:cancelInstall", payload),
  launchEngine: (payload) => ipcRenderer.invoke("funkhub:launchEngine", payload),
  openPath: (payload) => ipcRenderer.invoke("funkhub:openPath", payload),
  openAnyPath: (payload) => ipcRenderer.invoke("funkhub:openAnyPath", payload),
  openExternalUrl: (payload) => ipcRenderer.invoke("funkhub:openExternalUrl", payload),
  deletePath: (payload) => ipcRenderer.invoke("funkhub:deletePath", payload),
  getItchAuthStatus: () => ipcRenderer.invoke("funkhub:getItchAuthStatus"),
  clearItchAuth: () => ipcRenderer.invoke("funkhub:clearItchAuth"),
  startItchOAuth: (payload) => ipcRenderer.invoke("funkhub:startItchOAuth", payload),
  listItchBaseGameReleases: () => ipcRenderer.invoke("funkhub:listItchBaseGameReleases"),
  resolveItchBaseGameDownload: (payload) => ipcRenderer.invoke("funkhub:resolveItchBaseGameDownload", payload),
  inspectEngineInstall: (payload) => ipcRenderer.invoke("funkhub:inspectEngineInstall", payload),
  inspectPath: (payload) => ipcRenderer.invoke("funkhub:inspectPath", payload),
  importEngineFolder: (payload) => ipcRenderer.invoke("funkhub:importEngineFolder", payload),
  importModFolder: (payload) => ipcRenderer.invoke("funkhub:importModFolder", payload),
  pickFolder: (payload) => ipcRenderer.invoke("funkhub:pickFolder", payload),
  pickFile: (payload) => ipcRenderer.invoke("funkhub:pickFile", payload),
  getSettings: () => ipcRenderer.invoke("funkhub:getSettings"),
  updateSettings: (payload) => ipcRenderer.invoke("funkhub:updateSettings", payload),
  getPendingDeepLinks: () => ipcRenderer.invoke("funkhub:getPendingDeepLinks"),
  onDeepLink: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("funkhub:deep-link", wrapped);
    return () => {
      ipcRenderer.removeListener("funkhub:deep-link", wrapped);
    };
  },
  onInstallProgress: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("funkhub:install-progress", wrapped);
    return () => {
      ipcRenderer.removeListener("funkhub:install-progress", wrapped);
    };
  },
});
