import { useState } from "react";
import { motion } from "motion/react";
import { Play, RefreshCw, Trash2, Star } from "lucide-react";
import { installedMods } from "../data/mockData";

export function Library() {
  const [selectedMod, setSelectedMod] = useState(installedMods[0]);

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
              onClick={() => setSelectedMod(mod)}
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
                  src={mod.thumbnail}
                  alt={mod.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm mb-1 truncate">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground">v{mod.version}</p>
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
              src={selectedMod.thumbnail}
              alt={selectedMod.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl font-bold text-white mb-2">{selectedMod.title}</h1>
              <p className="text-gray-300">by {selectedMod.author}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button className="flex-1 max-w-xs px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Launch Mod
            </button>
            <button className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Update
            </button>
            <button className="px-6 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Remove
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Installed Version</p>
              <p className="text-lg font-semibold text-foreground">v{selectedMod.version}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Required Engine</p>
              <p className="text-lg font-semibold text-foreground">{selectedMod.engine}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Installed Date</p>
              <p className="text-lg font-semibold text-foreground">
                {new Date(selectedMod.installedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-3">About this mod</h3>
            <p className="text-muted-foreground leading-relaxed">
              {selectedMod.title} is an exciting Friday Night Funkin' mod that brings new songs, characters, and
              gameplay mechanics. Experience intense rhythm battles with custom charts and stunning visuals. This mod
              requires {selectedMod.engine} to run properly.
            </p>
          </div>

          {/* Screenshots */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Screenshots</h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-secondary rounded-lg overflow-hidden">
                  <img
                    src={selectedMod.thumbnail}
                    alt={`Screenshot ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
