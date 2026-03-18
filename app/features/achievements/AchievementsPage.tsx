import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Package, Clock, Zap, Cpu, Layers, RefreshCw, Music, Flame, Tag, Trash2, Lock, Check, Download, Settings, Palette, Link2, Calendar, Flame as FlameIcon, Hash, Folder, FileText, Play, Repeat, Gauge, Sparkles, TrendingUp, Target, MousePointer, X, Info } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { computeAchievements, type Achievement } from "../stats/statsUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../shared/ui/dialog";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  first_steps: Star,
  collector: Package,
  hoarder: Layers,
  legend: Trophy,
  mod_machine: Package,
  first_launch: Zap,
  launcher: Play,
  regular: Play,
  century: Play,
  thousand: Play,
  time_flies: Clock,
  dedicated: Flame,
  obsessed: Flame,
  engine_master: Cpu,
  engine_collector: Cpu,
  up_to_date: RefreshCw,
  variety_pack: Music,
  category_crusher: Hash,
  tagging_along: Tag,
  note_taker: FileText,
  minimalist: Target,
  maximalist: Package,
  engine_hopper: Repeat,
  multitasker: Layers,
  downloader: Download,
  download_demon: Download,
  download_deity: Download,
  speed_demon: Gauge,
  parallel_downloader: Download,
  patient: Clock,
  speedy: Sparkles,
  cleaner: Trash2,
  organizer: Folder,
  fresh_start: RefreshCw,
  pair_up: Link2,
  deep_link_pro: Link2,
  linked: Link2,
  tweaker: Settings,
  theme_explorer: Palette,
  getting_started: Star,
  week_one: Calendar,
  month_user: Calendar,
  veteran: Calendar,
  old_timer: Calendar,
  consistent: TrendingUp,
  data_nerd: FlameIcon,
  curator: Folder,
  collector_of_collectors: Layers,
};

export function Achievements() {
  const { t } = useI18n();
  const { installedMods, installedEngines, modUpdates, downloads, clearAchievements } = useFunkHub();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const achievements: Achievement[] = computeAchievements(installedMods, installedEngines, modUpdates.length, downloads);
  const unlockedCount = achievements.filter((a: Achievement) => a.unlocked).length;

  const getAchievementProgress = (achievement: Achievement): string => {
    const id = achievement.id;
    const progressMap: Record<string, string> = {
      first_steps: `${installedMods.length}/1`,
      collector: `${installedMods.length}/10`,
      hoarder: `${installedMods.length}/25`,
      legend: `${installedMods.length}/50`,
      mod_machine: `${installedMods.length}/100`,
      launcher: `${installedMods.length >= 10 ? "10+" : installedMods.length}/10`,
      regular: `${installedMods.length >= 50 ? "50+" : installedMods.length}/50`,
      century: `${installedMods.length >= 100 ? "100+" : installedMods.length}/100`,
      thousand: `${installedMods.length >= 1000 ? "1000+" : installedMods.length}/1000`,
      engine_master: `${installedEngines.length}/2`,
      engine_collector: `${installedEngines.length}/4`,
      engine_hopper: `${new Set(installedMods.map(m => m.engine)).size}/3`,
    };
    return progressMap[id] || "";
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-foreground">{t("achievements.title", "Achievements")}</h1>
        <p className="text-muted-foreground mt-1">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </motion.div>

      {/* Achievement grid - varied sizes for visual interest */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {achievements.map((achievement: Achievement, index: number) => {
          const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? Trophy;
          const progress = getAchievementProgress(achievement);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                achievement.unlocked
                  ? "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                  : "bg-secondary/20 border-border/50 hover:bg-secondary/30 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  achievement.unlocked
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {achievement.unlocked ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {t(`stats.achievement.${achievement.id}.name`, achievement.id.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t(`stats.achievement.${achievement.id}.desc`, "")}
                  </p>
                </div>
              </div>
              
              {progress && !achievement.unlocked && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Progress: {progress}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Achievement detail modal */}
      <Dialog open={selectedAchievement !== null} onOpenChange={(open) => { if (!open) setSelectedAchievement(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAchievement && (
                <>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedAchievement.unlocked
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {selectedAchievement.unlocked ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-lg">
                    {selectedAchievement ? t(`stats.achievement.${selectedAchievement.id}.name`, selectedAchievement.id.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")) : ""}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Achievement details
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {t(`stats.achievement.${selectedAchievement.id}.desc`, "Complete challenges to unlock this achievement.")}
              </p>
              
              <div className="flex items-center gap-2 text-sm">
                {selectedAchievement.unlocked ? (
                  <span className="flex items-center gap-1.5 text-green-500">
                    <Check className="w-4 h-4" />
                    Unlocked
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    Locked
                  </span>
                )}
              </div>
              
              {!selectedAchievement.unlocked && getAchievementProgress(selectedAchievement) && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Progress</p>
                  <p className="text-sm font-medium">{getAchievementProgress(selectedAchievement)}</p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Click elsewhere to close
              </p>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty state if no achievements yet */}
      {unlockedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("achievements.none", "No achievements yet")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("achievements.hint", "Install mods, play games, and explore to unlock achievements!")}
          </p>
        </motion.div>
      )}

      {/* Reset button */}
      {unlockedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-border"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (window.confirm(t("achievements.confirmClear", "Reset all achievements? This cannot be undone."))) {
                clearAchievements();
              }
            }}
            className="px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("achievements.reset", "Reset Achievements")}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
