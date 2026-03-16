const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { app, BrowserWindow } = require("electron");
const { path7za } = require("7zip-bin");

const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z"];
const GITHUB_RELEASES_URL = "https://github.com/Crew-Awesome/FunkHub/releases/latest";
const jobState = new Map();
const runningProcesses = new Map(); // launchId -> { pid, installPath, startTime, child }
const appUpdateState = {
  initialized: false,
  autoUpdater: null,
  lastInfo: null,
};

function resolve7zipBinaryPath() {
  const candidates = [];

  if (path7za.includes("app.asar")) {
    candidates.push(path7za.replace("app.asar", "app.asar.unpacked"));
  }

  candidates.push(path7za);

  if (process.resourcesPath) {
    const packagedCandidate = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "7zip-bin",
      process.platform,
      process.arch,
      process.platform === "win32" ? "7za.exe" : "7za",
    );
    candidates.push(packagedCandidate);
  }

  const dedupedCandidates = [...new Set(candidates)];
  const found = dedupedCandidates.find((candidate) => {
    try {
      return fsSync.existsSync(candidate) && fsSync.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });

  if (!found) {
    throw new Error(`7zip binary not found. Tried: ${dedupedCandidates.join(", ")}`);
  }

  try {
    fsSync.chmodSync(found, 0o755);
  } catch {
    // Ignore chmod failures and try spawning anyway.
  }

  return found;
}

function getDefaultDataRoot() {
  return path.join(app.getPath("userData"), "funkhub");
}

function getSettingsFilePath() {
  return path.join(getDefaultDataRoot(), "settings.json");
}

function getItchAuthFilePath() {
  return path.join(getDefaultDataRoot(), "itch-auth.json");
}

function now() {
  return Date.now();
}

function normalizeVersionParts(version) {
  const cleaned = String(version || "").trim().replace(/^v/i, "");
  const parts = cleaned.split(/[^0-9]+/).filter(Boolean).slice(0, 3).map((part) => Number(part));
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a, b) {
  const left = normalizeVersionParts(a);
  const right = normalizeVersionParts(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) {
      return 1;
    }
    if (left[index] < right[index]) {
      return -1;
    }
  }
  return 0;
}

function emitAppUpdateStatus(payload) {
  const { BrowserWindow } = require("electron");
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (win.isDestroyed()) {
      continue;
    }
    win.webContents.send("funkhub:app-update", {
      ...payload,
      timestamp: now(),
    });
  }
}

function mapUpdaterInfo(updateInfo) {
  const currentVersion = String(app.getVersion() || "0.0.0").replace(/^v/i, "");
  const latestVersion = String(updateInfo?.version || currentVersion).replace(/^v/i, "");
  const releaseName = String(updateInfo?.releaseName || `FunkHub v${latestVersion}`);
  const releaseNotes = updateInfo?.releaseNotes;
  let notes = "";
  if (Array.isArray(releaseNotes)) {
    notes = releaseNotes.map((entry) => {
      if (entry && typeof entry.note === "string") {
        return entry.note;
      }
      return "";
    }).filter(Boolean).join("\n\n");
  } else if (typeof releaseNotes === "string") {
    notes = releaseNotes;
  }

  return {
    available: compareVersions(latestVersion, currentVersion) > 0,
    currentVersion,
    latestVersion,
    releaseName,
    releaseUrl: GITHUB_RELEASES_URL,
    publishedAt: typeof updateInfo?.releaseDate === "string" ? updateInfo.releaseDate : undefined,
    notes,
  };
}

function canUseNativeAutoUpdater() {
  if (!app.isPackaged) {
    return false;
  }
  if (process.platform !== "win32" && process.platform !== "darwin") {
    return false;
  }
  const version = String(app.getVersion() || "").toLowerCase();
  if (version.includes("nightly") || version.includes("indev")) {
    return false;
  }
  return true;
}

