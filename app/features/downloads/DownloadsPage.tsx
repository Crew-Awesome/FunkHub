import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, X, Download, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";

function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) {
    return "--";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  downloading: "Downloading",
  installing: "Installing",
  completed: "Completed",
  failed: "Failed",
};

export function Downloads() {
  const { t } = useI18n();
  const { downloads, cancelDownload, retryDownload, clearDownloads } = useFunkHub();
  const activeDownloads = downloads.filter((task) => task.status === "queued" || task.status === "downloading" || task.status === "installing");
  const completedDownloads = downloads.filter((task) => task.status === "completed");
  const failedDownloads = downloads.filter((task) => task.status === "failed");
  const hasAny = downloads.length > 0;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("downloads.title", "Downloads")}</h1>
          {hasAny && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeDownloads.length > 0 && `${activeDownloads.length} active`}
              {activeDownloads.length > 0 && (completedDownloads.length > 0 || failedDownloads.length > 0) && " · "}
              {completedDownloads.length > 0 && `${completedDownloads.length} completed`}
              {failedDownloads.length > 0 && (completedDownloads.length > 0 || activeDownloads.length > 0) && " · "}
              {failedDownloads.length > 0 && `${failedDownloads.length} failed`}
            </p>
          )}
        </div>
        {hasAny && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearDownloads}
            className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-sm text-foreground transition-colors"
          >
            {t("downloads.clear", "Clear All")}
          </motion.button>
        )}
      </motion.div>

      {/* Active Downloads */}
      {activeDownloads.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("downloads.active", "Active")}</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {activeDownloads.map((download) => {
                const percent = Math.round(download.progress * 100);
                const isInstalling = download.status === "installing";

                return (
                  <motion.div
                    key={download.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isInstalling ? "bg-success/15" : "bg-primary/15"}`}>
                        {isInstalling
                          ? <Zap className="w-4 h-4 text-success" />
                          : <Download className={`w-4 h-4 text-primary ${download.status === "downloading" ? "animate-bounce" : ""}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{download.fileName}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span className={`font-medium ${isInstalling ? "text-success" : "text-primary"}`}>
                            {isInstalling ? t("downloads.installing", "Installing...") : (download.phase ?? STATUS_LABEL[download.status] ?? download.status)}
                          </span>
                          {download.speedBytesPerSecond ? (
                            <span>{formatBytes(download.speedBytesPerSecond)}/s</span>
                          ) : (
                            <span>{t("downloads.waiting", "Waiting...")}</span>
                          )}
                          {download.totalBytes ? <span>{formatBytes(download.totalBytes)}</span> : null}
                        </div>
                        {download.message && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{download.message}</p>
                        )}
                      </div>
                      <button
                        onClick={() => cancelDownload(download.id)}
                        className="p-1.5 hover:bg-secondary rounded-lg transition-colors shrink-0"
                        aria-label={t("downloads.cancel", "Cancel download")}
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t("downloads.progress", "Progress")}</span>
                        <span className="font-medium text-foreground tabular-nums">{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden relative">
                        <motion.div
                          className={`h-full origin-left rounded-full ${isInstalling ? "bg-success" : "bg-gradient-to-r from-primary to-chart-3"}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: Math.max(0, Math.min(1, download.progress)) }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                        {!isInstalling && download.status === "downloading" && (
                          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                            <div className="animate-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Completed */}
      {completedDownloads.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("downloads.recent", "Completed")}</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AnimatePresence>
              {completedDownloads.map((download, index) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-3 px-4 py-3 ${index < completedDownloads.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{download.fileName}</p>
                    <p className="text-xs text-muted-foreground">{t("downloads.completed", "Completed")} · {formatBytes(download.totalBytes)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Failed */}
      {failedDownloads.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("downloads.failed", "Failed")}</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {failedDownloads.map((download) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-destructive/20 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{download.fileName}</p>
                    <p className="text-xs text-destructive/80 mt-0.5 truncate">{download.error || download.message || t("downloads.failedGeneric", "Download failed")}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => retryDownload(download.id)}
                    className="h-8 px-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t("downloads.retry", "Retry")}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasAny && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
              <Clock className="w-9 h-9 text-muted-foreground" />
            </div>
          </motion.div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("downloads.noneActive", "Nothing downloading")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("downloads.noneActiveDesc", "Install mods from Discover and your downloads will appear here.")}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
