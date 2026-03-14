import { downloadManager } from "./downloadManager";
import { engineCatalogService } from "./engineCatalog";
import { gameBananaApiService } from "./gamebananaApi";
import { modInstallerService } from "./installer";
import { DEFAULT_SETTINGS, funkHubStorageService } from "./storage";
import {
  CategoryNode,
  DownloadTask,
  EngineDefinition,
  EngineSlug,
  FunkHubSettings,
  GameBananaModProfile,
  GameBananaModSummary,
  InstalledEngine,
  InstalledMod,
  ListModsParams,
  ModUpdateInfo,
  SearchModsParams,
} from "./types";

function formatEngineName(slug: EngineSlug): string {
  switch (slug) {
    case "psych":
      return "Psych Engine";
    case "basegame":
      return "Base Game";
    case "codename":
      return "Codename Engine";
    case "fps-plus":
      return "FPS Plus";
    case "js-engine":
      return "JS Engine";
    case "ale-psych":
      return "ALE Psych";
    case "p-slice":
      return "P-Slice";
    default:
      return slug;
  }
}

function parseVersion(version?: string): number[] {
  if (!version) {
    return [0, 0, 0];
  }

  const cleaned = version.trim().replace(/^v/i, "");
  const parts = cleaned.split(/[^0-9]+/).filter(Boolean).slice(0, 3).map((part) => Number(part));
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a?: string, b?: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let index = 0; index < 3; index += 1) {
    if (va[index] > vb[index]) {
      return 1;
    }
    if (va[index] < vb[index]) {
      return -1;
    }
  }
  return 0;
}

export class FunkHubService {
  private installedMods: InstalledMod[] = [];

  private installedEngines: InstalledEngine[] = [];

  private downloadHistory: DownloadTask[] = [];

  private updateCache: ModUpdateInfo[] = [];

  private settings: FunkHubSettings;

  private desktopProgressUnsubscribe: (() => void) | undefined;

  constructor() {
    this.settings = funkHubStorageService.getSettings();
    this.installedMods = funkHubStorageService.getInstalledMods();
    const storedEngines = funkHubStorageService.getInstalledEngines();
    this.installedEngines = storedEngines.filter((engine) => !(
      engine.slug === "psych"
      && engine.version === "latest"
      && engine.installPath === "engines/psych"
      && engine.modsPath === "engines/psych/mods"
    ));
    this.downloadHistory = funkHubStorageService.getDownloadHistory();
    downloadManager.setMaxConcurrent(this.settings.maxConcurrentDownloads);

    if (storedEngines.length !== this.installedEngines.length) {
      funkHubStorageService.saveInstalledEngines(this.installedEngines);
    }

    this.setupDesktopProgressBridge();
  }

  getSettings(): FunkHubSettings {
    return { ...this.settings };
  }

  async syncDesktopSettings(): Promise<FunkHubSettings> {
    if (!window.funkhubDesktop?.getSettings) {
      return this.getSettings();
    }

    try {
      const runtimeSettings = await window.funkhubDesktop.getSettings();
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...this.settings,
        ...runtimeSettings,
      };
      downloadManager.setMaxConcurrent(this.settings.maxConcurrentDownloads);
      funkHubStorageService.saveSettings(this.settings);
    } catch {
      // Keep local settings if desktop runtime settings are unavailable.
    }

