import { motion } from "motion/react";
import { Cpu, Play, Settings, Check } from "lucide-react";
import { useI18n } from "../../providers";

interface EngineCardProps {
  name: string;
  version: string;
  iconSrc?: string;
  customIconUrl?: string;
  typeBadge?: string;
  isDefault?: boolean;
  onLaunch?: () => void;
  onManage?: () => void;
}

export function EngineCard({ name, version, iconSrc, customIconUrl, typeBadge, isDefault, onLaunch, onManage }: EngineCardProps) {
  const { t } = useI18n();
  const displayIcon = customIconUrl || iconSrc;

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-6 group cursor-pointer"
      whileHover={{ y: -4, boxShadow: "0 8px 24px var(--hover-glow)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-secondary/70 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {displayIcon
            ? <img src={displayIcon} alt="" className="w-9 h-9 object-contain" loading="lazy" />
            : <Cpu className="w-6 h-6 text-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">{name}</h3>
              {typeBadge && (
                <span className="text-[10px] text-muted-foreground/70 font-normal">{typeBadge}</span>
              )}
            </div>
            {isDefault && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                {t("engines.default", "Default")}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("engines.version", "Version")} {version}</p>

          <div className="flex gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onLaunch?.();
              }}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {t("engines.launch", "Launch")}
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onManage?.();
              }}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {t("engines.manage", "Manage")}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
