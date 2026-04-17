import type { EngineRelease } from "./types";

export type ClientPlatform = EngineRelease["platform"] | "unknown";

// Platform-specific default paths for the app (FunkHub folder locations)
// These are used as defaults in the onboarding setup
export function getPlatformDefaults(platform: ClientPlatform): {
  dataRoot: string;
  downloads: string;
  game: string;
} {
  // All in one Documents/FunkHub folder - cleaner organization
  const base = platform === "windows"
    ? "C:\\Users\\%username%\\Documents\\FunkHub"
    : platform === "macos"
      ? "~/Documents/FunkHub"
      : platform === "linux"
        ? "~/Documents/FunkHub"
        : "~/Documents/FunkHub";

  // Downloads and game folder under the same FunkHub folder
  const downloads = platform === "windows"
    ? "C:\\Users\\%username%\\Documents\\FunkHub\\downloads"
    : platform === "macos"
      ? "~/Documents/FunkHub/downloads"
      : platform === "linux"
        ? "~/Documents/FunkHub/downloads"
        : "~/Documents/FunkHub/downloads";

  const game = platform === "windows"
    ? "C:\\Users\\%username%\\Documents\\FunkHub\\game"
    : platform === "macos"
      ? "~/Documents/FunkHub/game"
      : platform === "linux"
        ? "~/Documents/FunkHub/game"
        : "~/Documents/FunkHub/game";

  return {
    dataRoot: base,
    downloads,
    game,
  };
}

export function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const platform = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();

  if (platform.includes("win")) {
    return "windows";
  }

  if (platform.includes("linux") || platform.includes("x11")) {
    return "linux";
  }

  if (platform.includes("mac") || platform.includes("darwin")) {
    return "macos";
  }

  return "unknown";
}

export function pickBestReleaseForPlatform(
  releases: EngineRelease[],
  platform: ClientPlatform,
): EngineRelease | undefined {
  if (releases.length === 0) {
    return undefined;
  }

  if (platform !== "unknown") {
    const exact = releases.find((release) => release.platform === platform);
    if (exact) {
      return exact;
    }
  }

  const any = releases.find((release) => release.platform === "any");
  if (any) {
    return any;
  }

  return releases[0];
}
