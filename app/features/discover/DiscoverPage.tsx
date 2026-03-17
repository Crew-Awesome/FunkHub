import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight, FolderTree, ChevronDown, ChevronRight as ChevronRightSmall, UserCircle2, Layers, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ModCard, ModVisualizerModal, UserProfileModal } from "../mods";
import { useFunkHub, useI18n } from "../../providers";
import type { CategoryNode, ContentRating, GameBananaMember, ReleaseType, SearchField, SearchSortOrder, SubfeedSort } from "../../services/funkhub";
import { CONTENT_RATING_OPTIONS, RELEASE_TYPE_OPTIONS, SEARCH_FIELD_OPTIONS, SEARCH_SORT_OPTIONS } from "../../services/funkhub";
import type { SupportedLocale } from "../../i18n";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shared/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../shared/ui/sheet";

export function Discover() {
  const { t, locale, locales, setLocale } = useI18n();
  const {
    loading,
    discoverMods,
    bestOfMods,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    subfeedSort,
    setSubfeedSort,
    categorySort,
    setCategorySort,
    discoverPage,
    setDiscoverPage,
    hasMoreDiscover,
    searchQuery,
    setSearchQuery,
    searchOrder,
    setSearchOrder,
    searchFields,
    setSearchFields,
    browseReleaseType,
    setBrowseReleaseType,
    browseContentRatings,
    setBrowseContentRatings,
    installedMods,
    modUpdates,
    settings,
    updateSettings,
    browseFolder,
  } = useFunkHub();

  const SUBFEED_SORTS: Array<{ value: SubfeedSort; label: string }> = [
    { value: "default", label: "Ripe" },
    { value: "new", label: "New" },
    { value: "updated", label: "Updated" },
  ];

  const CATEGORY_SORTS = [
    { value: "Generic_Newest", label: "Newest" },
    { value: "Generic_MostDownloaded", label: "Most Downloaded" },
    { value: "Generic_MostLiked", label: "Most Liked" },
    { value: "Generic_MostViewed", label: "Most Viewed" },
  ];

  const PERIOD_ORDER = ["today", "week", "month", "3month", "6month", "year", "alltime"];
  const PERIOD_LABELS: Record<string, string> = {
    today: "Today", week: "This Week", month: "This Month",
    "3month": "3 Months", "6month": "6 Months", year: "This Year", alltime: "All Time",
  };
  const navigate = useNavigate();

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showBrowseFilters, setShowBrowseFilters] = useState(false);
  const [showRatingPicker, setShowRatingPicker] = useState(false);
  const [selectedModId, setSelectedModId] = useState<number | undefined>(undefined);
  const [selectedSubmitter, setSelectedSubmitter] = useState<Pick<GameBananaMember, "id" | "name" | "avatarUrl"> | undefined>(undefined);
  const [onboardingOpen, setOnboardingOpen] = useState(!settings.firstRunCompleted);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [bestOfIndex, setBestOfIndex] = useState(0);
  const [bestOfStripOffset, setBestOfStripOffset] = useState(0);
  const STRIP_SIZE = 4;

  // Flat list of all bestOfMods sorted by period order (today first, alltime last)
  const bestOfFlat = useMemo(() => {
    return [...bestOfMods].sort((a, b) => {
      const ai = PERIOD_ORDER.indexOf(a.period ?? "alltime");
      const bi = PERIOD_ORDER.indexOf(b.period ?? "alltime");
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [bestOfMods]);

  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoAdvance = () => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setBestOfIndex((prev) => (prev + 1) % Math.max(1, bestOfFlat.length));
    }, 4000);
  };

  // Auto-advance on mount and whenever bestOfFlat changes
  useEffect(() => {
    if (bestOfFlat.length <= 1) return;
    startAutoAdvance();
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestOfFlat.length]);

  // Scroll strip to keep selected index visible
  useEffect(() => {
    if (bestOfIndex < bestOfStripOffset || bestOfIndex >= bestOfStripOffset + STRIP_SIZE) {
      setBestOfStripOffset(
        Math.max(0, Math.min(Math.max(0, bestOfFlat.length - STRIP_SIZE), bestOfIndex)),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestOfIndex]);

  const needsOnboarding = !settings.firstRunCompleted;

  useEffect(() => {
    if (needsOnboarding) {
      setOnboardingOpen(true);
    }
  }, [needsOnboarding]);

  const completeOnboarding = async () => {
    await updateSettings({ firstRunCompleted: true });
    setOnboardingOpen(false);
  };

  useEffect(() => {
    const rootExpanded: number[] = [];
    for (const node of categories) {
      rootExpanded.push(node.id);
    }
    setExpandedCategoryIds(rootExpanded);
  }, [categories]);

  const usernameFilter = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.startsWith("@")) {
      return trimmed.slice(1).trim().toLowerCase();
    }
    const prefixed = trimmed.match(/^user:\s*(.+)$/i);
    if (prefixed?.[1]) {
      return prefixed[1].trim().toLowerCase();
    }
    return "";
  }, [searchQuery]);

  const visibleMods = useMemo(() => {
    if (!usernameFilter) {
      return discoverMods;
    }
    return discoverMods.filter((mod) => (mod.submitter?.name ?? "").toLowerCase().includes(usernameFilter));
  }, [discoverMods, usernameFilter]);

  const filteredCategoryTree = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) {
      return categories;
    }

    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => nodes
      .map((node) => ({
        ...node,
        children: filterNodes(node.children),
      }))
      .filter((node) => node.name.toLowerCase().includes(term) || node.children.length > 0);

    return filterNodes(categories);
  }, [categories, categorySearch]);

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
          <div
            className={[
              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left border",
              selected
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-foreground border-transparent",
            ].join(" ")}
            style={{ paddingLeft: `${12 + depth * 14}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(category.id)}
                className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-foreground rounded"
                aria-label={expanded ? t("discover.collapseCategory", "Collapse category") : t("discover.expandCategory", "Expand category")}
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRightSmall className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5 h-5" />
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId(category.id);
                setShowCategoryPanel(false);
              }}
              className="flex w-full min-w-0 flex-1 items-center justify-start gap-2 text-left hover:text-primary transition-colors"
            >
              {category.iconUrl ? (
                <img
                  src={category.iconUrl}
                  alt=""
                  className="w-4 h-4 object-contain"
                  loading="lazy"
                />
              ) : (
                <FolderTree className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="line-clamp-1">{category.name}</span>
            </button>
          </div>

          {hasChildren && expanded && (
            <div className="space-y-1">
              {renderCategoryTree(category.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const categoryPanel = (
    <>
      <div className="mb-3">
        <input
          value={categorySearch}
          onChange={(event) => setCategorySearch(event.target.value)}
          placeholder={t("discover.searchCategories", "Search categories")}
          aria-label={t("discover.searchCategories", "Search categories")}
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-1">
        <button
          onClick={() => {
            setSelectedCategoryId(undefined);
            setShowCategoryPanel(false);
          }}
          className={[
            "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left border",
            selectedCategoryId === undefined
              ? "bg-primary/10 text-primary border-primary/20"
              : "hover:bg-secondary text-foreground border-transparent",
          ].join(" ")}
        >
          <Layers className="w-4 h-4" />
          <span>{t("discover.allMods", "All Mods")}</span>
        </button>
        {renderCategoryTree(filteredCategoryTree)}
      </div>
    </>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">{t("discover.title", "Discover Mods")}</h1>

        {needsOnboarding && (
          <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("discover.quickStart", "Quick Start Setup")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("discover.quickStartDesc", "Set your folders, install an engine, and test one-click installs before browsing mods.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("discover.openWizard", "Open Wizard")}
                </button>
                <button
                  onClick={completeOnboarding}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  {t("discover.dismiss", "Dismiss")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              aria-label={t("discover.searchMods", "Search mods")}
              placeholder={t("discover.searchMods", "Search mods or paste a GameBanana URL...")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCategoryPanel(true)}
            className="inline-flex xl:hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("discover.filters", "Filters")}
          </button>
        </div>

        {/* Search options — search mode */}
        {searchQuery.trim().length >= 2 && (
          <div className="space-y-2 pb-2">
            {/* Search sort order */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground shrink-0">{t("discover.sortBy", "Sort by")}:</span>
              {SEARCH_SORT_OPTIONS.map((option) => {
                const isSelected = searchOrder === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setSearchOrder(option.value as SearchSortOrder)}
                    whileTap={{ scale: 0.92 }}
                    animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-card hover:bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Search fields */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground shrink-0">{t("discover.searchIn", "Search in")}:</span>
              {SEARCH_FIELD_OPTIONS.map((field) => {
                const isActive = searchFields.includes(field.value as SearchField);
                return (
                  <button
                    key={field.value}
                    type="button"
                    onClick={() => {
                      if (isActive && searchFields.length === 1) return; // keep at least one
                      setSearchFields(
                        isActive
                          ? searchFields.filter((f) => f !== field.value)
                          : [...searchFields, field.value as SearchField],
                      );
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {field.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Best Of hero — shown in browse mode (no search), persists across category changes */}
      {bestOfFlat.length > 0 && !searchQuery.trim() && (() => {
        const hero = bestOfFlat[bestOfIndex];
        if (!hero) return null;
        const stripMods = bestOfFlat.slice(bestOfStripOffset, bestOfStripOffset + STRIP_SIZE);
        const canStripPrev = bestOfStripOffset > 0;
        const canStripNext = bestOfStripOffset + STRIP_SIZE < bestOfFlat.length;

        return (
          <div className="mb-6 rounded-2xl overflow-hidden border border-border bg-card">
            {/* Large hero image */}
            <div
              className="relative h-56 cursor-pointer"
              onClick={() => setSelectedModId(hero.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedModId(hero.id)}
              aria-label={`View ${hero.name}`}
            >
              <img
                src={hero.imageUrl ?? hero.thumbnailUrl ?? "/mod-placeholder.svg"}
                alt={hero.name}
                className="w-full h-full object-cover"
                loading="eager"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/mod-placeholder.svg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              {hero.period && (
                <div className="absolute top-3 left-3">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                    Best of {PERIOD_LABELS[hero.period] ?? hero.period}
                  </span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{hero.name}</h3>
                {hero.description && (
                  <p className="text-white/70 text-xs mt-1 line-clamp-2">{hero.description}</p>
                )}
                {hero.likeCount !== undefined && (
                  <span className="text-white/60 text-xs mt-1.5 inline-block">♥ {hero.likeCount.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Thumbnail strip — arrows scroll viewport by 1, click selects hero */}
            <div className="flex items-center gap-2 p-3 bg-card border-t border-border">
              <button
                onClick={() => setBestOfStripOffset((prev) => Math.max(0, prev - 1))}
                disabled={!canStripPrev}
                className="shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-30 transition-colors"
                aria-label={t("discover.bestOfPrev", "Previous")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${STRIP_SIZE}, 1fr)` }}>
                {stripMods.map((mod) => {
                  const globalIndex = bestOfFlat.indexOf(mod);
                  const isSelected = globalIndex === bestOfIndex;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setBestOfIndex(globalIndex);
                        startAutoAdvance(); // reset timer on manual select
                      }}
                      title={mod.period ? `${mod.name} — Best of ${PERIOD_LABELS[mod.period] ?? mod.period}` : mod.name}
                      className={`relative w-full h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      aria-label={mod.name}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={mod.thumbnailUrl ?? mod.imageUrl ?? "/mod-placeholder.svg"}
                        alt={mod.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/mod-placeholder.svg"; }}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setBestOfStripOffset((prev) => Math.min(Math.max(0, bestOfFlat.length - STRIP_SIZE), prev + 1))}
                disabled={!canStripNext}
                className="shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-30 transition-colors"
                aria-label={t("discover.bestOfNext", "Next")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Sort + filter bar — browse mode, below Best Of */}
      {!searchQuery.trim() && (
        <div className="space-y-2 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            {selectedCategoryId === undefined
              ? SUBFEED_SORTS.map((option) => {
                  const isSelected = subfeedSort === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setSubfeedSort(option.value)}
                      whileTap={{ scale: 0.92 }}
                      animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                        isSelected
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-card hover:bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  );
                })
              : CATEGORY_SORTS.map((option) => {
                  const isSelected = categorySort === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setCategorySort(option.value)}
                      whileTap={{ scale: 0.92 }}
                      animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                        isSelected
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-card hover:bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  );
                })
            }
            <button
              type="button"
              onClick={() => setShowBrowseFilters((v) => !v)}
              className={`ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showBrowseFilters || browseReleaseType || browseContentRatings.length > 0
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t("discover.filters", "Filters")}
              {(browseReleaseType || browseContentRatings.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 leading-none">
                  {[browseReleaseType ? 1 : 0, browseContentRatings.length > 0 ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>

          {showBrowseFilters && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-foreground mb-2">{t("discover.releaseType", "Release type")}</p>
                <div className="flex flex-wrap gap-2">
                  {RELEASE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBrowseReleaseType(opt.value as ReleaseType)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        browseReleaseType === opt.value
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-secondary text-muted-foreground border-transparent hover:border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-foreground">
                    {t("discover.contentRatings", "Content ratings")}
                    {browseContentRatings.length > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">({browseContentRatings.length} selected)</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowRatingPicker((v) => !v)} className="text-xs text-primary hover:underline">
                      {showRatingPicker ? t("discover.hide", "Hide") : t("discover.pick", "Pick ratings")}
                    </button>
                    {browseContentRatings.length > 0 && (
                      <button type="button" onClick={() => setBrowseContentRatings([])} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                        {t("discover.clearAll", "Clear")}
                      </button>
                    )}
                  </div>
                </div>
                {showRatingPicker && (
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_RATING_OPTIONS.map((opt) => {
                      const active = browseContentRatings.includes(opt.value as ContentRating);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBrowseContentRatings(active ? browseContentRatings.filter((r) => r !== opt.value) : [...browseContentRatings, opt.value as ContentRating])}
                          className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${active ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-transparent hover:border-border"}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <section>
          <div className="mb-4 text-sm text-muted-foreground">
            {loading ? t("discover.loadingMods", "Loading mods...") : `Showing ${visibleMods.length} mods`}
          </div>
          {usernameFilter && (
            <div className="mb-4 text-sm text-muted-foreground inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
              <UserCircle2 className="w-4 h-4" />
              {t("discover.filteredByUser", "Filtered by user")}: <span className="text-foreground">{usernameFilter}</span>
            </div>
          )}
          {!loading && visibleMods.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-muted-foreground text-sm">
                {searchQuery.trim()
                  ? t("discover.noResults", "No mods match your search.")
                  : t("discover.noMods", "No mods found.")}
              </p>
              {(browseReleaseType || browseContentRatings.length > 0) && (
                <button
                  onClick={() => { setBrowseReleaseType(undefined as unknown as ReleaseType); setBrowseContentRatings([]); }}
                  className="text-xs text-primary hover:underline"
                >
                  {t("discover.clearFilters", "Clear filters")}
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
            {visibleMods.map((mod, index) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              >
                <ModCard
                  id={mod.id}
                  title={mod.name}
                  author={mod.submitter?.name ?? t("discover.communityUploader", "Community uploader")}
                  thumbnail={mod.imageUrl ?? mod.thumbnailUrl ?? "/mod-placeholder.svg"}
                  likes={mod.likeCount}
                  downloads={mod.downloadCount}
                  onView={() => setSelectedModId(mod.id)}
                  onAuthorClick={() => {
                    if (mod.submitter?.id) {
                      setSelectedSubmitter({
                        id: mod.submitter.id,
                        name: mod.submitter.name,
                        avatarUrl: mod.submitter.avatarUrl,
                      });
                    }
                  }}
                  categoryLabel={selectedCategoryId === undefined ? (mod.rootCategory?.name || t("discover.uncategorized", "Uncategorized")) : undefined}
                  statusLabel={(() => {
                    const installed = installedMods.find((entry) => entry.modId === mod.id);
                    if (!installed) {
                      return undefined;
                    }
                    return modUpdates.some((update) => update.installedId === installed.id)
                      ? t("discover.update", "Update")
                      : t("discover.installed", "Installed");
                  })()}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <aside className="hidden xl:block bg-card border border-border rounded-xl p-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">{t("discover.categories", "Categories")}</h2>
          </div>
          {categoryPanel}
        </aside>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setDiscoverPage(Math.max(1, discoverPage - 1))}
          disabled={discoverPage <= 1}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("discover.previous", "Previous")}
        </button>
        <span className="text-sm text-muted-foreground">{t("discover.page", "Page")} {discoverPage}</span>
        <button
          onClick={() => setDiscoverPage(discoverPage + 1)}
          disabled={!hasMoreDiscover}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          {t("discover.next", "Next")}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ModVisualizerModal
        modId={selectedModId}
        open={Boolean(selectedModId)}
        onClose={() => setSelectedModId(undefined)}
        onOpenSubmitter={(submitter) => setSelectedSubmitter(submitter)}
      />

      <UserProfileModal
        open={Boolean(selectedSubmitter)}
        submitter={selectedSubmitter}
        onClose={() => setSelectedSubmitter(undefined)}
        onOpenMod={(modId) => {
          setSelectedSubmitter(undefined);
          setSelectedModId(modId);
        }}
      />

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("discover.welcome", "Welcome to FunkHub")}</DialogTitle>
            <DialogDescription>
              {t("discover.welcomeDesc", "Finish these setup steps so installs and launches work correctly.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step0", "0) Choose your language")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step0Desc", "Pick your preferred UI language before continuing setup.")}</p>
              <select
                value={locale}
                onChange={(event) => {
                  void setLocale(event.target.value as SupportedLocale);
                }}
                className="mt-2 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground"
              >
                {locales.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step1", "1) Choose your game folder")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step1Desc", "Pick your Friday Night Funkin' directory so FunkHub can open and reference local files.")}</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: t("discover.chooseGameFolder", "Choose your FNF game folder"),
                    defaultPath: settings.gameDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ gameDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                {t("discover.chooseGameFolderBtn", "Choose Game Folder")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">{t("discover.current", "Current")}: {settings.gameDirectory || t("discover.notSet", "Not set")}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step2", "2) Choose data root (engine installs)")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step2Desc", "This is where FunkHub stores engine installs and imported content.")}</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: t("discover.chooseEngineRoot", "Choose engine install root"),
                    defaultPath: settings.dataRootDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ dataRootDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                {t("discover.chooseDataRoot", "Choose Data Root")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">{t("discover.current", "Current")}: {settings.dataRootDirectory || t("discover.notSetDefault", "Not set (app default)")}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step3", "3) Install an engine and test one-click")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step3Desc", "After installing an engine, test with a URL like:")}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{t("discover.exampleDeepLink", "funkhub://mod/install/<ModId>/<FileId>")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/engines")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  {t("discover.openEngines", "Open Engines")}
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  {t("discover.openSettings", "Open Settings")}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={completeOnboarding}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("discover.markSetupComplete", "Mark Setup Complete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={() => setShowCategoryPanel(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm shadow-sm xl:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("discover.categories", "Categories")}
      </button>

      <Sheet open={showCategoryPanel} onOpenChange={setShowCategoryPanel}>
        <SheetContent side="right" className="w-[88vw] p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{t("discover.browseCategories", "Browse Categories")}</SheetTitle>
            <SheetDescription>{t("discover.browseCategoriesDesc", "Filter discover results by category.")}</SheetDescription>
          </SheetHeader>
          <div className="p-4">{categoryPanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
