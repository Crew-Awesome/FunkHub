import { motion } from "motion/react";
import { Download, Star, Eye } from "lucide-react";

interface ModCardProps {
  id?: number;
  title: string;
  author: string;
  thumbnail: string;
  rating?: number;
  downloads?: string | number;
  onInstall?: () => void;
  onView?: () => void;
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

export function ModCard({ title, author, thumbnail, rating = 0, downloads, onInstall, onView }: ModCardProps) {
  return (
    <motion.div
      className="bg-card rounded-xl overflow-hidden border border-border group cursor-pointer"
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(79, 140, 255, 0.15)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onInstall?.();
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Install
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onView?.();
            }}
            className="px-4 py-2 bg-secondary/90 hover:bg-secondary text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            View
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">by {author}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span>{rating}</span>
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
