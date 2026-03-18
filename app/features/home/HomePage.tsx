import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, Compass, Cpu, Download, RefreshCw, Package, ChevronRight, Square } from "lucide-react";
import { useNavigate } from "react-router";
import { ModCard, ModVisualizerModal } from "../mods";
import { useFunkHub, useI18n } from "../../providers";
import { formatEngineName, type EngineSlug } from "../../services/funkhub";
import { getEngineIcon } from "../engines/engineIcons";

function formatDuration(ms: number | undefined): string {
  if (!ms || ms <= 0) return "";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const {
    loading,
    bestOfMods,
    installedMods,
    installedEngines,
    modUpdates,
    downloads,
    launchInstalledMod,
    runningLaunchIds,
    getEngineHealth,
    settings,
  } = useFunkHub();
  const shouldAnimate = (settings?.showAnimations ?? true) && !prefersReducedMotion;

  const [selectedModId, setSelectedModId] = useState<number | undefined>(undefined);

  const recentMods = useMemo(
    () =>
      [...installedMods]
        .sort((a, b) => (b.lastLaunchedAt ?? b.installedAt) - (a.lastLaunchedAt ?? a.installedAt))
        .slice(0, 8),
    [installedMods],
  );

  const heroMod = recentMods[0];
  const quickLaunchMods = useMemo(() => {
    const pinned = installedMods.filter((m) => m.pinned);
    return pinned.length > 0 ? pinned : recentMods;
  }, [installedMods, recentMods]);

  const activeDownloads = downloads.filter(
    (d) => d.status === "downloading" || d.status === "queued" || d.status === "installing",
  );
  const pendingUpdates = modUpdates.length;
  const hasContent = installedMods.length > 0;

  const brokenEngines = installedEngines.filter((e) => {
    const { health } = getEngineHealth(e.id);
    return health !== "ready";
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Empty state
  // ─────────────────────────────────────────────────────────────────────────────

  if (!loading && !hasContent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center h-full p-8 text-center gap-6"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"
        >
          <Package className="w-8 h-8 text-muted-foreground" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("home.empty.title", "No mods installed yet")}</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("home.empty.desc", "Browse GameBanana to find mods, or make sure you have an engine installed first.")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/discover")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Compass className="w-4 h-4" />
            {t("home.empty.discover", "Browse Mods")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/engines")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <Cpu className="w-4 h-4" />
            {t("home.empty.engines", "Set Up Engines")}
          </motion.button>
        </div>

        {installedEngines.length === 0 && (
          <p className="text-xs text-warning max-w-xs">
            {t("home.empty.noEngineHint", "You need at least one engine installed before mods can run.")}
          </p>
        )}
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading && !hasContent) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div className="h-64 rounded-2xl bg-secondary animate-pulse" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 flex-1 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto">

      {/* ── Personal hero: last-launched mod ─────────────────────────────── */}
      {heroMod && (
        <motion.div
          className="relative h-64 md:h-80 rounded-2xl overflow-hidden"
          initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={heroMod.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = `${import.meta.env.BASE_URL}mod-placeholder.svg`;
            }}
            alt={heroMod.modName}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Engine badge top-right */}
          {heroMod.engine && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
              {getEngineIcon(heroMod.engine as EngineSlug) && (
                <img
                  src={getEngineIcon(heroMod.engine as EngineSlug)!}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-white/80 text-xs font-medium">{formatEngineName(heroMod.engine as EngineSlug)}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              {heroMod.lastLaunchedAt ? (
                <p className="text-white/60 text-xs mb-1.5">{t("home.lastPlayed", "Last played")}</p>
              ) : (
                <p className="text-white/60 text-xs mb-1.5">{t("home.recentlyInstalled", "Recently installed")}</p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-1">{heroMod.modName}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                {heroMod.author && (
                  <span className="text-white/60 text-sm">{heroMod.author}</span>
                )}
                {heroMod.totalPlayTimeMs ? (
                  <span className="text-white/40 text-xs">{formatDuration(heroMod.totalPlayTimeMs)} played</span>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {runningLaunchIds.has(heroMod.id) ? (
                <button
                  onClick={() => navigate("/library")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Square className="w-4 h-4" fill="currentColor" />
                  {t("home.running", "Running")}
                </button>
              ) : (
                <button
                  onClick={() => launchInstalledMod(heroMod.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-lg"
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  {t("home.play", "Play")}
                </button>
              )}
              <button
                onClick={() => navigate("/library")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t("home.library", "Library")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-secondary transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{installedMods.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("home.stats.mods", "mods installed")}</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/engines")}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-secondary transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Cpu className={`w-4 h-4 shrink-0 transition-colors ${brokenEngines.length > 0 ? "text-warning" : "text-muted-foreground group-hover:text-foreground"}`} />
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{installedEngines.length}</p>
            <p className={`text-xs mt-0.5 ${brokenEngines.length > 0 ? "text-warning" : "text-muted-foreground"}`}>
              {brokenEngines.length > 0
                ? t("home.stats.enginesWarning", "{{n}} need attention", { n: brokenEngines.length })
                : t("home.stats.engines", "engines")}
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/downloads")}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
            activeDownloads.length > 0
              ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          <Download className={`w-4 h-4 shrink-0 ${activeDownloads.length > 0 ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-foreground"}`} />
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{activeDownloads.length}</p>
            <p className={`text-xs mt-0.5 ${activeDownloads.length > 0 ? "text-primary" : "text-muted-foreground"}`}>
              {t("home.stats.downloads", "active downloads")}
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/updates")}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
            pendingUpdates > 0
              ? "border-warning/20 bg-warning/5 hover:bg-warning/10"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${pendingUpdates > 0 ? "text-warning" : "text-muted-foreground group-hover:text-foreground"}`} />
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{pendingUpdates}</p>
            <p className={`text-xs mt-0.5 ${pendingUpdates > 0 ? "text-warning" : "text-muted-foreground"}`}>
              {t("home.stats.updates", "pending updates")}
            </p>
          </div>
        </button>
      </div>

      {/* ── Jump back in ─────────────────────────────────────────────────── */}
      {quickLaunchMods.length > 1 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {installedMods.filter((m) => m.pinned).length > 0
                ? t("home.pinned", "Pinned")
                : t("home.jumpBackIn", "Jump back in")}
            </h2>
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("home.viewAll", "View all")}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            <AnimatePresence>
              {quickLaunchMods.map((mod, index) => {
                const isRunning = runningLaunchIds.has(mod.id);
                return (
                  <motion.div
                    key={mod.id}
                    className="shrink-0 w-36 snap-start"
                    initial={shouldAnimate ? { opacity: 0, x: 16 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
                  >
                    <article className="group relative rounded-xl overflow-hidden border border-border bg-card">
                      <button
                        aria-label={`${isRunning ? t("home.stop", "Stop") : t("home.play", "Play")} ${mod.modName}`}
                        onClick={() => isRunning ? navigate("/library") : launchInstalledMod(mod.id)}
                        className="relative block w-full aspect-square overflow-hidden bg-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset focus-visible:outline-none"
                      >
                        <img
                          src={mod.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.onerror = null;
                            img.src = `${import.meta.env.BASE_URL}mod-placeholder.svg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isRunning ? "bg-warning" : "bg-primary"}`}>
                            {isRunning ? <Square className="w-4 h-4 text-warning-foreground" fill="currentColor" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedModId(mod.modId)}
                        className="w-full p-2.5 text-left hover:bg-secondary/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset focus-visible:outline-none"
                      >
                        <p className="text-xs font-medium text-foreground line-clamp-1">{mod.modName}</p>
                        {mod.totalPlayTimeMs ? (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDuration(mod.totalPlayTimeMs)}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatEngineName(mod.engine as EngineSlug)}</p>
                        )}
                      </button>
                    </article>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Trending on GameBanana ────────────────────────────────────────── */}
      {bestOfMods.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">{t("home.trending", "Trending on GameBanana")}</h2>
            <button
              onClick={() => navigate("/discover")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("home.browseAll", "Browse all")}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {bestOfMods.slice(0, 5).map((mod, index) => (
              <motion.div
                key={mod.id}
                initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
              >
                <ModCard
                  id={mod.id}
                  title={mod.name}
                  author={mod.submitter?.name}
                  thumbnail={mod.imageUrl ?? mod.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                  downloads={mod.downloadCount}
                  likes={mod.likeCount}
                  onView={() => setSelectedModId(mod.id)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick action: no engines installed ───────────────────────────── */}
      {installedEngines.length === 0 && hasContent && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{t("home.noEngine.title", "No engine installed")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("home.noEngine.desc", "Mods need an engine to run.")}</p>
          </div>
          <button
            onClick={() => navigate("/engines")}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            {t("home.noEngine.cta", "Install Engine")}
          </button>
        </motion.div>
      )}

      <ModVisualizerModal
        modId={selectedModId}
        open={Boolean(selectedModId)}
        onClose={() => setSelectedModId(undefined)}
      />
    </div>
  );
}
