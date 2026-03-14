import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { funkHubService } from "../../services/funkhub";
import {
  CategoryNode,
  DownloadTask,
  EngineDefinition,
  FunkHubSettings,
  GameBananaModProfile,
  GameBananaModSummary,
  InstalledEngine,
  InstalledMod,
  ModUpdateInfo,
} from "../../services/funkhub";

interface FunkHubContextValue {
  loading: boolean;
  trendingMods: GameBananaModSummary[];
  discoverMods: GameBananaModSummary[];
  categories: CategoryNode[];
  modSortOptions: Array<{ alias: string; title: string }>;
  installedMods: InstalledMod[];
  modUpdates: ModUpdateInfo[];
  downloads: DownloadTask[];
  enginesCatalog: EngineDefinition[];
  installedEngines: InstalledEngine[];
  settings: FunkHubSettings;
  selectedCategoryId?: number;
  setSelectedCategoryId: (categoryId?: number) => void;
  discoverSort: string;
  setDiscoverSort: (value: string) => void;
  discoverPage: number;
  setDiscoverPage: (page: number) => void;
  discoverPerPage: number;
  hasMoreDiscover: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  refreshDiscover: () => Promise<void>;
  refreshModUpdates: () => Promise<void>;
  getModProfile: (modId: number) => Promise<GameBananaModProfile>;
  installMod: (modId: number, fileId: number, selectedEngineId?: string, priority?: number) => void;
  installEngine: (slug: InstalledEngine["slug"], downloadUrl: string, version: string) => Promise<void>;
  importEngineFromFolder: (slug: InstalledEngine["slug"], versionHint?: string) => Promise<void>;
  updateEngine: (engineId: string) => Promise<void>;
  uninstallEngine: (engineId: string) => Promise<void>;
  launchEngine: (
    engineId: string,
    options?: { launcher?: "native" | "wine" | "wine64" | "proton"; launcherPath?: string },
  ) => Promise<void>;
  openEngineFolder: (engineId: string) => Promise<void>;
  openEngineModsFolder: (engineId: string) => Promise<void>;
  getEngineHealth: (engineId: string) => { health: "ready" | "missing_binary" | "broken_install"; message?: string };
  refreshEngineHealth: (engineId?: string) => Promise<void>;
  launchInstalledMod: (installedId: string) => Promise<void>;
  cancelDownload: (taskId: string) => void;
  retryDownload: (taskId: string) => void;
  setDefaultEngine: (engineId: string) => void;
  removeInstalledMod: (installedId: string, options?: { deleteFiles?: boolean }) => Promise<void>;
  updateSettings: (patch: Partial<FunkHubSettings>) => Promise<void>;
  browseFolder: (options?: { title?: string; defaultPath?: string }) => Promise<string | undefined>;
}

const FunkHubContext = createContext<FunkHubContextValue | undefined>(undefined);

