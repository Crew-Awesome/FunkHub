import { useEffect, useMemo, useState } from "react";
import { X, Download, Clock3, User, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useFunkHub } from "../../providers";
import { modInstallerService } from "../../services/funkhub";
import type { GameBananaMember, GameBananaModProfile } from "../../services/funkhub";

interface ModVisualizerModalProps {
  modId?: number;
  open: boolean;
  onClose: () => void;
  onOpenSubmitter?: (submitter: Pick<GameBananaMember, "id" | "name" | "avatarUrl">) => void;
}

function formatDownloads(value?: number): string {
  if (!value) {
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

function formatDate(ts?: number): string {
  if (!ts) {
    return "Unknown";
  }
  return new Date(ts * 1000).toLocaleDateString();
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "Unknown";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function plainText(value?: string): string {
  if (!value) {
    return "No description provided.";
  }
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ModVisualizerModal({ modId, open, onClose, onOpenSubmitter }: ModVisualizerModalProps) {
  const { getModProfile, installMod, installedEngines } = useFunkHub();
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [profile, setProfile] = useState<GameBananaModProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useState<string>("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    if (!open || !modId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getModProfile(modId)
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
          setActiveMediaIndex(0);
          const defaultEngine = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];
          setSelectedEngineId(defaultEngine?.id ?? "");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load mod profile");
          setProfile(null);
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
  }, [open, modId, getModProfile]);

  const mediaGallery = useMemo(() => {
    if (!profile) {
      return [] as string[];
    }
    const merged = [profile.imageUrl, profile.thumbnailUrl, ...(profile.screenshotUrls ?? [])]
      .filter((entry): entry is string => Boolean(entry && entry.trim()));
    return Array.from(new Set(merged));
  }, [profile]);
  const categoryLabel = profile?.rootCategory?.name ?? profile?.category?.name ?? profile?.superCategory?.name;
  const selectedEngine = installedEngines.find((engine) => engine.id === selectedEngineId);
  const isExecutableMod = Boolean(profile && profile.files.some((file) => modInstallerService.isExecutableMod(profile, file)));
  const hasDependencyWarning = Boolean(!isExecutableMod && profile?.requiredEngine && selectedEngine && selectedEngine.slug !== profile.requiredEngine);

  useEffect(() => {
    if (!loading) {
      setShowLoadingState(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLoadingState(true);
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loading]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mod Visualizer</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && showLoadingState && (
          <div className="p-8 text-sm text-muted-foreground">Loading mod details...</div>
        )}

        {error && (
          <div className="p-8 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && profile && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
              <div className="rounded-xl overflow-hidden bg-secondary min-h-[220px]">
                {mediaGallery.length > 0 ? (
                  <div>
                    <div className="relative">
                      <img
                        src={mediaGallery[Math.min(activeMediaIndex, mediaGallery.length - 1)]}
                        alt={profile.name}
                        className="w-full h-[320px] object-cover"
                      />
                      {mediaGallery.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveMediaIndex((current) => (current - 1 + mediaGallery.length) % mediaGallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/70 text-white"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveMediaIndex((current) => (current + 1) % mediaGallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/70 text-white"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {mediaGallery.length > 1 && (
                      <div className="flex gap-2 p-3 overflow-x-auto border-t border-border/60 bg-card/30">
                        {mediaGallery.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            onClick={() => setActiveMediaIndex(index)}
                            className={[
                              "w-16 h-12 rounded overflow-hidden border shrink-0",
                              index === activeMediaIndex ? "border-primary" : "border-border",
                            ].join(" ")}
                            aria-label={`Preview ${index + 1}`}
                          >
                            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                    No preview image
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{profile.name}</h3>
                  {categoryLabel && <p className="text-sm text-muted-foreground mt-1">{categoryLabel}</p>}
                </div>

                 <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-muted-foreground">Downloads</p>
                    <p className="text-foreground font-semibold">{formatDownloads(profile.downloadCount)}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-muted-foreground">Version</p>
                    <p className="text-foreground font-semibold">{profile.version ?? "Unknown"}</p>
                  </div>
                   <div className="bg-secondary/50 rounded-lg p-3">
                     <p className="text-muted-foreground">Author</p>
                     <button
                       onClick={() => {
                         if (profile.submitter?.id) {
                           onOpenSubmitter?.({
                             id: profile.submitter.id,
                             name: profile.submitter.name,
                             avatarUrl: profile.submitter.avatarUrl,
                           });
                         }
                       }}
                       className="text-foreground font-semibold line-clamp-1 inline-flex items-center gap-2 hover:text-primary transition-colors"
                     >
                       {profile.submitter?.avatarUrl
                         ? <img src={profile.submitter.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" loading="lazy" />
                         : <User className="w-4 h-4" />}
                       <span>{profile.submitter?.name ?? "Unknown"}</span>
                     </button>
                   </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-foreground font-semibold">{formatDate(profile.dateUpdated || profile.dateModified || profile.dateAdded)}</p>
                  </div>
                </div>

                 <div className="flex flex-wrap gap-2 items-center">
                   {!isExecutableMod && (
                     <>
                       <span className="text-sm text-muted-foreground">Engine:</span>
                       <select
                         value={selectedEngineId}
                         onChange={(event) => setSelectedEngineId(event.target.value)}
                         className="px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground"
                       >
                         {installedEngines.map((engine) => (
                           <option key={engine.id} value={engine.id}>
                             {engine.name} {engine.version}
                           </option>
                         ))}
                       </select>
                     </>
                   )}
                   <button
                     onClick={() => window.open(profile.profileUrl, "_blank", "noopener,noreferrer")}
                     className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open on GameBanana
                  </button>
              </div>

                {hasDependencyWarning && (
                  <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    This mod targets <span className="font-medium">{profile?.requiredEngine}</span>, but selected engine is <span className="font-medium">{selectedEngine?.slug}</span>.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-secondary/40 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{plainText(profile.description ?? profile.text)}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Files</h4>
              <div className="space-y-2">
                {profile.files.length === 0 && (
                  <div className="text-sm text-muted-foreground">No downloadable files found.</div>
                )}
                {profile.files.map((file) => (
                  <div key={file.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{file.fileName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" />{formatDownloads(file.downloadCount)}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{formatDate(file.dateAdded)}</span>
                        <span>{formatBytes(file.fileSize)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => installMod(profile.id, file.id, selectedEngineId || undefined)}
                      className="px-3 py-2 bg-primary/90 hover:bg-primary text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {profile.credits.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Credits</h4>
                <div className="space-y-2">
                  {profile.credits.map((group) => (
                    <div key={group.groupName} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground mb-1">{group.groupName}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {group.authors.map((author) => (
                          <button
                            key={`${group.groupName}-${author.id}`}
                            type="button"
                            onClick={() => {
                              if (author.id > 0) {
                                onOpenSubmitter?.({ id: author.id, name: author.name, avatarUrl: author.avatarUrl });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/70 hover:bg-secondary text-muted-foreground"
                          >
                            {author.avatarUrl
                              ? <img src={author.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" loading="lazy" />
                              : <User className="w-3 h-3" />}
                            <span>{author.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
