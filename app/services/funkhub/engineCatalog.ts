import { EngineDefinition, EngineRelease, EngineSlug } from "./types";

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubReleaseResponse {
  tag_name: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  published_at?: string;
  assets: GithubReleaseAsset[];
}

interface GithubEngineSource {
  slug: EngineSlug;
  name: string;
  description: string;
  repo: string;
  fallbackVersion: string;
  fallbackReleases: EngineRelease[];
}

const githubEngineSources: GithubEngineSource[] = [
  {
    slug: "fps-plus",
    name: "FPS Plus",
    description: "FPS Plus engine builds and releases.",
    repo: "ThatRozebudDude/FPS-Plus-Public",
    fallbackVersion: "latest",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/ThatRozebudDude/FPS-Plus-Public/releases",
        downloadUrl: "https://github.com/ThatRozebudDude/FPS-Plus-Public/releases",
      },
    ],
  },
  {
    slug: "js-engine",
    name: "JS Engine",
    description: "FNF-JS-Engine release feed.",
    repo: "JordanSantiagoYT/FNF-JS-Engine",
    fallbackVersion: "unknown",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/JordanSantiagoYT/FNF-JS-Engine/releases",
        downloadUrl: "https://github.com/JordanSantiagoYT/FNF-JS-Engine/releases",
      },
    ],
  },
  {
    slug: "p-slice",
    name: "P-Slice Engine",
    description: "Psych Slice release feed.",
    repo: "Psych-Slice/P-Slice",
    fallbackVersion: "unknown",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/Psych-Slice/P-Slice/releases",
        downloadUrl: "https://github.com/Psych-Slice/P-Slice/releases",
      },
    ],
  },
  {
    slug: "codename",
    name: "Codename Engine",
    description: "Codename Engine official release feed.",
    repo: "CodenameCrew/CodenameEngine",
    fallbackVersion: "latest",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/CodenameCrew/CodenameEngine/releases",
        downloadUrl: "https://github.com/CodenameCrew/CodenameEngine/releases",
      },
    ],
  },
  {
    slug: "basegame",
    name: "Funkin Base Game",
    description: "Official FunkinCrew base game releases.",
    repo: "FunkinCrew/Funkin",
    fallbackVersion: "unknown",
    fallbackReleases: [
      {
        platform: "windows",
        version: "0.8.3",
        sourceUrl: "https://ninja-muffin24.itch.io/funkin",
        downloadUrl: "itch://funkin/basegame/windows",
      },
      {
        platform: "linux",
        version: "0.8.3",
        sourceUrl: "https://ninja-muffin24.itch.io/funkin",
        downloadUrl: "itch://funkin/basegame/linux",
      },
      {
        platform: "macos",
        version: "0.8.3",
        sourceUrl: "https://ninja-muffin24.itch.io/funkin",
        downloadUrl: "itch://funkin/basegame/macos",
      },
    ],
  },
  {
    slug: "psych",
    name: "Psych Engine",
    description: "ShadowMario Psych Engine releases.",
    repo: "ShadowMario/FNF-PsychEngine",
    fallbackVersion: "unknown",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/ShadowMario/FNF-PsychEngine/releases",
        downloadUrl: "https://github.com/ShadowMario/FNF-PsychEngine/releases",
      },
    ],
  },
  {
    slug: "psych-online",
    name: "Psych Online",
    description: "Funkin Psych Online engine releases.",
    repo: "Snirozu/Funkin-Psych-Online",
    fallbackVersion: "unknown",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/Snirozu/Funkin-Psych-Online/releases",
        downloadUrl: "https://github.com/Snirozu/Funkin-Psych-Online/releases",
      },
    ],
  },
];

const staticOnlyEngines: EngineDefinition[] = [
  {
    slug: "ale-psych",
    name: "ALE Psych Engine",
    description: "ALE Psych nightly workflow artifacts.",
    releases: [
      {
        platform: "windows",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Windows%20Build.zip",
      },
      {
        platform: "windows",
        version: "nightly-x32",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Windows%20x32%20Build.zip",
      },
      {
        platform: "linux",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Linux%20Build.zip",
      },
      {
        platform: "macos",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/MacOS%20Build.zip",
      },
      {
        platform: "macos",
        version: "nightly-x64",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/MacOS%20x64%20Build.zip",
      },
      {
        platform: "any",
        version: "nightly-android",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Android%20Build.zip",
      },
    ],
  },
];

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function detectSourceMetadata(release: Pick<EngineRelease, "sourceUrl" | "downloadUrl" | "sourceKey" | "sourceLabel" | "sourceHint">) {
  if (release.sourceKey && release.sourceLabel) {
    return {
      key: release.sourceKey,
      label: release.sourceLabel,
      hint: release.sourceHint,
    };
  }

  const combined = `${release.sourceUrl} ${release.downloadUrl}`.toLowerCase();
  if (combined.includes("nightly.link")) {
    return { key: "nightly-link", label: "nightly.link", hint: "Workflow artifact mirror" };
  }
  if (combined.includes("/actions/") || combined.includes("actions/workflows")) {
    return { key: "github-actions", label: "GitHub Actions", hint: "Workflow artifacts" };
  }
  if (combined.includes("github.com")) {
    return { key: "github-releases", label: "GitHub Releases", hint: "Official release feed" };
  }
  if (combined.includes("gamebanana.com")) {
    return { key: "gamebanana", label: "GameBanana", hint: "Community portal" };
  }
  if (combined.includes("itch.io") || release.downloadUrl.startsWith("itch://")) {
    return { key: "itch", label: "itch.io", hint: "Store portal" };
  }
  return { key: "direct", label: "Direct Download", hint: undefined };
}

