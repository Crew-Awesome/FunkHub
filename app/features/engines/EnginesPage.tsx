import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Plus, Cpu, Loader2, AlertCircle, Download, ImagePlus, Search, ArrowLeft } from "lucide-react";
import { EngineCard } from "./EngineCard";
import { getEngineIcon } from "./engineIcons";
import { useFunkHub, useI18n } from "../../providers";
import { detectClientPlatform, pickBestReleaseForPlatform, formatEngineName, type EngineSlug } from "../../services/funkhub";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";
import { useEngineWizard } from "./useEngineWizard";
import { useEngineManage } from "./useEngineManage";

export function Engines() {
  const { t } = useI18n();
  const {
    installedEngines,
    enginesCatalog,
    downloads,
    settings,
    updateSettings,
    setDefaultEngine,
    installEngine,
    importEngineFromFolder,
    updateEngine,
    uninstallEngine,
    launchEngine,
    openEngineFolder,
    openEngineModsFolder,
    getEngineHealth,
    refreshEngineHealth,
    browseFolder,
    browseFile,
    renameEngine,
    setEngineCustomIcon,
    runningLaunchIds,
    killLaunch,
    detectWineRuntimes,
    scanCommonEnginePaths,
  } = useFunkHub();
  const wizard = useEngineWizard();
  const {
    installingSlug, setInstallingSlug,
    installError, setInstallError,
    scannedPaths, setScannedPaths,
    scanningPaths, setScanningPaths,
    platformWarning, setPlatformWarning,
    resetWizard,
  } = wizard;

  const manage = useEngineManage();
  const {
    manageEngineId, setManageEngineId,
    manageLauncher, setManageLauncher,
    manageLauncherPath, setManageLauncherPath,
    manageExecutablePath, setManageExecutablePath,
    manageCustomName, setManageCustomName,
    manageCustomIconUrl, setManageCustomIconUrl,
    detectedRuntimes, setDetectedRuntimes,
    openManage,
    closeManage,
  } = manage;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyEngineId, setBusyEngineId] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<{ id: string; name: string; version: string; path: string } | null>(null);
  const [wizardQuery, setWizardQuery] = useState("");
  const [selectedEngineSlug, setSelectedEngineSlug] = useState<EngineSlug | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedReleaseType, setSelectedReleaseType] = useState<"all" | "release" | "prerelease" | "nightly">("all");
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState<string>("all");
  const deferredWizardQuery = useDeferredValue(wizardQuery);

  useEffect(() => {
    refreshEngineHealth().catch((error) => {
      console.warn("[Engines] Initial health check failed:", error instanceof Error ? error.message : error);
    });
  }, []);

  const availableEngines = enginesCatalog;
  const hasEngines = installedEngines.length > 0;
  const currentPlatform = detectClientPlatform();
  const normalizedWizardQuery = deferredWizardQuery.trim().toLowerCase();
  const engineDownloads = downloads
    .filter((task) => task.modId === -1)
    .filter((task) => ["queued", "downloading", "installing", "failed"].includes(task.status));

  const getLaunchOverride = (engineId: string) => settings.engineLaunchOverrides[engineId] ?? { launcher: "native" as const };

  // Group installed engines by slug
  const engineGroups = useMemo(() => {
    const map = new Map<string, typeof installedEngines>();
    for (const engine of installedEngines) {
      const list = map.get(engine.slug) ?? [];
      list.push(engine);
      map.set(engine.slug, list);
    }
    return Array.from(map.entries());
  }, [installedEngines]);

  const showGroupHeaders = engineGroups.length > 1 || (engineGroups[0]?.[1].length ?? 0) > 1;

  const installedCountBySlug = useMemo(() => {
    const counts = new Map<EngineSlug, number>();
    for (const engine of installedEngines) {
      counts.set(engine.slug, (counts.get(engine.slug) ?? 0) + 1);
    }
    return counts;
  }, [installedEngines]);

  const filteredAvailableEngines = useMemo(() => {
    if (!normalizedWizardQuery) return availableEngines;
    return availableEngines.filter((engine) => {
      const haystack = `${engine.name} ${engine.slug} ${engine.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedWizardQuery);
    });
  }, [availableEngines, normalizedWizardQuery]);

  const installSelectedEngine = async (
    engineSlug: EngineSlug,
    releaseUrl: string,
    releaseVersion: string,
    options?: { allowMissingExecutable?: boolean },
  ) => {
    setInstallError(null);
    setPlatformWarning(null);
    setInstallingSlug(engineSlug);
    try {
      await installEngine(engineSlug, releaseUrl, releaseVersion, options);
      await refreshEngineHealth();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("engines.installFailed", "Engine install failed");
      if (/launchable executable for this platform/i.test(message) && !options?.allowMissingExecutable) {
        setPlatformWarning({ slug: engineSlug, releaseUrl, releaseVersion, message });
      } else {
        setInstallError(message);
      }
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleLaunch = async (engineId: string) => {
    setActionError(null);
    try {
      const override = getLaunchOverride(engineId);
      await launchEngine(engineId, {
        launcher: currentPlatform === "linux" ? override.launcher : "native",
        launcherPath: currentPlatform === "linux" ? override.launcherPath : undefined,
        executablePath: override.executablePath,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("engines.launchFailed", "Failed to launch engine"));
    }
  };

  const handleManage = (engineId: string) => {
    const override = getLaunchOverride(engineId);
    const engine = installedEngines.find((entry) => entry.id === engineId);
    openManage({
      engineId,
      launcher: override.launcher,
      launcherPath: override.launcherPath,
      executablePath: override.executablePath,
      customName: engine?.customName,
      customIconUrl: engine?.customIconUrl,
    });
  };

  const handleUpdate = async (engineId: string) => {
    setActionError(null);
    setBusyEngineId(engineId);
    try {
      await updateEngine(engineId);
      await refreshEngineHealth();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("engines.updateFailed", "Failed to update engine"));
    } finally {
      setBusyEngineId(null);
    }
  };

  const handleUninstall = async (engineId: string) => {
    setActionError(null);
    setBusyEngineId(engineId);
    try {
      await uninstallEngine(engineId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("engines.uninstallFailed", "Failed to uninstall engine"));
    } finally {
      setBusyEngineId(null);
    }
  };

  const handleImport = async (slug: EngineSlug) => {
    setInstallError(null);
    setInstallingSlug(slug);
    try {
      await importEngineFromFolder(slug, "imported");
      await refreshEngineHealth();
      setShowAddDialog(false);
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : t("engines.importFailed", "Engine import failed"));
    } finally {
      setInstallingSlug(null);
    }
  };

  const saveManageOverrides = async () => {
    if (!manageEngineId) return;
    await updateSettings({
      engineLaunchOverrides: {
        ...settings.engineLaunchOverrides,
        [manageEngineId]: {
          launcher: manageLauncher,
          launcherPath: manageLauncherPath.trim() || undefined,
          executablePath: manageExecutablePath.trim() || undefined,
        },
      },
    });
    renameEngine(manageEngineId, manageCustomName);
    setEngineCustomIcon(manageEngineId, manageCustomIconUrl.trim() || undefined);
    closeManage();
  };

  const browseLauncherPath = async () => {
    const selected = await browseFile({ title: t("engines.selectLauncherBinary", "Select launcher binary"), defaultPath: manageLauncherPath || undefined });
    if (selected) setManageLauncherPath(selected);
  };

  const browseExecutablePath = async () => {
    const selected = await browseFile({
      title: t("engines.selectExecutable", "Select engine executable"),
      defaultPath: manageExecutablePath || undefined,
      filters: [{ name: "Executable", extensions: ["exe", "sh", "bin", "x86_64", "appimage", "app"] }],
    });
    if (selected) setManageExecutablePath(selected);
  };

  const browseExecutableFolder = async () => {
    const selected = await browseFolder({ title: t("engines.selectExecutableFolder", "Select folder containing engine executable") });
    if (selected) setManageExecutablePath(selected);
  };

  const formatVersionLabel = (version: string) => {
    const trimmed = version.trim();
    return /^[0-9]/.test(trimmed) ? `v${trimmed}` : trimmed;
  };

  const hasUpdateForEngine = (engineSlug: EngineSlug, installedVersion: string) => {
    const definition = enginesCatalog.find((entry) => entry.slug === engineSlug);
    const release = definition ? pickBestReleaseForPlatform(definition.releases, currentPlatform) : undefined;
    if (!release) return false;
    const normalize = (value?: string) =>
      (value || "0").replace(/^v/i, "").split(/[^0-9]+/).filter(Boolean).slice(0, 3).map((n) => Number(n));
    const a = normalize(release.version);
    const b = normalize(installedVersion);
    while (a.length < 3) a.push(0);
    while (b.length < 3) b.push(0);
    for (let i = 0; i < 3; i += 1) {
      if (a[i] > b[i]) return true;
      if (a[i] < b[i]) return false;
    }
    return false;
  };

  const getInstallableReleases = (engineSlug: EngineSlug) => {
    const definition = availableEngines.find((engine) => engine.slug === engineSlug);
    if (!definition) return [];

    const list = [...definition.releases].sort((a, b) => {
      const aPlatformScore = a.platform === currentPlatform ? 0 : (a.platform === "any" ? 1 : 2);
      const bPlatformScore = b.platform === currentPlatform ? 0 : (b.platform === "any" ? 1 : 2);
      if (aPlatformScore !== bPlatformScore) return aPlatformScore - bPlatformScore;
      if (a.isPrerelease !== b.isPrerelease) return Number(a.isPrerelease) - Number(b.isPrerelease);
      return String(b.version).localeCompare(String(a.version), undefined, { numeric: true, sensitivity: "base" });
    });
    const deduped = new Map<string, (typeof list)[number]>();
    for (const release of list) {
      const key = `${release.version}|${release.downloadUrl}`;
      if (!deduped.has(key)) deduped.set(key, release);
    }
    return Array.from(deduped.values());
  };

  const getSelectedRelease = (engineSlug: EngineSlug) => {
    const releases = getInstallableReleases(engineSlug);
    if (releases.length === 0) return undefined;
    return pickBestReleaseForPlatform(releases, currentPlatform) ?? releases[0];
  };

  const selectedEngine = selectedEngineSlug
    ? availableEngines.find((engine) => engine.slug === selectedEngineSlug) ?? null
    : null;
  const selectedEngineReleases = selectedEngineSlug ? getInstallableReleases(selectedEngineSlug) : [];

  useEffect(() => {
    setSelectedReleaseType("all");
    setSelectedReleaseVersion("all");
    setWizardStep(1);
  }, [selectedEngineSlug]);

  const releaseTypeOf = (input: { isPrerelease?: boolean; version?: string }) => {
    const version = (input.version || "").toLowerCase();
    if (version.includes("nightly")) return "nightly" as const;
    if (input.isPrerelease) return "prerelease" as const;
    return "release" as const;
  };

  const releaseTypeLabel = (input: { isPrerelease?: boolean; version?: string }) => {
    const type = releaseTypeOf(input);
    if (type === "nightly") return t("engines.releaseTypeNightly", "Nightly");
    if (type === "prerelease") return t("engines.releaseTypePrerelease", "Pre-release");
    return t("engines.releaseTypeStable", "Release");
  };

  const selectedEngineTypeFilteredReleases = useMemo(() => {
    if (selectedReleaseType === "all") return selectedEngineReleases;
    return selectedEngineReleases.filter((release) => releaseTypeOf(release) === selectedReleaseType);
  }, [selectedEngineReleases, selectedReleaseType]);

  const selectedEngineVisibleReleases = useMemo(() => {
    if (selectedReleaseVersion === "all") return selectedEngineTypeFilteredReleases;
    return selectedEngineTypeFilteredReleases.filter((release) => release.version === selectedReleaseVersion);
  }, [selectedEngineTypeFilteredReleases, selectedReleaseVersion]);

  const selectedEngineVersionGroups = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const release of selectedEngineTypeFilteredReleases) {
      grouped.set(release.version, (grouped.get(release.version) ?? 0) + 1);
    }
    return Array.from(grouped.entries()).map(([version, files]) => ({ version, files }));
  }, [selectedEngineTypeFilteredReleases]);

  const allReleaseResults = useMemo(() => {
    if (!normalizedWizardQuery) {
      return [] as Array<{ slug: EngineSlug; name: string; release: ReturnType<typeof getInstallableReleases>[number] }>;
    }

    const rows: Array<{ slug: EngineSlug; name: string; release: ReturnType<typeof getInstallableReleases>[number] }> = [];
    for (const engine of availableEngines) {
      for (const release of getInstallableReleases(engine.slug)) {
        const fileName = getReleaseFileName(release);
        const haystack = `${engine.name} ${engine.slug} ${release.version} ${fileName}`.toLowerCase();
        if (haystack.includes(normalizedWizardQuery)) {
          rows.push({ slug: engine.slug, name: engine.name, release });
        }
      }
    }
    return rows.slice(0, 120);
  }, [availableEngines, normalizedWizardQuery]);

  function getReleaseFileName(release: { fileName?: string; downloadUrl: string }) {
    const fromUrl = release.downloadUrl.split("?")[0].split("/").pop();
    const raw = release.fileName ?? fromUrl ?? release.downloadUrl;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  const addEnginePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
        <DialogHeader>
          <DialogTitle>{t("engines.addEngine", "Add Engine")}</DialogTitle>
          <DialogDescription>{t("engines.addEngineDesc", "Install from official releases or import an existing folder.")}</DialogDescription>
        </DialogHeader>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={wizardQuery}
              onChange={(event) => setWizardQuery(event.target.value)}
              placeholder={t("engines.searchPlaceholder", "Search engines (name, slug)")}
              className="w-full rounded-lg border border-border bg-input-background py-2.5 pl-10 pr-3 text-sm text-foreground"
            />
          </div>
          <button
            onClick={async () => {
              setScanningPaths(true);
              try {
                const paths = await scanCommonEnginePaths();
                setScannedPaths(paths);
              } finally {
                setScanningPaths(false);
              }
            }}
            disabled={scanningPaths}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {scanningPaths ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {scanningPaths ? t("engines.scanning", "Scanning…") : t("engines.scanNow", "Scan Now")}
          </button>
          <button
            onClick={async () => {
              const sourcePath = await browseFolder({ title: t("engines.selectEngineFolder", "Select engine folder to import") });
              if (!sourcePath) {
                return;
              }
              const suggested = sourcePath.split(/[\\/]/).filter(Boolean).pop() || "Custom Engine";
              const customName = window.prompt(t("engines.customEngineNamePrompt", "Custom engine name"), suggested)?.trim();
              if (!customName) {
                return;
              }

              setInstallError(null);
              setInstallingSlug("custom");
              try {
                await importEngineFromFolder("custom", "imported", sourcePath, customName);
                await refreshEngineHealth();
                setShowAddDialog(false);
              } catch (error) {
                setInstallError(error instanceof Error ? error.message : t("engines.importFailed", "Engine import failed"));
              } finally {
                setInstallingSlug(null);
              }
            }}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs text-foreground hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("engines.importCustom", "Import Custom")}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("engines.availableCount", "{{count}} engines available", { count: filteredAvailableEngines.length })}
        </p>
        {selectedEngine && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-secondary/25 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{selectedEngine.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("engines.chooseReleasePrompt", "Choose a release and file to install")} - {t("engines.stepProgress", "Step {{current}}/3", { current: String(wizardStep) })}
              </p>
            </div>
            <button
              onClick={() => {
                if (wizardStep > 1) {
                  setWizardStep((step) => (step - 1) as 1 | 2 | 3);
                  return;
                }
                setSelectedEngineSlug(null);
              }}
              className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {wizardStep > 1 ? t("engines.previous", "Back") : t("engines.backToEngines", "Back")}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!selectedEngine && (
          <>
            <div className="grid grid-cols-3 gap-3 2xl:grid-cols-4">
              {filteredAvailableEngines.map((engine) => {
                const installedCount = installedCountBySlug.get(engine.slug) ?? 0;
                const iconSrc = getEngineIcon(engine.slug);
                const release = getSelectedRelease(engine.slug);
                const versionPreview = [...new Set(getInstallableReleases(engine.slug).map((entry) => entry.version))].slice(0, 3);
                return (
                  <div key={engine.slug} className="rounded-lg border border-border bg-secondary/25 p-3">
                    <div className="mb-2 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                        {iconSrc
                          ? <img src={iconSrc} alt="" className="h-6 w-6 object-contain" loading="lazy" />
                          : <Cpu className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{engine.name}</p>
                        <p className="text-[11px] text-muted-foreground">{release ? formatVersionLabel(release.version) : "latest"}</p>
                        {versionPreview.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {versionPreview.map((version) => (
                              <span key={version} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {formatVersionLabel(version)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {installedCount > 0 && (
                        <span className="shrink-0 rounded border border-success/25 bg-success/10 px-1.5 py-0.5 text-[10px] text-success">
                          {t("engines.installed", "Installed")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEngineSlug(engine.slug);
                        setWizardStep(1);
                      }}
                      className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {t("engines.viewReleases", "View")}
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredAvailableEngines.length === 0 && (
              <div className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                {t("engines.searchNoResults", "No engines match your search.")}
              </div>
            )}

            {allReleaseResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("engines.searchAllReleases", "Matching release files across all engines")}</p>
                {allReleaseResults.map((entry) => {
                  const fileName = getReleaseFileName(entry.release);
                  return (
                    <div key={`${entry.slug}|${entry.release.downloadUrl}`} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{entry.name}</span>
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{formatVersionLabel(entry.release.version)}</span>
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{entry.release.platform}</span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{releaseTypeLabel(entry.release)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => installSelectedEngine(entry.slug, entry.release.downloadUrl, entry.release.version)}
                          disabled={installingSlug === entry.slug}
                          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {installingSlug === entry.slug
                            ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                            : <Download className="mr-1 inline h-3.5 w-3.5" />}
                          {t("engines.install", "Install")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {selectedEngine && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded px-2 py-1 ${wizardStep >= 1 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>1. {t("engines.filterType", "Type")}</span>
              <span className={`rounded px-2 py-1 ${wizardStep >= 2 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>2. {t("engines.filterVersion", "Version")}</span>
              <span className={`rounded px-2 py-1 ${wizardStep >= 3 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>3. {t("engines.filterFile", "File")}</span>
            </div>

            {wizardStep === 1 && (
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">{t("engines.chooseTypeStep", "Choose release type")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    ["all", t("engines.filterAll", "All")],
                    ["release", t("engines.releaseTypeStable", "Release")],
                    ["prerelease", t("engines.releaseTypePrerelease", "Pre-release")],
                    ["nightly", t("engines.releaseTypeNightly", "Nightly")],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSelectedReleaseType(value);
                        setSelectedReleaseVersion("all");
                        setWizardStep(2);
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        selectedReleaseType === value
                          ? "border-primary/30 bg-primary/15 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("engines.chooseVersionStep", "Choose a version")}</p>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {selectedEngineVersionGroups.map((entry) => (
                    <button
                      key={entry.version}
                      onClick={() => {
                        setSelectedReleaseVersion(entry.version);
                        setWizardStep(3);
                      }}
                      className={`rounded-lg border px-3 py-2 text-left ${
                        selectedReleaseVersion === entry.version
                          ? "border-primary/30 bg-primary/15"
                          : "border-border bg-secondary/20 hover:bg-secondary/30"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{formatVersionLabel(entry.version)}</p>
                      <p className="text-[11px] text-muted-foreground">{t("engines.filesFound", "{{count}} files", { count: entry.files })}</p>
                    </button>
                  ))}
                </div>
                {selectedEngineVersionGroups.length === 0 && (
                  <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                    {t("engines.noReleasesFound", "No installable releases were found for this engine.")}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <>
                {selectedEngineVisibleReleases.map((release) => {
                  const fileName = getReleaseFileName(release);
                  return (
                    <div key={`${release.downloadUrl}|${release.version}|${release.platform}|${release.fileName ?? ""}`} className="rounded-lg border border-border bg-secondary/25 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{formatVersionLabel(release.version)}</span>
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{release.platform}</span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{releaseTypeLabel(release)}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await installSelectedEngine(selectedEngine.slug, release.downloadUrl, release.version);
                          }}
                          disabled={installingSlug === selectedEngine.slug}
                          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {installingSlug === selectedEngine.slug
                            ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                            : <Download className="mr-1 inline h-3.5 w-3.5" />}
                          {t("engines.install", "Install")}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {selectedEngineVisibleReleases.length === 0 && (
                  <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                    {t("engines.noReleasesFound", "No installable releases were found for this engine.")}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {installError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {installError}
          </div>
        )}

        {platformWarning && (
          <div className="mt-3 space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <p className="font-medium">{t("engines.crossPlatformWarning", "Cross-platform executable warning")}</p>
            <p className="text-xs opacity-90">{t("engines.crossPlatformWarningDesc", "This engine may still work with a custom launcher (Wine/Proton) after install. Continue anyway?")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const pending = platformWarning;
                  setPlatformWarning(null);
                  installSelectedEngine(pending.slug, pending.releaseUrl, pending.releaseVersion, { allowMissingExecutable: true }).catch(() => undefined);
                }}
                className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
              >
                {t("engines.keepDownloading", "Keep Downloading")}
              </button>
              <button
                onClick={() => setPlatformWarning(null)}
                className="rounded bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80"
              >
                {t("engines.cancel", "Cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{t("engines.scanTitle", "Scan for existing engines")}</p>
            <span className="text-xs text-muted-foreground">{t("engines.scanHint", "Use Scan Now to auto-detect old installs.")}</span>
          </div>
          {scannedPaths !== null && scannedPaths.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("engines.scanNoneFound", "No engine folders found in common locations.")}</p>
          )}
          {scannedPaths !== null && scannedPaths.length > 0 && (
            <div className="space-y-1.5">
              <p className="mb-2 text-xs text-muted-foreground">{t("engines.scanFoundPaths", "Found potential engine folders — select a slug to import:")}</p>
              {scannedPaths.map((foundPath) => (
                <div key={foundPath} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                  <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{foundPath}</span>
                  {availableEngines.map((eng) => (
                    <button
                      key={eng.slug}
                      onClick={async () => {
                        setInstallingSlug(eng.slug);
                        try {
                          await importEngineFromFolder(eng.slug, "imported", foundPath);
                          await refreshEngineHealth();
                          setScannedPaths((prev) => prev ? prev.filter((p) => p !== foundPath) : prev);
                          setShowAddDialog(false);
                        } catch (error) {
                          setInstallError(error instanceof Error ? error.message : t("engines.importFailed", "Engine import failed"));
                        } finally {
                          setInstallingSlug(null);
                        }
                      }}
                      disabled={installingSlug === eng.slug}
                      className="shrink-0 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      {eng.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {engineDownloads.length > 0 && (
          <div className="mt-4 space-y-2">
            {engineDownloads.map((task) => (
              <div key={task.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{task.fileName}</span>
                  <span className="text-muted-foreground">{Math.round(task.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full origin-left bg-primary transition-transform"
                    style={{ transform: `scaleX(${Math.max(0, Math.min(1, task.progress))})` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{task.message ?? task.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!hasEngines) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex items-center justify-between"
        >
          <h1 className="text-3xl font-bold text-foreground">{t("engines.title", "Engines")}</h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWizardQuery("");
              setSelectedEngineSlug(null);
              setSelectedReleaseType("all");
              setSelectedReleaseVersion("all");
              setWizardStep(1);
              setShowAddDialog(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("engines.addEngine", "Add Engine")}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center py-16 mb-8"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Cpu className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t("engines.noneInstalled", "No engines installed")}</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {t("engines.noneInstalledDesc", "Install or import an engine to start playing mods.")}
          </p>
        </motion.div>

        {availableEngines.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Get started with:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {availableEngines.slice(0, 3).map((engine) => {
                const release = getSelectedRelease(engine.slug);
                const iconSrc = getEngineIcon(engine.slug);
                return (
                  <motion.div
                    key={engine.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border border-border p-5"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary/70 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {iconSrc
                          ? <img src={iconSrc} alt="" className="w-7 h-7 object-contain" loading="lazy" />
                          : <Cpu className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{engine.name}</h3>
                        <p className="text-xs text-muted-foreground">{release?.version ?? "latest"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (release) await installSelectedEngine(engine.slug, release.downloadUrl, release.version);
                        }}
                        disabled={!release || installingSlug === engine.slug}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {installingSlug === engine.slug
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Download className="w-3.5 h-3.5" />}
                        {t("engines.install", "Install")}
                      </button>
                      <button
                        onClick={() => handleImport(engine.slug)}
                        disabled={installingSlug === engine.slug}
                        className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary/80 disabled:opacity-50"
                      >
                        {t("engines.importFolder", "Import")}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {installError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {installError}
          </div>
        )}

        <Dialog
          open={showAddDialog}
          onOpenChange={(next) => {
            if (next) {
              resetWizard();
            }
            setWizardQuery("");
            setSelectedEngineSlug(null);
            setSelectedReleaseType("all");
            setSelectedReleaseVersion("all");
            setWizardStep(1);
            setShowAddDialog(next);
          }}
        >
          <DialogContent className="h-[90vh] w-[min(97vw,1180px)] max-w-none overflow-hidden p-0">
            {addEnginePanel}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("engines.title", "Engines")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Game engine installs used to run mods</p>
        </div>
        <button
          onClick={() => {
            resetWizard();
            setWizardQuery("");
            setSelectedEngineSlug(null);
            setSelectedReleaseType("all");
            setSelectedReleaseVersion("all");
            setWizardStep(1);
            setShowAddDialog(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t("engines.addEngine", "Add Engine")}
        </button>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Engine groups */}
      <div className="space-y-8">
        {engineGroups.map(([slug, engines], groupIndex) => (
          <motion.section
            key={slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
          >
            {showGroupHeaders && (
              <div className="flex items-center gap-3 mb-4">
                {getEngineIcon(slug as EngineSlug) ? (
                  <img
                    src={getEngineIcon(slug as EngineSlug)!}
                    alt=""
                    className="w-5 h-5 object-contain opacity-80"
                    loading="lazy"
                  />
                ) : (
                  <Cpu className="w-5 h-5 text-muted-foreground" />
                )}
                <h2 className="text-base font-semibold text-foreground">{formatEngineName(slug as EngineSlug)}</h2>
                <span className="text-xs text-muted-foreground">
                  {engines.length} {engines.length === 1 ? "install" : "installs"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {engines.map((engine) => (
                <EngineCard
                  key={engine.id}
                  name={engine.customName ?? engine.name}
                  version={formatVersionLabel(engine.version)}
                  iconSrc={getEngineIcon(engine.slug)}
                  customIconUrl={engine.customIconUrl}
                  typeBadge={engine.customName ? formatEngineName(engine.slug) : undefined}
                  isDefault={engine.isDefault}
                  isRunning={runningLaunchIds.has(engine.id)}
                  health={getEngineHealth(engine.id).health}
                  healthMessage={getEngineHealth(engine.id).message}
                  hasUpdate={hasUpdateForEngine(engine.slug, engine.version)}
                  onLaunch={() => { if (!busyEngineId) handleLaunch(engine.id); }}
                  onStop={() => killLaunch(engine.id).catch(() => undefined)}
                  onManage={() => { if (!busyEngineId) handleManage(engine.id); }}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Add Engine Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(next) => {
          if (next) {
            resetWizard();
          }
          setWizardQuery("");
          setSelectedEngineSlug(null);
          setSelectedReleaseType("all");
          setSelectedReleaseVersion("all");
          setWizardStep(1);
          setShowAddDialog(next);
        }}
      >
        <DialogContent className="h-[90vh] w-[min(97vw,1180px)] max-w-none overflow-hidden p-0">
          {addEnginePanel}
        </DialogContent>
      </Dialog>

      {/* Manage Dialog */}
      <Dialog open={Boolean(manageEngineId)} onOpenChange={(next) => { if (!next) closeManage(); }}>
        <DialogContent className="max-w-xl">
          {(() => {
            const engine = installedEngines.find((entry) => entry.id === manageEngineId);
            if (!engine) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{engine.customName ?? engine.name}</DialogTitle>
                  <DialogDescription>{formatEngineName(engine.slug)} · {formatVersionLabel(engine.version)}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-5">
                  {/* Identity */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Identity</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">{t("engines.customName", "Custom name")}</label>
                        <input
                          value={manageCustomName}
                          onChange={(e) => setManageCustomName(e.target.value)}
                          placeholder={engine.name}
                          className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{t("engines.customIconUrl", "Custom icon URL")}</label>
                        <div className="mt-1 flex gap-2">
                          <input
                            value={manageCustomIconUrl}
                            onChange={(e) => setManageCustomIconUrl(e.target.value)}
                            placeholder="https://..."
                            className="min-w-0 flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const path = await browseFile({ title: t("engines.chooseIcon", "Choose Icon"), filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }] });
                              if (path) setManageCustomIconUrl(`file://${path}`);
                            }}
                            className="shrink-0 px-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground flex items-center"
                            title={t("engines.browseIcon", "Browse for image")}
                          >
                            <ImagePlus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {!engine.isDefault && (
                        <button
                          onClick={() => { setDefaultEngine(engine.id); closeManage(); }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                        >
                          {t("engines.setDefault", "Set Default")}
                        </button>
                      )}
                      <button
                        onClick={() => openEngineFolder(engine.id).catch((err) => setActionError(err instanceof Error ? err.message : t("engines.openFolderFailed", "Failed to open folder")))}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                      >
                        {t("engines.openFolder", "Open Folder")}
                      </button>
                      <button
                        onClick={() => openEngineModsFolder(engine.id).catch((err) => setActionError(err instanceof Error ? err.message : t("engines.openModsFolderFailed", "Failed to open mods folder")))}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                      >
                        {t("engines.openModsFolder", "Open Mods Folder")}
                      </button>
                      <button
                        onClick={() => handleUpdate(engine.id)}
                        disabled={busyEngineId === engine.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        {t("engines.update", "Check Update")}
                      </button>
                    </div>
                  </div>

                  {/* Launch Override */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Launch Override</p>
                    <div className="space-y-2">
                      <select
                        value={manageLauncher}
                        onChange={(e) => setManageLauncher(e.target.value as "native" | "wine" | "wine64" | "proton")}
                        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      >
                        <option value="native">{t("engines.native", "Native")}</option>
                        <option value="wine">Wine</option>
                        <option value="wine64">Wine64</option>
                        <option value="proton">Proton</option>
                      </select>

                      {manageLauncher !== "native" && (
                        <>
                          <div className="flex gap-2">
                            <input
                              value={manageLauncherPath}
                              onChange={(e) => setManageLauncherPath(e.target.value)}
                              placeholder={t("engines.optionalLauncherPath", "Optional launcher binary path (eg /usr/bin/wine)")}
                              className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                            />
                            <button onClick={browseLauncherPath} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">
                              {t("engines.browse", "Browse")}
                            </button>
                            <button
                              onClick={async () => {
                                const runtimes = await detectWineRuntimes();
                                setDetectedRuntimes(runtimes);
                              }}
                              className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm whitespace-nowrap"
                            >
                              {t("engines.detect", "Detect")}
                            </button>
                          </div>
                          {detectedRuntimes !== null && detectedRuntimes.length === 0 && (
                            <p className="text-xs text-muted-foreground">{t("engines.noRuntimesFound", "No Wine/Proton runtimes detected.")}</p>
                          )}
                          {detectedRuntimes !== null && detectedRuntimes.length > 0 && (
                            <div className="space-y-1">
                              {detectedRuntimes.map((rt) => (
                                <button
                                  key={rt.path}
                                  onClick={() => {
                                    setManageLauncher(rt.type);
                                    setManageLauncherPath(rt.path);
                                    setDetectedRuntimes(null);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm flex items-center justify-between"
                                >
                                  <span className="font-medium">{rt.label}</span>
                                  <span className="text-xs text-muted-foreground font-mono truncate ml-2">{rt.path}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2">
                        <input
                          value={manageExecutablePath}
                          onChange={(e) => setManageExecutablePath(e.target.value)}
                          placeholder={t("engines.optionalExecutablePath", "Optional executable path (absolute or inside engine folder)")}
                          className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                        />
                        <button onClick={browseExecutablePath} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">
                          {t("engines.browseFile", "File")}
                        </button>
                        <button onClick={browseExecutableFolder} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">
                          {t("engines.browseFolder", "Folder")}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("engines.executableExamples", "Examples: `ALEPsych`, `bin/Funkin.sh`")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-between gap-2">
                  <button
                    onClick={() => setConfirmUninstall({ id: engine.id, name: engine.name, version: engine.version, path: engine.installPath })}
                    className="px-3 py-2 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive text-sm"
                  >
                    {t("engines.uninstall", "Uninstall")}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => closeManage()} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">
                      {t("engines.close", "Close")}
                    </button>
                    <button onClick={saveManageOverrides} className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                      {t("engines.save", "Save")}
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Uninstall Dialog */}
      <Dialog open={Boolean(confirmUninstall)} onOpenChange={(next) => { if (!next) setConfirmUninstall(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("engines.confirmUninstall", "Confirm engine uninstall")}</DialogTitle>
            <DialogDescription>
              {t("engines.remove", "Remove")} <span className="text-foreground font-medium">{confirmUninstall?.name}</span>{" "}
              {confirmUninstall ? formatVersionLabel(confirmUninstall.version) : ""}?
            </DialogDescription>
          </DialogHeader>
          <p className="mt-2 text-xs text-muted-foreground break-all">{confirmUninstall?.path}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmUninstall(null)}
              className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm"
            >
              {t("engines.cancel", "Cancel")}
            </button>
            <button
              onClick={async () => {
                if (!confirmUninstall) return;
                const target = confirmUninstall;
                setConfirmUninstall(null);
                closeManage();
                await handleUninstall(target.id);
              }}
              className="px-3 py-2 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive text-sm"
            >
              {t("engines.uninstall", "Uninstall")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
