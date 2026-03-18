import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Star, Trophy, Sparkles } from "lucide-react";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  first_steps: Star,
  collector: Trophy,
  hoarder: Trophy,
  legend: Trophy,
  first_launch: Star,
  time_flies: Star,
  dedicated: Trophy,
  obsessed: Trophy,
  engine_master: Star,
  up_to_date: Star,
  variety_pack: Star,
  tagging_along: Star,
};

interface AchievementUnlockProps {
  id: string;
  name: string;
  description?: string;
  onDismiss?: () => void;
}

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    color: ["#f97316", "#fbbf24", "#ef4444", "#22c55e", "#3b82f6", "#a855f7"][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}%`, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            y: 200,
            rotate: Math.random() * 720 - 360,
            scale: 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export function AchievementUnlock({ id, name, description, onDismiss }: AchievementUnlockProps) {
  const Icon = ACHIEVEMENT_ICONS[id] ?? Trophy;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 rounded-xl p-4 shadow-lg min-w-[300px] max-w-sm"
      onClick={onDismiss}
    >
      <Confetti />
      
      <div className="relative flex items-start gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="shrink-0"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-1"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-500">
              Achievement Unlocked!
            </span>
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg font-bold text-foreground leading-tight"
          >
            {name}
          </motion.h3>
          
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-yellow-400 to-primary"
      />
    </motion.div>
  );
}

export function showAchievementToast(id: string, name: string, description?: string) {
  toast.custom(
    (t) => (
      <AchievementUnlock
        id={id}
        name={name}
        description={description}
        onDismiss={() => toast.dismiss(t)}
      />
    ),
    {
      duration: 5000,
      id: `achievement-${id}`,
    }
  );
}
