import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Play, RefreshCw, Trash2, FolderPlus, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

export function Library() {
  const { t } = useI18n();
  const {
    installedMods,
    installedEngines,
    getModProfile,
    removeInstalledMod,
    refreshModUpdates,
    installMod,
    launchInstalledMod,
    browseFolder,
    browseFile,
    openFolderPath,
    addManualMod,
    updateInstalledModLaunchOptions,
  } = useFunkHub();
  const [selectedModId, setSelectedModId] = useState(installedMods[0]?.id);
  const [deleteFilesOnRemove, setDeleteFilesOnRemove] = useState(true);
  const [selectedProfileShots, setSelectedProfileShots] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualVersion, setManualVersion] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualEngineId, setManualEngineId] = useState(installedEngines[0]?.id ?? "");
  const [manualSourcePath, setManualSourcePath] = useState("");
  const [manualStandalone, setManualStandalone] = useState(false);
  const [launchMode, setLaunchMode] = useState<"native" | "wine" | "wine64" | "proton">("native");
  const [launchPath, setLaunchPath] = useState("");
  const [launchExecutablePath, setLaunchExecutablePath] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const selectedMod = installedMods.find((mod) => mod.id === selectedModId) ?? installedMods[0];
  const selectedEngineInstall = useMemo(
    () => installedEngines.find((engine) => selectedMod && selectedMod.installPath.startsWith(engine.installPath)),
    [installedEngines, selectedMod],
  );
  const isStandaloneMod = Boolean(selectedMod && (selectedMod.standalone || selectedMod.installPath.startsWith("executables")));

  useEffect(() => {
    if (!selectedMod) {
      return;
    }
    setLaunchMode(selectedMod.launcher ?? "native");
    setLaunchPath(selectedMod.launcherPath ?? "");
    setLaunchExecutablePath(selectedMod.executablePath ?? "");
  }, [selectedMod?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedMod) {
      setSelectedProfileShots([]);
      return;
    }

    if (selectedMod.screenshotUrls && selectedMod.screenshotUrls.length > 0) {
      setSelectedProfileShots(Array.from(new Set(selectedMod.screenshotUrls)));
      return;
    }

    if (selectedMod.manual || selectedMod.modId <= 0) {
      setSelectedProfileShots([]);
      return;
    }

    getModProfile(selectedMod.modId)
      .then((profile) => {
        if (cancelled) {
          return;
        }
        const shots = (profile.screenshotUrls ?? []).filter(Boolean);
        const deduped = Array.from(new Set(shots));
        setSelectedProfileShots(deduped);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedProfileShots([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMod?.modId, getModProfile]);

  useEffect(() => {
    if (!manualEngineId && installedEngines.length > 0) {
      setManualEngineId(installedEngines[0].id);
    }
  }, [installedEngines, manualEngineId]);

  if (!selectedMod) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("library.empty", "No installed mods yet. Install one from Discover.")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mod List */}
      <div className="w-full lg:w-80 bg-card border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">{t("library.installedMods", "Installed Mods")} ({installedMods.length})</h2>
            <button
              onClick={() => setShowManualModal(true)}
              className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs inline-flex items-center gap-1"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              {t("library.addManual", "Add Manual")}
            </button>
          </div>
        </div>
        <div className="p-2 space-y-1">
          {installedMods.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedModId(mod.id)}
              className={`
                w-full text-left p-3 rounded-lg transition-all
                ${
                  selectedMod.id === mod.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-secondary border border-transparent"
                }
              `}
            >
              <div className="flex gap-3">
                <img
                  src={mod.thumbnailUrl ?? "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400"}
                  alt={mod.modName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">{mod.modName}</h3>
                    {mod.updateAvailable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">{t("library.update", "Update")}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mod.version ? `v${mod.version}` : t("library.versionUnknown", "Version unknown")}</p>
                  <p className="text-xs text-muted-foreground">{mod.categoryName ?? mod.engine ?? t("library.uncategorized", "Uncategorized")}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mod Details */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <motion.div
          key={selectedMod.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
          className="p-4 md:p-6 lg:p-8"
        >
          {/* Banner */}
          <div className="relative h-56 md:h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={selectedMod.thumbnailUrl ?? "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400"}
                alt={selectedMod.modName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">{selectedMod.modName}</h1>
                <p className="text-muted-foreground">{t("library.by", "by")} {selectedMod.author ?? t("library.unknown", "Unknown")}</p>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => launchInstalledMod(selectedMod.id)}
              className="flex-1 max-w-xs px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {t("library.launchMod", "Launch Mod")}
            </button>
            <button className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              {selectedMod.updateAvailable ? t("library.updateAvailable", "Update Available") : t("library.checkUpdate", "Check Update")}
            </button>
            {selectedMod.updateAvailable && (
              <button
                onClick={() => installMod(selectedMod.modId, selectedMod.sourceFileId, undefined, 10)}
                className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                {t("library.installUpdate", "Install Update")}
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  await openFolderPath(selectedMod.installPath);
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : t("library.openModFolderFailed", "Failed to open mod folder"));
                }
              }}
              className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-5 h-5" />
              {t("library.openModFolder", "Open Mod Folder")}
            </button>
            <button
              onClick={() => removeInstalledMod(selectedMod.id, { deleteFiles: deleteFilesOnRemove })}
              className="px-6 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {t("library.remove", "Remove")}
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <input
              type="checkbox"
              checked={deleteFilesOnRemove}
              onChange={(event) => setDeleteFilesOnRemove(event.target.checked)}
            />
            {t("library.deleteFilesOnRemove", "Delete mod files from disk when removing")}
          </label>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t("library.version", "Version")}</p>
                <p className="text-lg font-semibold text-foreground">
                 {selectedMod.version ? `v${selectedMod.version}` : t("library.versionUnknown", "Version unknown")}
                 {selectedMod.latestVersion ? ` -> v${selectedMod.latestVersion}` : ""}
                </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">{t("library.requiredEngine", "Required Engine")}</p>
              <p className="text-lg font-semibold text-foreground">{isStandaloneMod ? t("library.standalone", "Standalone") : (selectedMod.requiredEngine ?? selectedMod.engine)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">{t("library.installedDate", "Installed Date")}</p>
              <p className="text-lg font-semibold text-foreground">
                {new Date(selectedMod.installedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">{t("library.installedLocation", "Installed Location")}</p>
            <p className="text-sm text-foreground font-medium">
              {isStandaloneMod
                ? t("library.standalonePackage", "Standalone executable package")
                : (selectedEngineInstall
                  ? `${selectedEngineInstall.name} v${selectedEngineInstall.version}`
                  : t("library.unknownEngineInstall", "Unknown engine installation"))}
            </p>
            <p className="text-xs text-muted-foreground mt-1 break-all">{selectedMod.installPath}</p>
          </div>

          {isStandaloneMod && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-3">{t("library.launchSettings", "Launch Settings")}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">{t("library.launcher", "Launcher")}</label>
                  <select
                    value={launchMode}
                    onChange={(event) => setLaunchMode(event.target.value as "native" | "wine" | "wine64" | "proton")}
                    className="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                  >
                    <option value="native">{t("library.native", "Native")}</option>
                    <option value="wine">{t("library.wine", "Wine")}</option>
                    <option value="wine64">{t("library.wine64", "Wine64")}</option>
                    <option value="proton">{t("library.proton", "Proton")}</option>
                  </select>
                </div>

                {launchMode !== "native" && (
                  <div className="flex gap-2">
                    <input
                      value={launchPath}
                      onChange={(event) => setLaunchPath(event.target.value)}
                      placeholder={t("library.optionalLauncherPath", "Optional launcher path")}
                      className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                    />
                    <button
                      onClick={async () => {
                        const selected = await browseFile({ title: t("library.selectLauncherBinary", "Select launcher binary"), defaultPath: launchPath || undefined });
                        if (selected) {
                          setLaunchPath(selected);
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                    >
                      {t("library.browse", "Browse")}
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={launchExecutablePath}
                    onChange={(event) => setLaunchExecutablePath(event.target.value)}
                    placeholder={t("library.optionalExecutablePath", "Optional executable path")}
                    className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                  />
                  <button
                    onClick={async () => {
                        const selected = await browseFile({ title: t("library.selectExecutable", "Select executable"), defaultPath: launchExecutablePath || undefined });
                      if (selected) {
                        setLaunchExecutablePath(selected);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                  >
                      {t("library.browse", "Browse")}
                  </button>
                </div>

                <button
                  onClick={async () => {
                    await updateInstalledModLaunchOptions(selectedMod.id, {
                      launcher: launchMode,
                      launcherPath: launchPath,
                      executablePath: launchExecutablePath,
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                >
                  {t("library.saveLaunchSettings", "Save Launch Settings")}
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-3">{t("library.aboutMod", "About this mod")}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {selectedMod.description
                ? selectedMod.description
                : `${selectedMod.modName} is installed from GameBanana and managed by FunkHub. This package is installed into the selected engine path and can be launched with ${selectedMod.engine}.`}
            </p>
            {selectedMod.developers && selectedMod.developers.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-1">{t("library.developers", "Developers")}</p>
                <p className="text-sm text-foreground">{selectedMod.developers.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Screenshots */}
          {selectedProfileShots.length > 1 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t("library.screenshots", "Screenshots")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProfileShots.map((shot, index) => (
                  <button
                    key={`${shot}-${index}`}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border/60 hover:border-primary/40 transition-colors"
                  >
                    <img
                      src={shot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <button
        onClick={() => refreshModUpdates()}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 px-4 py-2 rounded-lg bg-card border border-border hover:bg-secondary text-sm"
      >
        {t("library.refreshUpdateStatus", "Refresh Update Status")}
      </button>

      <Dialog open={previewIndex !== null} onOpenChange={(next) => { if (!next) setPreviewIndex(null); }}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          {previewIndex !== null && selectedProfileShots[previewIndex] && (
            <div className="relative bg-black">
              <img
                src={selectedProfileShots[previewIndex]}
                alt={`Screenshot ${previewIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
              {selectedProfileShots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((current) => {
                      if (current === null) {
                        return 0;
                      }
                      return (current - 1 + selectedProfileShots.length) % selectedProfileShots.length;
                    })}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((current) => {
                      if (current === null) {
                        return 0;
                      }
                      return (current + 1) % selectedProfileShots.length;
                    })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("library.addManualMod", "Add Manual Mod")}</DialogTitle>
            <DialogDescription>{t("library.addManualModDesc", "Import a local mod folder into an installed engine or as standalone.")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <div>
              <label htmlFor="manual-mod-name" className="mb-1 block text-xs text-muted-foreground">{t("library.modName", "Mod name")}</label>
              <input id="manual-mod-name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label htmlFor="manual-mod-author" className="mb-1 block text-xs text-muted-foreground">{t("library.authorOptional", "Author (optional)")}</label>
              <input id="manual-mod-author" value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label htmlFor="manual-mod-version" className="mb-1 block text-xs text-muted-foreground">{t("library.versionOptional", "Version (optional)")}</label>
              <input id="manual-mod-version" value={manualVersion} onChange={(e) => setManualVersion(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label htmlFor="manual-mod-description" className="mb-1 block text-xs text-muted-foreground">{t("library.descriptionOptional", "Description (optional)")}</label>
              <textarea id="manual-mod-description" value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm min-h-20" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={manualStandalone} onChange={(event) => setManualStandalone(event.target.checked)} />
              {t("library.importStandalone", "Import as standalone executable package")}
            </label>
            {!manualStandalone && (
              <div>
                <label htmlFor="manual-mod-engine" className="mb-1 block text-xs text-muted-foreground">{t("library.targetEngine", "Target engine")}</label>
                <select id="manual-mod-engine" value={manualEngineId} onChange={(e) => setManualEngineId(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm">
                  {installedEngines.map((engine) => (
                    <option key={engine.id} value={engine.id}>{engine.name} ({engine.version})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="manual-mod-source" className="mb-1 block text-xs text-muted-foreground">{t("library.modFolderPath", "Mod folder path")}</label>
              <div className="flex gap-2">
                <input id="manual-mod-source" value={manualSourcePath} onChange={(e) => setManualSourcePath(e.target.value)} className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                <button
                  onClick={async () => {
                    const selected = await browseFolder({ title: t("library.selectModFolder", "Select mod folder") });
                    if (selected) {
                      setManualSourcePath(selected);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                >
                  {t("library.browse", "Browse")}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setShowManualModal(false)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("library.cancel", "Cancel")}</button>
            <button
              onClick={async () => {
                try {
                  await addManualMod({
                    modName: manualName,
                    engineId: manualStandalone ? undefined : manualEngineId,
                    sourcePath: manualSourcePath || undefined,
                    description: manualDescription,
                    version: manualVersion,
                    author: manualAuthor,
                    standalone: manualStandalone,
                  });
                  setShowManualModal(false);
                  setManualName("");
                  setManualAuthor("");
                  setManualVersion("");
                  setManualDescription("");
                  setManualSourcePath("");
                  setManualStandalone(false);
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : t("library.addManualError", "Failed to add manual mod"));
                }
              }}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            >
              {t("library.importMod", "Import Mod")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
