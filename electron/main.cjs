const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const {
  handleInstallArchive,
  handleInstallEngine,
  handleCancelInstall,
  handleLaunchEngine,
  handleGetSettings,
  handleUpdateSettings,
} = require("./runtime-bridge.cjs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("funkhub:installArchive", async (event, payload) => {
    return handleInstallArchive(event.sender, payload);
  });

  ipcMain.handle("funkhub:installEngine", async (event, payload) => {
    return handleInstallEngine(event.sender, payload);
  });

  ipcMain.handle("funkhub:cancelInstall", async (_event, payload) => {
    return handleCancelInstall(payload);
  });

  ipcMain.handle("funkhub:launchEngine", async (_event, payload) => {
    return handleLaunchEngine(payload);
  });

  ipcMain.handle("funkhub:pickFolder", async (_event, payload) => {
    const result = await dialog.showOpenDialog({
      title: payload?.title || "Select folder",
      defaultPath: payload?.defaultPath,
      properties: ["openDirectory", "createDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return {
      canceled: false,
      path: result.filePaths[0],
    };
  });

  ipcMain.handle("funkhub:getSettings", async () => {
    return handleGetSettings();
  });

  ipcMain.handle("funkhub:updateSettings", async (_event, payload) => {
    return handleUpdateSettings(payload);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
