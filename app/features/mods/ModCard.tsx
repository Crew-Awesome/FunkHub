import { motion } from "motion/react";
import { Download, Heart, UserCircle2 } from "lucide-react";

interface ModCardProps {
  id?: number;
  title: string;
  author: string;
  thumbnail: string;
  likes?: number;
  downloads?: string | number;
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

  return "--";
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

export function ModCard({ title, author, thumbnail, likes, downloads, onView, onAuthorClick, categoryLabel, statusLabel }: ModCardProps) {
  return (
    <motion.div
      className="bg-card rounded-xl overflow-hidden border border-border group cursor-pointer"
      whileHover={{ y: -4, boxShadow: "0 8px 24px var(--hover-glow)" }}
      transition={{ duration: 0.2 }}
      onClick={onView}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <img
          loading="lazy"
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
          {statusLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary whitespace-nowrap">{statusLabel}</span>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAuthorClick?.();
          }}
          className="text-xs text-muted-foreground mb-3 inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <UserCircle2 className="w-3.5 h-3.5" />
          by {author}
        </button>

        {categoryLabel && (
          <p className="mb-3 text-[11px] text-muted-foreground inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
            {categoryLabel}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-primary/25 text-primary" />
            <span>{formatLikes(likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>{formatDownloads(downloads)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
