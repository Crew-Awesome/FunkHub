import { Cpu, Play, Settings, Check, Square, ShieldAlert, ShieldX, FolderSearch } from "lucide-react";
import { useI18n } from "../../providers";

interface EngineCardProps {
  name: string;
  version: string;
  iconSrc?: string;
  customIconUrl?: string;
  typeBadge?: string;
  isDefault?: boolean;
  isRunning?: boolean;
  health?: "ready" | "missing_binary" | "broken_install";
  healthMessage?: string;
  hasUpdate?: boolean;
  onLaunch?: () => void;
  onStop?: () => void;
  onManage?: () => void;
}

export function EngineCard({
  name,
  version,
  iconSrc,
  customIconUrl,
  typeBadge,
  isDefault,
  isRunning,
  health = "ready",
  healthMessage,
  hasUpdate,
  onLaunch,
  onStop,
  onManage,
}: EngineCardProps) {
  const { t } = useI18n();
  const displayIcon = customIconUrl || iconSrc;
  const isHealthy = health === "ready";

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-secondary/70 border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {displayIcon
            ? <img src={displayIcon} alt="" className="w-8 h-8 object-contain" loading="lazy" />
            : <Cpu className="w-5 h-5 text-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row + status badge */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{name}</h3>
                {isDefault && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    <Check className="w-2.5 h-2.5" />
                    {t("engines.default", "Default")}
                  </span>
                )}
              </div>
              {typeBadge && <span className="text-[10px] text-muted-foreground/60">{typeBadge}</span>}
            </div>

            {isRunning ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-success px-1.5 py-0.5 rounded border border-success/20 bg-success/10">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {t("engines.running", "Running")}
              </span>
            ) : !isHealthy ? (
              <span
                title={healthMessage}
                className={`shrink-0 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${
                  health === "missing_binary"
                    ? "border-warning/20 bg-warning/10 text-warning"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                }`}
              >
                {health === "missing_binary" ? <ShieldAlert className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                {health === "missing_binary" ? "No Binary" : "Broken"}
              </span>
            ) : null}
          </div>

          {/* Version + update pill */}
          <div className="flex items-center gap-2 mb-3.5">
            <span className="text-xs text-muted-foreground">{version}</span>
            {hasUpdate && (
              <span className="text-[10px] text-primary px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10">
                {t("engines.updateAvailable", "Update")}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStop?.(); }}
                className="flex-1 px-3 py-2 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-3.5 h-3.5" fill="currentColor" />
                {t("engines.stopEngine", "Stop")}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onLaunch?.(); }}
                className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {t("engines.launch", "Launch")}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onManage?.(); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                !isHealthy
                  ? "bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              {health === "missing_binary" ? <FolderSearch className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
              {t("engines.manage", "Manage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
