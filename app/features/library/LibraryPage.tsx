import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RefreshCw, Trash2, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Settings2, Square, Clock } from "lucide-react";
import { toast } from "sonner";
import { useFunkHub, useI18n } from "../../providers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";
import { Checkbox } from "../../shared/ui/checkbox";
import { formatEngineName, type EngineSlug } from "../../services/funkhub";
import { getEngineIcon } from "../engines/engineIcons";

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
    runningLaunchIds,
    killLaunch,
    clearModPlayTime,
  } = useFunkHub();
  const [selectedModId, setSelectedModId] = useState(installedMods[0]?.id);
  const [deleteFilesOnRemove, setDeleteFilesOnRemove] = useState(true);
  const [selectedProfileShots, setSelectedProfileShots] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showLaunchSettings, setShowLaunchSettings] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
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
  const [carouselIndex, setCarouselIndex] = useState(0);

  const selectedMod = installedMods.find((mod) => mod.id === selectedModId) ?? installedMods[0];
  const isRunning = Boolean(selectedMod && runningLaunchIds.has(selectedMod.id));
  const selectedEngineInstall = useMemo(
    () => installedEngines.find((engine) => selectedMod && selectedMod.installPath.startsWith(engine.installPath)),
    [installedEngines, selectedMod],
  );
  const isStandaloneMod = Boolean(selectedMod && (selectedMod.standalone || selectedMod.installPath.startsWith("executables")));

  const formatPlayTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${totalSeconds}s`;
  };

  useEffect(() => {
    if (!selectedMod) {
      return;
    }
    setLaunchMode(selectedMod.launcher ?? "native");
    setLaunchPath(selectedMod.launcherPath ?? "");
    setLaunchExecutablePath(selectedMod.executablePath ?? "");
  }, [selectedMod?.id]);

  useEffect(() => {
    setCarouselIndex(0);
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
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
          <Play className="w-9 h-9 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-center max-w-sm">
          {t("library.empty", "No installed mods yet. Install one from Discover.")}
        </p>
        <button
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
        >
          <FolderPlus className="w-4 h-4" />
          {t("library.addManual", "Add Manual")}
        </button>
      </div>
    );
  }

  const hasScreenshots = selectedProfileShots.length > 0;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mod List */}
      <div className="w-full lg:w-72 bg-card border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t("library.installedMods", "Installed Mods")} <span className="text-muted-foreground font-normal">({installedMods.length})</span>
            </span>
            <button
              onClick={() => setShowManualModal(true)}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("library.addManual", "Add Manual")}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {installedMods.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedModId(mod.id)}
              className={`w-full text-left p-2.5 rounded-lg transition-all ${
                selectedMod.id === mod.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-secondary border border-transparent"
              }`}
            >
              <div className="flex gap-2.5">
                <img
                  src={mod.thumbnailUrl ?? "/mod-placeholder.svg"}
                  alt={mod.modName}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-medium text-foreground text-sm truncate">{mod.modName}</h3>
                    {runningLaunchIds.has(mod.id) && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-success/15 text-success shrink-0 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                        {t("library.running", "Running")}
                      </span>
                    )}
                    {mod.updateAvailable && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary shrink-0">{t("library.update", "Update")}</span>
                    )}
                  </div>
                  {mod.categoryName && <p className="text-xs text-muted-foreground truncate">{mod.categoryName}</p>}
                  <div className="flex items-center gap-1 mt-0.5">
                    {mod.engine && (
                      <img src={getEngineIcon(mod.engine as EngineSlug)} alt="" className="w-3 h-3 object-contain shrink-0" loading="lazy" />
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {mod.engine ? formatEngineName(mod.engine as EngineSlug) : (mod.version ? `v${mod.version}` : "")}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mod Detail */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMod.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Hero Banner */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={selectedMod.thumbnailUrl ?? "/mod-placeholder.svg"}
                alt={selectedMod.modName}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-1 drop-shadow-sm">{selectedMod.modName}</h1>
                  {selectedMod.author && <p className="text-sm text-muted-foreground">{t("library.by", "by")} {selectedMod.author}</p>}
                </div>
                {/* Action cluster */}
                <div className="flex items-center gap-2 shrink-0">
                  {isRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-success font-medium shrink-0">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      {t("library.running", "Running")}
                    </span>
                  )}
                  {selectedMod.updateAvailable && (
                    <button
                      onClick={() => installMod(selectedMod.modId, selectedMod.sourceFileId, undefined, 10)}
                      className="h-9 px-3 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("library.installUpdate", "Update")}
                    </button>
                  )}
                  {isRunning ? (
                    <button
                      onClick={() => killLaunch(selectedMod.id).catch((error) => toast.error(error instanceof Error ? error.message : t("library.stopFailed", "Failed to stop mod")))}
                      className="h-9 px-4 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Square className="w-4 h-4" fill="currentColor" />
                      {t("library.stopMod", "Stop")}
                    </button>
                  ) : (
                    <motion.button
                      onClick={() => launchInstalledMod(selectedMod.id).catch((error) => toast.error(error instanceof Error ? error.message : t("library.launchFailed", "Failed to launch mod")))}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.93 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <motion.span
                        className="inline-flex"
                        whileHover={{ rotate: [0, -15, 15, -8, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <Play className="w-4 h-4" fill="currentColor" />
                      </motion.span>
                      {t("library.launchMod", "Launch")}
                    </motion.button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await openFolderPath(selectedMod.installPath);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : t("library.openModFolderFailed", "Failed to open mod folder"));
                      }
                    }}
                    className="h-9 w-9 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors"
                    aria-label={t("library.openModFolder", "Open Mod Folder")}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  {isStandaloneMod && (
                    <button
                      onClick={() => setShowLaunchSettings(true)}
                      className="h-9 w-9 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors"
                      aria-label={t("library.launchSettings", "Launch Settings")}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowRemoveConfirm(true)}
                    className="h-9 w-9 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors"
                    aria-label={t("library.remove", "Remove mod")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-6">
              {/* Screenshots / Media — front and center */}
              {hasScreenshots && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-3">{t("library.screenshots", "Screenshots")}</h2>
                  <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary">
                    <img
                      src={selectedProfileShots[carouselIndex]}
                      alt={`${selectedMod.modName} screenshot ${carouselIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    {selectedProfileShots.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label={t("library.previousScreenshot", "Previous screenshot")}
                          onClick={() => setCarouselIndex((i) => (i - 1 + selectedProfileShots.length) % selectedProfileShots.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("library.nextScreenshot", "Next screenshot")}
                          onClick={() => setCarouselIndex((i) => (i + 1) % selectedProfileShots.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        {/* Dot indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {selectedProfileShots.map((_, i) => (
                            <button
                              key={i}
                              aria-label={`Screenshot ${i + 1}`}
                              onClick={() => setCarouselIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIndex ? "bg-white w-3" : "bg-white/50"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {selectedProfileShots.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {selectedProfileShots.map((shot, i) => (
                        <button
                          key={`${shot}-${i}`}
                          type="button"
                          aria-label={`Screenshot ${i + 1}`}
                          onClick={() => { setCarouselIndex(i); setPreviewIndex(i); }}
                          className={`shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${i === carouselIndex ? "border-primary" : "border-transparent hover:border-border"}`}
                        >
                          <img src={shot} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">{t("library.aboutMod", "About")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedMod.description
                    ? selectedMod.description
                    : `${selectedMod.modName} ${t("library.descFallback", "is installed from GameBanana and managed by FunkHub.")}`}
                </p>
                {selectedMod.developers && selectedMod.developers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMod.developers.map((dev) => (
                      <span key={dev} className="text-xs px-2 py-1 rounded-full border border-border bg-secondary text-muted-foreground">{dev}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta strip */}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("library.version", "Version")}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedMod.version ? `v${selectedMod.version}` : "—"}
                    {selectedMod.latestVersion ? <span className="text-primary ml-1 text-xs">→ v{selectedMod.latestVersion}</span> : null}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("library.requiredEngine", "Engine")}</p>
                  {isStandaloneMod ? (
                    <p className="text-sm font-semibold text-foreground truncate">{t("library.standalone", "Standalone")}</p>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {selectedEngineInstall && (
                        <img
                          src={selectedEngineInstall.customIconUrl ?? getEngineIcon(selectedEngineInstall.slug)}
                          alt=""
                          className="w-4 h-4 object-contain shrink-0"
                          loading="lazy"
                        />
                      )}
                      <p className="text-sm font-semibold text-foreground truncate">
                        {selectedEngineInstall
                          ? (selectedEngineInstall.customName ?? selectedEngineInstall.name)
                          : formatEngineName((selectedMod.requiredEngine ?? selectedMod.engine) as EngineSlug)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("library.installedDate", "Installed")}</p>
                  <p className="text-sm font-semibold text-foreground">{new Date(selectedMod.installedAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 relative group">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t("library.playTime", "Play Time")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedMod.totalPlayTimeMs && selectedMod.totalPlayTimeMs > 0
                      ? formatPlayTime(selectedMod.totalPlayTimeMs)
                      : "—"}
                  </p>
                  {selectedMod.totalPlayTimeMs != null && selectedMod.totalPlayTimeMs > 0 && (
                    <button
                      onClick={() => clearModPlayTime(selectedMod.id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-destructive/40"
                      title={t("library.clearPlayTime", "Clear play time")}
                    >
                      {t("library.clear", "Clear")}
                    </button>
                  )}
                </div>
              </div>

              {/* Install path — subtle */}
              <div className="text-xs text-muted-foreground border-t border-border pt-4">
                <span className="font-medium text-foreground/60">{t("library.installedLocation", "Location")}: </span>
                <span className="break-all font-mono">{selectedMod.installPath}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Refresh FAB */}
      <button
        onClick={() => { refreshModUpdates(); toast.success(t("library.checkingUpdates", "Checking for updates...")); }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-10 px-4 rounded-lg bg-card border border-border hover:bg-secondary text-sm flex items-center gap-2 shadow-sm"
        aria-label={t("library.refreshUpdateStatus", "Refresh update status")}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {t("library.refreshUpdateStatus", "Refresh Update Status")}
      </button>

      {/* Screenshot lightbox */}
      <Dialog open={previewIndex !== null} onOpenChange={(next) => { if (!next) setPreviewIndex(null); }}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("library.screenshotPreview", "Screenshot Preview")}</DialogTitle>
            <DialogDescription>{t("library.screenshotPreviewDesc", "Full-size screenshot viewer")}</DialogDescription>
          </DialogHeader>
          {previewIndex !== null && selectedProfileShots[previewIndex] && (
            <div className="relative bg-black">
              <img
                src={selectedProfileShots[previewIndex]}
                alt={`${selectedMod.modName} screenshot ${previewIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
              {selectedProfileShots.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={t("library.previousScreenshot", "Previous screenshot")}
                    onClick={() => setPreviewIndex((current) => {
                      if (current === null) return 0;
                      return (current - 1 + selectedProfileShots.length) % selectedProfileShots.length;
                    })}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("library.nextScreenshot", "Next screenshot")}
                    onClick={() => setPreviewIndex((current) => {
                      if (current === null) return 0;
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

      {/* Remove confirm dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("library.confirmRemove", "Remove mod?")}</DialogTitle>
            <DialogDescription>
              {t("library.confirmRemoveDesc", "This will remove")} <span className="font-medium text-foreground">{selectedMod.modName}</span> {t("library.confirmRemoveDesc2", "from FunkHub.")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex items-center gap-2">
            <Checkbox
              id="delete-files"
              checked={deleteFilesOnRemove}
              onCheckedChange={(checked: boolean | "indeterminate") => setDeleteFilesOnRemove(checked === true)}
            />
            <label htmlFor="delete-files" className="text-sm text-muted-foreground cursor-pointer">
              {t("library.deleteFilesOnRemove", "Also delete files from disk")}
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setShowRemoveConfirm(false)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("library.cancel", "Cancel")}</button>
            <button
              onClick={() => {
                removeInstalledMod(selectedMod.id, { deleteFiles: deleteFilesOnRemove });
                setShowRemoveConfirm(false);
                toast.success(t("library.modRemoved", "Mod removed."));
              }}
              className="px-3 py-2 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive text-sm"
            >
              {t("library.remove", "Remove")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Launch settings dialog (standalone only) */}
      <Dialog open={showLaunchSettings} onOpenChange={setShowLaunchSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("library.launchSettings", "Launch Settings")}</DialogTitle>
            <DialogDescription>{t("library.launchSettingsDesc", "Configure how this standalone mod is launched.")}</DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3">
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
                    if (selected) setLaunchPath(selected);
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
                  if (selected) setLaunchExecutablePath(selected);
                }}
                className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
              >
                {t("library.browse", "Browse")}
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setShowLaunchSettings(false)} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm">{t("library.cancel", "Cancel")}</button>
            <button
              onClick={async () => {
                await updateInstalledModLaunchOptions(selectedMod.id, {
                  launcher: launchMode,
                  launcherPath: launchPath,
                  executablePath: launchExecutablePath,
                });
                setShowLaunchSettings(false);
                toast.success(t("library.launchSettingsSaved", "Launch settings saved."));
              }}
              className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            >
              {t("library.saveLaunchSettings", "Save")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Manual Mod dialog */}
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="manual-standalone"
                checked={manualStandalone}
                onCheckedChange={(checked: boolean | "indeterminate") => setManualStandalone(checked === true)}
              />
              <label htmlFor="manual-standalone" className="text-sm text-muted-foreground cursor-pointer">{t("library.importStandalone", "Import as standalone executable package")}</label>
            </div>
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
                    if (selected) setManualSourcePath(selected);
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
                  toast.success(t("library.modAdded", "Mod added to library."));
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : t("library.addManualError", "Failed to add manual mod"));
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
