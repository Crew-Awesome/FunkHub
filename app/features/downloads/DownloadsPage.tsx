import { motion } from "motion/react";
import { Pause, X, FolderOpen, Download } from "lucide-react";
import { activeDownloads } from "../mods";

export function Downloads() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Downloads</h1>

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
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{download.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{download.speed}</span>
                    <span>•</span>
                    <span>{download.size}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Pause className="w-5 h-5 text-foreground" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
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
                  <span className="font-medium text-primary">{download.progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${download.progress}%` }}
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
      {activeDownloads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Downloads</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">VS Sonic.EXE v3.0</h4>
                  <p className="text-xs text-muted-foreground">Completed 2 hours ago</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">450 MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
