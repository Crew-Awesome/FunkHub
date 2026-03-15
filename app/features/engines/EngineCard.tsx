import { motion } from "motion/react";
import { Cpu, Play, Settings, Check } from "lucide-react";

interface EngineCardProps {
  name: string;
  version: string;
  iconSrc?: string;
  isDefault?: boolean;
  onLaunch?: () => void;
  onManage?: () => void;
}

export function EngineCard({ name, version, iconSrc, isDefault, onLaunch, onManage }: EngineCardProps) {
  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-6 group cursor-pointer"
      whileHover={{ y: -4, boxShadow: "0 8px 24px var(--hover-glow)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-secondary/70 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {iconSrc
            ? <img src={iconSrc} alt="" className="w-9 h-9 object-contain" loading="lazy" />
            : <Cpu className="w-6 h-6 text-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-foreground">{name}</h3>
            {isDefault && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">Version {version}</p>

          <div className="flex gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onLaunch?.();
              }}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Launch
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onManage?.();
              }}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
