import { motion } from "motion/react";
import { RefreshCw, Download } from "lucide-react";
import { availableUpdates } from "../mods";

export function Updates() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Updates</h1>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Check for Updates
        </button>
      </div>

      {availableUpdates.length > 0 ? (
        <div className="space-y-3">
          {availableUpdates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{update.modName}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="px-2 py-1 bg-secondary rounded text-foreground">
                        v{update.currentVersion}
                      </span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">New:</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                        v{update.newVersion}
                      </span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{update.size}</span>
                  </div>
                </div>
                <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Update
                </button>
              </div>
            </motion.div>
          ))}

          <div className="mt-6">
            <button className="w-full px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors">
              Update All ({availableUpdates.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <RefreshCw className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">All mods are up to date!</h3>
          <p className="text-muted-foreground text-center max-w-md">
            There are no updates available for your installed mods at this time.
          </p>
        </div>
      )}

      {/* Update Settings */}
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Update Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-foreground">Auto-update mods</p>
              <p className="text-sm text-muted-foreground">
                Automatically download and install mod updates
              </p>
            </div>
            <input
              type="checkbox"
              className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                       checked:bg-primary transition-colors
                       after:content-[''] after:absolute after:top-1 after:left-1 
                       after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                       checked:after:translate-x-5"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-foreground">Check for updates on startup</p>
              <p className="text-sm text-muted-foreground">
                Scan for available updates when FunkHub launches
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                       checked:bg-primary transition-colors
                       after:content-[''] after:absolute after:top-1 after:left-1 
                       after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                       checked:after:translate-x-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
