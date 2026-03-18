import { DownloadTask, FunkHubSettings, InstalledEngine, InstalledMod } from "./types";

const STORAGE_KEYS = {
  installedMods: "funkhub-installed-mods",
  installedEngines: "funkhub-installed-engines",
  downloadHistory: "funkhub-download-history",
  settings: "funkhub-settings",
  theme: "funkhub-theme",
  achievements: "funkhub-achievements",
} as const;

const DEFAULT_SETTINGS: FunkHubSettings = {
  locale: "en",
  gameDirectory: "",
  downloadsDirectory: "",
  dataRootDirectory: "",
  firstRunCompleted: false,
  maxConcurrentDownloads: 3,
  compatibilityChecks: true,
  checkAppUpdatesOnStartup: true,
  autoDownloadAppUpdates: false,
  autoUpdateMods: false,
  autoUpdateEngines: false,
  sendAnalytics: false,
  showAnimations: true,
  gameBananaIntegration: {
    pollingIntervalSeconds: 300,
  },
  engineLaunchOverrides: {},
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class FunkHubStorageService {
  getInstalledMods(): InstalledMod[] {
    return safeParse<InstalledMod[]>(localStorage.getItem(STORAGE_KEYS.installedMods), []);
  }

  saveInstalledMods(mods: InstalledMod[]): void {
    localStorage.setItem(STORAGE_KEYS.installedMods, JSON.stringify(mods));
  }

  getInstalledEngines(): InstalledEngine[] {
    return safeParse<InstalledEngine[]>(localStorage.getItem(STORAGE_KEYS.installedEngines), []);
  }

  saveInstalledEngines(engines: InstalledEngine[]): void {
    localStorage.setItem(STORAGE_KEYS.installedEngines, JSON.stringify(engines));
  }

  getDownloadHistory(): DownloadTask[] {
    return safeParse<DownloadTask[]>(localStorage.getItem(STORAGE_KEYS.downloadHistory), []);
  }

  saveDownloadHistory(history: DownloadTask[]): void {
    localStorage.setItem(STORAGE_KEYS.downloadHistory, JSON.stringify(history));
  }

  getSettings(): FunkHubSettings {
    const parsed = safeParse<Partial<FunkHubSettings>>(localStorage.getItem(STORAGE_KEYS.settings), {});
    const mergedGameBananaIntegration = {
      ...DEFAULT_SETTINGS.gameBananaIntegration,
      ...(parsed.gameBananaIntegration || {}),
    };
    const mergedEngineLaunchOverrides = {
      ...DEFAULT_SETTINGS.engineLaunchOverrides,
      ...(parsed.engineLaunchOverrides || {}),
    };

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gameBananaIntegration: mergedGameBananaIntegration,
      engineLaunchOverrides: mergedEngineLaunchOverrides,
    };
  }

  saveSettings(settings: FunkHubSettings): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  clearMods(): void {
    localStorage.removeItem(STORAGE_KEYS.installedMods);
  }

  clearEngines(): void {
    localStorage.removeItem(STORAGE_KEYS.installedEngines);
  }

  clearDownloads(): void {
    localStorage.removeItem(STORAGE_KEYS.downloadHistory);
  }

  clearSettings(): void {
    localStorage.removeItem(STORAGE_KEYS.settings);
  }

  clearTheme(): void {
    localStorage.removeItem(STORAGE_KEYS.theme);
  }

  clearDownloadsByStatus(status: "completed" | "failed" | "active"): void {
    const all = this.getDownloadHistory();
    const filtered = all.filter((task) => {
      if (status === "completed") return task.status !== "completed";
      if (status === "failed") return task.status !== "failed";
      if (status === "active") return !["queued", "downloading", "installing"].includes(task.status);
      return true;
    });
    this.saveDownloadHistory(filtered);
  }

  clearDisabledMods(): void {
    const mods = this.getInstalledMods();
    const enabled = mods.filter((mod) => mod.enabled !== false);
    this.saveInstalledMods(enabled);
  }

  clearUnpinnedMods(): void {
    const mods = this.getInstalledMods();
    const pinned = mods.filter((mod) => mod.pinned === true);
    this.saveInstalledMods(pinned);
  }

  clearModPlayTime(): void {
    const mods = this.getInstalledMods();
    const reset = mods.map((mod) => ({
      ...mod,
      totalPlayTimeMs: 0,
      lastLaunchedAt: undefined,
    }));
    this.saveInstalledMods(reset);
  }

  clearModUpdates(): void {
    const mods = this.getInstalledMods();
    const reset = mods.map((mod) => ({
      ...mod,
      latestFileId: mod.sourceFileId,
    }));
    this.saveInstalledMods(reset);
  }

  clearAchievements(): void {
    localStorage.removeItem(STORAGE_KEYS.achievements);
  }

  getUnlockedAchievements(): string[] {
    const value = localStorage.getItem(STORAGE_KEYS.achievements);
    if (!value) return [];
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }

  saveUnlockedAchievements(achievements: string[]): void {
    localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(achievements));
  }
}

export const funkHubStorageService = new FunkHubStorageService();
export { DEFAULT_SETTINGS };
