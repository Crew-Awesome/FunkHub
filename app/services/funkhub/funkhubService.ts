import { downloadManager } from "./downloadManager";
import { engineCatalogService } from "./engineCatalog";
import { gameBananaApiService } from "./gamebananaApi";
import { modInstallerService } from "./installer";
import { funkHubStorageService } from "./storage";
import {
  CategoryNode,
  DownloadTask,
  EngineDefinition,
  EngineSlug,
  GameBananaModProfile,
  GameBananaModSummary,
  InstalledEngine,
  InstalledMod,
  ListModsParams,
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

export class FunkHubService {
  private installedMods: InstalledMod[] = [];

  private installedEngines: InstalledEngine[] = [];

  private downloadHistory: DownloadTask[] = [];

  constructor() {
    this.installedMods = funkHubStorageService.getInstalledMods();
    this.installedEngines = funkHubStorageService.getInstalledEngines();
    this.downloadHistory = funkHubStorageService.getDownloadHistory();

    if (this.installedEngines.length === 0) {
      this.installedEngines = [
        {
          id: crypto.randomUUID(),
          slug: "psych",
          name: "Psych Engine",
          version: "latest",
          installPath: "engines/psych",
          modsPath: "engines/psych/mods",
          isDefault: true,
          installedAt: Date.now(),
        },
      ];
      funkHubStorageService.saveInstalledEngines(this.installedEngines);
    }
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

  async getEngineCatalog(): Promise<EngineDefinition[]> {
    return engineCatalogService.getEngineCatalog();
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

  async searchMods(params: SearchModsParams): Promise<GameBananaModSummary[]> {
    return gameBananaApiService.searchMods(params);
  }

  async getModProfile(modId: number): Promise<GameBananaModProfile> {
    return gameBananaApiService.getModProfile(modId);
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

    this.installedEngines = [engine, ...this.installedEngines.map((item) => ({ ...item, isDefault: item.isDefault }))];
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
    funkHubStorageService.saveInstalledMods(this.installedMods);
  }

  cancelDownload(taskId: string): void {
    downloadManager.cancel(taskId);
  }

  queueInstall(modId: number, fileId: number, selectedEngineId?: string): DownloadTask {
    const abortController = new AbortController();
    const taskId = `${modId}-${fileId}-${Date.now()}`;

    return downloadManager.enqueue({
      task: {
        id: taskId,
        modId,
        fileId,
        fileName: `file-${fileId}`,
      },
      cancel: () => abortController.abort(),
      run: async (task, update) => {
        const profile = await this.getModProfile(modId);
        const selectedFile = profile.files.find((file) => file.id === fileId) ?? profile.files[0];

        if (!selectedFile) {
          throw new Error("No downloadable files available for this mod.");
        }

        update({
          ...task,
          fileName: selectedFile.fileName,
          totalBytes: selectedFile.fileSize,
          status: "downloading",
        });

        const response = await fetch(`https://gamebanana.com/dl/${selectedFile.id}`, {
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to download archive");
        }

        const totalBytes = Number((response.headers.get("content-length") ?? selectedFile.fileSize) || 0) || undefined;
        const reader = response.body.getReader();
        const chunks: ArrayBuffer[] = [];
        const startedAt = performance.now();
        let downloaded = 0;

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
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
            });
          }
        }

        update({
          ...task,
          fileName: selectedFile.fileName,
          totalBytes,
          downloadedBytes: downloaded,
          progress: 1,
          status: "installing",
        });

        const selectedEngine = this.installedEngines.find((engine) => engine.id === selectedEngineId)
          ?? this.installedEngines.find((engine) => engine.isDefault)
          ?? this.installedEngines[0];

        const plan = modInstallerService.createInstallPlan({
          mod: profile,
          file: selectedFile,
          selectedEngine,
        });

        const blob = new Blob(chunks);
        const installedMod = await modInstallerService.installDownloadedArchive({
          plan,
          blob,
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
        });
      },
    });
  }
}

export const funkHubService = new FunkHubService();
