import type { InstalledMod, InstalledEngine } from "../../services/funkhub";
import { formatEngineName, type EngineSlug } from "../../services/funkhub";

// ─────────────────────────────────────────────────────────────────────────────
// Play time
// ─────────────────────────────────────────────────────────────────────────────

export function computeTotalPlayTime(mods: InstalledMod[]): number {
  return mods.reduce((sum, mod) => sum + (mod.totalPlayTimeMs ?? 0), 0);
}

export function formatPlayTime(ms: number): string {
  if (ms <= 0) return "< 1m";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

// ─────────────────────────────────────────────────────────────────────────────
// Member since
// ─────────────────────────────────────────────────────────────────────────────

export function computeMemberSince(mods: InstalledMod[]): number | undefined {
  if (mods.length === 0) return undefined;
  return Math.min(...mods.map((m) => m.installedAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// Most played
// ─────────────────────────────────────────────────────────────────────────────

export interface MostPlayedEntry {
  mod: InstalledMod;
  playTimeMs: number;
  percentage: number;
}

export function computeMostPlayed(mods: InstalledMod[]): MostPlayedEntry[] {
  const withTime = mods
    .filter((m) => (m.totalPlayTimeMs ?? 0) > 0)
    .sort((a, b) => (b.totalPlayTimeMs ?? 0) - (a.totalPlayTimeMs ?? 0))
    .slice(0, 8);

  if (withTime.length === 0) return [];

  const maxMs = withTime[0].totalPlayTimeMs ?? 1;

  return withTime.map((mod) => ({
    mod,
    playTimeMs: mod.totalPlayTimeMs ?? 0,
    percentage: Math.round(((mod.totalPlayTimeMs ?? 0) / maxMs) * 100),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Recently played
// ─────────────────────────────────────────────────────────────────────────────

export function computeRecentlyPlayed(mods: InstalledMod[]): InstalledMod[] {
  return [...mods]
    .filter((m) => m.lastLaunchedAt != null)
    .sort((a, b) => (b.lastLaunchedAt ?? 0) - (a.lastLaunchedAt ?? 0))
    .slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Relative time helper
// ─────────────────────────────────────────────────────────────────────────────

export function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine groups
// ─────────────────────────────────────────────────────────────────────────────

export interface EngineGroup {
  slug: string;
  name: string;
  count: number;
  percentage: number;
}

export function computeEngineGroups(mods: InstalledMod[]): EngineGroup[] {
  if (mods.length === 0) return [];

  const counts = new Map<string, number>();
  for (const mod of mods) {
    const key = mod.engine ?? "__unknown__";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({
      slug,
      name: slug === "__unknown__" ? "Unknown" : formatEngineName(slug as EngineSlug),
      count,
      percentage: Math.round((count / mods.length) * 100),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  unlocked: boolean;
}

export interface AchievementData {
  totalLaunches: number;
  totalDownloads: number;
  deepLinksUsed: number;
  settingsChanged: number;
  themesTried: string[];
  lastActiveDate: number;
  currentStreak: number;
  longestStreak: number;
  categoriesBrowsed: Set<string>;
}

interface DownloadTask {
  status: string;
  totalBytes?: number;
}

export function computeAchievements(
  mods: InstalledMod[],
  engines: InstalledEngine[],
  pendingUpdates: number,
  downloads: DownloadTask[] = [],
  achievementData?: AchievementData,
): Achievement[] {
  const totalPlayMs = computeTotalPlayTime(mods);

  const uniqueCategories = new Set(
    mods.map((m) => m.categoryName).filter(Boolean),
  );

  const hasTags = mods.some((m) => (m.tags?.length ?? 0) > 0);
  const hasNotes = mods.some((m) => (m.notes?.length ?? 0) > 0);
  const hasLaunched = mods.some((m) => m.lastLaunchedAt != null);
  const uniqueEngines = new Set(mods.map((m) => m.engine));
  const modsWithNotes = mods.filter((m) => (m.notes?.length ?? 0) > 0).length;

  const totalDownloads = downloads.length;
  const completedDownloads = downloads.filter((d) => d.status === "completed").length;
  const totalDownloadBytes = downloads.reduce((sum, d) => sum + (d.totalBytes ?? 0), 0);
  const largestDownloadMB = Math.max(...downloads.map((d) => (d.totalBytes ?? 0) / 1024 / 1024), 0);

  const data = achievementData ?? {
    totalLaunches: 0,
    totalDownloads: 0,
    deepLinksUsed: 0,
    settingsChanged: 0,
    themesTried: [],
    lastActiveDate: 0,
    currentStreak: 0,
    longestStreak: 0,
    categoriesBrowsed: new Set(),
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;

  return [
    // Existing achievements
    { id: "first_steps", unlocked: mods.length >= 1 },
    { id: "collector", unlocked: mods.length >= 10 },
    { id: "hoarder", unlocked: mods.length >= 25 },
    { id: "legend", unlocked: mods.length >= 50 },
    { id: "mod_machine", unlocked: mods.length >= 100 },
    { id: "first_launch", unlocked: hasLaunched },
    { id: "launcher", unlocked: (data.totalLaunches ?? 0) >= 10 },
    { id: "regular", unlocked: (data.totalLaunches ?? 0) >= 50 },
    { id: "century", unlocked: (data.totalLaunches ?? 0) >= 100 },
    { id: "thousand", unlocked: (data.totalLaunches ?? 0) >= 1000 },
    { id: "time_flies", unlocked: totalPlayMs >= 3_600_000 },
    { id: "dedicated", unlocked: totalPlayMs >= 36_000_000 },
    { id: "obsessed", unlocked: totalPlayMs >= 180_000_000 },
    { id: "engine_master", unlocked: engines.length >= 2 },
    { id: "engine_collector", unlocked: engines.length >= 4 },
    { id: "up_to_date", unlocked: pendingUpdates === 0 && mods.length > 0 },
    { id: "variety_pack", unlocked: uniqueCategories.size >= 5 },
    { id: "category_crusher", unlocked: uniqueCategories.size >= 10 },
    { id: "tagging_along", unlocked: hasTags },
    { id: "note_taker", unlocked: modsWithNotes >= 5 },
    { id: "minimalist", unlocked: mods.length === 1 },
    { id: "maximalist", unlocked: mods.length >= 100 },
    { id: "engine_hopper", unlocked: uniqueEngines.size >= 3 },
    { id: "multitasker", unlocked: uniqueEngines.size >= 3 && mods.length >= 3 },

    // Download achievements
    { id: "downloader", unlocked: totalDownloads >= 5 },
    { id: "download_demon", unlocked: totalDownloads >= 25 },
    { id: "download_deity", unlocked: totalDownloads >= 100 },
    { id: "speed_demon", unlocked: completedDownloads >= 3 },
    { id: "parallel_downloader", unlocked: false }, // Would need real-time tracking
    { id: "patient", unlocked: largestDownloadMB >= 500 },
    { id: "speedy", unlocked: false }, // Would need daily tracking
    { id: "cleaner", unlocked: completedDownloads >= 10 },
    { id: "organizer", unlocked: completedDownloads >= 50 },
    { id: "fresh_start", unlocked: totalDownloads >= 10 },

    // Deep link & integration
    { id: "pair_up", unlocked: (data.deepLinksUsed ?? 0) >= 1 },
    { id: "deep_link_pro", unlocked: (data.deepLinksUsed ?? 0) >= 10 },
    { id: "linked", unlocked: false }, // Would need itch.io tracking

    // Settings & customization
    { id: "tweaker", unlocked: (data.settingsChanged ?? 0) >= 10 },
    { id: "theme_explorer", unlocked: (data.themesTried?.length ?? 0) >= 3 },

    // Usage & consistency
    { id: "getting_started", unlocked: true }, // Onboarding complete
    { id: "week_one", unlocked: (data.currentStreak ?? 0) >= 7 || (data.longestStreak ?? 0) >= 7 },
    { id: "month_user", unlocked: (data.currentStreak ?? 0) >= 30 || (data.longestStreak ?? 0) >= 30 },
    { id: "veteran", unlocked: (data.currentStreak ?? 0) >= 100 || (data.longestStreak ?? 0) >= 100 },
    { id: "old_timer", unlocked: (data.currentStreak ?? 0) >= 365 || (data.longestStreak ?? 0) >= 365 },
    { id: "consistent", unlocked: (data.currentStreak ?? 0) >= 7 },
    { id: "data_nerd", unlocked: false }, // Would need page view tracking

    // Collections
    { id: "curator", unlocked: false }, // Would need collections feature
    { id: "collector_of_collectors", unlocked: false }, // Would need collections feature
  ];
}
