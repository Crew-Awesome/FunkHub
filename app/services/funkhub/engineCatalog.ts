import { gameBananaApiService } from "./gamebananaApi";
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

interface GameBananaEngineSource {
  slug: EngineSlug;
  name: string;
  description: string;
  modId: number;
  fallbackReleases: EngineRelease[];
}

interface GithubWorkflowRun {
  id: number;
  html_url: string;
  run_number: number;
  head_branch?: string;
  status?: string;
  conclusion?: string;
  created_at?: string;
  artifacts_url: string;
}

interface GithubWorkflowRunResponse {
  workflow_runs: GithubWorkflowRun[];
}

interface GithubActionArtifact {
  id: number;
  name: string;
  expired: boolean;
}

interface GithubActionArtifactResponse {
  artifacts: GithubActionArtifact[];
}

interface GithubActionWorkflowSource {
  workflow: string;
  label: string;
  branch?: string;
  maxRuns?: number;
}

interface GithubActionEngineSource {
  slug: EngineSlug;
  name: string;
  description: string;
  repo: string;
  workflows: GithubActionWorkflowSource[];
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
    slug: "fnf-love",
    name: "FNF Löve",
    description: "FNF Löve release builds.",
    repo: "Stilic/FNF-LOVE",
    fallbackVersion: "latest",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/Stilic/FNF-LOVE/releases",
        downloadUrl: "https://github.com/Stilic/FNF-LOVE/releases",
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
  {
    slug: "ale-psych",
    name: "ALE Psych Engine",
    description: "ALE Psych stable and tagged releases.",
    repo: "ALE-Psych-Crew/ALE-Psych",
    fallbackVersion: "latest",
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/releases",
        downloadUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/releases",
      },
    ],
  },
];

const staticOnlyEngines: EngineDefinition[] = [
  {
    slug: "codename",
    name: "Codename Engine",
    description: "Codename Engine nightlies and alternative downloads.",
    releases: [
      {
        platform: "windows",
        version: "nightly",
        sourceUrl: "https://github.com/CodenameCrew/CodenameEngine/actions",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/windows/main/Codename%20Engine.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "codename-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "macos",
        version: "nightly",
        sourceUrl: "https://github.com/CodenameCrew/CodenameEngine/actions",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/macos/main/Codename%20Engine.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "codename-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "linux",
        version: "nightly",
        sourceUrl: "https://github.com/CodenameCrew/CodenameEngine/actions",
        downloadUrl: "https://nightly.link/CodenameCrew/CodenameEngine/workflows/linux/main/Codename%20Engine.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "codename-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://gamebanana.com/mods/598553",
        downloadUrl: "https://gamebanana.com/mods/download/598553",
        channel: "alternative",
        channelLabel: "Alternative",
        sourceKey: "codename-gamebanana",
        sourceLabel: "GameBanana",
        sourceHint: "Community mirrors and file list",
      },
    ],
  },
];