function ensureAppUpdaterInitialized() {
  if (appUpdateState.initialized && appUpdateState.autoUpdater) {
    return appUpdateState.autoUpdater;
  }

  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "Crew-Awesome",
    repo: "FunkHub",
    private: false,
  });

  autoUpdater.on("checking-for-update", () => {
    emitAppUpdateStatus({ status: "checking", message: "Checking for app updates" });
  });

  autoUpdater.on("update-available", (info) => {
    const mapped = mapUpdaterInfo(info);
    appUpdateState.lastInfo = mapped;
    emitAppUpdateStatus({ status: "available", info: mapped, message: "Update available" });
  });

  autoUpdater.on("update-not-available", () => {
    const info = {
      available: false,
      currentVersion: String(app.getVersion() || "0.0.0").replace(/^v/i, ""),
      latestVersion: String(app.getVersion() || "0.0.0").replace(/^v/i, ""),
      releaseName: "No update",
      releaseUrl: GITHUB_RELEASES_URL,
      notes: "You are on the latest version.",
    };
    appUpdateState.lastInfo = info;
    emitAppUpdateStatus({ status: "idle", info, message: "No updates available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    emitAppUpdateStatus({
      status: "downloading",
      info: appUpdateState.lastInfo || undefined,
      progress: Number(progress?.percent || 0),
      downloadedBytes: Number(progress?.transferred || 0),
      totalBytes: Number(progress?.total || 0),
      speedBytesPerSecond: Number(progress?.bytesPerSecond || 0),
      message: "Downloading update",
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    const mapped = mapUpdaterInfo(info);
    appUpdateState.lastInfo = mapped;
    emitAppUpdateStatus({ status: "downloaded", info: mapped, progress: 100, message: "Update ready to install" });
  });

  autoUpdater.on("error", (error) => {
    emitAppUpdateStatus({
      status: "error",
      info: appUpdateState.lastInfo || undefined,
      message: error instanceof Error ? error.message : "App update failed",
    });
  });

  appUpdateState.initialized = true;
  appUpdateState.autoUpdater = autoUpdater;
  return autoUpdater;
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

function isPathInside(basePath, targetPath) {
  const baseResolved = path.resolve(basePath);
  const targetResolved = path.resolve(targetPath);
  const relative = path.relative(baseResolved, targetResolved);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
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

function encryptString(value) {
  const { safeStorage } = require("electron");
  if (safeStorage.isEncryptionAvailable()) {
    return {
      encrypted: true,
      value: safeStorage.encryptString(value).toString("base64"),
    };
  }
  return {
    encrypted: false,
    value,
  };
}

function decryptString(payload) {
  const { safeStorage } = require("electron");
  if (!payload || typeof payload !== "object") {
    return "";
  }
  if (payload.encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(payload.value, "base64"));
    } catch {
      return "";
    }
  }
  return typeof payload.value === "string" ? payload.value : "";
}

async function readItchAuth() {
  try {
    const content = await fs.readFile(getItchAuthFilePath(), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function writeItchAuth(payload) {
  await ensureDir(path.dirname(getItchAuthFilePath()));
  await fs.writeFile(getItchAuthFilePath(), JSON.stringify(payload, null, 2), "utf-8");
}

async function clearItchAuth() {
  await removePath(getItchAuthFilePath());
}

async function getItchAccessToken() {
  const auth = await readItchAuth();
  return auth ? decryptString(auth.accessToken) : "";
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
  const sevenZipBinary = resolve7zipBinaryPath();

  await new Promise((resolve, reject) => {
    const child = spawn(sevenZipBinary, ["x", "-y", `-o${outputDir}`, archivePath], {
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
        if (code === 2) {
          reject(new Error("7z extraction failed with exit code 2 (unsupported or corrupted archive format)"));
          return;
        }
        reject(new Error(`7z extraction failed with exit code ${code}`));
        return;
      }

      resolve();
    });
  });
}

async function extractRarWithUnrar(archivePath, outputDir, cancelState, webContents, jobId) {
  await ensureDir(outputDir);

  return new Promise((resolve, reject) => {
    const child = spawn("unrar", ["x", "-o+", "-idq", archivePath, `${outputDir}${path.sep}`], {
      windowsHide: true,
    });

    cancelState.process = child;

    child.on("error", (error) => {
      cancelState.process = null;
      if (error && error.code === "ENOENT") {
        resolve(false);
        return;
      }
      reject(error);
    });

    child.on("close", (code) => {
      cancelState.process = null;

      if (cancelState.cancelled) {
        reject(new Error("Extraction cancelled"));
        return;
      }

      if (code === 0) {
        emitProgress(webContents, {
          jobId,
          phase: "extract",
          progress: 1,
          message: "Extraction complete",
          timestamp: now(),
        });
        resolve(true);
        return;
      }

      resolve(false);
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

async function detectArchiveSignature(filePath) {
  try {
    const handle = await fs.open(filePath, "r");
    try {
      const buffer = Buffer.alloc(8);
      const { bytesRead } = await handle.read(buffer, 0, 8, 0);
      if (bytesRead >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
        return "zip";
      }
      if (bytesRead >= 7 && buffer[0] === 0x52 && buffer[1] === 0x61 && buffer[2] === 0x72 && buffer[3] === 0x21 && buffer[4] === 0x1a && buffer[5] === 0x07 && (buffer[6] === 0x00 || buffer[6] === 0x01)) {
        return "rar";
      }
      if (bytesRead >= 6 && buffer[0] === 0x37 && buffer[1] === 0x7a && buffer[2] === 0xbc && buffer[3] === 0xaf && buffer[4] === 0x27 && buffer[5] === 0x1c) {
        return "7z";
      }
      return "unknown";
    } finally {
      await handle.close();
    }
  } catch {
    return "unknown";
  }
}

async function installRawModPackage({ resolvedInstallPath, installSubdir, archiveName, tempArchivePath, jobId }) {
  const folderNameBase = installSubdir || archiveName.replace(/\.[^.]+$/, "") || `mod-${jobId}`;
  const safeFolderName = folderNameBase.replace(/[^A-Za-z0-9._ -]/g, "_").trim() || `mod-${jobId}`;
  const safeArchiveName = path.basename(archiveName || `package-${jobId}.bin`).replace(/[^A-Za-z0-9._ -]/g, "_").trim() || `package-${jobId}.bin`;
  const destinationDir = path.join(resolvedInstallPath, safeFolderName);
  await removePath(destinationDir);
  await ensureDir(destinationDir);
  await fs.copyFile(tempArchivePath, path.join(destinationDir, safeArchiveName));
  return destinationDir;
}

async function installRawStandalonePackage({ resolvedInstallPath, archiveName, tempArchivePath, jobId }) {
  const safeArchiveName = path.basename(archiveName || `package-${jobId}.bin`).replace(/[^A-Za-z0-9._ -]/g, "_").trim() || `package-${jobId}.bin`;
  await removePath(resolvedInstallPath);
  await ensureDir(resolvedInstallPath);
  await fs.copyFile(tempArchivePath, path.join(resolvedInstallPath, safeArchiveName));
  return resolvedInstallPath;
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

  if (!isPathInside(rootPath, resolvedInstallPath)) {
    throw new Error("Invalid install path");
  }

  if (mode === "engine" && !isPathInside(enginesPath, resolvedInstallPath)) {
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
    allowMissingExecutable,
  } = payload;
  const treatAsStandaloneMod = mode === "mod" && typeof installPath === "string" && installPath.startsWith("executables/");

  if (!jobId) {
    throw new Error("Missing jobId");
  }

  const cancelState = {
    cancelled: false,
    controller: new AbortController(),
    process: null,
  };

  jobState.set(jobId, cancelState);

  const { rootPath, downloadsPath, resolvedInstallPath } = await resolveInstallDirs(mode, installPath);
  await ensureDir(downloadsPath);
  await ensureDir(resolvedInstallPath);

  const archiveName = fileName || `archive-${jobId}.zip`;
  const tempArchivePath = path.join(downloadsPath, `${jobId}-${archiveName}`);
  const extractTempPath = path.join(downloadsPath, `${jobId}-extract`);

  await removePath(extractTempPath);
  await ensureDir(extractTempPath);
  let finalizedInstall = false;

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
      phase: "validate",
      progress: 0,
      message: "Validating package",
      timestamp: now(),
    });

    emitProgress(webContents, {
      jobId,
      phase: "extract",
      progress: 0,
      message: "Preparing extraction",
      timestamp: now(),
    });

    const archiveSignature = await detectArchiveSignature(tempArchivePath);
    const hasArchiveExtension = ARCHIVE_EXTENSIONS.some((extension) => archiveName.toLowerCase().endsWith(extension));
    const canExtract = archiveSignature !== "unknown" || hasArchiveExtension;

    let finalInstallPath = resolvedInstallPath;

    if (!canExtract && mode === "mod") {
      emitProgress(webContents, {
        jobId,
        phase: "install",
        progress: 0.9,
        message: treatAsStandaloneMod
          ? "Package is not a supported archive; saving executable package"
          : "Package is not a supported archive; installing as raw file",
        timestamp: now(),
      });
      finalInstallPath = treatAsStandaloneMod
        ? await installRawStandalonePackage({
            resolvedInstallPath,
            archiveName,
            tempArchivePath,
            jobId,
          })
        : await installRawModPackage({
            resolvedInstallPath,
            installSubdir,
            archiveName,
            tempArchivePath,
            jobId,
          });
    } else {
      try {
        await extractArchive(tempArchivePath, extractTempPath, cancelState, webContents, jobId);
        await flattenSingleTopFolder(extractTempPath);
        await extractNestedArchiveIfPresent(extractTempPath, cancelState, webContents, jobId);
        await flattenSingleTopFolder(extractTempPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Extraction failed";
        const canRetryWithUnrar = mode === "mod"
          && archiveSignature === "rar"
          && /exit code 2/i.test(message);
        let recoveredFromRarFallback = false;

        if (canRetryWithUnrar) {
          emitProgress(webContents, {
            jobId,
            phase: "extract",
            progress: 0.8,
            message: "7z failed for RAR, retrying extraction with unrar",
            timestamp: now(),
          });

          recoveredFromRarFallback = await extractRarWithUnrar(tempArchivePath, extractTempPath, cancelState, webContents, jobId);
          if (recoveredFromRarFallback) {
            await flattenSingleTopFolder(extractTempPath);
            await extractNestedArchiveIfPresent(extractTempPath, cancelState, webContents, jobId);
            await flattenSingleTopFolder(extractTempPath);
          }
        }

        if (!recoveredFromRarFallback && mode === "mod") {
          emitProgress(webContents, {
            jobId,
            phase: "install",
            progress: 0.9,
            message: treatAsStandaloneMod
              ? (/exit code 2/i.test(message)
                ? "Archive extraction unsupported for this format; keeping package for manual launcher setup"
                : "Archive extraction failed; keeping package for manual launcher setup")
              : (/exit code 2/i.test(message)
                ? "Archive extraction unsupported for this format; saving package as raw file"
                : "Archive extraction failed; saving package as raw file"),
            timestamp: now(),
          });
          finalInstallPath = treatAsStandaloneMod
            ? await installRawStandalonePackage({
                resolvedInstallPath,
                archiveName,
                tempArchivePath,
                jobId,
              })
            : await installRawModPackage({
                resolvedInstallPath,
                installSubdir,
                archiveName,
                tempArchivePath,
                jobId,
              });
        } else if (!recoveredFromRarFallback) {
          throw error;
        }
      }

      if (finalInstallPath === resolvedInstallPath) {
        if (mode === "mod") {
          if (treatAsStandaloneMod) {
            await removePath(resolvedInstallPath);
            await ensureDir(path.dirname(resolvedInstallPath));
            await fs.rename(extractTempPath, resolvedInstallPath);
            finalInstallPath = resolvedInstallPath;
          } else {
            const folderNameBase = installSubdir || archiveName.replace(/\.[^.]+$/, "") || `mod-${jobId}`;
            const safeFolderName = folderNameBase.replace(/[^A-Za-z0-9._ -]/g, "_").trim() || `mod-${jobId}`;
            const modRoot = await ensureModFolderStructure(extractTempPath, safeFolderName);
            const destination = path.join(resolvedInstallPath, safeFolderName);
            await removePath(destination);
            await ensureDir(resolvedInstallPath);
            await fs.rename(modRoot, destination);
            finalInstallPath = destination;
          }
        } else {
          await removePath(resolvedInstallPath);
          await ensureDir(path.dirname(resolvedInstallPath));
          await fs.rename(extractTempPath, resolvedInstallPath);
          await ensureDir(path.join(resolvedInstallPath, "mods"));

          emitProgress(webContents, {
            jobId,
            phase: "validate",
            progress: 0.85,
            message: "Validating engine launch files",
            timestamp: now(),
          });

          const launchable = await findLaunchableExecutable(resolvedInstallPath, [path.basename(resolvedInstallPath), "funkin", "engine"]);
          if (!launchable) {
            if (allowMissingExecutable) {
              emitProgress(webContents, {
                jobId,
                phase: "validate",
                progress: 0.95,
                message: "No native executable detected for this platform; keeping install for manual launcher setup",
                timestamp: now(),
              });
            } else {
              throw new Error("Installed engine does not contain a launchable executable for this platform");
            }
          }
        }
      }
    }

    finalizedInstall = true;

    emitProgress(webContents, {
      jobId,
      phase: "install",
      progress: 1,
      message: "Installation complete",
      timestamp: now(),
    });

    return {
      installPath: path.relative(rootPath, finalInstallPath).replace(/\\/g, "/"),
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
    await removePath(extractTempPath);
    if (mode === "engine" && !finalizedInstall) {
      await removePath(resolvedInstallPath);
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

async function findMacAppInnerBinary(appBundlePath) {
  const macosDir = path.join(appBundlePath, "Contents", "MacOS");
  try {
    const entries = await fs.readdir(macosDir, { withFileTypes: true });
    const appName = path.basename(appBundlePath, ".app").toLowerCase();
    const files = entries.filter((e) => e.isFile());
    const preferred = files.find((e) => e.name.toLowerCase() === appName) ?? files[0];
    if (preferred) {
      return path.join(macosDir, preferred.name);
    }
  } catch {
    // Non-standard bundle or missing Contents/MacOS
  }
  return null;
}

async function findLaunchableExecutable(dirPath, hints = []) {
  const queue = [dirPath];
  const normalizedHints = hints.map((hint) => hint.toLowerCase());
  let hintedCandidate = null;
  const windowsCandidates = [];
  const blockedWindowsTokens = [
    "crashpad",
    "updater",
    "unins",
    "uninstall",
    "helper",
    "cef",
    "ffmpeg",
    "setup",
    "vc_redist",
    "dxwebsetup",
  ];

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
        windowsCandidates.push(fullPath);
        continue;
      }
      if (process.platform === "darwin" && lower.endsWith(".app")) {
        return fullPath;
      }
      if (process.platform === "linux" && (lower.endsWith(".appimage") || lower.endsWith(".x86_64") || lower.endsWith(".sh"))) {
        return fullPath;
      }

      if (process.platform === "linux") {
        const isHintMatch = normalizedHints.some((hint) => hint.length > 0 && lower.includes(hint));
        const hasNoExtension = !entry.name.includes(".");

        if (isHintMatch && (hasNoExtension || lower.endsWith(".bin"))) {
          hintedCandidate = hintedCandidate ?? fullPath;
        }

        try {
          const stats = await fs.stat(fullPath);
          if ((stats.mode & 0o111) !== 0) {
            return fullPath;
          }
        } catch {
          // Ignore stat failures and continue searching.
        }
      }
    }
  }

  if (process.platform === "win32" && windowsCandidates.length > 0) {
    const ranked = windowsCandidates
      .map((candidate) => {
        const base = path.basename(candidate).toLowerCase().replace(/\.exe$/i, "");
        const relativeDepth = path.relative(dirPath, candidate).split(path.sep).length;

        let score = 0;

        if (normalizedHints.some((hint) => hint.length > 0 && base === hint)) {
          score += 300;
        } else if (normalizedHints.some((hint) => hint.length > 0 && base.includes(hint))) {
          score += 180;
        }

        if (base.includes("funkin") || base.includes("engine")) {
          score += 120;
        }

        if (blockedWindowsTokens.some((token) => base.includes(token))) {
          score -= 350;
        }

        score -= Math.max(0, relativeDepth - 1) * 5;

        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score);

    return ranked[0].candidate;
  }

  return hintedCandidate;
}

async function collectFileHints(dirPath) {
  const queue = [dirPath];
  const names = [];
  while (queue.length > 0 && names.length < 60) {
    const current = queue.shift();
    const entries = await readDirEntries(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else {
        names.push(entry.name.toLowerCase());
      }
      if (names.length >= 60) {
        break;
      }
    }
  }
  return names;
}

async function getLaunchFailureHint(dirPath) {
  const names = await collectFileHints(dirPath);
  const hasWindowsBinary = names.some((name) => name.endsWith(".exe") || name.endsWith(".msi") || name.endsWith(".bat"));
  const hasMacBinary = names.some((name) => name.endsWith(".app") || name.endsWith(".dmg") || name.endsWith(".pkg"));
  const hasLinuxBinary = names.some((name) => name.endsWith(".appimage") || name.endsWith(".x86_64") || name.endsWith(".sh"));
  const hasAnyBinLike = names.some((name) => !name.includes("."));

  if (process.platform === "linux" && hasWindowsBinary && !hasLinuxBinary) {
    return "This looks like a Windows build. Install the Linux engine artifact or run via Wine/Proton launcher mode.";
  }
  if (process.platform === "win32" && hasLinuxBinary && !hasWindowsBinary) {
    return "This looks like a Linux build. Install the Windows engine artifact.";
  }
  if (process.platform === "darwin" && hasWindowsBinary && !hasMacBinary) {
    return "This looks like a Windows build. Install the macOS engine artifact.";
  }
  if (process.platform === "linux" && hasAnyBinLike && !hasLinuxBinary) {
    return "Found binary-like files, but none are executable. Ensure execute permissions are set (chmod +x).";
  }

  return "No launchable engine executable found.";
}

async function handleLaunchEngine(payload) {
  const installPath = payload?.installPath;
  const launcher = payload?.launcher || "native";
  const launcherPath = payload?.launcherPath;
  const executablePath = payload?.executablePath;
  const extraArgs = Array.isArray(payload?.args) ? payload.args : [];
  const launchId = typeof payload?.launchId === "string" ? payload.launchId : null;
  if (!installPath) {
    throw new Error("installPath is required");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = path.isAbsolute(installPath)
    ? path.resolve(installPath)
    : safeJoin(rootPath, installPath);
  if (!isPathInside(rootPath, absolutePath)) {
    throw new Error("installPath must be inside FunkHub data root");
  }
  let launchable;
  if (typeof executablePath === "string" && executablePath.trim().length > 0) {
    const rawExecutable = executablePath.trim();
    launchable = path.isAbsolute(rawExecutable)
      ? path.resolve(rawExecutable)
      : path.resolve(absolutePath, rawExecutable);

    if (!isPathInside(absolutePath, launchable)) {
      throw new Error("Executable path must be inside selected engine folder");
    }

    try {
      const stats = await fs.stat(launchable);
      if (!stats.isFile()) {
        throw new Error("Executable path is not a file");
      }
    } catch {
      throw new Error(`Configured executable path was not found: ${launchable}`);
    }
  } else {
    launchable = await findLaunchableExecutable(absolutePath, [
      path.basename(installPath || ""),
      "funkin",
      "alepsych",
      "ale-psych",
      "ale psych",
      "psych",
      "engine",
    ]);
  }
  if (!launchable) {
    const hint = await getLaunchFailureHint(absolutePath);
    throw new Error(`${hint} (${absolutePath})`);
  }

  if (process.platform === "linux") {
    try {
      const stats = await fs.stat(launchable);
      if ((stats.mode & 0o111) === 0) {
        await fs.chmod(launchable, 0o755);
      }
    } catch {
      // Keep going and let spawn surface the real error.
    }
  }

  let command = launchable;
  let args = [];
  let launchCwd = path.dirname(launchable);
  const isAppBundle = process.platform === "darwin" && launcher === "native" && launchable.toLowerCase().endsWith(".app");
  let usingOpenWrapper = false;

  if (process.platform === "linux" && launcher === "native" && launchable.toLowerCase().endsWith(".exe")) {
    throw new Error("Selected executable is a Windows .exe. Choose Wine/Wine64/Proton in Manage before launching.");
  }

  if (isAppBundle) {
    const innerBinary = await findMacAppInnerBinary(launchable);
    if (innerBinary) {
      command = innerBinary;
      launchCwd = path.dirname(innerBinary);
      try {
        const stats = await fs.stat(innerBinary);
        if ((stats.mode & 0o111) === 0) {
          await fs.chmod(innerBinary, 0o755);
        }
      } catch {
        // Ignore chmod failures.
      }
    } else {
      command = "open";
      args = [launchable];
      usingOpenWrapper = true;
    }
  }

  if (launcher !== "native") {
    if (process.platform !== "linux") {
      throw new Error("Custom launchers are only supported on Linux");
    }
    command = launcherPath || launcher;
    args = [launchable];
  }

  if (extraArgs.length > 0) {
    args = [...args, ...extraArgs];
  }

  const startupGraceMs = 1200;
  const allowImmediateExit = launcher !== "native" || usingOpenWrapper;
  const shouldDetach = !(process.platform === "win32" && launcher === "native" && !isAppBundle);
  const shouldHideWindow = process.platform === "win32"
    ? (launcher !== "native" || isAppBundle)
    : true;

  const child = await new Promise((resolve, reject) => {
    let resolved = false;
    let spawned;

    try {
      spawned = spawn(command, args, {
        cwd: launchCwd,
        detached: shouldDetach,
        stdio: "ignore",
        windowsHide: shouldHideWindow,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "spawn failed";
      if (message.includes("ENOENT")) {
        reject(new Error(`Launcher command not found: ${command}. Set a valid launcher path.`));
        return;
      }
      reject(error);
      return;
    }

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(spawned);
      }
    }, startupGraceMs);

    spawned.once("spawn", () => {
      // Keep waiting through startup grace period so we can catch immediate crashes.
    });

    spawned.once("exit", (code, signal) => {
      if (resolved) {
        return;
      }
      if (allowImmediateExit) {
        resolved = true;
        clearTimeout(timeout);
        resolve(spawned);
        return;
      }
      resolved = true;
      clearTimeout(timeout);
      if (signal) {
        reject(new Error(`Engine process exited immediately (signal: ${signal}). Check executable path and launcher settings.`));
        return;
      }
      reject(new Error(`Engine process exited immediately (code: ${code ?? "unknown"}). Check executable path and launcher settings.`));
    });

    spawned.once("error", (error) => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timeout);
      const message = error instanceof Error ? error.message : "spawn failed";
      if (message.includes("ENOENT")) {
        reject(new Error(`Launcher command not found: ${command}. Set a valid launcher path.`));
        return;
      }
      reject(error instanceof Error ? error : new Error(message));
    });
  });

  if (launchId && child.exitCode === null) {
    const startTime = Date.now();
    runningProcesses.set(launchId, { pid: child.pid, installPath: absolutePath, startTime });
    child.once("exit", () => {
      runningProcesses.delete(launchId);
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send("funkhub:launch-exit", { launchId });
        }
      }
    });
  }

  if (shouldDetach) {
    child.unref();
  }

  return { ok: true, launchedPath: launchable };
}

async function handleOpenPath(payload) {
  const targetPath = payload?.targetPath;
  if (!targetPath) {
    throw new Error("targetPath is required");
  }

  const { shell } = require("electron");
  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : safeJoin(rootPath, targetPath);
  if (!isPathInside(rootPath, absolutePath)) {
    throw new Error("targetPath must be inside FunkHub data root");
  }
  const error = await shell.openPath(absolutePath);
  if (error) {
    return { ok: false, error };
  }

  return { ok: true, openedPath: absolutePath };
}

async function handleOpenAnyPath(payload) {
  const targetPath = payload?.targetPath;
  if (!targetPath) {
    throw new Error("targetPath is required");
  }

  const { shell } = require("electron");
  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : safeJoin(rootPath, targetPath);

  const error = await shell.openPath(absolutePath);
  if (error) {
    return { ok: false, error };
  }

  return { ok: true, openedPath: absolutePath };
}

async function handleOpenExternalUrl(payload) {
  const url = payload?.url;
  if (!url || typeof url !== "string") {
    throw new Error("url is required");
  }

  const normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error("Only http/https URLs are supported");
  }

  const { shell } = require("electron");
  try {
    await shell.openExternal(normalized);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to open URL",
    };
  }
}

async function handleDeletePath(payload) {
  const targetPath = payload?.targetPath;
  if (!targetPath) {
    throw new Error("targetPath is required");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : safeJoin(rootPath, targetPath);
  if (!isPathInside(rootPath, absolutePath)) {
    throw new Error("targetPath must be inside FunkHub data root");
  }

  try {
    await fs.rm(absolutePath, { recursive: true, force: true });
    return { ok: true, deletedPath: absolutePath };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete path",
    };
  }
}

async function handleInspectEngineInstall(payload) {
  const installPath = payload?.installPath;
  if (!installPath) {
    throw new Error("installPath is required");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = safeJoin(rootPath, installPath);

  if (!isPathInside(rootPath, absolutePath)) {
    throw new Error("installPath must be inside FunkHub data root");
  }

  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return { ok: true, health: "broken_install", message: "Engine path is not a directory" };
    }
  } catch {
    return { ok: true, health: "broken_install", message: "Engine directory is missing" };
  }

  const launchablePath = await findLaunchableExecutable(absolutePath, [path.basename(installPath), "funkin", "alepsych", "ale-psych", "ale psych", "psych", "engine"]);
  if (!launchablePath) {
    const hint = await getLaunchFailureHint(absolutePath);
    return { ok: true, health: "missing_binary", message: hint };
  }

  return {
    ok: true,
    health: "ready",
    launchablePath,
  };
}

async function handleInspectPath(payload) {
  const targetPath = payload?.targetPath;
  if (!targetPath) {
    throw new Error("targetPath is required");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : safeJoin(rootPath, targetPath);

  try {
    const stats = await fs.stat(absolutePath);
    return {
      ok: true,
      exists: true,
      isDirectory: stats.isDirectory(),
      absolutePath,
    };
  } catch {
    return {
      ok: true,
      exists: false,
      absolutePath,
    };
  }
}

async function handleImportEngineFolder(payload) {
  const sourcePath = payload?.sourcePath;
  const slug = payload?.slug;
  const version = payload?.version;

  if (!sourcePath || !slug) {
    throw new Error("sourcePath and slug are required");
  }

  const sourceAbsolute = path.resolve(sourcePath);
  const sourceStats = await fs.stat(sourceAbsolute);
  if (!sourceStats.isDirectory()) {
    throw new Error("sourcePath must be a directory");
  }

  const { rootPath, enginesPath } = await resolveInstallDirs("engine", `engines/${slug}`);
  await ensureDir(enginesPath);

  const safeVersion = (version || "imported").toString().replace(/[^A-Za-z0-9._-]+/g, "-") || "imported";
  const relInstallPath = `engines/${slug}/${safeVersion}-${Date.now()}`;
  const absoluteInstallPath = safeJoin(rootPath, relInstallPath);

  await removePath(absoluteInstallPath);
  await ensureDir(path.dirname(absoluteInstallPath));
  await fs.cp(sourceAbsolute, absoluteInstallPath, { recursive: true });
  await ensureDir(path.join(absoluteInstallPath, "mods"));

  const launchablePath = await findLaunchableExecutable(absoluteInstallPath, [slug, path.basename(sourceAbsolute), "funkin", "engine"]);
  if (!launchablePath) {
    await removePath(absoluteInstallPath);
    return {
      ok: false,
      error: "Imported folder has no launchable executable for this platform",
    };
  }

  return {
    ok: true,
    installPath: relInstallPath,
    modsPath: `${relInstallPath}/mods`,
    detectedVersion: detectVersionFromName(path.basename(sourceAbsolute)) || version || "imported",
  };
}

async function handleImportModFolder(payload) {
  const sourcePath = payload?.sourcePath;
  const targetModsPath = payload?.targetModsPath;
  const installSubdir = payload?.installSubdir;

  if (!sourcePath || !targetModsPath || !installSubdir) {
    throw new Error("sourcePath, targetModsPath and installSubdir are required");
  }

  const sourceAbsolute = path.resolve(sourcePath);
  const sourceStats = await fs.stat(sourceAbsolute);
  if (!sourceStats.isDirectory()) {
    throw new Error("sourcePath must be a directory");
  }

  const { dataRootDirectory } = await getEffectiveSettings();
  const rootPath = dataRootDirectory
    ? path.resolve(dataRootDirectory)
    : getDefaultDataRoot();
  const targetRoot = safeJoin(rootPath, targetModsPath);
  const targetInstall = safeJoin(rootPath, `${targetModsPath}/${installSubdir}`);

  if (!isPathInside(rootPath, targetInstall)) {
    throw new Error("target path must be inside FunkHub data root");
  }

  await ensureDir(targetRoot);
  await removePath(targetInstall);
  await fs.cp(sourceAbsolute, targetInstall, { recursive: true });

  return {
    ok: true,
    installPath: path.relative(rootPath, targetInstall).replace(/\\/g, "/"),
  };
}

async function handleGetItchAuthStatus() {
  const auth = await readItchAuth();
  if (!auth) {
    return { connected: false };
  }
  const token = decryptString(auth.accessToken);
  return {
    connected: Boolean(token),
    connectedAt: auth.connectedAt,
    scopes: Array.isArray(auth.scopes) ? auth.scopes : [],
  };
}

async function handleClearItchAuth() {
  await clearItchAuth();
  return { ok: true };
}

async function handleStartItchOAuth(payload) {
  const clientId = payload?.clientId;
  const redirectPort = Number(payload?.redirectPort || 34567);
  const scopes = Array.isArray(payload?.scopes) && payload.scopes.length > 0
    ? payload.scopes
    : ["profile:me", "profile:owned"];

  if (!clientId) {
    throw new Error("itch clientId is required");
  }

  const state = crypto.randomUUID();
  const redirectUri = `http://127.0.0.1:${redirectPort}/callback`;
  const authUrl = new URL("https://itch.io/user/oauth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  await new Promise((resolve, reject) => {
    let done = false;

    const finish = (value, asError = false) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout);
      try {
        server.close();
      } catch {
        // ignore close errors
      }
      if (asError) {
        reject(value);
      } else {
        resolve(value);
      }
    };

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${redirectPort}`);
      if (url.pathname === "/callback") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!doctype html><html><body><script>(function(){
          var hash = window.location.hash.slice(1);
          fetch('/token', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: hash})
            .then(function(){ document.body.textContent='itch.io connection complete. You can close this tab.'; })
            .catch(function(){ document.body.textContent='itch.io connection failed. Please retry.'; });
        })();</script></body></html>`);
        return;
      }

      if (url.pathname === "/token" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          const params = new URLSearchParams(body);
          const accessToken = params.get("access_token") || "";
          const returnedState = params.get("state") || "";
          if (!accessToken) {
            res.writeHead(400);
            res.end("Missing access token");
            finish(new Error("Missing access token from itch OAuth callback"), true);
            return;
          }
          if (returnedState !== state) {
            res.writeHead(400);
            res.end("State mismatch");
            finish(new Error("itch OAuth state mismatch"), true);
            return;
          }

          await writeItchAuth({
            accessToken: encryptString(accessToken),
            scopes,
            connectedAt: Date.now(),
          });

          res.writeHead(200);
          res.end("ok");
          finish({ ok: true });
        });
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    server.on("error", (error) => finish(error, true));

    server.listen(redirectPort, "127.0.0.1", () => {
      const { shell } = require("electron");
      shell.openExternal(authUrl.toString()).catch((error) => finish(error, true));
    });

    const timeout = setTimeout(() => {
      finish(new Error("itch OAuth timed out"), true);
    }, 180000);
  });

  return { ok: true };
}

