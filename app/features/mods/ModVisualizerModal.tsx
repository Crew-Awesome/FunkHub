import { useEffect, useMemo, useState } from "react";
import { X, Download, Clock3, User, ExternalLink } from "lucide-react";
import { useFunkHub } from "../../providers";
import type { GameBananaModProfile } from "../../services/funkhub";

interface ModVisualizerModalProps {
  modId?: number;
  open: boolean;
  onClose: () => void;
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

export function ModVisualizerModal({ modId, open, onClose }: ModVisualizerModalProps) {
  const { getModProfile, installMod } = useFunkHub();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<GameBananaModProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const heroImage = useMemo(() => profile?.imageUrl ?? profile?.thumbnailUrl, [profile]);

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

        {loading && (
          <div className="p-8 text-sm text-muted-foreground">Loading mod details...</div>
        )}

        {error && (
          <div className="p-8 text-sm text-red-300">{error}</div>
        )}

        {!loading && !error && profile && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
              <div className="rounded-xl overflow-hidden bg-secondary min-h-[220px]">
                {heroImage ? (
                  <img src={heroImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                    No preview image
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.rootCategory?.name ?? "Unknown category"}
                  </p>
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
                    <p className="text-foreground font-semibold line-clamp-1">{profile.submitter?.name ?? "Unknown"}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-muted-foreground">Updated</p>
                    <p className="text-foreground font-semibold">{formatDate(profile.dateUpdated || profile.dateModified || profile.dateAdded)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const targetFile = profile.files[0];
                      if (targetFile) {
                        installMod(profile.id, targetFile.id);
                      }
                    }}
                    disabled={profile.files.length === 0}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                  >
                    Install First File
                  </button>
                  <button
                    onClick={() => window.open(profile.profileUrl, "_blank", "noopener,noreferrer")}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open on GameBanana
                  </button>
                </div>
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
                      onClick={() => installMod(profile.id, file.id)}
                      className="px-3 py-2 bg-primary/90 hover:bg-primary text-white rounded-lg text-xs font-medium"
                    >
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
                          <span key={`${group.groupName}-${author.id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary/70">
                            <User className="w-3 h-3" />
                            {author.name}
                          </span>
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
