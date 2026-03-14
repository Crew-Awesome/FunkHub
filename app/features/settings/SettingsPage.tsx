import { motion } from "motion/react";
import { Folder, Download, Palette, Sliders, Info } from "lucide-react";
import { useTheme } from "../../providers";

export function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <div className="space-y-6">
        {/* General Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">General</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Game Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="C:/Games/FridayNightFunkin"
                  className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Browse
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Default Engine
              </label>
              <select className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>Psych Engine</option>
                <option>Kade Engine</option>
                <option>Codename Engine</option>
                <option>Vanilla FNF</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Download Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Downloads</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Download Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="C:/Users/User/Downloads/FunkHub"
                  className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Browse
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Concurrent Downloads
              </label>
              <select defaultValue="3" className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>5</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Appearance Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Dark Theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark mode is enabled" : "Light mode is enabled"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
                className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                         checked:bg-primary transition-colors
                         after:content-[''] after:absolute after:top-1 after:left-1 
                         after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                         checked:after:translate-x-5"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Show animations</p>
                <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
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
        </motion.section>

        {/* Advanced Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Advanced</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Enable compatibility checks</p>
                <p className="text-sm text-muted-foreground">
                  Verify mod compatibility before installation
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

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Auto-update mods</p>
                <p className="text-sm text-muted-foreground">
                  Automatically download updates for installed mods
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
                <p className="font-medium text-foreground">Send analytics</p>
                <p className="text-sm text-muted-foreground">
                  Help improve FunkHub by sharing usage data
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
          </div>
        </motion.section>

        {/* About */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">FunkHub v1.0.0</h3>
          <p className="text-sm text-muted-foreground">
            A modern mod manager and launcher for Friday Night Funkin'
          </p>
        </div>
      </div>
    </div>
  );
}