function detectChannelMetadata(release: Pick<EngineRelease, "version" | "isPrerelease" | "channel" | "channelLabel" | "downloadUrl" | "sourceUrl" | "sourceKey" | "sourceLabel" | "sourceHint">) {
  if (release.channel && release.channelLabel) {
    return {
      key: slugify(release.channel),
      label: release.channelLabel,
    };
  }

  const version = String(release.version || "").toLowerCase();
  const source = detectSourceMetadata(release);

  if (version.includes("nightly")) {
    return { key: "nightly", label: "Nightly" };
  }
  if (release.isPrerelease) {
    return { key: "prerelease", label: "Pre-release" };
  }
  if (source.key === "gamebanana") {
    return { key: "alternative", label: "Alternative" };
  }
  return { key: "stable", label: "Stable" };
}

function decodeAssetName(raw?: string): string {
  if (!raw) {
    return "";
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function detectPackageMetadata(release: Pick<EngineRelease, "platform" | "fileName" | "downloadUrl" | "packageLabel" | "packageHint">) {
  if (release.packageLabel) {
    return {
      label: release.packageLabel,
      hint: release.packageHint,
    };
  }

  const fileName = decodeAssetName(release.fileName || release.downloadUrl.split("?")[0].split("/").pop());
  const lowered = `${fileName} ${release.downloadUrl}`.toLowerCase();

  const platformLabel = lowered.includes("android")
    ? "Android"
    : release.platform === "windows"
      ? "Windows"
      : release.platform === "macos"
        ? "macOS"
        : release.platform === "linux"
          ? "Linux"
          : "Universal";

  let architecture = "";
  if (/arm64|aarch64/.test(lowered)) {
    architecture = "ARM64";
  } else if (/x32|win32|32-bit|x86(?!_64)/.test(lowered)) {
    architecture = "32-bit";
  } else if (/x64|64-bit|intel/.test(lowered)) {
    architecture = platformLabel === "macOS" ? "Intel" : "64-bit";
  }

  return {
    label: architecture ? `${platformLabel} (${architecture})` : platformLabel,
    hint: fileName || undefined,
  };
}

function enrichRelease(release: EngineRelease): EngineRelease {
  const source = detectSourceMetadata(release);
  const channel = detectChannelMetadata({ ...release, ...source });
  const packageMeta = detectPackageMetadata(release);

  return {
    ...release,
    channel: release.channel || channel.key,
    channelLabel: release.channelLabel || channel.label,
    sourceKey: release.sourceKey || source.key,
    sourceLabel: release.sourceLabel || source.label,
    sourceHint: release.sourceHint || source.hint,
    packageLabel: release.packageLabel || packageMeta.label,
    packageHint: release.packageHint || packageMeta.hint,
  };
}

function dedupeReleases(releases: EngineRelease[]): EngineRelease[] {
  const deduped = new Map<string, EngineRelease>();
  for (const release of releases.map(enrichRelease)) {
    const key = `${release.platform}|${release.version}|${release.downloadUrl}`;
    if (!deduped.has(key)) {
      deduped.set(key, release);
    }
  }
  return Array.from(deduped.values());
}

function detectPlatformFromAsset(name: string): EngineRelease["platform"] {
  const lowered = name.toLowerCase();

  const hasToken = (tokens: string[]) => {
    return tokens.some((token) => new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`).test(lowered));
  };

  if (hasToken(["windows", "win32", "win64", "win"])) {
    return "windows";
  }
  if (hasToken(["linux", "appimage"])) {
    return "linux";
  }
  if (hasToken(["macos", "mac", "osx", "darwin"])) {
    return "macos";
  }
  return "any";
}

function normalizeVersionTag(tag: string, prerelease: boolean): string {
  const cleaned = tag.replace(/^v/i, "") || "latest";
  return prerelease ? `${cleaned}-pre` : cleaned;
}

async function fetchGithubReleases(source: GithubEngineSource): Promise<EngineDefinition> {
  try {
    const response = await fetch(`https://api.github.com/repos/${source.repo}/releases?per_page=25`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub release fetch failed for ${source.repo}`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error(`Unexpected GitHub releases payload for ${source.repo}`);
    }
    const publishedReleases = payload
      .filter((release) => !release.draft)
      .sort((a, b) => {
        const at = a.published_at ? Date.parse(a.published_at) : 0;
        const bt = b.published_at ? Date.parse(b.published_at) : 0;
        return bt - at;
      });

    const releases: EngineRelease[] = [];
    for (const release of publishedReleases) {
      const assets = Array.isArray(release.assets) ? release.assets : [];
      for (const asset of assets) {
        if (!asset?.name || !asset?.browser_download_url) {
          continue;
        }
        releases.push({
          platform: detectPlatformFromAsset(asset.name),
          version: normalizeVersionTag(release.tag_name || source.fallbackVersion, release.prerelease),
          downloadUrl: asset.browser_download_url,
          sourceUrl: release.html_url,
          fileName: asset.name,
          isPrerelease: release.prerelease,
          publishedAt: release.published_at,
        });
      }
    }

    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases: dedupeReleases(releases.length > 0 ? releases : source.fallbackReleases),
    };
  } catch {
    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases: dedupeReleases(source.fallbackReleases),
    };
  }
}

export class EngineCatalogService {
  async getEngineCatalog(): Promise<EngineDefinition[]> {
    const githubEngines = await Promise.all(githubEngineSources.map((source) => fetchGithubReleases(source)));
    const all = [...githubEngines, ...staticOnlyEngines];
    return all.sort((a, b) => {
      if (a.slug === "ale-psych") return -1;
      if (b.slug === "ale-psych") return 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const engineCatalogService = new EngineCatalogService();
