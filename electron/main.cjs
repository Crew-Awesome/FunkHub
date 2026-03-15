const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const {
  handleInstallArchive,
  handleInstallEngine,
  handleCancelInstall,
  handleLaunchEngine,
  handleOpenPath,
  handleOpenAnyPath,
  handleOpenExternalUrl,
  handleDeletePath,
  handleGetItchAuthStatus,
  handleClearItchAuth,
  handleStartItchOAuth,
  handleListItchBaseGameReleases,
  handleResolveItchBaseGameDownload,
  handleInspectEngineInstall,
  handleInspectPath,
  handleImportEngineFolder,
  handleImportModFolder,
  handleGetSettings,
  handleUpdateSettings,
  handleCheckAppUpdate,
  handleDownloadAppUpdate,
  handleInstallAppUpdate,
} = require("./runtime-bridge.cjs");

let mainWindow = null;
const pendingDeepLinks = [];

function extractDeepLinkFromArgv(argv) {
  if (!Array.isArray(argv)) {
    return undefined;
  }

  for (const value of argv) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed) {
      continue;
    }

    if (/^funkhub:/i.test(trimmed)) {
      return trimmed;
    }

    const embedded = trimmed.match(/(funkhub:[^\s"']+)/i);
    if (embedded && embedded[1]) {
      return embedded[1];
    }
  }

  return undefined;
}

function enqueueDeepLink(rawUrl) {
  if (typeof rawUrl !== "string") {
    return;
  }

  const normalized = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  if (!/^funkhub:/i.test(normalized)) {
    return;
  }

  pendingDeepLinks.push(normalized);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("funkhub:deep-link", { url: normalized });
  }
}

function registerProtocolHandler() {
  try {
    if (process.defaultApp && process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("funkhub", process.execPath, [path.resolve(process.argv[1])]);
      return;
    }
    app.setAsDefaultProtocolClient("funkhub");
  } catch {
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", (_event, argv) => {
  const deepLink = extractDeepLinkFromArgv(argv);
  if (deepLink) {
    enqueueDeepLink(deepLink);
  }

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  enqueueDeepLink(url);
  if (!mainWindow && app.isReady()) {
    createWindow();
  }
});

function createWindow() {
  const iconPath = path.join(__dirname, "assets/icon.png");
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    icon: iconPath,
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

  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  win.webContents.on("did-finish-load", () => {
    if (pendingDeepLinks.length > 0) {
      for (const url of pendingDeepLinks) {
        win.webContents.send("funkhub:deep-link", { url });
      }
    }
  });

  return win;
}

app.whenReady().then(() => {
  registerProtocolHandler();
  const startupDeepLink = extractDeepLinkFromArgv(process.argv);
  if (startupDeepLink) {
    enqueueDeepLink(startupDeepLink);
  }

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

  ipcMain.handle("funkhub:openPath", async (_event, payload) => {
    return handleOpenPath(payload);
  });

  ipcMain.handle("funkhub:openAnyPath", async (_event, payload) => {
    return handleOpenAnyPath(payload);
  });

  ipcMain.handle("funkhub:openExternalUrl", async (_event, payload) => {
    return handleOpenExternalUrl(payload);
  });

  ipcMain.handle("funkhub:checkAppUpdate", async () => {
    return handleCheckAppUpdate();
  });

  ipcMain.handle("funkhub:downloadAppUpdate", async () => {
    return handleDownloadAppUpdate();
  });

  ipcMain.handle("funkhub:installAppUpdate", async () => {
    return handleInstallAppUpdate();
  });

  ipcMain.handle("funkhub:deletePath", async (_event, payload) => {
    return handleDeletePath(payload);
  });

  ipcMain.handle("funkhub:getItchAuthStatus", async () => {
    return handleGetItchAuthStatus();
  });

  ipcMain.handle("funkhub:clearItchAuth", async () => {
    return handleClearItchAuth();
  });

  ipcMain.handle("funkhub:startItchOAuth", async (_event, payload) => {
    return handleStartItchOAuth(payload);
  });

  ipcMain.handle("funkhub:listItchBaseGameReleases", async () => {
    return handleListItchBaseGameReleases();
  });

  ipcMain.handle("funkhub:resolveItchBaseGameDownload", async (_event, payload) => {
    return handleResolveItchBaseGameDownload(payload);
  });

  ipcMain.handle("funkhub:inspectEngineInstall", async (_event, payload) => {
    return handleInspectEngineInstall(payload);
  });

  ipcMain.handle("funkhub:inspectPath", async (_event, payload) => {
    return handleInspectPath(payload);
  });

  ipcMain.handle("funkhub:importEngineFolder", async (_event, payload) => {
    return handleImportEngineFolder(payload);
  });

  ipcMain.handle("funkhub:importModFolder", async (_event, payload) => {
    return handleImportModFolder(payload);
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

  ipcMain.handle("funkhub:pickFile", async (_event, payload) => {
    const result = await dialog.showOpenDialog({
      title: payload?.title || "Select file",
      defaultPath: payload?.defaultPath,
      properties: ["openFile"],
      filters: Array.isArray(payload?.filters) ? payload.filters : undefined,
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

  ipcMain.handle("funkhub:getPendingDeepLinks", async () => {
    const links = [...pendingDeepLinks];
    pendingDeepLinks.length = 0;
    return { links };
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
