import type { EngineRelease } from "./types";

export type ClientPlatform = EngineRelease["platform"] | "unknown";

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