const githubActionEngineSources: GithubActionEngineSource[] = [
  {
    slug: "js-engine",
    name: "JS Engine",
    description: "JS Engine GitHub Actions builds.",
    repo: "JordanSantiagoYT/FNF-JS-Engine",
    workflows: [
      {
        workflow: "main.yml",
        label: "Build",
        branch: "main",
        maxRuns: 3,
      },
    ],
    fallbackReleases: [],
  },
  {
    slug: "psych-online",
    name: "Psych Online",
    description: "Psych Online GitHub Actions builds.",
    repo: "Snirozu/Funkin-Psych-Online",
    workflows: [
      {
        workflow: "main.yml",
        label: "Build",
        branch: "main",
        maxRuns: 3,
      },
    ],
    fallbackReleases: [],
  },
  {
    slug: "ale-psych",
    name: "ALE Psych Engine",
    description: "ALE Psych GitHub Actions builds.",
    repo: "ALE-Psych-Crew/ALE-Psych",
    workflows: [
      {
        workflow: "builds.yaml",
        label: "ALE Psych Builds",
        branch: "main",
        maxRuns: 3,
      },
    ],
    fallbackReleases: [
      {
        platform: "windows",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Windows%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "windows",
        version: "nightly-x32",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Windows%20x32%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "linux",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Linux%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "macos",
        version: "nightly",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/MacOS%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "macos",
        version: "nightly-x64",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/MacOS%20x64%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
      {
        platform: "any",
        version: "nightly-android",
        sourceUrl: "https://github.com/ALE-Psych-Crew/ALE-Psych/actions/workflows/builds.yaml",
        downloadUrl: "https://nightly.link/ALE-Psych-Crew/ALE-Psych/workflows/builds.yaml/main/Android%20Build.zip",
        channel: "nightly",
        channelLabel: "Nightly",
        sourceKey: "ale-psych-nightly",
        sourceLabel: "GitHub Actions",
        sourceHint: "Delivered by nightly.link",
      },
    ],
  },
];

const gameBananaEngineSources: GameBananaEngineSource[] = [
  {
    slug: "codename",
    name: "Codename Engine",
    description: "Codename Engine GameBanana files.",
    modId: 598553,
    fallbackReleases: [
      {
        platform: "any",
        version: "latest",
        sourceUrl: "https://gamebanana.com/mods/598553",
        downloadUrl: "https://gamebanana.com/mods/download/598553",
        channel: "alternative",
        channelLabel: "Alternative",
        sourceKey: "codename-gamebanana",
        sourceLabel: "GameBanana",
        sourceHint: "Community mirrors and file list",
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

function mergeEngineDefinitions(definitions: EngineDefinition[]): EngineDefinition[] {
  const merged = new Map<EngineSlug, EngineDefinition>();

  for (const definition of definitions) {
    const current = merged.get(definition.slug);
    if (!current) {
      merged.set(definition.slug, {
        ...definition,
        releases: dedupeReleases(definition.releases),
      });
      continue;
    }

    current.releases = dedupeReleases([...current.releases, ...definition.releases]);
    if (!current.description && definition.description) {
      current.description = definition.description;
    }
  }

  return Array.from(merged.values());
}

function detectPlatformFromAsset(name: string): EngineRelease["platform"] {
  const lowered = name.toLowerCase();

  if (lowered.includes("windowsbuild") || lowered.includes("windows build")) {
    return "windows";
  }
  if (lowered.includes("linuxbuild") || lowered.includes("linux build")) {
    return "linux";
  }
  if (lowered.includes("macbuild") || lowered.includes("mac build") || lowered.includes("macos build")) {
    return "macos";
  }

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

function formatActionRunVersion(input: { createdAt?: string; runNumber: number }): string {
  const timestamp = input.createdAt ? Date.parse(input.createdAt) : NaN;
  const dateLabel = Number.isNaN(timestamp)
    ? "Workflow Run"
    : new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));

  return `${dateLabel} · Run ${input.runNumber}`;
}

function buildNightlyRunDownloadUrl(repo: string, runId: number, artifactName: string): string {
  return `https://nightly.link/${repo}/actions/runs/${runId}/${encodeURIComponent(artifactName)}.zip`;
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

async function fetchGameBananaReleases(source: GameBananaEngineSource): Promise<EngineDefinition> {
  try {
    const files = await gameBananaApiService.getModFiles(source.modId);
    const releases = files.map((file) => ({
      platform: detectPlatformFromAsset(file.fileName),
      version: "latest",
      sourceUrl: `https://gamebanana.com/mods/${source.modId}`,
      downloadUrl: file.downloadUrl || `https://gamebanana.com/dl/${file.id}`,
      fileName: file.fileName,
      channel: "alternative",
      channelLabel: "Alternative",
      sourceKey: `${source.slug}-gamebanana`,
      sourceLabel: "GameBanana",
      sourceHint: "Community mirrors and file list",
      publishedAt: file.dateAdded ? new Date(file.dateAdded * 1000).toISOString() : undefined,
    } satisfies EngineRelease));

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

async function fetchGithubActionReleases(source: GithubActionEngineSource): Promise<EngineDefinition> {
  try {
    const releases = await Promise.all(source.workflows.map(async (workflow) => {
      const params = new URLSearchParams({
        per_page: String(workflow.maxRuns ?? 3),
        status: "completed",
      });
      const response = await fetch(`https://api.github.com/repos/${source.repo}/actions/workflows/${encodeURIComponent(workflow.workflow)}/runs?${params.toString()}`, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub workflow runs fetch failed for ${source.repo}/${workflow.workflow}`);
      }

      const payload = await response.json() as GithubWorkflowRunResponse;
      const runs = Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];
      const successfulRuns = runs.filter((run) => {
        if (run.status !== "completed" || run.conclusion !== "success") {
          return false;
        }
        if (workflow.branch && run.head_branch !== workflow.branch) {
          return false;
        }
        return true;
      });

      return Promise.all(successfulRuns.map(async (run) => {
        const artifactsResponse = await fetch(run.artifacts_url, {
          headers: {
            Accept: "application/vnd.github+json",
          },
        });

        if (!artifactsResponse.ok) {
          throw new Error(`GitHub artifacts fetch failed for run ${run.id}`);
        }

        const artifactsPayload = await artifactsResponse.json() as GithubActionArtifactResponse;
        const artifacts = Array.isArray(artifactsPayload.artifacts) ? artifactsPayload.artifacts : [];

        return artifacts
          .filter((artifact) => !artifact.expired && artifact.name)
          .map((artifact) => ({
            platform: detectPlatformFromAsset(artifact.name),
            version: formatActionRunVersion({ createdAt: run.created_at, runNumber: run.run_number }),
            sourceUrl: run.html_url,
            downloadUrl: buildNightlyRunDownloadUrl(source.repo, run.id, artifact.name),
            fileName: artifact.name,
            channel: "nightly",
            channelLabel: "Nightly",
            sourceKey: `${source.slug}-actions`,
            sourceLabel: "GitHub Actions",
            sourceHint: workflow.label,
            publishedAt: run.created_at,
          } satisfies EngineRelease));
      }));
    }));

    const flattened = releases.flat(2);
    return {
      slug: source.slug,
      name: source.name,
      description: source.description,
      releases: dedupeReleases(flattened.length > 0 ? flattened : source.fallbackReleases),
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
    const githubActionEngines = await Promise.all(githubActionEngineSources.map((source) => fetchGithubActionReleases(source)));
    const gameBananaEngines = await Promise.all(gameBananaEngineSources.map((source) => fetchGameBananaReleases(source)));
    const all = mergeEngineDefinitions([...githubEngines, ...githubActionEngines, ...gameBananaEngines, ...staticOnlyEngines.map((engine) => ({
      ...engine,
      releases: dedupeReleases(engine.releases),
    }))]);
    return all.sort((a, b) => {
      if (a.slug === "ale-psych") return -1;
      if (b.slug === "ale-psych") return 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const engineCatalogService = new EngineCatalogService();
