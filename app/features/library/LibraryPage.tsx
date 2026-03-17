import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RefreshCw, Trash2, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Settings2, Square, Clock, ImagePlus, Eye, EyeOff, Search, Layers, Tag, X, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFunkHub, useI18n } from "../../providers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";
import { Checkbox } from "../../shared/ui/checkbox";
import { formatEngineName, type EngineSlug } from "../../services/funkhub";
import { getEngineIcon } from "../engines/engineIcons";

type SortBy = "newest" | "oldest" | "name" | "nameDesc" | "mostPlayed" | "engine" | "updates";

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
    setModCustomImage,
    setModEnabled,
    setModTags,
    detectWineRuntimes,
  } = useFunkHub();
  const [selectedModId, setSelectedModId] = useState(installedMods[0]?.id);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [groupByEngine, setGroupByEngine] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [collectionTargetId, setCollectionTargetId] = useState<string | null>(null);
  const [newCollectionInput, setNewCollectionInput] = useState("");
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
  const [detectedRuntimes, setDetectedRuntimes] = useState<Array<{ type: "wine" | "wine64" | "proton"; path: string; label: string }> | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const selectedMod = installedMods.find((mod) => mod.id === selectedModId) ?? installedMods[0];
  const isRunning = Boolean(selectedMod && runningLaunchIds.has(selectedMod.id));
  const selectedEngineInstall = useMemo(
    () => installedEngines.find((engine) => selectedMod && selectedMod.installPath.startsWith(engine.installPath)),
    [installedEngines, selectedMod],
  );
  const isStandaloneMod = Boolean(selectedMod && (selectedMod.standalone || selectedMod.installPath.startsWith("executables")));

  const allCollections = useMemo(() => {
    const set = new Set<string>();
    for (const mod of installedMods) {
      for (const tag of (mod.tags ?? [])) set.add(tag);
    }
    return Array.from(set).sort();
  }, [installedMods]);

  const displayedMods = useMemo(() => {
    let mods = [...installedMods];
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.trim().toLowerCase();
      mods = mods.filter((m) => m.modName.toLowerCase().includes(q) || m.author?.toLowerCase().includes(q));
    }
    if (activeCollection) {
      mods = mods.filter((m) => m.tags?.includes(activeCollection));
    }
    switch (sortBy) {
      case "name": mods.sort((a, b) => a.modName.localeCompare(b.modName)); break;
      case "nameDesc": mods.sort((a, b) => b.modName.localeCompare(a.modName)); break;
      case "newest": mods.sort((a, b) => b.installedAt - a.installedAt); break;
      case "oldest": mods.sort((a, b) => a.installedAt - b.installedAt); break;
      case "mostPlayed": mods.sort((a, b) => (b.totalPlayTimeMs ?? 0) - (a.totalPlayTimeMs ?? 0)); break;
      case "engine": mods.sort((a, b) => (a.engine ?? "zzz").localeCompare(b.engine ?? "zzz")); break;
      case "updates": mods.sort((a, b) => Number(b.updateAvailable ?? false) - Number(a.updateAvailable ?? false)); break;
    }
    return mods;
  }, [installedMods, sidebarSearch, sortBy, activeCollection]);

  const groupedMods = useMemo(() => {
    if (!groupByEngine) return null;
    const groups = new Map<string, typeof installedMods>();
    for (const mod of displayedMods) {
      const isStandalone = mod.standalone || mod.installPath.startsWith("executables");
      const key = isStandalone ? "__standalone__" : (mod.engine ?? "__unknown__");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(mod);
    }
    return groups;
  }, [displayedMods, groupByEngine]);

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

  const renderModRow = (mod: (typeof installedMods)[number]) => (
    <div
      key={mod.id}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedModId(mod.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedModId(mod.id); } }}
      className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer ${
        selectedMod?.id === mod.id
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-secondary border border-transparent"
      }`}
    >
      <div className="flex gap-2.5">
        <div className="relative w-10 h-10 shrink-0">
          <img
            src={mod.thumbnailUrl ?? "/mod-placeholder.svg"}
            alt={mod.modName}
            className={`w-10 h-10 rounded-lg object-cover ${mod.enabled === false ? "opacity-40" : ""}`}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setModEnabled(mod.id, mod.enabled === false); }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 hover:bg-black/40 opacity-0 hover:opacity-100 transition-all"
            aria-label={mod.enabled === false ? t("library.enableMod", "Enable mod") : t("library.disableMod", "Disable mod")}
            title={mod.enabled === false ? t("library.enableMod", "Enable mod") : t("library.disableMod", "Disable mod")}
          >
            {mod.enabled === false ? <EyeOff className="w-3.5 h-3.5 text-white" /> : <Eye className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <h3 className="font-medium text-foreground text-sm truncate flex-1">{mod.modName}</h3>
            {mod.enabled === false && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{t("library.modDisabled", "Disabled")}</span>
            )}
            {runningLaunchIds.has(mod.id) && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-success/15 text-success shrink-0 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                {t("library.running", "Running")}
              </span>
            )}
            {mod.updateAvailable && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary shrink-0">{t("library.update", "Update")}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setCollectionTargetId(mod.id); setNewCollectionInput(""); }}
              className="shrink-0 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label={t("library.manageCollections", "Manage collections")}
              title={t("library.manageCollections", "Manage collections")}
            >
              <Tag className="w-3 h-3" />
            </button>
          </div>
          {mod.categoryName && !groupByEngine && <p className="text-xs text-muted-foreground truncate">{mod.categoryName}</p>}
          {mod.tags && mod.tags.length > 0 && (
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {mod.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
          {!mod.tags?.length && (
            <div className="flex items-center gap-1 mt-0.5">
              {(() => {
                const isStandalone = mod.standalone || mod.installPath.startsWith("executables");
                if (isStandalone) {
                  return <p className="text-xs text-muted-foreground truncate">{t("library.standalone", "Standalone")}</p>;
                }
                return (
                  <>
                    {mod.engine && (
                      <img src={getEngineIcon(mod.engine as EngineSlug)} alt="" className="w-3 h-3 object-contain shrink-0" loading="lazy" />
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {mod.engine ? formatEngineName(mod.engine as EngineSlug) : (mod.version ? `v${mod.version}` : "")}
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
        <div className="p-3 border-b border-border space-y-2">
          {/* Header row */}
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

          {/* Collections chips */}
          {allCollections.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              <button
                onClick={() => setActiveCollection(null)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCollection === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("library.allMods", "All")}
              </button>
              {allCollections.map((col) => (
                <button
                  key={col}
                  onClick={() => setActiveCollection(col === activeCollection ? null : col)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCollection === col ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          )}

          {/* Search + sort + group controls */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder={t("library.search", "Search...")}
                className="w-full pl-8 pr-7 py-1.5 bg-input-background border border-border rounded-lg text-sm"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t("library.clearSearch", "Clear search")}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-2 py-1.5 bg-input-background border border-border rounded-lg text-xs text-muted-foreground cursor-pointer"
              aria-label={t("library.sortBy", "Sort by")}
            >
              <option value="newest">{t("library.sortNewest", "Newest")}</option>
              <option value="oldest">{t("library.sortOldest", "Oldest")}</option>
              <option value="name">{t("library.sortName", "A–Z")}</option>
              <option value="nameDesc">{t("library.sortNameDesc", "Z–A")}</option>
              <option value="mostPlayed">{t("library.sortMostPlayed", "Played")}</option>
              <option value="engine">{t("library.sortEngine", "Engine")}</option>
              <option value="updates">{t("library.sortUpdates", "Updates")}</option>
            </select>
            <button
              onClick={() => setGroupByEngine((g) => !g)}
              className={`p-1.5 rounded-lg border transition-colors ${groupByEngine ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              aria-label={t("library.groupByEngine", "Group by engine")}
              title={t("library.groupByEngine", "Group by engine")}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {displayedMods.length === 0 && installedMods.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-6 px-3">{t("library.noModsMatch", "No mods match your filter.")}</p>
          )}

          {groupedMods ? (
            Array.from(groupedMods.entries()).map(([engineKey, mods]) => {
              const engineInstall = installedEngines.find((e) => e.slug === engineKey);
              const groupLabel =
                engineKey === "__standalone__"
                  ? t("library.standalone", "Standalone")
                  : engineKey === "__unknown__"
                    ? t("library.unknownEngine", "Unknown Engine")
                    : (engineInstall?.customName ?? engineInstall?.name ?? formatEngineName(engineKey as EngineSlug));
              return (
                <div key={engineKey}>
                  <div className="flex items-center gap-2 px-1 pt-2 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {engineInstall && (
                      <img src={engineInstall.customIconUrl ?? getEngineIcon(engineInstall.slug)} alt="" className="w-3 h-3 object-contain" />
                    )}
                    <span className="truncate">{groupLabel}</span>
                    <span className="ml-auto font-normal normal-case">{mods.length}</span>
                  </div>
                  {mods.map((mod) => renderModRow(mod))}
                </div>
              );
            })
          ) : (
            displayedMods.map((mod) => renderModRow(mod))
          )}
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
            <div className="relative h-64 md:h-80 overflow-hidden group">
              <img
                src={selectedMod.thumbnailUrl ?? "/mod-placeholder.svg"}
                alt={selectedMod.modName}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <button
                onClick={async () => {
                  const path = await browseFile({ title: t("library.chooseImage", "Choose Image"), filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }] });
                  if (path) setModCustomImage(selectedMod.id, `file://${path}`);
                }}
                className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t("library.changeImage", "Change image")}
                title={t("library.changeImage", "Change image")}
              >
                <ImagePlus className="w-4 h-4" />
              </button>
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
              <>
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
                  <button
                    onClick={async () => {
                      const runtimes = await detectWineRuntimes();
                      setDetectedRuntimes(runtimes);
                    }}
                    className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm whitespace-nowrap"
                  >
                    {t("library.detect", "Detect")}
                  </button>
                </div>
                {detectedRuntimes !== null && detectedRuntimes.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("library.noRuntimesFound", "No Wine/Proton runtimes detected.")}</p>
                )}
                {detectedRuntimes !== null && detectedRuntimes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("library.detectedRuntimes", "Detected runtimes — click to use:")}</p>
                    {detectedRuntimes.map((rt) => (
                      <button
                        key={rt.path}
                        onClick={() => {
                          setLaunchMode(rt.type);
                          setLaunchPath(rt.path);
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

      {/* Collection management dialog */}
      {(() => {
        const targetMod = collectionTargetId ? installedMods.find((m) => m.id === collectionTargetId) : null;
        return (
          <Dialog open={Boolean(collectionTargetId)} onOpenChange={(open) => { if (!open) setCollectionTargetId(null); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("library.manageCollections", "Manage Collections")}</DialogTitle>
                <DialogDescription>
                  {targetMod ? targetMod.modName : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-1">
                {allCollections.map((col) => {
                  const isInCollection = Boolean(targetMod?.tags?.includes(col));
                  return (
                    <button
                      key={col}
                      onClick={() => {
                        if (!targetMod) return;
                        const current = targetMod.tags ?? [];
                        const next = isInCollection ? current.filter((t) => t !== col) : [...current, col];
                        setModTags(targetMod.id, next);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isInCollection ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                        {isInCollection && <Check className="w-3 h-3" />}
                      </span>
                      {col}
                    </button>
                  );
                })}
                {allCollections.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 pb-1">{t("library.noCollections", "No collections yet. Create one below.")}</p>
                )}
              </div>
              {/* New collection input */}
              <div className="mt-3 flex gap-2">
                <input
                  value={newCollectionInput}
                  onChange={(e) => setNewCollectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCollectionInput.trim() && targetMod) {
                      const name = newCollectionInput.trim();
                      const current = targetMod.tags ?? [];
                      if (!current.includes(name)) setModTags(targetMod.id, [...current, name]);
                      setNewCollectionInput("");
                    }
                  }}
                  placeholder={t("library.newCollection", "New collection name...")}
                  className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    const name = newCollectionInput.trim();
                    if (!name || !targetMod) return;
                    const current = targetMod.tags ?? [];
                    if (!current.includes(name)) setModTags(targetMod.id, [...current, name]);
                    setNewCollectionInput("");
                  }}
                  disabled={!newCollectionInput.trim()}
                  className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setCollectionTargetId(null)}
                  className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
                >
                  {t("library.done", "Done")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
