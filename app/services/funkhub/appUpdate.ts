import type { ClientPlatform } from "./platform";
import type { AppUpdateInfo } from "./types";

const RELEASES_LATEST_API = "https://api.github.com/repos/Crew-Awesome/FunkHub/releases/latest";

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface GitHubReleaseResponse {
  tag_name?: string;
  name?: string;
  html_url?: string;
  body?: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

function normalizeVersion(version: string): number[] {
  const cleaned = (version || "").trim().replace(/^v/i, "");
  const parts = cleaned.split(/[^0-9]+/).filter(Boolean).slice(0, 3).map((part) => Number(part));
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a: string, b: string): number {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
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

function pickDownloadAsset(assets: GitHubReleaseAsset[], platform: ClientPlatform): string | undefined {
  if (!Array.isArray(assets) || assets.length === 0) {
    return undefined;
  }

  const find = (predicate: (asset: GitHubReleaseAsset) => boolean) => {
    const match = assets.find(predicate);
    return match?.browser_download_url;
  };

  if (platform === "windows") {
    return find((asset) => /setup.+\.exe$/i.test(asset.name || ""))
      || find((asset) => /\.exe$/i.test(asset.name || ""));
  }

  if (platform === "linux") {
    return find((asset) => /\.appimage$/i.test(asset.name || ""))
      || find((asset) => /\.deb$/i.test(asset.name || ""));
  }

  if (platform === "macos") {
    return find((asset) => /\.dmg$/i.test(asset.name || ""))
      || find((asset) => /mac\.zip$/i.test(asset.name || ""))
      || find((asset) => /\.zip$/i.test(asset.name || ""));
  }

  return undefined;
}

export async function checkLatestAppUpdate(input: {
  currentVersion: string;
  platform: ClientPlatform;
}): Promise<AppUpdateInfo> {
  const response = await fetch(RELEASES_LATEST_API, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Update check failed (${response.status})`);
  }

  const payload = await response.json() as GitHubReleaseResponse;
  const latestVersion = String(payload.tag_name || "").replace(/^v/i, "");
  const currentVersion = String(input.currentVersion || "0.0.0").replace(/^v/i, "");

  if (!latestVersion) {
    throw new Error("Update check returned no release version");
  }

  const available = compareVersions(latestVersion, currentVersion) > 0;

  return {
    available,
    currentVersion,
    latestVersion,
    releaseName: String(payload.name || `FunkHub v${latestVersion}`),
    releaseUrl: String(payload.html_url || "https://github.com/Crew-Awesome/FunkHub/releases/latest"),
    publishedAt: payload.published_at,
    notes: payload.body || "",
    downloadUrl: pickDownloadAsset(payload.assets || [], input.platform),
  };
}
