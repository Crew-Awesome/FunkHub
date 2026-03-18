import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Download, Clock3, User, ExternalLink, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { modInstallerService, detectRequiredEngineFromMetadata } from "../../services/funkhub";
import type { GameBananaMember, GameBananaModProfile } from "../../services/funkhub";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

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

function formatDate(ts?: number, unknown = "—"): string {
  if (!ts) {
    return unknown;
  }
  return new Date(ts * 1000).toLocaleDateString();
}

function formatBytes(bytes?: number, unknown = "—"): string {
  if (!bytes || bytes <= 0) {
    return unknown;
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

const FNF_LOADING_MESSAGES = [
  "Loading the beats...",
  "Warming up the crew...",
  "Reading the charts...",
  "Checking the tracklist...",
  "Getting the stage ready...",
  "Waking up Boyfriend...",
  "Tuning the microphone...",
];

export function ModVisualizerModal({ modId, open, onClose, onOpenSubmitter }: ModVisualizerModalProps) {
  const { t } = useI18n();
  const { getModProfile, installMod, installedEngines } = useFunkHub();
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [loadingMsgIndex] = useState(() => Math.floor(Math.random() * FNF_LOADING_MESSAGES.length));
  const [profile, setProfile] = useState<GameBananaModProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useState<string>("");
  const [installMode, setInstallMode] = useState<"executable" | "mod_folder">("mod_folder");
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
          const detectedSlug = detectRequiredEngineFromMetadata({
            name: next.name,
            text: next.text ?? next.description,
            rootCategoryName: next.rootCategory?.name ?? next.category?.name,
          }) ?? next.requiredEngine;
          const matchingEngine = detectedSlug
            ? installedEngines.find((engine) => engine.slug === detectedSlug)
            : undefined;
          const defaultEngine = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];
          setSelectedEngineId((matchingEngine ?? defaultEngine)?.id ?? "");
          const defaultExecutable = modInstallerService.isExecutableCategoryMod(next)
            || next.files.some((file) => modInstallerService.isExecutableMod(next, file));
          setInstallMode(defaultExecutable ? "executable" : "mod_folder");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("mod.failedLoadProfile", "Failed to load mod profile"));
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
  const categoryBreadcrumb = profile
    ? [profile.superCategory, profile.rootCategory, profile.category].filter(
        (c, i, arr) => c?.name && arr.findIndex((x) => x?.name === c.name) === i,
      )
    : [];
  const selectedEngine = installedEngines.find((engine) => engine.id === selectedEngineId);
  const installAsExecutable = installMode === "executable";
  const detectedEngineSlug = profile
    ? (detectRequiredEngineFromMetadata({
        name: profile.name,
        text: profile.text ?? profile.description,
        rootCategoryName: profile.rootCategory?.name ?? profile.category?.name,
      }) ?? profile.requiredEngine)
    : undefined;
  const detectedEngineInstalled = detectedEngineSlug
    ? installedEngines.find((engine) => engine.slug === detectedEngineSlug)
    : undefined;
  const hasDependencyWarning = Boolean(
    !installAsExecutable && detectedEngineSlug && selectedEngine && selectedEngine.slug !== detectedEngineSlug,
  );

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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="h-[90vh] w-[min(96vw,1700px)] max-w-none overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4">
          <DialogTitle>{t("mod.visualizer", "Mod Visualizer")}</DialogTitle>
        </DialogHeader>

        {loading && showLoadingState && (
          <div className="p-8 flex items-center gap-3 text-sm text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
            />
            {FNF_LOADING_MESSAGES[loadingMsgIndex]}
          </div>
        )}

        {error && (
          <div className="p-8 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && profile && (
          <div className="h-[calc(90vh-72px)] p-4 md:p-6">
            <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(420px,0.8fr)]">
              <section className="min-h-0 overflow-y-auto pr-1">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-2xl font-bold text-foreground">{profile.name}</h3>
                  {categoryBreadcrumb.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {categoryBreadcrumb.map((cat, i) => (
                        <span key={cat!.id ?? cat!.name} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                          {cat!.iconUrl && (
                            <img src={cat!.iconUrl} alt="" className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
                          )}
                          <span className={[
                            "text-sm",
                            i === categoryBreadcrumb.length - 1 ? "font-medium text-primary" : "text-muted-foreground",
                          ].join(" ")}>
                            {cat!.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-border bg-secondary/30">
                  {mediaGallery.length > 0 ? (
                    <>
                      <div className="relative aspect-video w-full bg-secondary/40">
                        <img
                          src={mediaGallery[Math.min(activeMediaIndex, mediaGallery.length - 1)]}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                        />
                        {mediaGallery.length > 1 && (
                          <>
                            <button
                              onClick={() => setActiveMediaIndex((current) => (current - 1 + mediaGallery.length) % mediaGallery.length)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                               aria-label={t("mod.previousImage", "Previous image")}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setActiveMediaIndex((current) => (current + 1) % mediaGallery.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                               aria-label={t("mod.nextImage", "Next image")}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {mediaGallery.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto border-t border-border/60 p-3">
                          {mediaGallery.map((image, index) => (
                            <button
                              key={`${image}-${index}`}
                              onClick={() => setActiveMediaIndex(index)}
                              className={[
                                "h-16 w-24 shrink-0 overflow-hidden rounded border",
                                index === activeMediaIndex ? "border-primary" : "border-border",
                              ].join(" ")}
                               aria-label={t("mod.preview", `Preview ${index + 1}`)}
                            >
                              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
                      {t("mod.noPreviewImage", "No preview image")}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">{t("mod.description", "Description")}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{plainText(profile.description ?? profile.text)}</p>
                </div>

                {profile.credits.length > 0 && (
                  <div className="mt-4 rounded-xl border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{t("mod.credits", "Credits")}</h4>
                    <div className="space-y-2">
                      {profile.credits.map((group) => (
                        <div key={group.groupName} className="rounded-lg border border-border p-3">
                          <p className="mb-1 text-sm font-medium text-foreground">{group.groupName}</p>
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
                                className="inline-flex items-center gap-1.5 rounded bg-secondary px-2 py-1 hover:bg-secondary/80"
                              >
                                {author.avatarUrl
                                  ? <img src={author.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" loading="lazy" />
                                  : <User className="h-3 w-3" />}
                                <span>{author.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <aside className="min-h-0 overflow-y-auto pr-1">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">{t("mod.downloads", "Downloads")}</p>
                      <p className="font-semibold text-foreground">{formatDownloads(profile.downloadCount)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">{t("mod.version", "Version")}</p>
                      <p className="font-semibold text-foreground">{profile.version ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">{t("mod.author", "Author")}</p>
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
                        className="mt-0.5 inline-flex max-w-full items-center gap-2 font-semibold text-foreground hover:text-primary"
                      >
                        {profile.submitter?.avatarUrl
                          ? <img src={profile.submitter.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" loading="lazy" />
                          : <User className="h-4 w-4" />}
                        <span className="line-clamp-1">{profile.submitter?.name ?? "—"}</span>
                      </button>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs text-muted-foreground">{t("mod.updated", "Updated")}</p>
                      <p className="font-semibold text-foreground">{formatDate(profile.dateUpdated || profile.dateModified || profile.dateAdded, "—")}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{t("mod.installMode", "Install mode")}</label>
                      <select
                        value={installMode}
                        onChange={(event) => setInstallMode(event.target.value as "executable" | "mod_folder")}
                        className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="mod_folder">{t("mod.installModeModFolder", "Mod folder (default)")}</option>
                        <option value="executable">{t("mod.installModeExecutable", "Standalone executable")}</option>
                      </select>
                    </div>

                    {!installAsExecutable && (
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">{t("mod.installTargetEngine", "Install target engine")}</label>
                        <select
                          value={selectedEngineId}
                          onChange={(event) => setSelectedEngineId(event.target.value)}
                          className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground"
                        >
                          {installedEngines.map((engine) => (
                            <option key={engine.id} value={engine.id}>
                              {engine.name} {engine.version}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => window.open(profile.profileUrl, "_blank", "noopener,noreferrer")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("mod.openOnGameBanana", "Open on GameBanana")}
                    </button>
                  </div>

                  {hasDependencyWarning && !installAsExecutable && (
                    <div className="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-foreground space-y-1.5">
                      <p>
                        {t("mod.engineMismatch", "This mod targets")} <span className="font-medium">{detectedEngineSlug}</span>
                        {", "}{t("mod.engineMismatchSelected", "but selected engine is")} <span className="font-medium">{selectedEngine?.slug}</span>.
                        {" "}{t("mod.engineMismatchProceed", "You can proceed anyway.")}
                      </p>
                      {detectedEngineInstalled && (
                        <button
                          type="button"
                          onClick={() => setSelectedEngineId(detectedEngineInstalled.id)}
                          className="rounded bg-warning/20 px-2 py-1 font-medium hover:bg-warning/30"
                        >
                          {t("mod.switchToEngine", "Switch to")} {detectedEngineInstalled.name}
                        </button>
                      )}
                    </div>
                  )}

                  {!installAsExecutable && installedEngines.length === 0 && (
                    <p className="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-foreground">
                       {t("mod.noEnginesInstalled", "No engines installed. Install an engine first or switch install mode to executable package.")}
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">{t("mod.files", "Files")}</h4>
                  <div className="space-y-3">
                    {profile.files.length === 0 && (
                      <div className="text-sm text-muted-foreground">{t("mod.noFiles", "No downloadable files found.")}</div>
                    )}
                    {profile.files.map((file) => (
                      <div key={file.id} className="rounded-xl border border-border p-3">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{file.fileName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{formatDownloads(file.downloadCount)}</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(file.dateAdded)}</span>
                          <span>{formatBytes(file.fileSize, "—")}</span>
                        </div>
                        <motion.button
                          onClick={() => installMod(
                            profile.id,
                            file.id,
                            installAsExecutable ? undefined : (selectedEngineId || undefined),
                            0,
                            { forceInstallType: installAsExecutable ? "executable" : "standard_mod" },
                          )}
                          disabled={!installAsExecutable && installedEngines.length === 0}
                          whileTap={{ scale: 0.94 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Download className="h-4 w-4" />
                           {t("mod.install", "Install")}
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
