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
import { detectRequiredEngineFromCategories, modInstallerService } from "../../services/funkhub";
import type { GameBananaMember, GameBananaModProfile } from "../../services/funkhub";
import { UserProfileModal } from "./UserProfileModal";

function formatCompact(value?: number): string {
  if (!value || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatDate(ts?: number, unknown = "—"): string {
  if (!ts) return unknown;
  return new Date(ts * 1000).toLocaleDateString();
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts * 1000;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d`;
  if (diff < 31_536_000_000) return `${Math.floor(diff / 2_592_000_000)}mo`;
  return `${Math.floor(diff / 31_536_000_000)}y`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
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

function buildRichTextSrcDoc(rawHtml: string): string {
  const html = sanitizeRichHtml(rawHtml);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        padding: 0.75rem 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.7;
        color: rgba(255,255,255,.9);
        background: transparent;
      }
      h1,h2,h3,h4,h5,h6 { margin: .7rem 0 .45rem; color: white; }
      p { margin: .5rem 0; }
      ul,ol { padding-left: 1.25rem; }
      blockquote { border-left: 3px solid rgba(255,255,255,.18); margin: .75rem 0; padding: .25rem .75rem; }
      img { max-width: 100%; border-radius: 0.5rem; }
      a { color: #8ec5ff; text-decoration: underline; }
      .GreenColor { color: #86efac; }
      .RedColor { color: #fca5a5; }
      .BlueColor { color: #93c5fd; }
      .OrangeColor { color: #fdba74; }
      .YellowColor { color: #fde68a; }
      .WhiteColor { color: #ffffff; }
      .GreyColor { color: #d4d4d8; }
      .Bold, strong { font-weight: 700; }
      .Italic, em { font-style: italic; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
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
        const detectedSlug = detectRequiredEngineFromCategories(next) ?? next.requiredEngine;
        const matching = detectedSlug
          ? installedEngines.find((engine) => engine.slug === detectedSlug)
          : undefined;
        const fallback = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];
        setSelectedEngineId((matching ?? fallback)?.id ?? "");
        const defaultExecutable = modInstallerService.isExecutableCategoryMod(next)
          || next.files.some((file) => modInstallerService.isExecutableMod(next, file));
        setInstallMode(defaultExecutable ? "executable" : "mod_folder");
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
  const detectedEngineSlug = profile
    ? (detectRequiredEngineFromCategories(profile) ?? profile.requiredEngine)
    : undefined;
  const selectedEngine = installedEngines.find((engine) => engine.id === selectedEngineId);
  const detectedEngineInstalled = detectedEngineSlug
    ? installedEngines.find((engine) => engine.slug === detectedEngineSlug)
    : undefined;

  const hasDependencyWarning = Boolean(
    !installAsExecutable && detectedEngineSlug && selectedEngine && selectedEngine.slug !== detectedEngineSlug,
  );

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
                      {mediaGallery[Math.min(activeMediaIndex, mediaGallery.length - 1)]?.type === "video" ? (
                        <iframe
                          src={mediaGallery[Math.min(activeMediaIndex, mediaGallery.length - 1)].embedUrl}
                          title={`YouTube embed ${activeMediaIndex + 1}`}
                          loading="eager"
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <img
                          src={mediaGallery[Math.min(activeMediaIndex, mediaGallery.length - 1)]?.url ?? ""}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                      )}
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
                    <iframe
                      title="Mod description"
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                      srcDoc={buildRichTextSrcDoc(profile.text)}
                      className="w-full min-h-[340px] rounded-lg border border-border bg-secondary/20"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-foreground">{t("mod.files", "Files")}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={installMode}
                      onChange={(event) => setInstallMode(event.target.value as "executable" | "mod_folder")}
                      className="rounded-lg border border-border bg-input-background px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <option value="mod_folder">{t("mod.installModeModFolder", "Mod folder (default)")}</option>
                      <option value="executable">{t("mod.installModeExecutable", "Standalone executable")}</option>
                    </select>

                    {!installAsExecutable && (
                      <select
                        value={selectedEngineId}
                        onChange={(event) => setSelectedEngineId(event.target.value)}
                        className="rounded-lg border border-border bg-input-background px-2.5 py-1.5 text-xs text-foreground"
                      >
                        {installedEngines.map((engine) => (
                          <option key={engine.id} value={engine.id}>{engine.name} {engine.version}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {hasDependencyWarning && !installAsExecutable && (
                  <div className="mb-3 rounded-lg border border-warning/25 bg-warning/10 p-2.5 text-xs text-foreground">
                    <p>
                      {t("mod.engineMismatch", "This mod targets")} <span className="font-medium">{detectedEngineSlug}</span>
                      {", "}{t("mod.engineMismatchSelected", "but selected engine is")} <span className="font-medium">{selectedEngine?.slug}</span>.
                    </p>
                    {detectedEngineInstalled && (
                      <button
                        type="button"
                        onClick={() => setSelectedEngineId(detectedEngineInstalled.id)}
                        className="mt-1.5 rounded bg-warning/20 px-2 py-1 font-medium hover:bg-warning/30"
                      >
                        {t("mod.switchToEngine", "Switch to")} {detectedEngineInstalled.name}
                      </button>
                    )}
                  </div>
                )}

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
                          onClick={() => installMod(
                            profile.id,
                            file.id,
                            installAsExecutable ? undefined : (selectedEngineId || undefined),
                            0,
                            { forceInstallType: installAsExecutable ? "executable" : "standard_mod" },
                          )}
                          disabled={!installAsExecutable && installedEngines.length === 0}
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
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><Heart className="h-3.5 w-3.5" /> Likes</span><span>{formatCompact(profile.likeCount)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><Download className="h-3.5 w-3.5" /> Downloads</span><span>{formatCompact(profile.downloadCount)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-3.5 w-3.5" /> Views</span><span>{formatCompact(profile.viewCount)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> Posts</span><span>{formatCompact(profile.postCount)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="text-muted-foreground">Added</span><span>{formatRelativeTime(profile.dateAdded)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="text-muted-foreground">Updated</span><span>{formatRelativeTime(profile.dateUpdated ?? profile.dateModified)}</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t("mod.submitter", "Submitter")}</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (profile.submitter?.id) {
                      setSelectedSubmitter({
                        id: profile.submitter.id,
                        name: profile.submitter.name,
                        avatarUrl: profile.submitter.avatarUrl,
                      });
                    }
                  }}
                  className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 text-left hover:bg-secondary"
                >
                  {profile.submitter?.avatarUrl
                    ? <img src={profile.submitter.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    : <User className="h-5 w-5" />}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{profile.submitter?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{profile.submitter?.profileUrl ?? ""}</p>
                  </div>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t("mod.details", "Details")}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="text-muted-foreground">Version</span><span>{profile.version ?? "—"}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="text-muted-foreground">Subscribers</span><span>{formatCompact(profile.subscriberCount)}</span></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"><span className="text-muted-foreground">Thanks</span><span>{formatCompact(profile.thanksCount)}</span></div>
                  {profile.license && <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2"><p className="mb-1 text-xs text-muted-foreground">License</p><p className="text-xs text-foreground">{profile.license}</p></div>}
                  {profile.devNotes && <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2"><p className="mb-1 text-xs text-muted-foreground">Dev notes</p><p className="text-xs text-foreground whitespace-pre-wrap">{profile.devNotes}</p></div>}
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
    </div>
  );
}
