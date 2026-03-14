import { DownloadTask, InstalledEngine, InstalledMod } from "./types";

const STORAGE_KEYS = {
  installedMods: "funkhub-installed-mods",
  installedEngines: "funkhub-installed-engines",
  downloadHistory: "funkhub-download-history",
} as const;

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
}

export const funkHubStorageService = new FunkHubStorageService();
