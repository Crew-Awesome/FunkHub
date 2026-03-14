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
];

const staticOnlyEngines: EngineDefinition[] = [
  {
    slug: "codename",
    name: "Codename Engine",
    description: "Nightly link build artifacts.",
    releases: [
      {
        platform: "windows",
        version: "nightly",
        sourceUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/windows/main/Codename%20Engine.zip",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/windows/main/Codename%20Engine.zip",
      },
      {
        platform: "macos",
        version: "nightly",
        sourceUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/macos/main/Codename%20Engine.zip",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/macos/main/Codename%20Engine.zip",
      },
      {
        platform: "linux",
        version: "nightly",
        sourceUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/linux/main/Codename%20Engine.zip",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/linux/main/Codename%20Engine.zip",
      },
    ],
  },
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

function detectPlatformFromAsset(name: string): EngineRelease["platform"] {
  const lowered = name.toLowerCase();
  if (lowered.includes("win")) {
    return "windows";
  }
  if (lowered.includes("mac") || lowered.includes("osx")) {
    return "macos";
  }
  if (lowered.includes("linux")) {
    return "linux";
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

    const payload = (await response.json()) as GithubReleaseResponse[];
    const publishedReleases = payload
      .filter((release) => !release.draft)
      .sort((a, b) => {
        const at = a.published_at ? Date.parse(a.published_at) : 0;
        const bt = b.published_at ? Date.parse(b.published_at) : 0;
        return bt - at;
      });

    const releases: EngineRelease[] = [];
    for (const release of publishedReleases) {
      for (const asset of release.assets) {
        releases.push({
          platform: detectPlatformFromAsset(asset.name),
          version: normalizeVersionTag(release.tag_name || source.fallbackVersion, release.prerelease),
          downloadUrl: asset.browser_download_url,
          sourceUrl: release.html_url,
          fileName: asset.name,
          isPrerelease: release.prerelease,
        });
      }
    }

    const normalized = releases.length > 0 ? releases : source.fallbackReleases;
    const deduped = new Map<string, EngineRelease>();
    for (const release of normalized) {
      const key = `${release.platform}|${release.version}|${release.downloadUrl}`;
      if (!deduped.has(key)) {
        deduped.set(key, release);
      }
    }

    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases: Array.from(deduped.values()),
    };
  } catch {
    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases: source.fallbackReleases,
    };
  }
}

export class EngineCatalogService {
  async getEngineCatalog(): Promise<EngineDefinition[]> {
    const githubEngines = await Promise.all(githubEngineSources.map((source) => fetchGithubReleases(source)));
    return [...githubEngines, ...staticOnlyEngines];
  }
}

export const engineCatalogService = new EngineCatalogService();
