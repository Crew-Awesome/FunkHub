import { EngineDefinition, EngineRelease, EngineSlug } from "./types";

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubReleaseResponse {
  tag_name: string;
  html_url: string;
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
    fallbackVersion: "unknown",
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
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/FunkinCrew/Funkin/releases",
        downloadUrl: "https://github.com/FunkinCrew/Funkin/releases",
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
    description: "ALE Psych CI workflow page.",
    releases: [
      {
        platform: "any",
        version: "workflow",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions",
        downloadUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions",
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

async function fetchGithubLatest(source: GithubEngineSource): Promise<EngineDefinition> {
  try {
    const response = await fetch(`https://api.github.com/repos/${source.repo}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub release fetch failed for ${source.repo}`);
    }

    const payload = (await response.json()) as GithubReleaseResponse;
    const releases: EngineRelease[] = payload.assets.length
      ? payload.assets.map((asset) => ({
          platform: detectPlatformFromAsset(asset.name),
          version: payload.tag_name || source.fallbackVersion,
          downloadUrl: asset.browser_download_url,
          sourceUrl: payload.html_url,
        }))
      : source.fallbackReleases;

    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases,
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
    const githubEngines = await Promise.all(githubEngineSources.map((source) => fetchGithubLatest(source)));
    return [...githubEngines, ...staticOnlyEngines];
  }
}

export const engineCatalogService = new EngineCatalogService();