export function FunkHubProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [trendingMods, setTrendingMods] = useState<GameBananaModSummary[]>([]);
  const [discoverMods, setDiscoverMods] = useState<GameBananaModSummary[]>([]);
  const [modSortOptions, setModSortOptions] = useState<Array<{ alias: string; title: string }>>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>(funkHubService.getDownloadHistory());
  const [enginesCatalog, setEnginesCatalog] = useState<EngineDefinition[]>([]);
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>(funkHubService.getInstalledMods());
  const [modUpdates, setModUpdates] = useState<ModUpdateInfo[]>(funkHubService.getModUpdates());
  const [installedEngines, setInstalledEngines] = useState<InstalledEngine[]>(funkHubService.getInstalledEngines());
  const [settings, setSettings] = useState<FunkHubSettings>(funkHubService.getSettings());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [discoverSort, setDiscoverSort] = useState("Generic_Newest");
  const [discoverPage, setDiscoverPage] = useState(1);
  const discoverPerPage = 24;
  const [hasMoreDiscover, setHasMoreDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshDiscover = useCallback(async () => {
    try {
      if (searchQuery.trim().length >= 2) {
        const results = await funkHubService.searchMods({ query: searchQuery, page: discoverPage, perPage: discoverPerPage });
        setDiscoverMods(results);
        setHasMoreDiscover(results.length >= discoverPerPage);
        return;
      }

      const mods = await funkHubService.listMods({
        categoryId: selectedCategoryId,
        page: discoverPage,
        perPage: discoverPerPage,
        sort: discoverSort,
      });
      setDiscoverMods(mods);
      setHasMoreDiscover(mods.length >= discoverPerPage);
    } catch {
      setDiscoverMods([]);
      setHasMoreDiscover(false);
    }
  }, [searchQuery, selectedCategoryId, discoverSort, discoverPage]);

  const refreshModUpdates = useCallback(async () => {
    const updates = await funkHubService.refreshModUpdates();
    setModUpdates(updates);
    setInstalledMods(funkHubService.getInstalledMods());
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);

    try {
      const [trending, categoryTree, catalog, sorts] = await Promise.all([
        funkHubService.getTrendingMods(),
        funkHubService.getFunkHubCategories(),
        funkHubService.getEngineCatalog(),
        funkHubService.getModSortOptions(),
        funkHubService.syncDesktopSettings(),
      ]);

      setTrendingMods(trending);
      setCategories(categoryTree);
      if (!selectedCategoryId && categoryTree.length > 0) {
        setSelectedCategoryId(categoryTree[0].id);
      }
      setEnginesCatalog(catalog);
      const filteredSorts = sorts.filter((sort) => ["Generic_Newest", "Generic_MostDownloaded", "Generic_MostLiked", "Generic_MostViewed"].includes(sort.alias));
      setModSortOptions(filteredSorts.length > 0
        ? filteredSorts
        : [
          { alias: "Generic_Newest", title: "Newest" },
          { alias: "Generic_MostDownloaded", title: "Most Downloaded" },
          { alias: "Generic_MostLiked", title: "Most Liked" },
          { alias: "Generic_MostViewed", title: "Most Viewed" },
        ]);
      setInstalledMods(funkHubService.getInstalledMods());
      setInstalledEngines(funkHubService.getInstalledEngines());
      setSettings(funkHubService.getSettings());
      await funkHubService.refreshEngineHealth();
      await refreshModUpdates();
      await refreshDiscover();
    } finally {
      setLoading(false);
    }
  }, [refreshDiscover, refreshModUpdates, selectedCategoryId]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const unsubscribe = funkHubService.subscribeDownloads((tasks) => {
      setDownloads(tasks);
      setInstalledMods(funkHubService.getInstalledMods());
      setModUpdates(funkHubService.getModUpdates());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    refreshDiscover();
  }, [refreshDiscover]);

  useEffect(() => {
    setDiscoverPage(1);
  }, [selectedCategoryId, discoverSort, searchQuery]);

  const value = useMemo<FunkHubContextValue>(
    () => ({
      loading,
      trendingMods,
      discoverMods,
      categories,
      modSortOptions,
      installedMods,
      modUpdates,
      downloads,
      enginesCatalog,
      installedEngines,
      settings,
      selectedCategoryId,
      setSelectedCategoryId,
      discoverSort,
      setDiscoverSort,
      discoverPage,
      setDiscoverPage,
      discoverPerPage,
      hasMoreDiscover,
      searchQuery,
      setSearchQuery,
      refreshDiscover,
      refreshModUpdates,
      getModProfile: (modId) => funkHubService.getModProfile(modId),
      installMod: (modId, fileId, selectedEngineId, priority = 0) => {
        funkHubService.queueInstall(modId, fileId, selectedEngineId, priority);
      },
      installEngine: async (slug, downloadUrl, version) => {
        await funkHubService.installEngineFromRelease({ slug, releaseUrl: downloadUrl, releaseVersion: version });
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      importEngineFromFolder: async (slug, versionHint) => {
        await funkHubService.importEngineFromFolder({ slug, versionHint });
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      updateEngine: async (engineId) => {
        await funkHubService.updateEngine(engineId);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      uninstallEngine: async (engineId) => {
        await funkHubService.uninstallEngine(engineId);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      launchEngine: async (engineId, options) => {
        await funkHubService.launchEngine(engineId, options);
      },
      openEngineFolder: async (engineId) => {
        await funkHubService.openEngineFolder(engineId);
      },
      openEngineModsFolder: async (engineId) => {
        await funkHubService.openEngineModsFolder(engineId);
      },
      getEngineHealth: (engineId) => funkHubService.getEngineHealth(engineId),
      refreshEngineHealth: async (engineId) => {
        await funkHubService.refreshEngineHealth(engineId);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      launchInstalledMod: async (installedId) => {
        await funkHubService.launchInstalledMod(installedId);
      },
      cancelDownload: (taskId) => {
        funkHubService.cancelDownload(taskId);
      },
      retryDownload: (taskId) => {
        funkHubService.retryDownload(taskId);
      },
      setDefaultEngine: (engineId) => {
        funkHubService.setDefaultEngine(engineId);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      removeInstalledMod: async (installedId, options) => {
        await funkHubService.removeInstalledMod(installedId, options);
        setInstalledMods(funkHubService.getInstalledMods());
      },
      updateSettings: async (patch) => {
        const next = await funkHubService.updateSettings(patch);
        setSettings(next);
      },
      browseFolder: async (options) => funkHubService.pickFolder(options),
    }),
    [
      loading,
      trendingMods,
      discoverMods,
      categories,
      modSortOptions,
      installedMods,
      modUpdates,
      downloads,
      enginesCatalog,
      installedEngines,
      settings,
      selectedCategoryId,
      discoverSort,
      discoverPage,
      discoverPerPage,
      hasMoreDiscover,
      searchQuery,
      refreshDiscover,
      refreshModUpdates,
      selectedCategoryId,
    ],
  );

  return <FunkHubContext.Provider value={value}>{children}</FunkHubContext.Provider>;
}

export function useFunkHub() {
  const context = useContext(FunkHubContext);
  if (!context) {
    throw new Error("useFunkHub must be used within FunkHubProvider");
  }
  return context;
}