function platformUploadMatch(platform, fileName) {
  const lower = fileName.toLowerCase();
  if (platform === "windows") return lower.includes("windows") || lower.includes("win");
  if (platform === "linux") return lower.includes("linux");
  if (platform === "macos") return lower.includes("mac");
  return true;
}

function detectPlatformFromUploadName(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("windows") || lower.includes("win")) return "windows";
  if (lower.includes("linux")) return "linux";
  if (lower.includes("mac")) return "macos";
  return "any";
}

function detectVersionFromUploadName(fileName) {
  const match = fileName.match(/v?(\d+\.\d+(?:\.\d+)?(?:[-+._A-Za-z0-9]+)?)/i);
  return match ? match[1] : "latest";
}

async function getItchFunkinUploads(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  let target = null;
  for (let page = 1; page <= 25; page += 1) {
    const ownedResponse = await fetch(`https://api.itch.io/profile/owned-keys?page=${page}`, { headers });
    if (!ownedResponse.ok) {
      throw new Error("itch.io auth failed, reconnect your account");
    }

    const ownedPayload = await ownedResponse.json();
    const ownedKeys = Array.isArray(ownedPayload?.owned_keys) ? ownedPayload.owned_keys : [];
    target = ownedKeys.find((entry) => entry?.game_id === 792778 || String(entry?.game?.url || "").includes("ninja-muffin24.itch.io/funkin"));
    if (target) {
      break;
    }

    if (ownedKeys.length === 0) {
      break;
    }
  }

  if (!target) {
    throw new Error("Funkin base game is not found in your itch.io library");
  }

  const uploadsResponse = await fetch(`https://api.itch.io/games/${target.game_id}/uploads?download_key=${target.id}`, { headers });
  if (!uploadsResponse.ok) {
    throw new Error("Failed to query itch.io uploads");
  }

  const uploadsPayload = await uploadsResponse.json();
  const uploads = Array.isArray(uploadsPayload?.uploads) ? uploadsPayload.uploads : [];

  return {
    headers,
    target,
    uploads,
  };
}

