import { DownloadTask, FunkHubSettings, InstalledEngine, InstalledMod } from "./types";

const STORAGE_KEYS = {
  installedMods: "funkhub-installed-mods",
  installedEngines: "funkhub-installed-engines",
  downloadHistory: "funkhub-download-history",
  settings: "funkhub-settings",
} as const;

const DEFAULT_SETTINGS: FunkHubSettings = {
  gameDirectory: "",
  downloadsDirectory: "",
  dataRootDirectory: "",
  firstRunCompleted: false,
  maxConcurrentDownloads: 3,
  compatibilityChecks: true,
  checkAppUpdatesOnStartup: true,
  autoDownloadAppUpdates: false,
  autoUpdateMods: false,
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
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  }

  saveSettings(settings: FunkHubSettings): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }
}

export const funkHubStorageService = new FunkHubStorageService();
export { DEFAULT_SETTINGS };
