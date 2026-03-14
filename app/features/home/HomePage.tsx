import { motion } from "motion/react";
import { Play, Eye, Gamepad2 } from "lucide-react";
import { ModCard } from "../mods";
import { useFunkHub } from "../../providers";

export function Home() {
  const { loading, trendingMods, installedMods, installMod } = useFunkHub();

  const featuredMod = trendingMods[0];
  const recommendedMods = trendingMods.slice(1, 5);

  return (
    <div className="p-8 space-y-10">
      {/* Featured Mod Banner */}
      <motion.div
        className="relative h-[420px] rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={featuredMod?.imageUrl ?? "https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"}
          alt={featuredMod?.name ?? "Featured Mod"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-10 max-w-3xl">
          <div className="inline-block px-4 py-1.5 bg-primary/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full mb-5 w-fit shadow-lg">
            Featured This Week
          </div>
          <h2 className="text-5xl font-bold text-white mb-4 leading-tight">{featuredMod?.name ?? "Loading..."}</h2>
          <p className="text-gray-200 mb-8 text-lg leading-relaxed max-w-2xl">
            {featuredMod?.description ?? "Top trending Friday Night Funkin' mod from GameBanana."}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (featuredMod?.id) {
                  installMod(featuredMod.id, 0);
                }
              }}
              className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all flex items-center gap-2.5 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Install Now
            </button>
            <button
              onClick={() => {
                if (featuredMod?.profileUrl) {
                  window.open(featuredMod.profileUrl, "_blank", "noopener,noreferrer");
                }
              }}
              className="px-8 py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-xl font-semibold transition-all flex items-center gap-2.5"
            >
              <Eye className="w-5 h-5" />
              View Details
            </button>
          </div>
        </div>
      </motion.div>

      {/* My Installed Mods */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">My Library</h3>
          </div>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {installedMods.map((mod, index) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={mod.thumbnailUrl ?? "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400"}
                    alt={mod.modName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-foreground mb-1">{mod.modName}</h4>
                  <p className="text-sm text-muted-foreground mb-3">by {mod.author ?? "Unknown"}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{mod.engine}</span>
                    <span className="text-muted-foreground">v{mod.version}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommended Mods */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Recommended for You</h3>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            See More →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {(loading ? [] : recommendedMods).map((mod, index) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
            >
              <ModCard
                id={mod.id}
                title={mod.name}
                author={mod.submitter?.name ?? "Unknown"}
                thumbnail={mod.thumbnailUrl ?? mod.imageUrl ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"}
                downloads={mod.downloadCount ?? mod.viewCount}
                rating={mod.likeCount ? Math.max(3.8, Math.min(5, mod.likeCount / 100 + 3.5)) : 4.5}
                onInstall={() => installMod(mod.id, 0)}
                onView={() => window.open(mod.profileUrl, "_blank", "noopener,noreferrer")}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
