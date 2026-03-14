import { useMemo } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { ModCard } from "../mods";
import { useFunkHub } from "../../providers";

export function Discover() {
  const {
    loading,
    discoverMods,
    modSortOptions,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    discoverSort,
    setDiscoverSort,
    discoverPage,
    setDiscoverPage,
    hasMoreDiscover,
    searchQuery,
    setSearchQuery,
    installMod,
  } = useFunkHub();

  const flatCategories = useMemo(() => {
    const list: Array<{ id?: number; name: string }> = [{ id: undefined, name: "All" }];
    const walk = (nodes: typeof categories) => {
      for (const node of nodes) {
        list.push({ id: node.id, name: node.name });
        if (node.children.length > 0) {
          walk(node.children);
        }
      }
    };

    walk(categories);
    return list;
  }, [categories]);

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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
          {flatCategories.map((category) => (
            <button
              key={category.id ?? -1}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${
                  selectedCategoryId === category.id
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {modSortOptions.map((option) => (
            <button
              key={option.alias}
              onClick={() => setDiscoverSort(option.alias)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${
                  discoverSort === option.alias
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-card hover:bg-secondary text-muted-foreground border border-border"
                }
              `}
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? "Loading mods..." : `Showing ${discoverMods.length} mods`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {discoverMods.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <ModCard
              id={mod.id}
              title={mod.name}
              author={mod.submitter?.name ?? "Unknown"}
              thumbnail={mod.thumbnailUrl ?? mod.imageUrl ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"}
              rating={mod.likeCount ? Math.max(3.8, Math.min(5, mod.likeCount / 100 + 3.5)) : 4.5}
              downloads={mod.downloadCount ?? mod.viewCount}
              onInstall={() => installMod(mod.id, 0)}
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setDiscoverPage(Math.max(1, discoverPage - 1))}
          disabled={discoverPage <= 1}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {discoverPage}</span>
        <button
          onClick={() => setDiscoverPage(discoverPage + 1)}
          disabled={!hasMoreDiscover}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
