import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Play,
  ShieldCheck,
  Tag,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { detectRequiredEngineFromCategories, formatEngineName } from "../../services/funkhub";
import type { GameBananaMember, GameBananaModProfile } from "../../services/funkhub";
import type { EngineSlug } from "../../services/funkhub";
import { UserProfileModal } from "./UserProfileModal";

function formatCompact(value?: number): string {
  if (!value || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatDate(ts?: number, unknown = "-"): string {
  if (!ts) return unknown;
  return new Date(ts * 1000).toLocaleDateString();
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return "-";
  const diff = Date.now() - ts * 1000;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d`;
  if (diff < 31_536_000_000) return `${Math.floor(diff / 2_592_000_000)}mo`;
  return `${Math.floor(diff / 31_536_000_000)}y`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function extractYoutubeEmbedUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function sanitizeRichHtml(input?: string): string {
  if (!input?.trim()) return "";
  let sanitized = input;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, "");
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<(object|embed|form|input|button|textarea|select)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "");
  sanitized = sanitized.replace(/\sstyle\s*=\s*(['"]).*?\1/gi, "");
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
  sanitized = sanitized.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
  return sanitized;
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

export function ModDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const modId = Number(params.modId);
  const {
    getModProfile,
    installMod,
    installedEngines,
    openExternalUrl,
  } = useFunkHub();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<GameBananaModProfile | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [installMode, setInstallMode] = useState<"executable" | "mod_folder">("mod_folder");
  const [selectedEngineId, setSelectedEngineId] = useState<string>("");
  const [pendingInstallFileId, setPendingInstallFileId] = useState<number | null>(null);
  const [pendingMismatch, setPendingMismatch] = useState<{ required: string; selected: string } | null>(null);
  const [selectedSubmitter, setSelectedSubmitter] = useState<Pick<GameBananaMember, "id" | "name" | "avatarUrl"> | undefined>(undefined);
  const [loadingMsgIndex] = useState(() => Math.floor(Math.random() * FNF_LOADING_MESSAGES.length));

  useEffect(() => {
    if (!Number.isFinite(modId) || modId <= 0) {
      setError(t("mod.invalidId", "Invalid mod id"));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getModProfile(modId)
      .then((next) => {
        if (cancelled) return;
        setProfile(next);
        setActiveMediaIndex(0);
        const fallback = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];
        setSelectedEngineId(fallback?.id ?? "");
        setInstallMode("mod_folder");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("mod.failedLoadProfile", "Failed to load mod profile"));
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modId, getModProfile, installedEngines, t]);

  type MediaItem = { type: "image"; url: string } | { type: "video"; embedUrl: string };
  const getCurrentItem = (index: number): MediaItem | undefined => mediaGallery[Math.min(index, mediaGallery.length - 1)];
  const mediaGallery = useMemo((): MediaItem[] => {
    if (!profile) return [];
    const items: MediaItem[] = [];
    const seen = new Set<string>();
    const addItem = (url: string | undefined) => {
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({ type: "image", url });
      }
    };
    if (profile.imageUrl) {
      addItem(profile.imageUrl);
    } else if (profile.thumbnailUrl) {
      addItem(profile.thumbnailUrl);
    }
    profile.screenshotUrls?.forEach(addItem);
    (profile.embeddedMedia ?? [])
      .map((url) => extractYoutubeEmbedUrl(url))
      .filter((url): url is string => Boolean(url))
      .forEach((embedUrl) => {
        if (embedUrl && !seen.has(embedUrl)) {
          seen.add(embedUrl);
          items.push({ type: "video", embedUrl });
        }
      });
    return items;
  }, [profile]);

  const categoryBreadcrumb = profile
    ? [profile.superCategory, profile.rootCategory, profile.category].filter(
        (c, i, arr) => c?.name && arr.findIndex((x) => x?.name === c.name) === i,
      )
    : [];

  const installAsExecutable = installMode === "executable";
  const selectedEngine = installedEngines.find((engine) => engine.id === selectedEngineId);
  const requiredEngine = profile ? (detectRequiredEngineFromCategories(profile) ?? profile.requiredEngine) : undefined;

  const beginInstallFlow = (fileId: number) => {
    setPendingInstallFileId(fileId);
  };

  const confirmInstallFlow = () => {
    if (!profile || !pendingInstallFileId) return;
    if (!installAsExecutable && requiredEngine && selectedEngine && selectedEngine.slug !== requiredEngine) {
      setPendingMismatch({ required: requiredEngine, selected: selectedEngine.slug });
      return;
    }
    installMod(
      profile.id,
      pendingInstallFileId,
      installAsExecutable ? undefined : (selectedEngineId || undefined),
      0,
      { forceInstallType: installAsExecutable ? "executable" : "standard_mod" },
    );
    setPendingInstallFileId(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/discover");
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("mod.backToBrowse", "Back to browse")}
        </button>

        {profile?.profileUrl && (
          <button
            type="button"
            onClick={() => void openExternalUrl(profile.profileUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            {t("mod.openOnGameBanana", "Open on GameBanana")}
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground inline-flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary"
          />
          {FNF_LOADING_MESSAGES[loadingMsgIndex]}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{profile.name}</h1>
            {profile.description && <p className="mt-2 text-sm text-muted-foreground">{profile.description}</p>}

            {categoryBreadcrumb.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {categoryBreadcrumb.map((cat, i) => (
                  <span key={cat!.id ?? `${cat!.name}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
                    {cat!.iconUrl && <img src={cat!.iconUrl} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                    <span className={i === categoryBreadcrumb.length - 1 ? "font-medium text-primary" : ""}>{cat!.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(350px,0.85fr)] 2xl:grid-cols-[minmax(0,1.7fr)_380px]">
            <section className="space-y-4">
              {(mediaGallery.length > 0) && (
                <div className="space-y-3 rounded-2xl border border-border bg-card p-3 md:p-4">
                  <div className="overflow-hidden rounded-xl border border-border bg-secondary/30">
                    <div className="relative aspect-video">
                      {(() => {
                        const currentItem = getCurrentItem(activeMediaIndex);
                        if (currentItem?.type === "video") {
                          return (
                            <iframe
                              src={currentItem.embedUrl}
                              title={`YouTube embed ${activeMediaIndex + 1}`}
                              loading="eager"
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <img
                            src={currentItem?.url ?? ""}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            loading="eager"
                          />
                        );
                      })()}
                      {mediaGallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveMediaIndex((v) => (v - 1 + mediaGallery.length) % mediaGallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white hover:bg-black/80"
                            aria-label={t("mod.previousImage", "Previous image")}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMediaIndex((v) => (v + 1) % mediaGallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white hover:bg-black/80"
                            aria-label={t("mod.nextImage", "Next image")}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {mediaGallery.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto border-t border-border/70 p-3">
                        {mediaGallery.map((item, index) => (
                          <button
                            key={`${item.type}-${index}`}
                            type="button"
                            onClick={() => setActiveMediaIndex(index)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded border ${index === activeMediaIndex ? "border-primary" : "border-border"}`}
                            aria-label={t("mod.preview", `Preview ${index + 1}`)}
                          >
                            {item.type === "video" ? (
                              <div className="flex h-full w-full items-center justify-center bg-black/40">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            ) : (
                              <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(profile.text || profile.description) && (
                <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                  <h2 className="mb-3 text-base font-semibold text-foreground">{t("mod.description", "Description")}</h2>
                  {profile.text?.trim() ? (
                    <div
                      className="prose prose-invert max-w-none text-sm leading-relaxed [&_a]:text-blue-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_img]:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(profile.text) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-foreground">{t("mod.files", "Files")}</h2>
                </div>

                <div className="space-y-3">
                  {profile.files.length === 0 && (
                    <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                      {t("mod.noFiles", "No downloadable files found.")}
                    </div>
                  )}

                  {profile.files.map((file) => (
                    <div key={file.id} className="rounded-xl border border-border bg-secondary/20 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold text-foreground">{file.fileName}</p>
                        {file.avResult === "clean" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" /> Clean
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {file.version && <span>v{file.version}</span>}
                        {file.description && <span>{file.description}</span>}
                        <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{formatCompact(file.downloadCount)}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(file.dateAdded)}</span>
                        <span>{formatBytes(file.fileSize)}</span>
                      </div>

                      {file.analysisResultVerbose && (
                        <p className="mt-2 text-xs text-muted-foreground">{file.analysisResultVerbose}</p>
                      )}

                      {file.modManagerIntegrations && file.modManagerIntegrations.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {file.modManagerIntegrations.map((integration, idx) => (
                            <span key={`${file.id}-integration-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-muted-foreground">
                              {integration.iconUrl
                                ? <img src={integration.iconUrl} alt="" className="h-3.5 w-3.5 object-contain" loading="lazy" />
                                : <Wrench className="h-3.5 w-3.5" />}
                              {integration.installerName ?? integration.alias ?? "Integration"}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <motion.button
                          type="button"
                          onClick={() => beginInstallFlow(file.id)}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/90 px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Download className="h-4 w-4" />
                          {t("mod.install", "Install")}
                        </motion.button>

                        {file.downloadUrl && (
                          <button
                            type="button"
                            onClick={() => void openExternalUrl(file.downloadUrl)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t("mod.openDownload", "Open download")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(profile.credits.length > 0 || (profile.alternateFileSources?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {profile.credits.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                      <h2 className="mb-3 text-base font-semibold text-foreground">{t("mod.credits", "Credits")}</h2>
                      <div className="space-y-3">
                        {profile.credits.map((group) => (
                          <div key={group.groupName} className="rounded-xl border border-border p-3">
                            <h3 className="mb-2 text-sm font-semibold text-foreground">{group.groupName}</h3>
                            <div className="flex flex-wrap gap-2">
                              {group.authors.map((author) => (
                                <button
                                  key={`${group.groupName}-${author.id}-${author.name}`}
                                  type="button"
                                  onClick={() => {
                                    if (author.id > 0) {
                                      setSelectedSubmitter({ id: author.id, name: author.name, avatarUrl: author.avatarUrl });
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2 py-1 text-xs text-foreground hover:bg-secondary"
                                >
                                  {author.avatarUrl
                                    ? <img src={author.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" loading="lazy" />
                                    : <User className="h-3.5 w-3.5" />}
                                  <span>{author.name}</span>
                                  {author.role && <span className="text-muted-foreground">• {author.role}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(profile.alternateFileSources?.length ?? 0) > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                      <h2 className="mb-3 text-base font-semibold text-foreground">{t("mod.mirrors", "Mirror downloads")}</h2>
                      <div className="space-y-2">
                        {profile.alternateFileSources?.map((source, index) => (
                          <button
                            key={`${source.url}-${index}`}
                            type="button"
                            onClick={() => void openExternalUrl(source.url)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-left text-sm hover:bg-secondary/60"
                          >
                            <span className="line-clamp-1">{source.description ?? source.url}</span>
                            <ExternalLink className="h-4 w-4 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t("mod.stats", "Stats")}</h2>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2 text-xs">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Likes</span>
                      <span className="ml-auto font-medium text-foreground">{formatCompact(profile.likeCount)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2 text-xs">
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Downloads</span>
                      <span className="ml-auto font-medium text-foreground">{formatCompact(profile.downloadCount)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2 text-xs">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Views</span>
                      <span className="ml-auto font-medium text-foreground">{formatCompact(profile.viewCount)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2 text-xs">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Posts</span>
                      <span className="ml-auto font-medium text-foreground">{formatCompact(profile.postCount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
                    <span className="text-muted-foreground">Added</span>
                    <span>{formatRelativeTime(profile.dateAdded)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{formatRelativeTime(profile.dateUpdated ?? profile.dateModified)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t("mod.submitter", "Submitter")}</h2>
                <div className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 text-left">
                  {profile.submitter?.avatarUrl
                    ? <img src={profile.submitter.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    : <User className="h-5 w-5" />}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{profile.submitter?.name ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{profile.submitter?.profileUrl ?? ""}</p>
                  </div>
                </div>
              </div>

              {profile.tags && profile.tags.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Tags</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      <UserProfileModal
        open={Boolean(selectedSubmitter)}
        submitter={selectedSubmitter}
        onClose={() => setSelectedSubmitter(undefined)}
        onOpenMod={(openModId) => {
          setSelectedSubmitter(undefined);
          navigate(`/mods/${openModId}`, { state: { from: location.pathname + location.search } });
        }}
      />

      {pendingMismatch ? (
        <div className="fixed inset-0 z-[60] bg-black/75 p-4">
          <div className="mx-auto mt-[14vh] w-full max-w-lg rounded-2xl border border-destructive/40 bg-card p-4">
            <h3 className="text-base font-semibold text-destructive">{t("mod.wrongEngineTitle", "WRONG ENGINE")}</h3>
            <p className="mt-2 text-sm text-foreground">
              {t("mod.wrongEngineBody", "This mod targets")} <span className="font-semibold">{formatEngineName(pendingMismatch.required as EngineSlug)}</span>
              {", "}{t("mod.wrongEngineBody2", "but selected engine is")} <span className="font-semibold">{formatEngineName(pendingMismatch.selected as EngineSlug)}</span>.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingMismatch(null)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const required = pendingMismatch.required;
                  setPendingMismatch(null);
                  setPendingInstallFileId(null);
                  navigate("/engines", { state: { openAddEngine: true, preselectEngineSlug: required } });
                }}
                className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/20"
              >
                {t("mod.goInstallEngine", "Go install")} {formatEngineName(pendingMismatch.required as EngineSlug)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingMismatch(null);
                  if (!profile || !pendingInstallFileId) return;
                  installMod(
                    profile.id,
                    pendingInstallFileId,
                    installAsExecutable ? undefined : (selectedEngineId || undefined),
                    0,
                    { forceInstallType: installAsExecutable ? "executable" : "standard_mod" },
                  );
                  setPendingInstallFileId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("common.continue", "Continue")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingInstallFileId ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="mx-auto mt-[10vh] w-full max-w-xl rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{t("mod.installSetupTitle", "Install setup")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("mod.installSetupDetected", "Choose how to install this mod.")}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-border bg-secondary/40 p-1.5 hover:bg-secondary"
                onClick={() => setPendingInstallFileId(null)}
                aria-label={t("common.close", "Close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs text-muted-foreground">{t("mod.installSetupOverride", "Select executable or mod folder, then confirm install.")}</p>

            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setInstallMode("executable")}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${installMode === "executable" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40"}`}
              >
                {t("mod.installModeExecutable", "Install as executable")}
              </button>
              <button
                type="button"
                onClick={() => setInstallMode("mod_folder")}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${installMode === "mod_folder" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40"}`}
              >
                {t("mod.installModeModFolder", "Install as mod folder")}
              </button>
            </div>

            {installMode === "mod_folder" && (
              <div className="mb-3">
                <label className="mb-1.5 block text-xs text-muted-foreground">{t("mod.selectEngine", "Select engine")}</label>
                <select
                  value={selectedEngineId}
                  onChange={(event) => setSelectedEngineId(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input-background px-2.5 py-2 text-sm text-foreground"
                >
                  {installedEngines.map((engine) => (
                    <option key={engine.id} value={engine.id}>{engine.name} {engine.version}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingInstallFileId(null)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmInstallFlow}
                disabled={installMode === "mod_folder" && !selectedEngineId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {t("mod.install", "Install")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

