import { useEffect, useMemo, useState } from "react";
import { Heart, Download, UserCircle2, X, FolderTree } from "lucide-react";
import { useFunkHub } from "../../providers";
import type { GameBananaMember, GameBananaModSummary } from "../../services/funkhub";

interface UserProfileModalProps {
  open: boolean;
  submitter?: Pick<GameBananaMember, "id" | "name" | "avatarUrl">;
  onClose: () => void;
  onOpenMod: (modId: number) => void;
}

function formatCompact(value?: number): string {
  if (!value || value <= 0) {
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

export function UserProfileModal({ open, submitter, onClose, onOpenMod }: UserProfileModalProps) {
  const { listModsBySubmitter } = useFunkHub();
  const [mods, setMods] = useState<GameBananaModSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !submitter?.id) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listModsBySubmitter({ submitterId: submitter.id, perPage: 50 })
      .then((results) => {
        if (!cancelled) {
          setMods(results);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setMods([]);
          setError(nextError instanceof Error ? nextError.message : "Failed to load user submissions");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, submitter?.id, listModsBySubmitter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, GameBananaModSummary[]>();
    for (const mod of mods) {
      const key = mod.rootCategory?.name || "Other";
      const current = groups.get(key) ?? [];
      current.push(mod);
      groups.set(key, current);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));
  }, [mods]);

  if (!open || !submitter) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {submitter.avatarUrl ? (
              <img src={submitter.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                <UserCircle2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{submitter.name}</h2>
              <p className="text-xs text-muted-foreground">Submissions by category</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading submissions...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && mods.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions were found for this creator.</p>
          )}

          {!loading && !error && grouped.map(([category, items]) => (
            <section key={category} className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-muted-foreground" />
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => onOpenMod(mod.id)}
                    className="w-full text-left rounded-lg border border-border/70 bg-secondary/35 hover:bg-secondary/60 px-3 py-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {mod.thumbnailUrl ? (
                        <img src={mod.thumbnailUrl} alt="" className="w-12 h-12 rounded object-cover" loading="lazy" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-secondary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{mod.name}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-primary/25 text-primary" />{formatCompact(mod.likeCount)}</span>
                          <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" />{formatCompact(mod.downloadCount ?? mod.viewCount)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
