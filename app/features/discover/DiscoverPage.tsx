import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, FolderTree, ChevronDown, ChevronRight as ChevronRightSmall, UserCircle2, Layers } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ModCard, ModVisualizerModal, UserProfileModal } from "../mods";
import { useFunkHub } from "../../providers";
import type { CategoryNode, GameBananaMember } from "../../services/funkhub";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

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
    installedMods,
    modUpdates,
    settings,
    updateSettings,
    browseFolder,
  } = useFunkHub();
  const navigate = useNavigate();

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedModId, setSelectedModId] = useState<number | undefined>(undefined);
  const [selectedSubmitter, setSelectedSubmitter] = useState<Pick<GameBananaMember, "id" | "name" | "avatarUrl"> | undefined>(undefined);
  const [onboardingOpen, setOnboardingOpen] = useState(!settings.firstRunCompleted);

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
    const defaultExpanded: number[] = [];
    const collectDefaults = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        if (node.id === 43771 || node.id === 43773) {
          defaultExpanded.push(node.id);
        }
        if (node.children.length > 0) {
          collectDefaults(node.children);
        }
      }
    };
    collectDefaults(categories);
    setExpandedCategoryIds(defaultExpanded);
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
                className="w-4 h-4 object-contain"
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

        {needsOnboarding && (
          <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Quick Start Setup</h2>
                <p className="text-sm text-muted-foreground">
                  Set your folders, install an engine, and test one-click installs before browsing mods.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Open Wizard
                </button>
                <button
                  onClick={completeOnboarding}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

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
            {loading ? "Loading mods..." : `Showing ${visibleMods.length} mods`}
          </div>
          {usernameFilter && (
            <div className="mb-4 text-sm text-muted-foreground inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
              <UserCircle2 className="w-4 h-4" />
              Filtered by user: <span className="text-foreground">{usernameFilter}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMods.map((mod, index) => (
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
                  thumbnail={mod.imageUrl ?? mod.thumbnailUrl ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"}
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
                  categoryLabel={selectedCategoryId === undefined ? (mod.rootCategory?.name ?? "Unknown") : undefined}
                  statusLabel={(() => {
                    const installed = installedMods.find((entry) => entry.modId === mod.id);
                    if (!installed) {
                      return undefined;
                    }
                    return modUpdates.some((update) => update.installedId === installed.id)
                      ? "Update"
                      : "Installed";
                  })()}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <aside className="bg-card border border-border rounded-xl p-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
          </div>
          <div className="mb-3">
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories"
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-1">
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={[
                "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left border",
                selectedCategoryId === undefined
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "hover:bg-secondary text-foreground border-transparent",
              ].join(" ")}
            >
              <Layers className="w-4 h-4" />
              <span>All</span>
            </button>
            {renderCategoryTree(filteredCategoryTree)}
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
            <DialogTitle>Welcome to FunkHub</DialogTitle>
            <DialogDescription>
              Finish these setup steps so installs and launches work correctly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">1) Choose your game folder</p>
              <p className="mt-1 text-muted-foreground">Pick your Friday Night Funkin' directory so FunkHub can open and reference local files.</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: "Choose your FNF game folder",
                    defaultPath: settings.gameDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ gameDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                Choose Game Folder
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">Current: {settings.gameDirectory || "Not set"}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">2) Choose data root (engine installs)</p>
              <p className="mt-1 text-muted-foreground">This is where FunkHub stores engine installs and imported content.</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: "Choose engine install root",
                    defaultPath: settings.dataRootDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ dataRootDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                Choose Data Root
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">Current: {settings.dataRootDirectory || "Not set (app default)"}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">3) Install an engine and test one-click</p>
              <p className="mt-1 text-muted-foreground">After installing an engine, test with a URL like:</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">funkhub://mod/install/&lt;ModId&gt;/&lt;FileId&gt;</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/engines")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  Open Engines
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  Open Settings
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={completeOnboarding}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Mark Setup Complete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
