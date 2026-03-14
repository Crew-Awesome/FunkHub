import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { ModCard, trendingMods, recentlyUpdatedMods, recommendedMods } from "../mods";

const categories = ["All", "Characters", "Weeks", "Songs", "Skins", "UI Mods", "Full Conversions"];
const sortOptions = ["Most Downloaded", "Newest", "Trending", "Top Rated"];

export function Discover() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Trending");

  const allMods = [...trendingMods, ...recentlyUpdatedMods, ...recommendedMods];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Discover Mods</h1>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for mods..."
              className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedSort(option)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${
                  selectedSort === option
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-card hover:bg-secondary text-muted-foreground border border-border"
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {allMods.length} mods
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allMods.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <ModCard {...mod} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
