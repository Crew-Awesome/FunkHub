import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Cpu, FolderOpen } from "lucide-react";
import { EngineCard } from "./EngineCard";
import { useFunkHub } from "../../providers";

export function Engines() {
  const { installedEngines, enginesCatalog, setDefaultEngine, installEngine } = useFunkHub();
  const [showEngines, setShowEngines] = useState(installedEngines.length > 0);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const availableEngines = enginesCatalog;

  if (!showEngines) {
    return (
      <div className="p-8 flex items-center justify-center min-h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">No engines installed</h2>
            <p className="text-muted-foreground mb-6">
              Install or import an engine to start playing mods.
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Engine
            </button>
          </div>

          {/* Add Engine Dialog */}
          {showAddDialog && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-card border border-border rounded-xl p-6"
            >
                <h3 className="font-semibold text-foreground mb-4">Select an engine to install</h3>
                <div className="space-y-2">
                {availableEngines.map((engine) => (
                  <button
                    key={engine.slug}
                    onClick={async () => {
                      const primaryRelease = engine.releases[0];
                      if (primaryRelease) {
                        await installEngine(engine.slug, primaryRelease.downloadUrl, primaryRelease.version);
                      }
                      setShowEngines(true);
                      setShowAddDialog(false);
                    }}
                    className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-left font-medium transition-colors flex items-center gap-3"
                  >
                    <Cpu className="w-5 h-5 text-primary" />
                    {engine.name}
                  </button>
                ))}
                <button className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-left font-medium transition-colors flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Import From Folder
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Game Engines</h1>
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Engine
        </button>
      </div>

      {/* Add Engine Dialog */}
      {showAddDialog && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Select an engine to install</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableEngines.map((engine) => (
              <button
                key={engine.slug}
                onClick={async () => {
                  const primaryRelease = engine.releases[0];
                  if (primaryRelease) {
                    await installEngine(engine.slug, primaryRelease.downloadUrl, primaryRelease.version);
                    setShowAddDialog(false);
                  }
                }}
                className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-left font-medium transition-colors flex items-center gap-3"
              >
                <Cpu className="w-5 h-5 text-primary" />
                <span className="flex-1">{engine.name}</span>
                <span className="text-xs text-muted-foreground">{engine.releases[0]?.version ?? "latest"}</span>
              </button>
            ))}
            <button className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-left font-medium transition-colors flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-primary" />
              Import From Folder
            </button>
          </div>
        </motion.div>
      )}

      {/* Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installedEngines.map((engine, index) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div onDoubleClick={() => setDefaultEngine(engine.id)}>
              <EngineCard name={engine.name} version={engine.version} isDefault={engine.isDefault} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Engine Info */}
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3">About Game Engines</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Different mods require different game engines to run. FunkHub manages multiple engine installations
          so you can play any mod. Set a default engine for quick launches, or switch between engines based on
          mod requirements.
        </p>
      </div>
    </div>
  );
}
