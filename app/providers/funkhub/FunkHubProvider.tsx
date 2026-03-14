import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { funkHubService } from "../../services/funkhub";
import {
  CategoryNode,
  DownloadTask,
  EngineDefinition,
  GameBananaModProfile,
  GameBananaModSummary,
  InstalledEngine,
  InstalledMod,
} from "../../services/funkhub";

interface FunkHubContextValue {
  loading: boolean;
  trendingMods: GameBananaModSummary[];
  discoverMods: GameBananaModSummary[];
  categories: CategoryNode[];
  installedMods: InstalledMod[];
  downloads: DownloadTask[];
  enginesCatalog: EngineDefinition[];
  installedEngines: InstalledEngine[];
  selectedCategoryId?: number;
  setSelectedCategoryId: (categoryId?: number) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  refreshDiscover: () => Promise<void>;
  getModProfile: (modId: number) => Promise<GameBananaModProfile>;
  installMod: (modId: number, fileId: number, selectedEngineId?: string) => void;
  cancelDownload: (taskId: string) => void;
  setDefaultEngine: (engineId: string) => void;
  removeInstalledMod: (installedId: string) => void;
}

const FunkHubContext = createContext<FunkHubContextValue | undefined>(undefined);

export function FunkHubProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [trendingMods, setTrendingMods] = useState<GameBananaModSummary[]>([]);
  const [discoverMods, setDiscoverMods] = useState<GameBananaModSummary[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>(funkHubService.getDownloadHistory());
  const [enginesCatalog, setEnginesCatalog] = useState<EngineDefinition[]>([]);
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>(funkHubService.getInstalledMods());
  const [installedEngines, setInstalledEngines] = useState<InstalledEngine[]>(funkHubService.getInstalledEngines());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshDiscover = useCallback(async () => {
    if (searchQuery.trim().length >= 2) {
      const results = await funkHubService.searchMods({ query: searchQuery, page: 1, perPage: 24 });
      setDiscoverMods(results);
      return;
    }

    const mods = await funkHubService.listMods({
      categoryId: selectedCategoryId,
      page: 1,
      perPage: 24,
      sort: "Generic_NewAndUpdated",
    });
    setDiscoverMods(mods);
  }, [searchQuery, selectedCategoryId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);

    try {
      const [trending, categoryTree, catalog] = await Promise.all([
        funkHubService.getTrendingMods(),
        funkHubService.getFunkHubCategories(),
        funkHubService.getEngineCatalog(),
      ]);

      setTrendingMods(trending);
      setCategories(categoryTree);
      setEnginesCatalog(catalog);
      setInstalledMods(funkHubService.getInstalledMods());
      setInstalledEngines(funkHubService.getInstalledEngines());
      await refreshDiscover();
    } finally {
      setLoading(false);
    }
  }, [refreshDiscover]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const unsubscribe = funkHubService.subscribeDownloads((tasks) => {
      setDownloads(tasks);
      setInstalledMods(funkHubService.getInstalledMods());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    refreshDiscover();
  }, [refreshDiscover]);

  const value = useMemo<FunkHubContextValue>(
    () => ({
      loading,
      trendingMods,
      discoverMods,
      categories,
      installedMods,
      downloads,
      enginesCatalog,
      installedEngines,
      selectedCategoryId,
      setSelectedCategoryId,
      searchQuery,
      setSearchQuery,
      refreshDiscover,
      getModProfile: (modId) => funkHubService.getModProfile(modId),
      installMod: (modId, fileId, selectedEngineId) => {
        funkHubService.queueInstall(modId, fileId, selectedEngineId);
      },
      cancelDownload: (taskId) => {
        funkHubService.cancelDownload(taskId);
      },
      setDefaultEngine: (engineId) => {
        funkHubService.setDefaultEngine(engineId);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      removeInstalledMod: (installedId) => {
        funkHubService.removeInstalledMod(installedId);
        setInstalledMods(funkHubService.getInstalledMods());
      },
    }),
    [
      loading,
      trendingMods,
      discoverMods,
      categories,
      installedMods,
      downloads,
      enginesCatalog,
      installedEngines,
      selectedCategoryId,
      searchQuery,
      refreshDiscover,
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
