import { motion } from "motion/react";
import { Heart, Download, Package, Calendar } from "lucide-react";
import { installedMods } from "../data/mockData";

export function Profile() {
  const userStats = {
    installedMods: 12,
    favoriteMods: 8,
    totalDownloads: "4.2M",
    memberSince: "January 2024",
  };

  const favoriteMods = installedMods.slice(0, 3);

  return (
    <div className="p-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-card to-secondary border border-border rounded-2xl p-8 mb-8"
      >
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl font-bold text-white">FH</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">FunkHub User</h1>
            <p className="text-muted-foreground mb-4">funkuser@example.com</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors">
                Connect GameBanana
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{userStats.installedMods}</p>
              <p className="text-sm text-muted-foreground">Installed Mods</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{userStats.favoriteMods}</p>
              <p className="text-sm text-muted-foreground">Favorite Mods</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{userStats.totalDownloads}</p>
              <p className="text-sm text-muted-foreground">Total Downloads</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Member Since</p>
              <p className="text-sm text-muted-foreground">{userStats.memberSince}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Favorite Mods */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Favorite Mods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favoriteMods.map((mod, index) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={mod.thumbnail}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{mod.title}</h3>
                <p className="text-sm text-muted-foreground">by {mod.author}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Future Features */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3">Coming Soon</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• GameBanana account integration</p>
          <p>• Cloud sync for mod configurations</p>
          <p>• Achievement system</p>
          <p>• Mod collections and sharing</p>
        </div>
      </div>
    </div>
  );
}
