import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Play, RefreshCw, Trash2, Star } from "lucide-react";
import { useFunkHub } from "../../providers";

export function Library() {
  const {
    installedMods,
    installedEngines,
    getModProfile,
    removeInstalledMod,
    refreshModUpdates,
    installMod,
    launchInstalledMod,
  } = useFunkHub();
  const [selectedModId, setSelectedModId] = useState(installedMods[0]?.id);
  const [deleteFilesOnRemove, setDeleteFilesOnRemove] = useState(true);
  const [selectedProfileShots, setSelectedProfileShots] = useState<string[]>([]);

  const selectedMod = installedMods.find((mod) => mod.id === selectedModId) ?? installedMods[0];
  const selectedEngineInstall = useMemo(
    () => installedEngines.find((engine) => selectedMod && selectedMod.installPath.startsWith(engine.installPath)),
    [installedEngines, selectedMod],
  );

  useEffect(() => {
    let cancelled = false;
    if (!selectedMod) {
      setSelectedProfileShots([]);
      return;
    }

    getModProfile(selectedMod.modId)
      .then((profile) => {
        if (cancelled) {
          return;
        }
        const shots = (profile.screenshotUrls ?? []).filter(Boolean);
        const deduped = Array.from(new Set(shots));
        setSelectedProfileShots(deduped);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedProfileShots([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMod?.modId, getModProfile]);

  if (!selectedMod) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No installed mods yet. Install one from Discover.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Mod List */}
      <div className="w-80 bg-card border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Installed Mods ({installedMods.length})</h2>
        </div>
        <div className="p-2 space-y-1">
          {installedMods.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedModId(mod.id)}
              className={`
                w-full text-left p-3 rounded-lg transition-all
                ${
                  selectedMod.id === mod.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-secondary border border-transparent"
                }
              `}
            >
              <div className="flex gap-3">
                <img
                  src={mod.thumbnailUrl ?? "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400"}
                  alt={mod.modName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">{mod.modName}</h3>
                    {mod.updateAvailable && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Update</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">v{mod.version ?? "unknown"}</p>
                  <p className="text-xs text-muted-foreground">{mod.engine}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mod Details */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={selectedMod.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
          className="p-8"
        >
          {/* Banner */}
          <div className="relative h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={selectedMod.thumbnailUrl ?? "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400"}
                alt={selectedMod.modName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-white mb-2">{selectedMod.modName}</h1>
                <p className="text-gray-300">by {selectedMod.author ?? "Unknown"}</p>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => launchInstalledMod(selectedMod.id)}
              className="flex-1 max-w-xs px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Launch Mod
            </button>
            <button className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              {selectedMod.updateAvailable ? "Update Available" : "Check Update"}
            </button>
            {selectedMod.updateAvailable && (
              <button
                onClick={() => installMod(selectedMod.modId, selectedMod.sourceFileId, undefined, 10)}
                className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Install Update
              </button>
            )}
            <button
              onClick={() => removeInstalledMod(selectedMod.id, { deleteFiles: deleteFilesOnRemove })}
              className="px-6 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Remove
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <input
              type="checkbox"
              checked={deleteFilesOnRemove}
              onChange={(event) => setDeleteFilesOnRemove(event.target.checked)}
            />
            Delete mod files from disk when removing
          </label>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <p className="text-lg font-semibold text-foreground">
                v{selectedMod.version ?? "unknown"}
                {selectedMod.latestVersion ? ` -> v${selectedMod.latestVersion}` : ""}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Required Engine</p>
              <p className="text-lg font-semibold text-foreground">{selectedMod.requiredEngine ?? selectedMod.engine}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Installed Date</p>
              <p className="text-lg font-semibold text-foreground">
                {new Date(selectedMod.installedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Installed In Engine</p>
            <p className="text-sm text-foreground font-medium">
              {selectedMod.installPath.startsWith("executables/")
                ? "Standalone executable package"
                : (selectedEngineInstall
                  ? `${selectedEngineInstall.name} v${selectedEngineInstall.version}`
                  : "Unknown engine installation")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 break-all">{selectedMod.installPath}</p>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-3">About this mod</h3>
            <p className="text-muted-foreground leading-relaxed">
              {selectedMod.modName} is installed from GameBanana and managed by FunkHub. This package is installed
              into the selected engine path and can be launched with {selectedMod.engine}.
            </p>
          </div>

          {/* Screenshots */}
          {selectedProfileShots.length > 1 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">Screenshots</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedProfileShots.map((shot, index) => (
                  <div key={`${shot}-${index}`} className="aspect-video bg-secondary rounded-lg overflow-hidden">
                    <img
                      src={shot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <button
        onClick={() => refreshModUpdates()}
        className="fixed bottom-6 right-6 px-4 py-2 rounded-lg bg-card border border-border hover:bg-secondary text-sm"
      >
        Refresh Update Status
      </button>
    </div>
  );
}