async function handleListItchBaseGameReleases() {
  const token = await getItchAccessToken();
  if (!token) {
    return {
      ok: false,
      requiresAuth: true,
      message: "You have to log in with itch.io to load base game versions",
      releases: [],
    };
  }

  try {
    const { uploads } = await getItchFunkinUploads(token);
    const releases = uploads.map((upload) => {
      const fileName = String(upload?.filename || "Funkin build");
      const platform = detectPlatformFromUploadName(fileName);
      return {
        platform,
        version: detectVersionFromUploadName(fileName),
        fileName,
        uploadId: Number(upload?.id || 0),
        downloadUrl: `itch://upload/${upload?.id}`,
        sourceUrl: "https://ninja-muffin24.itch.io/funkin",
      };
    }).filter((entry) => Number.isFinite(entry.uploadId) && entry.uploadId > 0);

    return {
      ok: true,
      releases,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to load itch releases",
      releases: [],
    };
  }
}

async function handleResolveItchBaseGameDownload(payload) {
  const platform = payload?.platform || "linux";
  const uploadId = Number(payload?.uploadId || 0) || undefined;

  if (!uploadId && platform === "unknown") {
    return {
      ok: false,
      message: "Platform is unknown. Select a specific base game release for your OS.",
    };
  }

  const token = await getItchAccessToken();
  if (!token) {
    return {
      ok: false,
      requiresAuth: true,
      message: "You have to log in with itch.io to install base game",
    };
  }

  let uploads;
  let headers;
  let target;
  try {
    ({ uploads, headers, target } = await getItchFunkinUploads(token));
  } catch (error) {
    return {
      ok: false,
      requiresAuth: true,
      message: error instanceof Error ? error.message : "Failed to query itch.io uploads",
    };
  }

  const upload = uploadId
    ? uploads.find((entry) => Number(entry?.id) === uploadId)
    : (uploads.find((entry) => platformUploadMatch(platform, String(entry?.filename || ""))) || uploads[0]);

  if (!upload?.id) {
    return { ok: false, message: "No compatible itch.io base game upload found" };
  }

  const downloadResponse = await fetch(
    `https://api.itch.io/uploads/${upload.id}/download?download_key_id=${target.id}&uuid=${crypto.randomUUID()}`,
    { headers, redirect: "manual" },
  );
  const location = downloadResponse.headers.get("location");
  if (!location) {
    return { ok: false, message: "Failed to resolve itch.io download URL" };
  }

  return {
    ok: true,
    downloadUrl: location,
    fileName: String(upload.filename || `funkin-${platform}.zip`),
    version: detectVersionFromUploadName(String(upload.filename || "")),
  };
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

async function handleCheckAppUpdate() {
  if (!canUseNativeAutoUpdater()) {
    const currentVersion = String(app.getVersion() || "0.0.0").replace(/^v/i, "");
    return {
      ok: true,
      info: {
        available: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: "Auto updater unavailable",
        releaseUrl: GITHUB_RELEASES_URL,
        notes: process.platform === "linux"
          ? "In-app auto updates are not enabled on Linux builds yet."
          : "In-app auto updates are unavailable in this build.",
      },
    };
  }

  try {
    const updater = ensureAppUpdaterInitialized();
    const result = await updater.checkForUpdates();
    const mapped = mapUpdaterInfo(result?.updateInfo || {});
    appUpdateState.lastInfo = mapped;
    return { ok: true, info: mapped };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to check app update",
    };
  }
}

