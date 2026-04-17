import type { EngineDefinition, EngineRelease } from "../../services/funkhub";
import type { ClientPlatform } from "../../services/funkhub/platform";

export interface EngineInstallPackage extends EngineRelease {
  channelKey: string;
  channelLabel: string;
  sourceKey: string;
  sourceLabel: string;
  sourceHint?: string;
  packageKey: string;
  packageLabel: string;
  packageHint?: string;
  releaseKey: string;
  releaseTitle: string;
  releaseDescription: string;
  priority: number;
}

export interface EngineInstallReleaseOption {
  key: string;
  title: string;
  badge: string;
  description: string;
  sourceCount: number;
  packageCount: number;
  packages: EngineInstallPackage[];
  priority: number;
}

export interface EngineInstallSourceOption {
  key: string;
  label: string;
  hint?: string;
  description: string;
  packageCount: number;
  packages: EngineInstallPackage[];
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeReleaseVersion(version: string, channelKey: string): string {
  const trimmed = String(version || "latest").trim();
  if (channelKey === "nightly" && /^nightly([-.].+)?$/i.test(trimmed)) {
    return "nightly";
  }
  if (/^(latest|unknown)$/i.test(trimmed)) {
    return "latest";
  }
  return trimmed;
}

function formatVersionLabel(version: string): string {
  const trimmed = version.trim();
  if (!trimmed || trimmed === "latest") {
    return "Latest";
  }
  if (trimmed === "nightly") {
    return "Latest nightly";
  }
  return /^[0-9]/.test(trimmed) ? `v${trimmed}` : trimmed;
}

function compareVersionsDescending(left: string, right: string): number {
  return right.localeCompare(left, undefined, { numeric: true, sensitivity: "base" });
}

function packagePlatformScore(pkg: Pick<EngineInstallPackage, "platform">, currentPlatform: ClientPlatform): number {
  if (pkg.platform === currentPlatform) {
    return 0;
  }
  if (pkg.platform === "any") {
    return 1;
  }
  return 2;
}

function releaseChannelPriority(channelKey: string): number {
  if (channelKey === "stable") return 0;
  if (channelKey === "prerelease") return 1;
  if (channelKey === "nightly") return 2;
  if (channelKey === "alternative") return 3;
  return 4;
}

export function buildEngineInstallPackages(engine: EngineDefinition | null, currentPlatform: ClientPlatform): EngineInstallPackage[] {
  if (!engine) {
    return [];
  }

  return engine.releases
    .map((release) => {
      const channelKey = release.channel || (release.isPrerelease ? "prerelease" : "stable");
      const channelLabel = release.channelLabel || (channelKey === "prerelease" ? "Pre-release" : "Stable");
      const sourceKey = release.sourceKey || release.sourceLabel?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "direct";
      const sourceLabel = release.sourceLabel || "Direct Download";
      const sourceHint = release.sourceHint;
      const packageLabel = release.packageLabel || "Package";
      const packageHint = release.packageHint;
      const normalizedVersion = normalizeReleaseVersion(release.version, channelKey);
      const releaseTitle = channelKey === "nightly" && normalizedVersion === "nightly"
        ? channelLabel
        : formatVersionLabel(normalizedVersion);
      const releaseKey = `${channelKey}|${normalizedVersion}`;
      const packageKey = `${releaseKey}|${sourceKey}|${release.downloadUrl}`;
      const sourceList = dedupe(engine.releases.filter((entry) => (entry.channel || (entry.isPrerelease ? "prerelease" : "stable")) === channelKey).map((entry) => entry.sourceLabel || sourceLabel));
      const releaseDescription = sourceList.length > 1
        ? `${channelLabel} · ${sourceList.length} sources`
        : channelLabel;

      return {
        ...release,
        channelKey,
        channelLabel,
        sourceKey,
        sourceLabel,
        sourceHint,
        packageKey,
        packageLabel,
        packageHint,
        releaseKey,
        releaseTitle,
        releaseDescription,
        priority: packagePlatformScore({ platform: release.platform }, currentPlatform),
      } satisfies EngineInstallPackage;
    })
    .sort((left, right) => {
      const priorityDiff = left.priority - right.priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      const channelDiff = releaseChannelPriority(left.channelKey) - releaseChannelPriority(right.channelKey);
      if (channelDiff !== 0) {
        return channelDiff;
      }
      const versionDiff = compareVersionsDescending(left.version, right.version);
      if (versionDiff !== 0) {
        return versionDiff;
      }
      return left.packageLabel.localeCompare(right.packageLabel);
    });
}

export function buildReleaseOptions(packages: EngineInstallPackage[]): EngineInstallReleaseOption[] {
  const grouped = new Map<string, EngineInstallReleaseOption>();

  for (const pkg of packages) {
    const current = grouped.get(pkg.releaseKey);
    if (current) {
      current.packages.push(pkg);
      current.packageCount += 1;
      current.sourceCount = dedupe(current.packages.map((entry) => entry.sourceKey)).length;
      current.description = current.sourceCount > 1
        ? `${pkg.channelLabel} · ${current.sourceCount} sources`
        : pkg.channelLabel;
      continue;
    }

    grouped.set(pkg.releaseKey, {
      key: pkg.releaseKey,
      title: pkg.releaseTitle,
      badge: pkg.channelLabel,
      description: pkg.releaseDescription,
      sourceCount: 1,
      packageCount: 1,
      packages: [pkg],
      priority: pkg.priority,
    });
  }

  return Array.from(grouped.values()).sort((left, right) => {
    const priorityDiff = left.priority - right.priority;
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    const channelDiff = releaseChannelPriority(left.packages[0].channelKey) - releaseChannelPriority(right.packages[0].channelKey);
    if (channelDiff !== 0) {
      return channelDiff;
    }
    return compareVersionsDescending(left.packages[0].version, right.packages[0].version);
  });
}

export function buildSourceOptions(packages: EngineInstallPackage[], releaseKey: string | null): EngineInstallSourceOption[] {
  if (!releaseKey) {
    return [];
  }

  const filtered = packages.filter((pkg) => pkg.releaseKey === releaseKey);
  const grouped = new Map<string, EngineInstallSourceOption>();

  for (const pkg of filtered) {
    const current = grouped.get(pkg.sourceKey);
    if (current) {
      current.packages.push(pkg);
      current.packageCount += 1;
      current.description = `${current.packageCount} packages`;
      continue;
    }

    grouped.set(pkg.sourceKey, {
      key: pkg.sourceKey,
      label: pkg.sourceLabel,
      hint: pkg.sourceHint,
      description: "1 package",
      packageCount: 1,
      packages: [pkg],
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.label.localeCompare(right.label));
}

export function buildPackageOptions(packages: EngineInstallPackage[], releaseKey: string | null, sourceKey: string | null): EngineInstallPackage[] {
  if (!releaseKey) {
    return [];
  }

  return packages.filter((pkg) => pkg.releaseKey === releaseKey && (!sourceKey || pkg.sourceKey === sourceKey));
}

export function getPrimaryEnginePackage(engine: EngineDefinition, currentPlatform: ClientPlatform): EngineInstallPackage | undefined {
  return buildEngineInstallPackages(engine, currentPlatform)[0];
}