    return this.getSettings();
  }

  async updateSettings(patch: Partial<FunkHubSettings>): Promise<FunkHubSettings> {
    const nextSettings: FunkHubSettings = {
      ...this.settings,
      ...patch,
    };

    nextSettings.maxConcurrentDownloads = Math.max(
      1,
      Number(nextSettings.maxConcurrentDownloads) || DEFAULT_SETTINGS.maxConcurrentDownloads,
    );

    if (window.funkhubDesktop?.updateSettings) {
      try {
        const runtimeSettings = await window.funkhubDesktop.updateSettings(nextSettings);
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...nextSettings,
          ...runtimeSettings,
        };
      } catch {
        this.settings = nextSettings;
      }
    } else {
      this.settings = nextSettings;
    }

    downloadManager.setMaxConcurrent(this.settings.maxConcurrentDownloads);
    funkHubStorageService.saveSettings(this.settings);
    return this.getSettings();
  }

  async pickFolder(options?: { title?: string; defaultPath?: string }): Promise<string | undefined> {
    if (!window.funkhubDesktop?.pickFolder) {
      return undefined;
    }

    const result = await window.funkhubDesktop.pickFolder(options);
    if (result.canceled) {
      return undefined;
    }

    return result.path;
  }

  private setupDesktopProgressBridge(): void {
    if (!window.funkhubDesktop?.onInstallProgress) {
      return;
    }

    this.desktopProgressUnsubscribe = window.funkhubDesktop.onInstallProgress((payload) => {
      const existing = this.downloadHistory.find((task) => task.id === payload.jobId);
      if (!existing) {
        return;
      }

      const status = payload.phase === "error"
        ? "failed"
        : payload.phase === "install"
          ? "installing"
          : "downloading";

      downloadManager.update(payload.jobId, {
        ...existing,
        phase: payload.phase,
        status,
        progress: payload.progress,
        downloadedBytes: payload.downloadedBytes ?? existing.downloadedBytes,
        totalBytes: payload.totalBytes ?? existing.totalBytes,
        speedBytesPerSecond: payload.speedBytesPerSecond ?? existing.speedBytesPerSecond,
        message: payload.message,
        error: payload.phase === "error" ? payload.message : existing.error,
      });
    });
  }

  subscribeDownloads(listener: (tasks: DownloadTask[]) => void): () => void {
    return downloadManager.subscribe((tasks) => {
      this.downloadHistory = tasks;
      funkHubStorageService.saveDownloadHistory(tasks);
      listener(tasks);
    });
  }

  getInstalledMods(): InstalledMod[] {
    return [...this.installedMods].sort((a, b) => b.installedAt - a.installedAt);
  }

  getInstalledEngines(): InstalledEngine[] {
    return [...this.installedEngines].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }

  getDownloadHistory(): DownloadTask[] {
    return [...this.downloadHistory].sort((a, b) => b.createdAt - a.createdAt);
  }

  getModUpdates(): ModUpdateInfo[] {
    return [...this.updateCache];
  }

  async getEngineCatalog(): Promise<EngineDefinition[]> {
    return engineCatalogService.getEngineCatalog();
  }

  async installEngineFromRelease(input: {
    slug: EngineSlug;
    releaseUrl: string;
    releaseVersion: string;
  }): Promise<InstalledEngine> {
    const jobId = `engine-${input.slug}-${Date.now()}`;
    const installPath = `engines/${input.slug}`;
    const taskName = `${input.slug}-${input.releaseVersion}.zip`;

    return new Promise<InstalledEngine>((resolve, reject) => {
      downloadManager.enqueue({
        task: {
          id: jobId,
          modId: -1,
          fileId: 0,
          fileName: taskName,
          priority: 10,
        },
        cancel: () => {
          if (window.funkhubDesktop) {
            window.funkhubDesktop.cancelInstall({ jobId }).catch(() => undefined);
          }
        },
        run: async (task, update) => {
          try {
            update({
              ...task,
              status: "downloading",
              phase: "download",
              message: `Preparing ${input.slug} engine install`,
            });

            if (window.funkhubDesktop) {
              await window.funkhubDesktop.installEngine({
                jobId,
                mode: "engine",
                fileName: taskName,
                downloadUrl: input.releaseUrl,
                installPath,
              });
            }

            const installed = this.addEngineInstallation({
              slug: input.slug,
              version: input.releaseVersion,
              installPath,
              modsPath: `${installPath}/mods`,
            });

            update({
              ...task,
              fileName: taskName,
              progress: 1,
              status: "completed",
              phase: "install",
              message: `${installed.name} installed`,
            });

            resolve(installed);
          } catch (error) {
            reject(error);
            throw error;
          }
        },
      });
    });
  }

  async getFunkHubCategories(): Promise<CategoryNode[]> {
    return gameBananaApiService.getFunkHubCategories();
  }

  async getTrendingMods(): Promise<GameBananaModSummary[]> {
    return gameBananaApiService.getTrendingMods();
  }

  async listMods(params?: ListModsParams): Promise<GameBananaModSummary[]> {
    return gameBananaApiService.listMods(params);
  }

  async getModSortOptions(): Promise<Array<{ alias: string; title: string }>> {
    const config = await gameBananaApiService.getModListFilterConfig();
    return config.sorts;
  }

  async searchMods(params: SearchModsParams): Promise<GameBananaModSummary[]> {
    return gameBananaApiService.searchMods(params);
  }

  async getModProfile(modId: number): Promise<GameBananaModProfile> {
    return gameBananaApiService.getModProfile(modId);
  }

  async refreshModUpdates(): Promise<ModUpdateInfo[]> {
    const updates: ModUpdateInfo[] = [];

    await Promise.all(this.installedMods.map(async (installed) => {
      try {
        const profile = await this.getModProfile(installed.modId);
        const latestVersion = profile.version || "unknown";
        const currentVersion = installed.version || "unknown";

        if (latestVersion !== "unknown" && compareVersions(latestVersion, currentVersion) > 0) {
          updates.push({
            installedId: installed.id,
            modId: installed.modId,
            modName: installed.modName,
            currentVersion,
            latestVersion,
            engine: installed.engine,
            sourceFileId: installed.sourceFileId,
          });
        }
      } catch {
        // Missing or removed mod entries are ignored in update scan.
      }
    }));

    this.updateCache = updates.sort((a, b) => a.modName.localeCompare(b.modName));

    const flagged = new Set(this.updateCache.map((item) => item.installedId));
    this.installedMods = this.installedMods.map((mod) => {
      const update = this.updateCache.find((entry) => entry.installedId === mod.id);
      return {
        ...mod,
        updateAvailable: flagged.has(mod.id),
        latestVersion: update?.latestVersion,
      };
    });
    funkHubStorageService.saveInstalledMods(this.installedMods);

    return this.updateCache;
  }

  addEngineInstallation(input: { slug: EngineSlug; version: string; installPath: string; modsPath: string }): InstalledEngine {
    const engine: InstalledEngine = {
      id: crypto.randomUUID(),
      slug: input.slug,
      name: formatEngineName(input.slug),
      version: input.version,
      installPath: input.installPath,
      modsPath: input.modsPath,
      isDefault: this.installedEngines.length === 0,
      installedAt: Date.now(),
    };

    this.installedEngines = [engine, ...this.installedEngines.map((item) => ({ ...item }))];
    funkHubStorageService.saveInstalledEngines(this.installedEngines);
    return engine;
  }

  setDefaultEngine(engineId: string): void {
    this.installedEngines = this.installedEngines.map((engine) => ({
      ...engine,
      isDefault: engine.id === engineId,
    }));
    funkHubStorageService.saveInstalledEngines(this.installedEngines);
  }

  removeInstalledMod(installedId: string): void {
    this.installedMods = this.installedMods.filter((mod) => mod.id !== installedId);
    this.updateCache = this.updateCache.filter((update) => update.installedId !== installedId);
    funkHubStorageService.saveInstalledMods(this.installedMods);
  }

  async launchInstalledMod(installedId: string): Promise<void> {
    const installed = this.installedMods.find((mod) => mod.id === installedId);
    if (!installed) {
      throw new Error("Installed mod not found");
    }

    const engine = this.installedEngines.find((entry) => entry.slug === installed.engine)
      ?? this.installedEngines.find((entry) => entry.isDefault)
      ?? this.installedEngines[0];

    if (!engine) {
      throw new Error("No engine installation found");
    }

    if (!window.funkhubDesktop?.launchEngine) {
      throw new Error("Desktop bridge unavailable for launching");
    }

    await window.funkhubDesktop.launchEngine({ installPath: engine.installPath });
  }

  async launchEngine(engineId: string): Promise<void> {
    const engine = this.installedEngines.find((entry) => entry.id === engineId);
    if (!engine) {
      throw new Error("Engine installation not found");
    }

    if (!window.funkhubDesktop?.launchEngine) {
      throw new Error("Desktop bridge unavailable for launching");
    }

    await window.funkhubDesktop.launchEngine({ installPath: engine.installPath });
  }

  async openEngineFolder(engineId: string): Promise<void> {
    const engine = this.installedEngines.find((entry) => entry.id === engineId);
    if (!engine) {
      throw new Error("Engine installation not found");
    }

    if (!window.funkhubDesktop?.openPath) {
      throw new Error("Desktop bridge unavailable for folder management");
    }

    const result = await window.funkhubDesktop.openPath({ targetPath: engine.installPath });
    if (!result.ok) {
      throw new Error(result.error || "Failed to open engine folder");
    }
  }

  cancelDownload(taskId: string): void {
    const task = this.downloadHistory.find((entry) => entry.id === taskId);
    downloadManager.cancel(taskId);
    if (window.funkhubDesktop && task) {
      window.funkhubDesktop.cancelInstall({ jobId: task.id }).catch(() => undefined);
    }
  }

  queueInstall(modId: number, fileId: number, selectedEngineId?: string, priority = 0): DownloadTask {
    const abortController = new AbortController();
    const taskId = `${modId}-${fileId}-${Date.now()}`;

    return downloadManager.enqueue({
      task: {
        id: taskId,
        modId,
        fileId,
        fileName: `file-${fileId}`,
        priority,
      },
      cancel: () => abortController.abort(),
      run: async (task, update) => {
        const profile = await this.getModProfile(modId);
        const selectedFile = profile.files.find((file) => file.id === fileId) ?? profile.files[0];

        if (!selectedFile) {
          throw new Error("Selected file is missing or has been removed.");
        }

        const selectedEngine = this.installedEngines.find((engine) => engine.id === selectedEngineId)
          ?? this.installedEngines.find((engine) => engine.isDefault)
          ?? this.installedEngines[0];

        const plan = modInstallerService.createInstallPlan({
          mod: profile,
          file: selectedFile,
          selectedEngine,
        });

        const compatibility = modInstallerService.validateEngineCompatibility({
          requiredEngine: plan.requiredEngine,
          selectedEngine,
          plan,
        });

        if (!compatibility.compatible) {
          throw new Error(compatibility.warning ?? "Selected engine is incompatible with this mod.");
        }

        update({
          ...task,
          fileName: selectedFile.fileName,
          totalBytes: selectedFile.fileSize,
          status: "downloading",
          message: "Starting download",
        });

        if (window.funkhubDesktop) {
          const request = modInstallerService.createDesktopInstallRequest({
            jobId: task.id,
            plan,
            file: selectedFile,
            modName: profile.name,
          });

          const installedMod = await modInstallerService.installViaDesktopBridge({
            request,
            mod: profile,
            sourceFileId: selectedFile.id,
            requiredEngine: plan.requiredEngine,
          });

          this.installedMods = [installedMod, ...this.installedMods];
          funkHubStorageService.saveInstalledMods(this.installedMods);

          update({
            ...task,
            fileName: selectedFile.fileName,
            totalBytes: selectedFile.fileSize,
            downloadedBytes: selectedFile.fileSize,
            progress: 1,
            status: "completed",
            message: "Install complete",
          });
          return;
        }

        const response = await fetch(`https://gamebanana.com/dl/${selectedFile.id}`, {
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Download interrupted or unavailable.");
        }

        const totalBytes = Number((response.headers.get("content-length") ?? selectedFile.fileSize) || 0) || undefined;
        const reader = response.body.getReader();
        const startedAt = performance.now();
        let downloaded = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            downloaded += value.byteLength;
            const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
            update({
              ...task,
              fileName: selectedFile.fileName,
              totalBytes,
              downloadedBytes: downloaded,
              progress: totalBytes ? downloaded / totalBytes : 0,
              speedBytesPerSecond: downloaded / elapsedSeconds,
              status: "downloading",
              message: "Downloading archive",
            });
          }
        }

        const installedMod = modInstallerService.createFallbackInstalledRecord({
          plan,
          fileName: selectedFile.fileName,
          mod: profile,
          sourceFileId: selectedFile.id,
        });
        this.installedMods = [installedMod, ...this.installedMods];
        funkHubStorageService.saveInstalledMods(this.installedMods);

        update({
          ...task,
          fileName: selectedFile.fileName,
          totalBytes,
          downloadedBytes: downloaded,
          progress: 1,
          status: "completed",
          message: "Downloaded (desktop bridge unavailable)",
        });
      },
    });
  }
}

export const funkHubService = new FunkHubService();