async function handleDownloadAppUpdate() {
  if (!canUseNativeAutoUpdater()) {
    return {
      ok: false,
      error: process.platform === "linux"
        ? "In-app auto download is not enabled on Linux builds yet."
        : "In-app auto download is unavailable in this build.",
    };
  }

  try {
    const updater = ensureAppUpdaterInitialized();
    await updater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to download app update",
    };
  }
}

async function handleInstallAppUpdate() {
  if (!canUseNativeAutoUpdater()) {
    return {
      ok: false,
      error: "In-app update install is unavailable in this build.",
    };
  }

  try {
    const updater = ensureAppUpdaterInitialized();
    setTimeout(() => {
      updater.quitAndInstall(false, true);
    }, 200);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to install app update",
    };
  }
}

function handleGetRunningLaunches() {
  const launches = Array.from(runningProcesses.entries()).map(([launchId, info]) => ({
    launchId,
    installPath: info.installPath,
    startTime: info.startTime,
  }));
  return { launches };
}

function handleKillLaunch(payload) {
  const launchId = payload?.launchId;
  if (!launchId) {
    throw new Error("launchId is required");
  }
  const info = runningProcesses.get(launchId);
  if (!info) {
    return { ok: false, message: "No running process found" };
  }
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(info.pid), "/F", "/T"], { stdio: "ignore" });
    } else {
      process.kill(info.pid, "SIGTERM");
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to kill process" };
  }
}

module.exports = {
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
  handleGetRunningLaunches,
  handleKillLaunch,
};
