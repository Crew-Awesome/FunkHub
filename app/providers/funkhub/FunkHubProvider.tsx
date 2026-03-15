import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  itchAuth: { connected: boolean; connectedAt?: number; scopes?: string[] };
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
  listModsBySubmitter: (input: { submitterId: number; categoryId?: number; page?: number; perPage?: number }) => Promise<GameBananaModSummary[]>;
  installMod: (modId: number, fileId: number, selectedEngineId?: string, priority?: number) => void;
  installEngine: (slug: InstalledEngine["slug"], downloadUrl: string, version: string) => Promise<void>;
  importEngineFromFolder: (slug: InstalledEngine["slug"], versionHint?: string) => Promise<void>;
  updateEngine: (engineId: string) => Promise<void>;
  uninstallEngine: (engineId: string) => Promise<void>;
  launchEngine: (
    engineId: string,
    options?: {
      launcher?: "native" | "wine" | "wine64" | "proton";
      launcherPath?: string;
      executablePath?: string;
    },
  ) => Promise<void>;
  openEngineFolder: (engineId: string) => Promise<void>;
  openEngineModsFolder: (engineId: string) => Promise<void>;
  getEngineHealth: (engineId: string) => { health: "ready" | "missing_binary" | "broken_install"; message?: string };
  refreshEngineHealth: (engineId?: string) => Promise<void>;
  launchInstalledMod: (installedId: string) => Promise<void>;
  cancelDownload: (taskId: string) => void;
  retryDownload: (taskId: string) => void;
  clearDownloads: () => void;
  setDefaultEngine: (engineId: string) => void;
  removeInstalledMod: (installedId: string, options?: { deleteFiles?: boolean }) => Promise<void>;
  updateSettings: (patch: Partial<FunkHubSettings>) => Promise<void>;
  browseFolder: (options?: { title?: string; defaultPath?: string }) => Promise<string | undefined>;
  browseFile: (options?: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | undefined>;
  openFolderPath: (targetPath: string) => Promise<void>;
  addManualMod: (input: { modName: string; engineId: string; sourcePath?: string; description?: string; version?: string; author?: string }) => Promise<void>;
  reconcileDiskState: () => Promise<void>;
  connectItch: (clientId: string) => Promise<void>;
  disconnectItch: () => Promise<void>;
  refreshItchAuth: () => Promise<void>;
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
  const [itchAuth, setItchAuth] = useState<{ connected: boolean; connectedAt?: number; scopes?: string[] }>({ connected: false });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [discoverSort, setDiscoverSort] = useState("Generic_Newest");
  const [discoverPage, setDiscoverPage] = useState(1);
  const discoverPerPage = 24;
  const [hasMoreDiscover, setHasMoreDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const handledDeepLinksRef = useRef<Set<string>>(new Set());

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

  const getModProfile = useCallback((modId: number) => funkHubService.getModProfile(modId), []);

  const listModsBySubmitter = useCallback((input: { submitterId: number; categoryId?: number; page?: number; perPage?: number }) => (
    funkHubService.listMods({
      submitterId: input.submitterId,
      categoryId: input.categoryId,
      page: input.page,
      perPage: input.perPage,
    })
  ), []);

  const handleDeepLink = useCallback(async (rawUrl: string) => {
    if (!rawUrl || handledDeepLinksRef.current.has(rawUrl)) {
      return;
    }
    handledDeepLinksRef.current.add(rawUrl);

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "funkhub:") {
        return;
      }

      const action = (parsed.hostname || parsed.pathname.replace(/^\//, "")).toLowerCase();
      if (action !== "install") {
        return;
      }

      const modId = Number(parsed.searchParams.get("mod") || "0");
      if (!Number.isFinite(modId) || modId <= 0) {
        throw new Error("Invalid mod id in protocol URL");
      }

      const engineParam = (parsed.searchParams.get("engine") || "").trim().toLowerCase();
      const selectedEngine = engineParam
        ? installedEngines.find((engine) => (
          engine.id.toLowerCase() === engineParam
          || engine.slug.toLowerCase() === engineParam
          || engine.name.toLowerCase().replace(/\s+/g, "-") === engineParam
        ))
        : undefined;

      if (engineParam && !selectedEngine) {
        throw new Error(`Engine '${engineParam}' is not installed`);
      }

      const profile = await funkHubService.getModProfile(modId);
      const firstFile = profile.files[0];
      if (!firstFile) {
        throw new Error("No downloadable files found for this mod");
      }

      funkHubService.queueInstall(modId, firstFile.id, selectedEngine?.id, 20);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to process protocol install URL");
    }
  }, [installedEngines]);

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
      await funkHubService.reconcileDiskState();
      setInstalledMods(funkHubService.getInstalledMods());
      setInstalledEngines(funkHubService.getInstalledEngines());
      setSettings(funkHubService.getSettings());
      setItchAuth(await funkHubService.getItchAuthStatus());
      await funkHubService.refreshEngineHealth();
      await funkHubService.hydrateInstalledModMetadata();
      setInstalledMods(funkHubService.getInstalledMods());
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
    if (!window.funkhubDesktop?.onDeepLink || !window.funkhubDesktop?.getPendingDeepLinks) {
      return;
    }

    let cancelled = false;
    window.funkhubDesktop.getPendingDeepLinks()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        for (const rawUrl of payload.links || []) {
          handleDeepLink(rawUrl);
        }
      })
      .catch(() => undefined);

    const unsubscribe = window.funkhubDesktop.onDeepLink((payload) => {
      if (!cancelled && payload?.url) {
        handleDeepLink(payload.url);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [handleDeepLink]);

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
      itchAuth,
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
      getModProfile,
      listModsBySubmitter,
      installMod: (modId, fileId, selectedEngineId, priority = 0) => {
        try {
          funkHubService.queueInstall(modId, fileId, selectedEngineId, priority);
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Unable to queue install");
        }
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
      clearDownloads: () => {
        funkHubService.clearDownloadHistory();
        setDownloads(funkHubService.getDownloadHistory());
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
      browseFile: async (options) => funkHubService.pickFile(options),
      openFolderPath: async (targetPath) => {
        await funkHubService.openAnyPath(targetPath);
      },
      addManualMod: async (input) => {
        await funkHubService.addManualModFromFolder(input);
        setInstalledMods(funkHubService.getInstalledMods());
      },
      reconcileDiskState: async () => {
        await funkHubService.reconcileDiskState();
        setInstalledMods(funkHubService.getInstalledMods());
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      connectItch: async (clientId) => {
        await funkHubService.connectItchOAuth(clientId);
        setItchAuth(await funkHubService.getItchAuthStatus());
      },
      disconnectItch: async () => {
        await funkHubService.disconnectItchOAuth();
        setItchAuth(await funkHubService.getItchAuthStatus());
      },
      refreshItchAuth: async () => {
        setItchAuth(await funkHubService.getItchAuthStatus());
      },
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
      itchAuth,
      selectedCategoryId,
      discoverSort,
      discoverPage,
      discoverPerPage,
      hasMoreDiscover,
      searchQuery,
      refreshDiscover,
      refreshModUpdates,
      getModProfile,
      listModsBySubmitter,
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
