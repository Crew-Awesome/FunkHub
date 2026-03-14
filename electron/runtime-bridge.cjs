const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { app } = require("electron");
const { path7za } = require("7zip-bin");

const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z"];
const jobState = new Map();

function getDefaultDataRoot() {
  return path.join(app.getPath("userData"), "funkhub");
}

function getSettingsFilePath() {
  return path.join(getDefaultDataRoot(), "settings.json");
}

function now() {
  return Date.now();
}

function isArchive(filePath) {
  return ARCHIVE_EXTENSIONS.some((extension) => filePath.toLowerCase().endsWith(extension));
}

function emitProgress(webContents, payload) {
  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  webContents.send("funkhub:install-progress", payload);
}

function safeJoin(base, requestedPath) {
  const normalized = path
    .normalize(requestedPath || "")
    .replace(/^([A-Za-z]:)?[\\/]+/, "")
    .replace(/\.\.(?:[\\/]|$)/g, "");
  return path.join(base, normalized);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readRuntimeSettings() {
  const settingsPath = getSettingsFilePath();
  try {
    const content = await fs.readFile(settingsPath, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeRuntimeSettings(settings) {
  const settingsPath = getSettingsFilePath();
  await ensureDir(path.dirname(settingsPath));
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

async function getEffectiveSettings() {
  const runtimeSettings = await readRuntimeSettings();
  const dataRootDirectory = typeof runtimeSettings.dataRootDirectory === "string"
    ? runtimeSettings.dataRootDirectory.trim()
    : "";
  const downloadsDirectory = typeof runtimeSettings.downloadsDirectory === "string"
    ? runtimeSettings.downloadsDirectory.trim()
    : "";

  return {
    ...runtimeSettings,
    dataRootDirectory,
    downloadsDirectory,
  };
}

async function removePath(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function readDirEntries(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function moveAllChildren(sourceDir, targetDir) {
  const entries = await readDirEntries(sourceDir);
  for (const entry of entries) {
    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);
    if (fsSync.existsSync(to)) {
      await removePath(to);
    }
    await fs.rename(from, to);
  }
}

async function flattenSingleTopFolder(extractDir) {
  const entries = (await readDirEntries(extractDir)).filter((entry) => !entry.name.startsWith("__MACOSX"));
  const directories = entries.filter((entry) => entry.isDirectory());
  const files = entries.filter((entry) => entry.isFile());

  if (directories.length === 1 && files.length === 0) {
    const nestedDir = path.join(extractDir, directories[0].name);
    await moveAllChildren(nestedDir, extractDir);
    await removePath(nestedDir);
  }
}

async function extractNestedArchiveIfPresent(extractDir, cancelState, webContents, jobId) {
  const entries = (await readDirEntries(extractDir)).filter((entry) => entry.isFile());
  if (entries.length !== 1) {
    return;
  }

  const nestedArchive = path.join(extractDir, entries[0].name);
  if (!isArchive(nestedArchive)) {
    return;
  }

  emitProgress(webContents, {
    jobId,
    phase: "extract",
    progress: 0,
    message: "Detected nested archive; extracting...",
    timestamp: now(),
  });

  await extractArchive(nestedArchive, extractDir, cancelState, webContents, jobId);
  await fs.unlink(nestedArchive);
}

async function ensureModFolderStructure(extractDir, modFolderName) {
  const entries = (await readDirEntries(extractDir)).filter((entry) => !entry.name.startsWith("."));
  const directories = entries.filter((entry) => entry.isDirectory());
  const files = entries.filter((entry) => entry.isFile());

  if (directories.length === 1 && files.length === 0) {
    return path.join(extractDir, directories[0].name);
  }

  const modRoot = path.join(extractDir, modFolderName);
  await ensureDir(modRoot);

  for (const entry of entries) {
    const from = path.join(extractDir, entry.name);
    const to = path.join(modRoot, entry.name);
    if (from === modRoot) {
      continue;
    }
    if (fsSync.existsSync(to)) {
      await removePath(to);
    }
    await fs.rename(from, to);
  }

  return modRoot;
}

function parsePercent(line) {
  const match = line.match(/(\d{1,3})%/);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, value));
}

async function extractArchive(archivePath, outputDir, cancelState, webContents, jobId) {
  await ensureDir(outputDir);

  await new Promise((resolve, reject) => {
    const child = spawn(path7za, ["x", "-y", `-o${outputDir}`, archivePath], {
      windowsHide: true,
    });

    cancelState.process = child;

    const onData = (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const percent = parsePercent(line);
        if (percent !== undefined) {
          emitProgress(webContents, {
            jobId,
            phase: "extract",
            progress: percent / 100,
            message: "Extracting archive",
            timestamp: now(),
          });
        }
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("error", reject);
    child.on("close", (code) => {
      cancelState.process = null;

      if (cancelState.cancelled) {
        reject(new Error("Extraction cancelled"));
        return;
      }

      if (code !== 0) {
        reject(new Error(`7z extraction failed with exit code ${code}`));
        return;
      }

      resolve();
    });
  });
}

async function downloadToFile(url, outputPath, cancelState, webContents, jobId) {
  const response = await fetch(url, { signal: cancelState.controller.signal });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status})`);
  }

  const totalBytes = Number(response.headers.get("content-length") || "0") || undefined;
  const writer = fsSync.createWriteStream(outputPath);
  const reader = response.body.getReader();
  const startedAt = Date.now();
  let downloaded = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    if (cancelState.cancelled) {
      throw new Error("Download cancelled");
    }

    if (value) {
      writer.write(Buffer.from(value));
      downloaded += value.byteLength;
      const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
      emitProgress(webContents, {
        jobId,
        phase: "download",
        progress: totalBytes ? downloaded / totalBytes : 0,
        downloadedBytes: downloaded,
        totalBytes,
        speedBytesPerSecond: downloaded / elapsedSeconds,
        message: "Downloading archive",
        timestamp: now(),
      });
    }
  }

  await new Promise((resolve, reject) => {
    writer.end((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function base64ToBuffer(value) {
  return Buffer.from(value, "base64");
}

function detectVersionFromName(name) {
  const match = name.match(/v?\d+\.\d+(?:\.\d+)?(?:[-+._A-Za-z0-9]+)?/i);
  return match ? match[0].replace(/^v/i, "") : "unknown";
}

async function resolveInstallDirs(mode, installPath) {
  const settings = await getEffectiveSettings();
  const defaultRoot = getDefaultDataRoot();
  const rootPath = settings.dataRootDirectory
    ? path.resolve(settings.dataRootDirectory)
    : defaultRoot;
  const enginesPath = path.join(rootPath, "engines");
  const downloadsPath = settings.downloadsDirectory
    ? path.resolve(settings.downloadsDirectory)
    : path.join(rootPath, "downloads");
  const resolvedInstallPath = safeJoin(rootPath, installPath || "");

  if (!resolvedInstallPath.startsWith(rootPath)) {
    throw new Error("Invalid install path");
  }

  if (mode === "engine" && !resolvedInstallPath.startsWith(enginesPath)) {
    throw new Error("Engine installation must target /engines/");
  }

  return {
    rootPath,
    enginesPath,
    downloadsPath,
    resolvedInstallPath,
  };
}

async function installArchiveInternal(webContents, payload) {
  const {
    jobId,
    fileName,
    mode,
    installPath,
    archiveBase64,
    downloadUrl,
    installSubdir,
  } = payload;

  if (!jobId) {
    throw new Error("Missing jobId");
  }

  const cancelState = {
    cancelled: false,
    controller: new AbortController(),
    process: null,
  };

  jobState.set(jobId, cancelState);

  const { downloadsPath, resolvedInstallPath } = await resolveInstallDirs(mode, installPath);
  await ensureDir(downloadsPath);
  await ensureDir(resolvedInstallPath);

  const archiveName = fileName || `archive-${jobId}.zip`;
  const tempArchivePath = path.join(downloadsPath, `${jobId}-${archiveName}`);
  const extractTempPath = path.join(downloadsPath, `${jobId}-extract`);

  await removePath(extractTempPath);
  await ensureDir(extractTempPath);

  try {
    if (downloadUrl) {
      await downloadToFile(downloadUrl, tempArchivePath, cancelState, webContents, jobId);
    } else if (archiveBase64) {
      await fs.writeFile(tempArchivePath, base64ToBuffer(archiveBase64));
    } else {
      throw new Error("Either downloadUrl or archiveBase64 is required");
    }

    emitProgress(webContents, {
      jobId,
      phase: "extract",
      progress: 0,
      message: "Preparing extraction",
      timestamp: now(),
    });

    await extractArchive(tempArchivePath, extractTempPath, cancelState, webContents, jobId);
    await flattenSingleTopFolder(extractTempPath);
    await extractNestedArchiveIfPresent(extractTempPath, cancelState, webContents, jobId);
    await flattenSingleTopFolder(extractTempPath);

    let finalInstallPath = resolvedInstallPath;

    if (mode === "mod") {
      const folderNameBase = installSubdir || archiveName.replace(/\.[^.]+$/, "") || `mod-${jobId}`;
      const safeFolderName = folderNameBase.replace(/[^A-Za-z0-9._ -]/g, "_").trim() || `mod-${jobId}`;
      const modRoot = await ensureModFolderStructure(extractTempPath, safeFolderName);
      const destination = path.join(resolvedInstallPath, safeFolderName);
      await removePath(destination);
      await ensureDir(resolvedInstallPath);
      await fs.rename(modRoot, destination);
      finalInstallPath = destination;
    } else {
      await removePath(resolvedInstallPath);
      await ensureDir(path.dirname(resolvedInstallPath));
      await fs.rename(extractTempPath, resolvedInstallPath);
      await ensureDir(path.join(resolvedInstallPath, "mods"));
    }

    emitProgress(webContents, {
      jobId,
      phase: "install",
      progress: 1,
      message: "Installation complete",
      timestamp: now(),
    });

    return {
      installPath: finalInstallPath,
      versionDetected: detectVersionFromName(archiveName),
      normalized: true,
    };
  } finally {
    cancelState.cancelled = true;
    if (cancelState.process) {
      cancelState.process.kill("SIGKILL");
    }
    jobState.delete(jobId);
    await removePath(tempArchivePath);
    if (mode !== "engine") {
      await removePath(extractTempPath);
    }
  }
}

async function handleInstallArchive(webContents, payload) {
  try {
    return await installArchiveInternal(webContents, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Installation failed";
    emitProgress(webContents, {
      jobId: payload?.jobId,
      phase: "error",
      progress: 0,
      message,
      timestamp: now(),
    });
    throw new Error(message);
  }
}

async function handleInstallEngine(webContents, payload) {
  return handleInstallArchive(webContents, {
    ...payload,
    mode: "engine",
  });
}

async function handleCancelInstall(payload) {
  const jobId = payload?.jobId;
  if (!jobId) {
    return { ok: false };
  }

  const state = jobState.get(jobId);
  if (!state) {
    return { ok: false };
  }

  state.cancelled = true;
  state.controller.abort();
  if (state.process) {
    state.process.kill("SIGKILL");
  }

  return { ok: true };
}

async function findLaunchableExecutable(dirPath) {
  const queue = [dirPath];
  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readDirEntries(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      const lower = entry.name.toLowerCase();
      if (process.platform === "win32" && lower.endsWith(".exe")) {
        return fullPath;
      }
      if (process.platform === "darwin" && lower.endsWith(".app")) {
        return fullPath;
      }
      if (process.platform === "linux" && (lower.endsWith(".appimage") || lower.endsWith(".x86_64") || lower.endsWith(".sh"))) {
        return fullPath;
      }
    }
  }
  return null;
}

async function handleLaunchEngine(payload) {
  const installPath = payload?.installPath;
  if (!installPath) {
    throw new Error("installPath is required");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = safeJoin(rootPath, installPath);
  const launchable = await findLaunchableExecutable(absolutePath);
  if (!launchable) {
    throw new Error("No launchable engine executable found");
  }

  const child = spawn(launchable, [], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  return { ok: true, launchedPath: launchable };
}

async function handleGetSettings() {
  return getEffectiveSettings();
}

async function handleUpdateSettings(payload) {
  const current = await getEffectiveSettings();
  const next = {
    ...current,
    ...(payload && typeof payload === "object" ? payload : {}),
  };

  if (typeof next.dataRootDirectory === "string") {
    next.dataRootDirectory = next.dataRootDirectory.trim();
  }
  if (typeof next.downloadsDirectory === "string") {
    next.downloadsDirectory = next.downloadsDirectory.trim();
  }

  await writeRuntimeSettings(next);
  return next;
}

module.exports = {
  handleInstallArchive,
  handleInstallEngine,
  handleCancelInstall,
  handleLaunchEngine,
  handleGetSettings,
  handleUpdateSettings,
};
