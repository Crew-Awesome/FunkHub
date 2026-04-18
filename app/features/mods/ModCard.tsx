import { motion } from "motion/react";
import {
  Download,
  Heart,
  UserCircle2,
  MessageCircle,
  Eye,
  Clock3,
  Layers,
  Wrench,
  GraduationCap,
  CircleHelp,
  HandHelping,
  AudioWaveform,
  FileCode2,
  MessageSquare,
  Newspaper,
  Trophy,
  CalendarDays,
  BarChart3,
  Puzzle,
  Hammer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../../providers";

interface ModCardProps {
  title: string;
  author?: string;
  thumbnail: string;
  likes?: number;
  downloads?: string | number;
  postCount?: number;
  viewCount?: number;
  modelName?: string;
  submitterAvatar?: string;
  rootCategoryIcon?: string;
  dateAdded?: number;
  dateUpdated?: number;
  onView?: () => void;
  onAuthorClick?: () => void;
  categoryLabel?: string;
  statusLabel?: string;
}

function formatDownloads(value: string | number | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return String(value);
  }

  return "0";
}

function hasMetricValue(value: string | number | undefined): boolean {
  if (typeof value === "number") {
    return value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return trimmed !== "0";
  }

  return false;
}

function formatLikes(value: number | undefined): string {
  if (!value || value < 0) {
    return "0";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

function formatDateBadge(timestamp?: number): string | null {
  if (!timestamp) return null;
  const ms = timestamp * 1000;
  if (!Number.isFinite(ms)) return null;
  const diff = Date.now() - ms;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < day * 30) return `${Math.floor(diff / day)}d`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))}mo`;
  return `${Math.floor(diff / (day * 365))}y`;
}

function modelIcon(modelName?: string): LucideIcon {
  const normalized = (modelName ?? "").toLowerCase();
  if (normalized.includes("wip")) return Hammer;
  if (normalized.includes("tutorial")) return GraduationCap;
  if (normalized.includes("question")) return CircleHelp;
  if (normalized.includes("request")) return HandHelping;
  if (normalized.includes("tool")) return Wrench;
  if (normalized.includes("sound")) return AudioWaveform;
  if (normalized.includes("script")) return FileCode2;
  if (normalized.includes("thread")) return MessageSquare;
  if (normalized.includes("blog")) return Newspaper;
  if (normalized.includes("event") || normalized.includes("jam") || normalized.includes("contest")) return Trophy;
  if (normalized.includes("news")) return CalendarDays;
  if (normalized.includes("poll")) return BarChart3;
  if (normalized.includes("mod")) return Puzzle;
  return Layers;
}

export function ModCard({
  title,
  author,
  thumbnail,
  likes,
  downloads,
  postCount,
  viewCount,
  modelName,
  submitterAvatar,
  rootCategoryIcon,
  dateAdded,
  dateUpdated,
  onView,
  onAuthorClick,
  categoryLabel,
  statusLabel,
}: ModCardProps) {
  const { t } = useI18n();
  const typeIcon = modelIcon(modelName);
  const relativeDate = formatDateBadge(dateUpdated ?? dateAdded);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      className="bg-card rounded-xl overflow-hidden border border-border/80 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      whileHover={{ y: -4, boxShadow: "0 10px 30px var(--hover-glow)" }}
      transition={{ duration: 0.2 }}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView?.();
        }
      }}
      aria-label={author ? `${title} ${t("mod.by", "by")} ${author}` : title}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <img
          loading="lazy"
          src={thumbnail}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />

        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/45 px-1.5 py-1 text-[10px] text-white/90 backdrop-blur-sm">
          {rootCategoryIcon ? (
            <img src={rootCategoryIcon} alt="" className="h-3.5 w-3.5 object-contain" loading="lazy" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
          {modelName && (
            <>
              {(() => {
                const ModelIcon = typeIcon;
                return <ModelIcon className="h-3.5 w-3.5" />;
              })()}
              <span className="line-clamp-1 max-w-[140px]">{modelName}</span>
            </>
          )}
        </div>

        {statusLabel && (
          <div className="absolute top-2 right-2 rounded-md border border-primary/30 bg-primary/90 px-1.5 py-1 text-[10px] font-semibold text-primary-foreground shadow">
            {statusLabel}
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 text-[10px] text-white/90">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAuthorClick?.();
            }}
            className="inline-flex min-w-0 max-w-[65%] items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-1.5 py-1 backdrop-blur-sm hover:bg-black/55"
          >
            {submitterAvatar ? (
              <img src={submitterAvatar} alt="" className="h-4 w-4 rounded-full border border-white/25 object-cover" loading="lazy" />
            ) : (
              <UserCircle2 className="h-3.5 w-3.5" />
            )}
            <span className="line-clamp-1 text-left">{author ? `${t("mod.by", "by")} ${author}` : t("discover.communityUploader", "Community uploader")}</span>
          </button>

          {relativeDate && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/15 bg-black/45 px-1.5 py-1 backdrop-blur-sm">
              <Clock3 className="h-3.5 w-3.5" />
              {relativeDate}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        </div>

        {categoryLabel && (
          <p className="mb-2 text-[10px] text-muted-foreground inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
            {categoryLabel}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Heart className="w-3.5 h-3.5 fill-primary/25 text-primary" />
            <span>{formatLikes(likes)}</span>
          </motion.div>
          {hasMetricValue(downloads) && (
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>{formatDownloads(downloads)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{formatDownloads(postCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatDownloads(viewCount)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
