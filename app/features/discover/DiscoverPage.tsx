import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, FolderTree, ChevronDown, ChevronRight as ChevronRightSmall } from "lucide-react";
import { motion } from "motion/react";
import { ModCard } from "../mods";
import { useFunkHub } from "../../providers";
import type { CategoryNode } from "../../services/funkhub";

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

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
  };

  const renderCategoryTree = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((category) => {
      const hasChildren = category.children.length > 0;
      const expanded = expandedCategoryIds.includes(category.id);
      const selected = selectedCategoryId === category.id;

      return (
        <div key={category.id} className="space-y-1">
          <button
            onClick={() => setSelectedCategoryId(category.id)}
            className={[
              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left",
              selected
                ? "bg-primary/10 text-primary border border-primary/20"
                : "hover:bg-secondary text-foreground border border-transparent",
            ].join(" ")}
            style={{ paddingLeft: `${12 + depth * 14}px` }}
          >
            {hasChildren ? (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground"
                aria-label={expanded ? "Collapse category" : "Expand category"}
                role="button"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRightSmall className="w-3.5 h-3.5" />}
              </span>
            ) : (
              <span className="w-4 h-4" />
            )}

            {category.iconUrl ? (
              <img
                src={category.iconUrl}
                alt=""
                className="w-4 h-4 rounded-sm object-cover"
                loading="lazy"
              />
            ) : (
              <FolderTree className="w-4 h-4 text-muted-foreground" />
            )}

            <span className="line-clamp-1">{category.name}</span>
          </button>

          {hasChildren && expanded && (
            <div className="space-y-1">
              {renderCategoryTree(category.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <section>
          <div className="mb-4 text-sm text-muted-foreground">
            {loading ? "Loading mods..." : `Showing ${discoverMods.length} mods`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onView={() => window.open(mod.profileUrl, "_blank", "noopener,noreferrer")}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <aside className="bg-card border border-border rounded-xl p-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={[
                "px-2 py-1 rounded text-xs border transition-colors",
                selectedCategoryId === undefined
                  ? "border-primary/30 text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:bg-secondary",
              ].join(" ")}
            >
              All
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-1">
            {renderCategoryTree(categories)}
          </div>
        </aside>
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
