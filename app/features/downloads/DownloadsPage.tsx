import { motion } from "motion/react";
import { RotateCcw, X, FolderOpen, Download } from "lucide-react";
import { useFunkHub } from "../../providers";

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

export function Downloads() {
  const { downloads, cancelDownload, retryDownload, clearDownloads } = useFunkHub();
  const activeDownloads = downloads.filter((task) => task.status === "queued" || task.status === "downloading" || task.status === "installing");
  const completedDownloads = downloads.filter((task) => task.status === "completed").slice(0, 5);
  const failedDownloads = downloads.filter((task) => task.status === "failed").slice(0, 8);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Downloads</h1>
        <button
          onClick={clearDownloads}
          className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-sm text-foreground"
        >
          Clear Downloads
        </button>
      </div>

      {activeDownloads.length > 0 ? (
        <div className="space-y-4">
          {activeDownloads.map((download, index) => (
            <motion.div
              key={download.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{download.fileName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{download.speedBytesPerSecond ? `${formatBytes(download.speedBytesPerSecond)}/s` : "Waiting..."}</span>
                    <span>•</span>
                    <span>{formatBytes(download.totalBytes)}</span>
                    {download.phase && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{download.phase}</span>
                      </>
                    )}
                  </div>
                  {download.message && <p className="text-xs text-muted-foreground mt-1">{download.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelDownload(download.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-destructive" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <FolderOpen className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{Math.round(download.progress * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-chart-3"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(download.progress * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Download className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No active downloads</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Your downloads will appear here. Browse mods and click install to start downloading.
          </p>
        </div>
      )}

      {/* Download History */}
      {completedDownloads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Downloads</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            {completedDownloads.map((download) => (
              <div key={download.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{download.fileName}</h4>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{formatBytes(download.totalBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {failedDownloads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Failed Downloads</h2>
          <div className="space-y-3">
            {failedDownloads.map((download) => (
              <div key={download.id} className="bg-card border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-foreground">{download.fileName}</h4>
                    <p className="text-xs text-red-300 mt-1">{download.error || download.message || "Download failed"}</p>
                  </div>
                  <button
                    onClick={() => retryDownload(download.id)}
                    className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
