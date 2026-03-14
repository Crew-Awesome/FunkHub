import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Cpu, Loader2, AlertCircle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { EngineCard } from "./EngineCard";
import { useFunkHub } from "../../providers";
import { detectClientPlatform, pickBestReleaseForPlatform, type EngineSlug } from "../../services/funkhub";

export function Engines() {
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
  const [selectedReleaseBySlug, setSelectedReleaseBySlug] = useState<Record<string, string>>({});

  const availableEngines = enginesCatalog;
  const hasEngines = installedEngines.length > 0;
  const currentPlatform = detectClientPlatform();
  const engineDownloads = downloads
    .filter((task) => task.modId === -1)
    .filter((task) => ["queued", "downloading", "installing", "failed"].includes(task.status));

  const getLaunchOverride = (engineId: string) => settings.engineLaunchOverrides[engineId] ?? { launcher: "native" as const };

  const installSelectedEngine = async (engineSlug: EngineSlug, releaseUrl: string, releaseVersion: string) => {
    setInstallError(null);
    setInstallingSlug(engineSlug);
    try {
      await installEngine(engineSlug, releaseUrl, releaseVersion);
      await refreshEngineHealth();
      setNotice(`${engineSlug} install queued.`);
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : "Engine install failed");
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
      setNotice("Engine launch command sent.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to launch engine");
    }
  };

  const handleManage = (engineId: string) => {
    const override = getLaunchOverride(engineId);
    setManageEngineId(engineId);
    setManageLauncher(override.launcher);
    setManageLauncherPath(override.launcherPath ?? "");
    setManageExecutablePath(override.executablePath ?? "");
  };

  const handleUpdate = async (engineId: string) => {
    setActionError(null);
    setBusyEngineId(engineId);
    try {
      await updateEngine(engineId);
      await refreshEngineHealth();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update engine");
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
      setActionError(error instanceof Error ? error.message : "Failed to uninstall engine");
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
      setInstallError(error instanceof Error ? error.message : "Engine import failed");
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
    setNotice("Engine launch settings saved.");
  };

  const healthMeta = (engineId: string) => {
    const health = getEngineHealth(engineId);
    if (health.health === "ready") {
      return { label: "Ready", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck };
    }
    if (health.health === "missing_binary") {
      return { label: "Missing Binary", tone: "text-amber-300 bg-amber-500/10 border-amber-500/20", icon: ShieldAlert };
    }
    return { label: "Broken", tone: "text-red-300 bg-red-500/10 border-red-500/20", icon: ShieldX };
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

  if (!hasEngines) {
    return (
      <div className="p-8 flex items-center justify-center min-h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">No engines installed</h2>
            <p className="text-muted-foreground mb-6">
              Install or import an engine to start playing mods.
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Engine
            </button>
          </div>

          {/* Add Engine Dialog */}
          {showAddDialog && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-card border border-border rounded-xl p-6"
            >
                <h3 className="font-semibold text-foreground mb-4">Select an engine to install</h3>
                <div className="space-y-2">
                {availableEngines.map((engine) => (
                  (() => {
                    const installedCount = installedEngines.filter((entry) => entry.slug === engine.slug).length;
                    return (
                  <div key={engine.slug} className="w-full px-4 py-3 bg-secondary rounded-lg text-left font-medium">
                    <div className="flex items-center gap-3 mb-2">
                      {installingSlug === engine.slug
                        ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        : <Cpu className="w-5 h-5 text-primary" />}
                      <span className="flex-1 text-foreground">{engine.name}</span>
                      <span className="text-xs text-muted-foreground">{installedCount > 0 ? `${installedCount} installed` : "new"}</span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={getSelectedRelease(engine.slug)?.downloadUrl ?? ""}
                        onChange={(event) => {
                          setSelectedReleaseBySlug((current) => ({
                            ...current,
                            [engine.slug]: event.target.value,
                          }));
                        }}
                        className="flex-1 px-2 py-1.5 bg-input-background border border-border rounded text-xs"
                      >
                        {getInstallableReleases(engine.slug).map((release) => (
                          <option key={`${release.version}-${release.downloadUrl}`} value={release.downloadUrl}>
                            {release.version}{release.isPrerelease ? " (pre)" : ""} [{release.platform}] {release.fileName ? `- ${release.fileName}` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={async () => {
                          const release = getSelectedRelease(engine.slug);
                          if (release) {
                            await installSelectedEngine(engine.slug, release.downloadUrl, release.version);
                          }
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-xs"
                      >
                        Install
                      </button>
                      <button
                        onClick={() => handleImport(engine.slug)}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded text-xs"
                      >
                        Import Folder
                      </button>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>

              {engineDownloads.length > 0 && (
                <div className="mt-4 space-y-2">
                  {engineDownloads.map((task) => (
                    <div key={task.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{task.fileName}</span>
                        <span className="text-muted-foreground">{Math.round(task.progress * 100)}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(task.progress * 100)}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{task.message ?? task.status}</p>
                    </div>
                  ))}
                </div>
              )}

              {installError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {installError}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Game Engines</h1>
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Engine
        </button>
      </div>

      {/* Add Engine Dialog */}
      {showAddDialog && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Select an engine to install</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableEngines.map((engine) => (
              (() => {
                const installedCount = installedEngines.filter((entry) => entry.slug === engine.slug).length;
                return (
              <div key={engine.slug} className="px-4 py-3 bg-secondary rounded-lg text-left font-medium">
                <div className="flex items-center gap-3 mb-2">
                  {installingSlug === engine.slug
                    ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    : <Cpu className="w-5 h-5 text-primary" />}
                  <span className="flex-1 text-foreground">{engine.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(getSelectedRelease(engine.slug)?.version ?? "latest")}
                    {installedCount > 0 ? ` • ${installedCount} installed` : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={getSelectedRelease(engine.slug)?.downloadUrl ?? ""}
                    onChange={(event) => {
                      setSelectedReleaseBySlug((current) => ({
                        ...current,
                        [engine.slug]: event.target.value,
                      }));
                    }}
                    className="flex-1 px-2 py-1.5 bg-input-background border border-border rounded text-xs"
                  >
                    {getInstallableReleases(engine.slug).map((release) => (
                      <option key={`${release.version}-${release.downloadUrl}`} value={release.downloadUrl}>
                        {release.version}{release.isPrerelease ? " (pre)" : ""} [{release.platform}] {release.fileName ? `- ${release.fileName}` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const release = getSelectedRelease(engine.slug);
                      if (release) {
                        await installSelectedEngine(engine.slug, release.downloadUrl, release.version);
                      }
                    }}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-xs"
                  >
                    Install
                  </button>
                  <button
                    onClick={() => handleImport(engine.slug)}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded text-xs"
                  >
                    Import Folder
                  </button>
                </div>
              </div>
                );
              })()
            ))}
          </div>

          {engineDownloads.length > 0 && (
            <div className="mt-4 space-y-2">
              {engineDownloads.map((task) => (
                <div key={task.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{task.fileName}</span>
                    <span className="text-muted-foreground">{Math.round(task.progress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(task.progress * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{task.message ?? task.status}</p>
                </div>
              ))}
            </div>
          )}

          {installError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {installError}
            </div>
          )}

          {actionError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {actionError}
            </div>
          )}
        </motion.div>
      )}

      {/* Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installedEngines.map((engine, index) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div onDoubleClick={() => setDefaultEngine(engine.id)}>
              <div className="mb-2 flex items-center gap-2">
                {(() => {
                  const meta = healthMeta(engine.id);
                  const Icon = meta.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${meta.tone}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                  );
                })()}
                {hasUpdateForEngine(engine.slug, engine.version) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded border border-primary/20 bg-primary/10 text-primary">
                    Update available
                  </span>
                )}
              </div>
              <EngineCard
                name={engine.name}
                version={engine.version}
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
            </div>
          </motion.div>
        ))}
      </div>

      {actionError && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {actionError}
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm">
          {notice}
        </div>
      )}

      {/* Engine Info */}
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3">About Game Engines</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Different mods require different game engines to run. FunkHub manages multiple engine installations
          so you can play any mod. Set a default engine for quick launches, or switch between engines based on
          mod requirements.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Detected device platform: {currentPlatform}
        </p>
      </div>

      {manageEngineId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-5">
            {(() => {
              const engine = installedEngines.find((entry) => entry.id === manageEngineId);
              if (!engine) {
                return null;
              }
              return (
                <>
                  <h3 className="text-lg font-semibold text-foreground">Manage {engine.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">v{engine.version}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setDefaultEngine(engine.id)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">Set Default</button>
                    <button onClick={() => openEngineFolder(engine.id).catch((error) => setActionError(error instanceof Error ? error.message : "Failed to open folder"))} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">Open Folder</button>
                    <button onClick={() => openEngineModsFolder(engine.id).catch((error) => setActionError(error instanceof Error ? error.message : "Failed to open mods folder"))} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">Open Mods Folder</button>
                    <button onClick={() => handleUpdate(engine.id)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">Update</button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-xs text-muted-foreground">Executable launcher</label>
                    <select
                      value={manageLauncher}
                      onChange={(event) => setManageLauncher(event.target.value as "native" | "wine" | "wine64" | "proton")}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                    >
                      <option value="native">Native</option>
                      <option value="wine">Wine</option>
                      <option value="wine64">Wine64</option>
                      <option value="proton">Proton</option>
                    </select>
                    {manageLauncher !== "native" && (
                      <input
                        value={manageLauncherPath}
                        onChange={(event) => setManageLauncherPath(event.target.value)}
                        placeholder="Optional launcher binary path (eg /usr/bin/wine)"
                        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                      />
                    )}
                    <input
                      value={manageExecutablePath}
                      onChange={(event) => setManageExecutablePath(event.target.value)}
                      placeholder="Optional executable path inside engine folder"
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Examples: `ALEPsych`, `bin/Funkin.sh`</p>
                  </div>

                  <div className="mt-5 flex justify-between gap-2">
                    <button
                      onClick={() => setConfirmUninstall({ id: engine.id, name: engine.name, version: engine.version, path: engine.installPath })}
                      className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm"
                    >
                      Uninstall
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setManageEngineId(null)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">Close</button>
                      <button onClick={saveManageOverrides} className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm">Save</button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {confirmUninstall && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-foreground">Confirm engine uninstall</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Remove <span className="text-foreground font-medium">{confirmUninstall.name}</span> v{confirmUninstall.version}?
            </p>
            <p className="mt-2 text-xs text-muted-foreground break-all">{confirmUninstall.path}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmUninstall(null)}
                className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = confirmUninstall;
                  setConfirmUninstall(null);
                  setManageEngineId(null);
                  await handleUninstall(target.id);
                }}
                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm"
              >
                Uninstall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
