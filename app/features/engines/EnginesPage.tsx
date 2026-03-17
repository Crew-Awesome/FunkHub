import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Plus, Cpu, Loader2, AlertCircle, Download, ImagePlus, ChevronLeft } from "lucide-react";
import { EngineCard } from "./EngineCard";
import { getEngineIcon } from "./engineIcons";
import { useFunkHub, useI18n } from "../../providers";
import { detectClientPlatform, pickBestReleaseForPlatform, formatEngineName, type EngineSlug, type EngineRelease } from "../../services/funkhub";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyEngineId, setBusyEngineId] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<{ id: string; name: string; version: string; path: string } | null>(null);
  const [manageEngineId, setManageEngineId] = useState<string | null>(null);
  const [manageLauncher, setManageLauncher] = useState<"native" | "wine" | "wine64" | "proton">("native");
  const [manageLauncherPath, setManageLauncherPath] = useState("");
  const [manageExecutablePath, setManageExecutablePath] = useState("");
  const [manageCustomName, setManageCustomName] = useState("");
  const [manageCustomIconUrl, setManageCustomIconUrl] = useState("");
  const [selectedReleaseBySlug, setSelectedReleaseBySlug] = useState<Record<string, string>>({});
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardEngineSlug, setWizardEngineSlug] = useState<EngineSlug | null>(null);
  const [wizardVersion, setWizardVersion] = useState<string | null>(null);
  const [scannedPaths, setScannedPaths] = useState<string[] | null>(null);
  const [scanningPaths, setScanningPaths] = useState(false);
  const [detectedRuntimes, setDetectedRuntimes] = useState<Array<{ type: "wine" | "wine64" | "proton"; path: string; label: string }> | null>(null);
  const [platformWarning, setPlatformWarning] = useState<{
    slug: EngineSlug;
    releaseUrl: string;
    releaseVersion: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    refreshEngineHealth().catch((error) => {
      console.warn("[Engines] Initial health check failed:", error instanceof Error ? error.message : error);
    });
  }, []);

  const availableEngines = enginesCatalog;
  const hasEngines = installedEngines.length > 0;
  const currentPlatform = detectClientPlatform();
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
        launcherPath: currentPlatform === "linux" && override.launcher !== "native" ? override.launcherPath : undefined,
        executablePath: override.executablePath,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("engines.launchFailed", "Failed to launch engine"));
    }
  };

  const handleManage = (engineId: string) => {
    const override = getLaunchOverride(engineId);
    const engine = installedEngines.find((entry) => entry.id === engineId);
    setManageEngineId(engineId);
    setManageLauncher(override.launcher);
    setManageLauncherPath(override.launcherPath ?? "");
    setManageExecutablePath(override.executablePath ?? "");
    setManageCustomName(engine?.customName ?? "");
    setManageCustomIconUrl(engine?.customIconUrl ?? "");
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
    setManageEngineId(null);
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

  const getVersionsForEngine = (slug: EngineSlug): string[] => {
    const releases = getInstallableReleases(slug);
    return [...new Set(releases.map((r) => r.version))];
  };

  const getFilesForVersion = (slug: EngineSlug, version: string): EngineRelease[] =>
    getInstallableReleases(slug).filter((r) => r.version === version);

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
    const selectedUrl = selectedReleaseBySlug[engineSlug];
    const selected = selectedUrl ? releases.find((release) => release.downloadUrl === selectedUrl) : undefined;
    return selected ?? pickBestReleaseForPlatform(releases, currentPlatform) ?? releases[0];
  };

  // ── 3-step wizard ──────────────────────────────────────────────────────────

  const wizardEngine = wizardEngineSlug ? availableEngines.find((e) => e.slug === wizardEngineSlug) : null;

  const addEnginePanel = (() => {
    // Step 1: choose engine
    if (wizardStep === 1) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>{t("engines.addEngine", "Add Engine")}</DialogTitle>
            <DialogDescription>{t("engines.addEngineDesc", "Choose an engine to install.")}</DialogDescription>
            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("engines.step", "Step")} {wizardStep} {t("engines.of3", "of 3")}</p>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableEngines.map((engine) => {
                const installedCount = installedEngines.filter((entry) => entry.slug === engine.slug).length;
                const iconSrc = getEngineIcon(engine.slug);
                return (
                  <div key={engine.slug} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setWizardEngineSlug(engine.slug); setWizardVersion(null); setWizardStep(2); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center shrink-0 overflow-hidden">
                        {iconSrc
                          ? <img src={iconSrc} alt="" className="w-6 h-6 object-contain" loading="lazy" />
                          : <Cpu className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{engine.name}</span>
                          {installedCount > 0 && (
                            <span className="text-[11px] text-muted-foreground">{t("engines.installedCount", "{{n}} installed", { n: installedCount })}</span>
                          )}
                        </div>
                        {engine.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{engine.description}</p>
                        )}
                      </div>
                    </button>
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => handleImport(engine.slug)}
                        disabled={installingSlug === engine.slug}
                        className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80 disabled:opacity-50 text-center"
                      >
                        {installingSlug === engine.slug ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                        {t("engines.importFolder", "Import from folder")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {installError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {installError}
              </div>
            )}

            {/* Scan for engine folders on disk */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{t("engines.scanTitle", "Scan for existing engines")}</p>
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
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {scanningPaths ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {scanningPaths ? t("engines.scanning", "Scanning…") : t("engines.scanNow", "Scan Now")}
                </button>
              </div>
              {scannedPaths !== null && scannedPaths.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("engines.scanNoneFound", "No engine folders found in common locations.")}</p>
              )}
              {scannedPaths !== null && scannedPaths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">{t("engines.scanFoundPaths", "Found potential engine folders — select a slug to import:")}</p>
                  {scannedPaths.map((foundPath) => (
                    <div key={foundPath} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                      <span className="flex-1 text-xs font-mono text-muted-foreground truncate">{foundPath}</span>
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
          </div>
        </>
      );
    }

    // Step 2: choose version
    if (wizardStep === 2 && wizardEngine) {
      const allReleases = getInstallableReleases(wizardEngine.slug);
      const bestRelease = pickBestReleaseForPlatform(allReleases, currentPlatform) ?? allReleases[0];
      const versions = getVersionsForEngine(wizardEngine.slug);
      const iconSrc = getEngineIcon(wizardEngine.slug);

      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="rounded-lg border border-border p-1.5 hover:bg-secondary transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {iconSrc && <img src={iconSrc} alt="" className="w-5 h-5 object-contain" />}
              {wizardEngine.name}
            </DialogTitle>
            <DialogDescription>{t("engines.chooseVersion", "Choose a version to install.")}</DialogDescription>
            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step <= 2 ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("engines.step", "Step")} {wizardStep} {t("engines.of3", "of 3")}</p>
          </DialogHeader>

          <div className="space-y-1.5 mt-2">
            {versions.map((version) => {
              const filesForVersion = getFilesForVersion(wizardEngine.slug, version);
              const isRecommended = bestRelease?.version === version;
              const isPrerelease = filesForVersion.every((r) => r.isPrerelease);
              const platforms = [...new Set(filesForVersion.map((r) => r.platform))];

              return (
                <button
                  key={version}
                  type="button"
                  onClick={() => { setWizardVersion(version); setWizardStep(3); }}
                  className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-left hover:bg-secondary/60 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-foreground">{formatVersionLabel(version)}</span>
                    {isRecommended && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Recommended</span>
                    )}
                    {isPrerelease && (
                      <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">Pre-release</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{platforms.join(", ")}</span>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    // Step 3: choose file
    if (wizardStep === 3 && wizardEngine && wizardVersion) {
      const files = getFilesForVersion(wizardEngine.slug, wizardVersion);
      const allReleases = getInstallableReleases(wizardEngine.slug);
      const bestRelease = pickBestReleaseForPlatform(allReleases, currentPlatform) ?? allReleases[0];
      const iconSrc = getEngineIcon(wizardEngine.slug);

      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="rounded-lg border border-border p-1.5 hover:bg-secondary transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {iconSrc && <img src={iconSrc} alt="" className="w-5 h-5 object-contain" />}
              {wizardEngine.name} · {formatVersionLabel(wizardVersion)}
            </DialogTitle>
            <DialogDescription>{t("engines.chooseFile", "Choose a file to download.")}</DialogDescription>
            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step <= 3 ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("engines.step", "Step")} {wizardStep} {t("engines.of3", "of 3")}</p>
          </DialogHeader>

          <div className="space-y-1.5 mt-2">
            {files.map((release) => {
              const fileName = release.fileName ?? release.downloadUrl.split("/").pop() ?? release.downloadUrl;
              const isRecommended = release.downloadUrl === bestRelease?.downloadUrl;
              return (
                <div key={release.downloadUrl} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-mono break-all">{fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">{release.platform}</span>
                        {isRecommended && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Recommended</span>
                        )}
                        {release.isPrerelease && (
                          <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">Pre-release</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await installSelectedEngine(wizardEngine.slug, release.downloadUrl, release.version);
                        setShowAddDialog(false);
                      }}
                      disabled={installingSlug === wizardEngine.slug}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {installingSlug === wizardEngine.slug
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                      {t("engines.install", "Install")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {engineDownloads.length > 0 && (
            <div className="space-y-2 mt-3">
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

          {installError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 mt-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {installError}
            </div>
          )}

          {platformWarning && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning space-y-2 mt-3">
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
        </>
      );
    }

    return null;
  })();

  if (!hasEngines) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t("engines.instances", "Instances")}</h1>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("engines.addEngine", "Add Engine")}
          </button>
        </div>

        <div className="text-center py-16 mb-8">
          <Cpu className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t("engines.noneInstalled", "No engines installed")}</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {t("engines.noneInstalledDesc", "Install or import an engine to start playing mods.")}
          </p>
        </div>

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

        <Dialog open={showAddDialog} onOpenChange={(next) => { setShowAddDialog(next); if (next) { setWizardStep(1); setWizardEngineSlug(null); setWizardVersion(null); } }}>
          <DialogContent className="max-h-[88vh] w-[min(96vw,900px)] max-w-none overflow-y-auto">
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
          <h1 className="text-3xl font-bold text-foreground">{t("engines.instances", "Instances")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Game engine installs used to run mods</p>
        </div>
        <button
          onClick={() => { setShowAddDialog(true); setWizardStep(1); setWizardEngineSlug(null); setWizardVersion(null); }}
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[88vh] w-[min(96vw,900px)] max-w-none overflow-y-auto">
          {addEnginePanel}
        </DialogContent>
      </Dialog>

      {/* Manage Dialog */}
      <Dialog open={Boolean(manageEngineId)} onOpenChange={(next) => { if (!next) setManageEngineId(null); }}>
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
                          onClick={() => { setDefaultEngine(engine.id); setManageEngineId(null); }}
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
                    <button onClick={() => setManageEngineId(null)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">
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
                setManageEngineId(null);
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
