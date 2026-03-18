import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BarChart2,
  Package,
  Clock,
  Cpu,
  Shield,
  Target,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { useNavigate } from "react-router";
import {
  computeTotalPlayTime,
  computeMemberSince,
  computeMostPlayed,
  computeRecentlyPlayed,
  computeEngineGroups,
  formatPlayTime,
  formatRelativeTime,
} from "./statsUtils";

export function Stats() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const {
    installedMods,
    installedEngines,
    modUpdates,
    settings,
  } = useFunkHub();
  const shouldAnimate = (settings?.showAnimations ?? true) && !prefersReducedMotion;

  // Progress bar mount animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hasContent = installedMods.length > 0;

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!hasContent) {
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
          <BarChart2 className="w-8 h-8 text-muted-foreground" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t("stats.empty.title", "No stats yet")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("stats.empty.desc", "Install some mods and play them to start tracking your stats.")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/discover")}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Package className="w-4 h-4" />
          {t("stats.empty.cta", "Browse Mods")}
        </motion.button>
      </motion.div>
    );
  }

  // ─── Computed data ─────────────────────────────────────────────────────────
  const totalPlayMs = computeTotalPlayTime(installedMods);
  const memberSince = computeMemberSince(installedMods);
  const mostPlayed = computeMostPlayed(installedMods);
  const recentlyPlayed = computeRecentlyPlayed(installedMods);
  const engineGroups = computeEngineGroups(installedMods);

  return (
    <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-3xl font-bold text-foreground">{t("stats.title", "My Stats")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("stats.subtitle", "A summary of your mod activity.")}</p>
      </motion.div>

      {/* ── Overview cards ────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">{t("stats.overview.mods", "Mods installed")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{installedMods.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">{t("stats.overview.playTime", "Total play time")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPlayTime(totalPlayMs)}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">{t("stats.overview.engines", "Engines")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{installedEngines.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">{t("stats.overview.memberSince", "Member since")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {memberSince
              ? new Date(memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })
              : "—"}
          </p>
        </div>
      </motion.div>

      {/* ── Most played ───────────────────────────────────────────────────── */}
      {mostPlayed.length > 0 && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-3">{t("stats.mostPlayed.title", "Most Played")}</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {mostPlayed.map((entry, index) => (
              <div key={entry.mod.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{index + 1}</span>
                    <img
                      src={entry.mod.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                      alt=""
                      className="w-6 h-6 rounded object-cover shrink-0"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = `${import.meta.env.BASE_URL}mod-placeholder.svg`;
                      }}
                    />
                    <span className="text-foreground font-medium line-clamp-1">{entry.mod.modName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatPlayTime(entry.playTimeMs)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                    style={{ width: mounted ? `${entry.percentage}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Recently played ───────────────────────────────────────────────── */}
      {recentlyPlayed.length > 0 && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-3">{t("stats.recentlyPlayed.title", "Recently Played")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentlyPlayed.map((mod) => (
              <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-square bg-secondary overflow-hidden">
                  <img
                    src={mod.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                    alt={mod.modName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = `${import.meta.env.BASE_URL}mod-placeholder.svg`;
                    }}
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{mod.modName}</p>
                  {mod.lastLaunchedAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(mod.lastLaunchedAt)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Engine breakdown ──────────────────────────────────────────────── */}
      {engineGroups.length > 0 && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-3">{t("stats.engines.title", "Mods by Engine")}</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {engineGroups.map((group) => (
              <div key={group.slug} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{group.name}</span>
                  <span className="text-xs text-muted-foreground">{group.count} {t("stats.engines.mods", "mods")} · {group.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-[width] duration-700 ease-out"
                    style={{ width: mounted ? `${group.percentage}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Library health ────────────────────────────────────────────────── */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <h2 className="text-base font-semibold text-foreground mb-3">{t("stats.health.title", "Library Health")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{t("stats.health.pendingUpdates", "Pending updates")}</p>
            </div>
            <p className={`text-2xl font-bold ${modUpdates.length > 0 ? "text-warning" : "text-foreground"}`}>
              {modUpdates.length}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{t("stats.health.enabled", "Enabled mods")}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {installedMods.filter((m) => m.enabled !== false).length}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{t("stats.health.launched", "Ever launched")}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {installedMods.filter((m) => m.lastLaunchedAt != null).length}
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
