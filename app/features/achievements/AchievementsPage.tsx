import { motion } from "motion/react";
import { Trophy, Star, Package, Clock, Zap, Cpu, Layers, RefreshCw, Music, Flame, Tag, Trash2 } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { computeAchievements, type Achievement } from "../stats/statsUtils";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  first_steps: Star,
  collector: Package,
  hoarder: Layers,
  legend: Trophy,
  first_launch: Zap,
  time_flies: Clock,
  dedicated: Flame,
  obsessed: Flame,
  engine_master: Cpu,
  up_to_date: RefreshCw,
  variety_pack: Music,
  tagging_along: Tag,
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  first_steps: "from-yellow-400 to-orange-500",
  collector: "from-blue-400 to-indigo-600",
  hoarder: "from-purple-400 to-pink-500",
  legend: "from-amber-400 to-yellow-600",
  first_launch: "from-green-400 to-emerald-600",
  time_flies: "from-sky-400 to-blue-600",
  dedicated: "from-rose-400 to-red-500",
  obsessed: "from-red-500 to-rose-700",
  engine_master: "from-cyan-400 to-teal-600",
  up_to_date: "from-lime-400 to-green-500",
  variety_pack: "from-violet-400 to-purple-600",
  tagging_along: "from-pink-400 to-rose-500",
};

export function Achievements() {
  const { t } = useI18n();
  const { installedMods, installedEngines, modUpdates, clearAchievements } = useFunkHub();
  
  const achievements: Achievement[] = computeAchievements(installedMods, installedEngines, modUpdates.length);
  const unlockedCount = achievements.filter((a: Achievement) => a.unlocked).length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("achievements.title", "Achievements")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("achievements.progress", "{{unlocked}} / {{total}} unlocked", { 
              unlocked: unlockedCount, 
              total: achievements.length 
            })}
          </p>
        </div>
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
          {t("achievements.reset", "Reset")}
        </motion.button>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-8"
      >
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-primary to-orange-500"
          />
        </div>
      </motion.div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement: Achievement, index: number) => {
          const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? Trophy;
          const gradient = ACHIEVEMENT_COLORS[achievement.id] ?? "from-primary to-orange-500";
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                achievement.unlocked
                  ? "bg-card border-primary/20 shadow-lg shadow-primary/5"
                  : "bg-secondary/30 border-border opacity-60"
              }`}
            >
              {achievement.unlocked && (
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${gradient} opacity-20`} />
              )}
              
              <div className="relative flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${gradient} shadow-lg`
                    : "bg-secondary"
                }`}>
                  {achievement.unlocked ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.05 + 0.2, type: "spring", stiffness: 200 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {t(`stats.achievement.${achievement.id}.name`, achievement.id.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(`stats.achievement.${achievement.id}.desc`, "")}
                  </p>
                </div>
              </div>

              {achievement.unlocked && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.05 + 0.3, duration: 0.3 }}
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty state if no achievements yet */}
      {unlockedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("achievements.none", "No achievements yet")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("achievements.hint", "Install mods, play games, and explore to unlock achievements!")}
          </p>
        </motion.div>
      )}
    </div>
  );
}
