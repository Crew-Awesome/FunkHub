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

export function computeAchievements(
  mods: InstalledMod[],
  engines: InstalledEngine[],
  pendingUpdates: number,
): Achievement[] {
  const totalPlayMs = computeTotalPlayTime(mods);

  const uniqueCategories = new Set(
    mods.map((m) => m.categoryName).filter(Boolean),
  );

  const hasTags = mods.some((m) => (m.tags?.length ?? 0) > 0);
  const hasLaunched = mods.some((m) => m.lastLaunchedAt != null);

  return [
    { id: "first_steps", unlocked: mods.length >= 1 },
    { id: "collector", unlocked: mods.length >= 10 },
    { id: "hoarder", unlocked: mods.length >= 25 },
    { id: "legend", unlocked: mods.length >= 50 },
    { id: "first_launch", unlocked: hasLaunched },
    { id: "time_flies", unlocked: totalPlayMs >= 3_600_000 },
    { id: "dedicated", unlocked: totalPlayMs >= 36_000_000 },
    { id: "obsessed", unlocked: totalPlayMs >= 180_000_000 },
    { id: "engine_master", unlocked: engines.length >= 2 },
    { id: "up_to_date", unlocked: pendingUpdates === 0 && mods.length > 0 },
    { id: "variety_pack", unlocked: uniqueCategories.size >= 5 },
    { id: "tagging_along", unlocked: hasTags },
  ];
}
