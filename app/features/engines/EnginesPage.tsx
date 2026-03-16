import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Cpu, Loader2, AlertCircle, ShieldCheck, ShieldAlert, ShieldX, FolderSearch } from "lucide-react";
import { EngineCard } from "./EngineCard";
import { getEngineIcon } from "./engineIcons";
import { useFunkHub, useI18n } from "../../providers";
import { detectClientPlatform, pickBestReleaseForPlatform, formatEngineName, type EngineSlug } from "../../services/funkhub";
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
  } = useFunkHub();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyEngineId, setBusyEngineId] = useState<string | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<{ id: string; name: string; version: string; path: string } | null>(null);
  const [manageEngineId, setManageEngineId] = useState<string | null>(null);
  const [manageLauncher, setManageLauncher] = useState<"native" | "wine" | "wine64" | "proton">("native");
  const [manageLauncherPath, setManageLauncherPath] = useState("");
  const [manageExecutablePath, setManageExecutablePath] = useState("");
  const [manageCustomName, setManageCustomName] = useState("");
  const [manageCustomIconUrl, setManageCustomIconUrl] = useState("");
  const [selectedReleaseBySlug, setSelectedReleaseBySlug] = useState<Record<string, string>>({});
  const [platformWarning, setPlatformWarning] = useState<{
    slug: EngineSlug;
    releaseUrl: string;
    releaseVersion: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    refreshEngineHealth().catch(() => undefined);
  }, []);

  const availableEngines = enginesCatalog;
  const hasEngines = installedEngines.length > 0;
  const currentPlatform = detectClientPlatform();
  const engineDownloads = downloads
    .filter((task) => task.modId === -1)
    .filter((task) => ["queued", "downloading", "installing", "failed"].includes(task.status));

  const getLaunchOverride = (engineId: string) => settings.engineLaunchOverrides[engineId] ?? { launcher: "native" as const };

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
      setNotice(t("engines.installQueued", `${engineSlug} install queued.`));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("engines.installFailed", "Engine install failed");
      if (/launchable executable for this platform/i.test(message) && !options?.allowMissingExecutable) {
        setPlatformWarning({
          slug: engineSlug,
          releaseUrl,
          releaseVersion,
          message,
        });
      } else {
        setInstallError(message);
      }
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleLaunch = async (engineId: string) => {
    setActionError(null);
    setNotice(null);
    try {
      const override = getLaunchOverride(engineId);
      await launchEngine(engineId, {
        launcher: currentPlatform === "linux" ? override.launcher : "native",
        launcherPath: currentPlatform === "linux" && override.launcher !== "native"
          ? override.launcherPath
          : undefined,
        executablePath: override.executablePath,
      });
      setNotice(t("engines.launchCommandSent", "Engine launch command sent."));
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
    if (!manageEngineId) {
      return;
    }
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
    setNotice(t("engines.launchSettingsSaved", "Engine launch settings saved."));
  };

  const browseLauncherPath = async () => {
    const selected = await browseFile({
      title: t("engines.selectLauncherBinary", "Select launcher binary"),
      defaultPath: manageLauncherPath || undefined,
    });
    if (selected) {
      setManageLauncherPath(selected);
    }
  };

  const browseExecutablePath = async () => {
    const selected = await browseFile({
      title: t("engines.selectExecutable", "Select engine executable"),
      defaultPath: manageExecutablePath || undefined,
      filters: [
        { name: "Executable", extensions: ["exe", "sh", "bin", "x86_64", "appimage", "app"] },
      ],
    });
    if (selected) {
      setManageExecutablePath(selected);
    }
  };

  const browseExecutableFolder = async () => {
    const selected = await browseFolder({
      title: t("engines.selectExecutableFolder", "Select folder containing engine executable"),
    });
    if (selected) {
      setManageExecutablePath(selected);
    }
  };

  const healthMeta = (engineId: string) => {
    const health = getEngineHealth(engineId);
    if (health.health === "ready") {
      return { label: t("engines.ready", "Ready"), tone: "text-foreground/85 bg-primary/10 border-primary/20", icon: ShieldCheck };
    }
    if (health.health === "missing_binary") {
      return { label: t("engines.executableNotDetected", "Executable Not Detected"), tone: "text-warning bg-warning/10 border-warning/20", icon: ShieldAlert };
    }
    return { label: t("engines.installBroken", "Engine Install Broken"), tone: "text-destructive bg-destructive/10 border-destructive/20", icon: ShieldX };
  };

  const formatVersionLabel = (version: string) => {
    const trimmed = version.trim();
    return /^[0-9]/.test(trimmed) ? `v${trimmed}` : trimmed;
  };

  const hasUpdateForEngine = (engineSlug: EngineSlug, installedVersion: string) => {
    const definition = enginesCatalog.find((entry) => entry.slug === engineSlug);
    const release = definition ? pickBestReleaseForPlatform(definition.releases, currentPlatform) : undefined;
    if (!release) {
      return false;
    }
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
    if (!definition) {
      return [];
    }

    const list = [...definition.releases].sort((a, b) => {
      const aPlatformScore = a.platform === currentPlatform ? 0 : (a.platform === "any" ? 1 : 2);
      const bPlatformScore = b.platform === currentPlatform ? 0 : (b.platform === "any" ? 1 : 2);
      if (aPlatformScore !== bPlatformScore) {
        return aPlatformScore - bPlatformScore;
      }

      if (a.isPrerelease !== b.isPrerelease) {
        return Number(a.isPrerelease) - Number(b.isPrerelease);
      }

      return String(b.version).localeCompare(String(a.version), undefined, { numeric: true, sensitivity: "base" });
    });
    const deduped = new Map<string, (typeof list)[number]>();
    for (const release of list) {
      const key = `${release.version}|${release.downloadUrl}`;
      if (!deduped.has(key)) {
        deduped.set(key, release);
      }
    }
    return Array.from(deduped.values());
  };

  const getSelectedRelease = (engineSlug: EngineSlug) => {
    const releases = getInstallableReleases(engineSlug);
    if (releases.length === 0) {
      return undefined;
    }
    const selectedUrl = selectedReleaseBySlug[engineSlug];
    const selected = selectedUrl ? releases.find((release) => release.downloadUrl === selectedUrl) : undefined;
    return selected ?? pickBestReleaseForPlatform(releases, currentPlatform) ?? releases[0];
  };

  const addEnginePanel = (
    <>
      <DialogHeader>
        <DialogTitle>{t("engines.addEngine", "Add Engine")}</DialogTitle>
        <DialogDescription>{t("engines.addEngineDesc", "Install from official releases or import an existing folder.")}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {availableEngines.map((engine) => (
            (() => {
              const installedCount = installedEngines.filter((entry) => entry.slug === engine.slug).length;
              const iconSrc = getEngineIcon(engine.slug);
              return (
                <div key={engine.slug} className="min-w-0 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-left">
                  <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[64px_minmax(0,1fr)_auto]">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                      {iconSrc
                        ? <img src={iconSrc} alt="" className="h-11 w-11 object-contain" loading="lazy" />
                        : <Cpu className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-base font-medium text-foreground">{engine.name}</span>
                        {installingSlug === engine.slug && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <span className="text-xs text-muted-foreground">
                          {(getSelectedRelease(engine.slug)?.version ?? "latest")}
                          {installedCount > 0 ? ` • ${installedCount} installed` : ""}
                        </span>
                      </div>
                      <select
                        value={getSelectedRelease(engine.slug)?.downloadUrl ?? ""}
                        onChange={(event) => {
                          setSelectedReleaseBySlug((current) => ({
                            ...current,
                            [engine.slug]: event.target.value,
                          }));
                        }}
                        className="min-w-0 w-full rounded border border-border bg-input-background px-2 py-2 text-xs"
                      >
                        {getInstallableReleases(engine.slug).map((release) => (
                          <option key={`${release.version}-${release.downloadUrl}`} value={release.downloadUrl}>
                            {release.version}{release.isPrerelease ? " (pre)" : ""} [{release.platform}] {release.fileName ? `- ${release.fileName}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 lg:w-40">
                      <button
                        onClick={async () => {
                          const release = getSelectedRelease(engine.slug);
                          if (release) {
                            await installSelectedEngine(engine.slug, release.downloadUrl, release.version);
                          }
                        }}
                        className="w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                      >
                         {t("engines.install", "Install")}
                      </button>
                      <button
                        onClick={() => handleImport(engine.slug)}
                        className="w-full rounded bg-secondary px-3 py-2 text-sm text-foreground hover:bg-secondary/80"
                      >
                         {t("engines.importFolder", "Import Folder")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ))}
        </div>

        {engineDownloads.length > 0 && (
          <div className="space-y-2">
            {engineDownloads.map((task) => (
              <div key={task.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{task.fileName}</span>
                  <span className="text-muted-foreground">{Math.round(task.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full origin-left bg-primary transition-transform"
                    style={{ transform: `scaleX(${Math.max(0, Math.min(1, task.progress))})` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{task.message ?? task.status}</p>
              </div>
            ))}
          </div>
        )}

        {installError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {installError}
          </div>
        )}

        {platformWarning && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning space-y-2">
            <p className="font-medium">{t("engines.crossPlatformWarning", "Cross-platform executable warning")}</p>
            <p>{platformWarning.message}</p>
            <p className="text-xs opacity-90">
               {t("engines.crossPlatformWarningDesc", "This engine may still work with a custom launcher (Wine/Proton) after install. Continue anyway?")}
            </p>
            <div className="flex flex-wrap gap-2">
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
                 {t("engines.stop", "Stop")}
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {actionError}
          </div>
        )}
      </div>
    </>
  );

  if (!hasEngines) {
    return (
      <div className="flex min-h-full items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t("engines.noneInstalled", "No engines installed")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("engines.noneInstalledDesc", "Install or import an engine to start playing mods.")}
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("engines.addEngine", "Add Engine")}
            </button>
          </div>
        </motion.div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-h-[88vh] w-[min(96vw,1200px)] max-w-none overflow-y-auto">
            {addEnginePanel}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">{t("engines.instances", "Instances")}</h1>
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("engines.addEngine", "Add Engine")}
        </button>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {installedEngines.map((engine, index) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {(() => {
                  const meta = healthMeta(engine.id);
                  const Icon = meta.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${meta.tone}`} title={getEngineHealth(engine.id).message}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                  );
                })()}
                {hasUpdateForEngine(engine.slug, engine.version) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded border border-primary/20 bg-primary/10 text-primary">
                    {t("engines.updateAvailable", "Update available")}
                  </span>
                )}
                {!engine.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultEngine(engine.id)}
                    className="inline-flex items-center rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-secondary"
                  >
                    {t("engines.setDefault", "Set default")}
                  </button>
                )}
              </div>
              <EngineCard
                name={engine.customName ?? engine.name}
                version={formatVersionLabel(engine.version)}
                iconSrc={getEngineIcon(engine.slug)}
                customIconUrl={engine.customIconUrl}
                typeBadge={engine.customName ? formatEngineName(engine.slug) : undefined}
                isDefault={engine.isDefault}
                onLaunch={() => {
                  if (!busyEngineId) {
                    handleLaunch(engine.id);
                  }
                }}
                onManage={() => {
                  if (!busyEngineId) {
                    handleManage(engine.id);
                  }
                }}
              />
              {getEngineHealth(engine.id).health !== "ready" && getEngineHealth(engine.id).message && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {getEngineHealth(engine.id).message}
                </p>
              )}
              {getEngineHealth(engine.id).health === "missing_binary" && (
                <button
                  onClick={() => handleManage(engine.id)}
                  className="mt-2 text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded border border-warning/30 bg-warning/10 text-warning"
                >
                  <FolderSearch className="w-3.5 h-3.5" />
                  {t("engines.locateExecutable", "Locate executable")}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {actionError && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {actionError}
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-lg border border-success/30 bg-success/10 text-success p-3 text-sm">
          {notice}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[88vh] w-[min(96vw,1200px)] max-w-none overflow-y-auto">
          {addEnginePanel}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(manageEngineId)} onOpenChange={(next) => { if (!next) setManageEngineId(null); }}>
        <DialogContent className="max-w-xl">
          {(() => {
            const engine = installedEngines.find((entry) => entry.id === manageEngineId);
            if (!engine) {
              return null;
            }
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{t("engines.manage", "Manage")} {engine.name}</DialogTitle>
                  <DialogDescription>{formatVersionLabel(engine.version)}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                   <button onClick={() => setDefaultEngine(engine.id)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("engines.setDefault", "Set Default")}</button>
                   <button onClick={() => openEngineFolder(engine.id).catch((error) => setActionError(error instanceof Error ? error.message : t("engines.openFolderFailed", "Failed to open folder")))} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("engines.openFolder", "Open Folder")}</button>
                   <button onClick={() => openEngineModsFolder(engine.id).catch((error) => setActionError(error instanceof Error ? error.message : t("engines.openModsFolderFailed", "Failed to open mods folder")))} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("engines.openModsFolder", "Open Mods Folder")}</button>
                   <button onClick={() => handleUpdate(engine.id)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("engines.update", "Update")}</button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground">{t("engines.customName", "Custom name")}</label>
                      <input
                        value={manageCustomName}
                        onChange={(event) => setManageCustomName(event.target.value)}
                        placeholder={engine.name}
                        className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">{t("engines.customIconUrl", "Custom icon URL")}</label>
                      <input
                        value={manageCustomIconUrl}
                        onChange={(event) => setManageCustomIconUrl(event.target.value)}
                        placeholder={t("engines.customIconUrlPlaceholder", "https://...")}
                        className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-xs text-muted-foreground">{t("engines.executableLauncher", "Executable launcher")}</label>
                  <select
                    value={manageLauncher}
                    onChange={(event) => setManageLauncher(event.target.value as "native" | "wine" | "wine64" | "proton")}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                  >
                    <option value="native">{t("engines.native", "Native")}</option>
                    <option value="wine">{t("engines.wine", "Wine")}</option>
                    <option value="wine64">{t("engines.wine64", "Wine64")}</option>
                    <option value="proton">{t("engines.proton", "Proton")}</option>
                  </select>
                  {manageLauncher !== "native" && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={manageLauncherPath}
                        onChange={(event) => setManageLauncherPath(event.target.value)}
                        placeholder={t("engines.optionalLauncherPath", "Optional launcher binary path (eg /usr/bin/wine)")}
                        className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      />
                      <button
                        onClick={browseLauncherPath}
                        className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                      >
                        {t("engines.browse", "Browse")}
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={manageExecutablePath}
                      onChange={(event) => setManageExecutablePath(event.target.value)}
                      placeholder={t("engines.optionalExecutablePath", "Optional executable path (absolute or inside engine folder)")}
                      className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                    />
                    <button
                      onClick={browseExecutablePath}
                      className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                    >
                      {t("engines.browseFile", "Browse File")}
                    </button>
                    <button
                      onClick={browseExecutableFolder}
                      className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                    >
                      {t("engines.browseFolder", "Browse Folder")}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("engines.executableExamples", "Examples: `ALEPsych`, `bin/Funkin.sh`")}</p>
                </div>

                <div className="mt-5 flex justify-between gap-2">
                  <button
                    onClick={() => setConfirmUninstall({ id: engine.id, name: engine.name, version: engine.version, path: engine.installPath })}
                    className="px-3 py-2 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive text-sm"
                  >
                    {t("engines.uninstall", "Uninstall")}
                  </button>
                  <div className="flex gap-2">
                     <button onClick={() => setManageEngineId(null)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("engines.close", "Close")}</button>
                     <button onClick={saveManageOverrides} className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm">{t("engines.save", "Save")}</button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

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
                if (!confirmUninstall) {
                  return;
                }
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
