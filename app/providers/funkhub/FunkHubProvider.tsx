import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { funkHubService } from "../../services/funkhub";
import {
  AppUpdateInfo,
  CategoryNode,
  DesktopAppUpdateStatus,
  DownloadTask,
  EngineDefinition,
  FunkHubSettings,
  GameBananaModProfile,
  GameBananaModSummary,
  InstallOptions,
  InstalledEngine,
  InstalledMod,
  ModUpdateInfo,
} from "../../services/funkhub";
import { parseFunkHubDeepLink } from "../../services/funkhub/deepLink";
import { modInstallerService } from "../../services/funkhub/installer";
import { normalizeLocale, translate } from "../../i18n";

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
  installMod: (modId: number, fileId: number, selectedEngineId?: string, priority?: number, options?: InstallOptions) => void;
  installEngine: (slug: InstalledEngine["slug"], downloadUrl: string, version: string, options?: { allowMissingExecutable?: boolean }) => Promise<void>;
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
  updateInstalledModLaunchOptions: (
    installedId: string,
    options: { launcher?: "native" | "wine" | "wine64" | "proton"; launcherPath?: string; executablePath?: string },
  ) => Promise<void>;
  cancelDownload: (taskId: string) => void;
  retryDownload: (taskId: string) => void;
  clearDownloads: () => void;
  setDefaultEngine: (engineId: string) => void;
  renameEngine: (engineId: string, name: string) => void;
  setEngineCustomIcon: (engineId: string, iconUrl?: string) => void;
  removeInstalledMod: (installedId: string, options?: { deleteFiles?: boolean }) => Promise<void>;
  updateSettings: (patch: Partial<FunkHubSettings>) => Promise<void>;
  browseFolder: (options?: { title?: string; defaultPath?: string }) => Promise<string | undefined>;
  browseFile: (options?: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | undefined>;
  openFolderPath: (targetPath: string) => Promise<void>;
  addManualMod: (input: { modName: string; engineId?: string; sourcePath?: string; description?: string; version?: string; author?: string; standalone?: boolean }) => Promise<void>;
  reconcileDiskState: () => Promise<void>;
  connectItch: (clientId: string) => Promise<void>;
  disconnectItch: () => Promise<void>;
  refreshItchAuth: () => Promise<void>;
  appUpdate: AppUpdateInfo | undefined;
  appUpdateError?: string;
  appUpdateChecking: boolean;
  checkAppUpdate: () => Promise<void>;
  openAppUpdateDownload: () => Promise<void>;
  downloadAppUpdate: () => Promise<void>;
  installAppUpdate: () => Promise<void>;
  appUpdateStatus?: DesktopAppUpdateStatus;
  runningLaunchIds: Set<string>;
  killLaunch: (launchId: string) => Promise<void>;
  clearModPlayTime: (installedId: string) => void;
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
  const processedDeepLinksRef = useRef<Map<string, number>>(new Map());
  const processingDeepLinksRef = useRef<Set<string>>(new Set());
  const [appUpdate, setAppUpdate] = useState<AppUpdateInfo | undefined>(undefined);
  const [appUpdateChecking, setAppUpdateChecking] = useState(false);
  const [appUpdateError, setAppUpdateError] = useState<string | undefined>(undefined);
  const [appUpdateStatus, setAppUpdateStatus] = useState<DesktopAppUpdateStatus | undefined>(
    funkHubService.getDesktopAppUpdateStatus(),
  );
  const startupUpdateCheckedRef = useRef(false);
  const [runningLaunchIds, setRunningLaunchIds] = useState<Set<string>>(new Set());
  const launchStartTimesRef = useRef<Map<string, number>>(new Map());
  const t = useCallback((key: string, fallback: string, vars?: Record<string, string | number>) => {
    return translate(normalizeLocale(settings.locale), key, fallback, vars);
  }, [settings.locale]);

  const collectCategoryIds = useCallback((targetId: number): Set<number> => {
    const ids = new Set<number>();

    const walk = (nodes: CategoryNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          const collectChildren = (current: CategoryNode) => {
            ids.add(current.id);
            current.children.forEach(collectChildren);
          };
          collectChildren(node);
          return true;
        }

        if (walk(node.children)) {
          return true;
        }
      }

      return false;
    };

    walk(categories);
    if (ids.size === 0) {
      ids.add(targetId);
    }
    return ids;
  }, [categories]);

  const refreshDiscover = useCallback(async () => {
    try {
      const selectedCategoryIds = selectedCategoryId !== undefined
        ? collectCategoryIds(selectedCategoryId)
        : undefined;

      if (searchQuery.trim().length >= 2) {
        const results = await funkHubService.searchMods({ query: searchQuery, page: discoverPage, perPage: discoverPerPage });
        const filtered = selectedCategoryIds
          ? results.filter((mod) => selectedCategoryIds.has(mod.rootCategory?.id ?? -1))
          : results;
        setDiscoverMods(filtered);
        setHasMoreDiscover(filtered.length >= discoverPerPage);
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
  }, [searchQuery, selectedCategoryId, discoverSort, discoverPage, collectCategoryIds]);

  const refreshModUpdates = useCallback(async () => {
    const updates = await funkHubService.refreshModUpdates();
    setModUpdates(updates);
    setInstalledMods(funkHubService.getInstalledMods());
  }, []);

  const checkAppUpdate = useCallback(async () => {
    setAppUpdateChecking(true);
    setAppUpdateError(undefined);
    try {
      const result = await funkHubService.checkAppUpdate();
      setAppUpdate(result);
    } catch (error) {
      setAppUpdateError(error instanceof Error ? error.message : "Failed to check app updates");
    } finally {
      setAppUpdateChecking(false);
    }
  }, []);

  const openAppUpdateDownload = useCallback(async () => {
    if (!appUpdate?.available) {
      throw new Error("No app update is currently available");
    }

    const targetUrl = appUpdate.downloadUrl || appUpdate.releaseUrl;
    await funkHubService.openExternalUrl(targetUrl);
  }, [appUpdate]);

  const downloadAppUpdate = useCallback(async () => {
    await funkHubService.downloadAppUpdate();
  }, []);

  const installAppUpdate = useCallback(async () => {
    await funkHubService.installAppUpdate();
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
    const normalizedUrl = rawUrl.trim();
    if (!normalizedUrl) {
      return;
    }

    const now = Date.now();
    for (const [url, seenAt] of processedDeepLinksRef.current.entries()) {
      if (now - seenAt > 60_000) {
        processedDeepLinksRef.current.delete(url);
      }
    }

    const lastProcessedAt = processedDeepLinksRef.current.get(normalizedUrl) ?? 0;
    if (now - lastProcessedAt < 3_000 || processingDeepLinksRef.current.has(normalizedUrl)) {
      return;
    }

    processingDeepLinksRef.current.add(normalizedUrl);

    try {
      if (!/^funkhub:/i.test(normalizedUrl)) {
        return;
      }

      const parsedDeepLink = parseFunkHubDeepLink(normalizedUrl);

      if (parsedDeepLink.kind === "pair") {
        const nextSettings = await funkHubService.updateSettings({
          gameBananaIntegration: {
            ...settings.gameBananaIntegration,
            memberId: parsedDeepLink.memberId,
            secretKey: parsedDeepLink.secretKey,
            pairedAt: Date.now(),
            lastPairUrl: normalizedUrl,
          },
        });
        setSettings(nextSettings);
        processedDeepLinksRef.current.set(normalizedUrl, Date.now());
        toast.success(t("provider.pairingReceived", "GameBanana pairing link received. Remote installs are now linked to this profile."));
        return;
      }

      const selectedEngineFromLink = parsedDeepLink.engine
        ? installedEngines.find((engine) => (
          engine.id.toLowerCase() === parsedDeepLink.engine
          || engine.slug.toLowerCase() === parsedDeepLink.engine
          || engine.name.toLowerCase().replace(/\s+/g, "-") === parsedDeepLink.engine
        ))
        : undefined;

      if (parsedDeepLink.engine && !selectedEngineFromLink) {
        throw new Error(`Engine '${parsedDeepLink.engine}' is not installed`);
      }

      if (parsedDeepLink.archiveUrl && !/^https?:\/\//i.test(parsedDeepLink.archiveUrl)) {
        throw new Error("Install URL must be http/https");
      }

      const profile = await funkHubService.getModProfile(parsedDeepLink.modId);
      if (profile.files.length === 0) {
        throw new Error("No downloadable files found for this mod");
      }

      const fileIdFromUrl = parsedDeepLink.archiveUrl?.match(/\/dl\/(\d+)/i);
      const selectedFileId = parsedDeepLink.fileId
        || (fileIdFromUrl ? Number(fileIdFromUrl[1]) : profile.files[0].id);

      if (!Number.isFinite(selectedFileId) || selectedFileId <= 0) {
        throw new Error("No valid file id found in deep link or mod profile");
      }

      if (!profile.files.some((file) => file.id === selectedFileId)) {
        throw new Error(`File ${selectedFileId} is not available for mod ${parsedDeepLink.modId}`);
      }

      const selectedFile = profile.files.find((file) => file.id === selectedFileId) ?? profile.files[0];
      if (!selectedFile) {
        throw new Error("No downloadable files found for this mod");
      }

      const defaultEngine = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];
      const inferredEngineSlug = modInstallerService.detectRequiredEngine(profile);
      const inferredEngines = inferredEngineSlug
        ? installedEngines.filter((engine) => engine.slug === inferredEngineSlug)
        : [];

      let selectedEngineId = selectedEngineFromLink?.id;
      const previewPlan = modInstallerService.createInstallPlan({
        mod: profile,
        file: selectedFile,
        selectedEngine: selectedEngineFromLink,
      });

      if (previewPlan.type === "standard_mod") {
        if (installedEngines.length === 0) {
          throw new Error("No engine installed. Install an engine first.");
        }

        if (!selectedEngineId) {
          if (inferredEngines.length === 1) {
            selectedEngineId = inferredEngines[0].id;
          } else if (installedEngines.length === 1 && defaultEngine) {
            const continueWithDefault = window.confirm(
              `Could not auto-detect a required engine for ${profile.name}. Use ${defaultEngine.name} (${defaultEngine.slug})?`,
            );
            if (!continueWithDefault) {
              return;
            }
            selectedEngineId = defaultEngine.id;
          } else {
            const suggestedEngine = inferredEngines[0] ?? defaultEngine;
            const warningLine = inferredEngineSlug
              ? `Detected engine hint: ${inferredEngineSlug}. Confirm target before installing.`
              : "Could not auto-detect required engine. Choose a target engine before installing.";
            if (!suggestedEngine) {
              throw new Error("No target engine selected. Install cancelled.");
            }

            const continueWithSuggested = window.confirm([
              warningLine,
              "",
              `Use suggested engine: ${suggestedEngine.name} (${suggestedEngine.slug})?`,
              "Select Cancel to stop this install and choose an engine manually from the app.",
            ].join("\n"));
            if (!continueWithSuggested) {
              return;
            }

            selectedEngineId = suggestedEngine.id;
          }
        }
      } else {
        selectedEngineId = undefined;
      }

      funkHubService.queueProtocolInstall({
        modId: parsedDeepLink.modId,
        fileId: selectedFileId,
        downloadUrl: parsedDeepLink.archiveUrl || undefined,
        selectedEngineId,
        priority: 20,
      });
      processedDeepLinksRef.current.set(normalizedUrl, Date.now());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("provider.failedProcessDeepLink", "Failed to process deep link"));
    } finally {
      processingDeepLinksRef.current.delete(normalizedUrl);
    }
  }, [installedEngines, settings.gameBananaIntegration]);

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
    } finally {
      setLoading(false);
    }
  }, [refreshModUpdates]);

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
    if (!window.funkhubDesktop?.onAppUpdateStatus) {
      return;
    }

    const unsubscribe = window.funkhubDesktop.onAppUpdateStatus((payload) => {
      setAppUpdateStatus(payload);
      if (payload.info) {
        setAppUpdate(payload.info);
      }
      if (payload.status === "error") {
        setAppUpdateError(payload.message || t("updates.autoUpdaterError", "App update failed"));
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [t]);

  useEffect(() => {
    if (startupUpdateCheckedRef.current) {
      return;
    }
    if (!settings.checkAppUpdatesOnStartup) {
      startupUpdateCheckedRef.current = true;
      return;
    }

    startupUpdateCheckedRef.current = true;
    setAppUpdateChecking(true);
    setAppUpdateError(undefined);
    funkHubService.checkAppUpdate()
      .then(async (latest) => {
        setAppUpdate(latest);
        if (latest.available && settings.autoDownloadAppUpdates) {
          if (window.funkhubDesktop?.downloadAppUpdate) {
            try {
              await funkHubService.downloadAppUpdate();
            } catch {
              await funkHubService.openExternalUrl(latest.downloadUrl || latest.releaseUrl);
            }
          } else {
            await funkHubService.openExternalUrl(latest.downloadUrl || latest.releaseUrl);
          }
        }
      })
      .catch((error) => {
        setAppUpdateError(error instanceof Error ? error.message : "Failed to check app updates");
      })
      .finally(() => {
        setAppUpdateChecking(false);
      });
  }, [settings.autoDownloadAppUpdates, settings.checkAppUpdatesOnStartup]);

  useEffect(() => {
    if (!window.funkhubDesktop?.getRunningLaunches || !window.funkhubDesktop?.onLaunchExit) {
      return;
    }

    window.funkhubDesktop.getRunningLaunches()
      .then(({ launches }) => {
        const ids = new Set(launches.map((l) => l.launchId));
        for (const l of launches) {
          launchStartTimesRef.current.set(l.launchId, l.startTime);
        }
        setRunningLaunchIds(ids);
      })
      .catch(() => undefined);

    const unsubscribe = window.funkhubDesktop.onLaunchExit(({ launchId }) => {
      const startTime = launchStartTimesRef.current.get(launchId);
      launchStartTimesRef.current.delete(launchId);
      setRunningLaunchIds((prev) => {
        const next = new Set(prev);
        next.delete(launchId);
        return next;
      });
      if (startTime !== undefined) {
        const durationMs = Date.now() - startTime;
        if (durationMs > 5_000) {
          funkHubService.addPlayTime(launchId, durationMs);
          setInstalledMods(funkHubService.getInstalledMods());
        }
      }
    });

    return unsubscribe;
  }, []);

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
      installMod: (modId, fileId, selectedEngineId, priority = 0, options) => {
        try {
          funkHubService.queueInstall(modId, fileId, selectedEngineId, priority, options);
          toast.success(t("provider.installQueued", "Install queued — check Downloads for progress."));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("provider.unableQueueInstall", "Unable to queue install"));
        }
      },
      installEngine: async (slug, downloadUrl, version, options) => {
        await funkHubService.installEngineFromRelease({
          slug,
          releaseUrl: downloadUrl,
          releaseVersion: version,
          allowMissingExecutable: options?.allowMissingExecutable,
        });
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
        launchStartTimesRef.current.set(engineId, Date.now());
        await funkHubService.launchEngine(engineId, options);
        setRunningLaunchIds((prev) => { const next = new Set(prev); next.add(engineId); return next; });
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
        launchStartTimesRef.current.set(installedId, Date.now());
        await funkHubService.launchInstalledMod(installedId);
        setRunningLaunchIds((prev) => { const next = new Set(prev); next.add(installedId); return next; });
      },
      updateInstalledModLaunchOptions: async (installedId, options) => {
        await funkHubService.updateInstalledModLaunchOptions(installedId, options);
        setInstalledMods(funkHubService.getInstalledMods());
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
      renameEngine: (engineId, name) => {
        funkHubService.renameEngine(engineId, name);
        setInstalledEngines(funkHubService.getInstalledEngines());
      },
      setEngineCustomIcon: (engineId, iconUrl) => {
        funkHubService.setEngineCustomIcon(engineId, iconUrl);
        setInstalledEngines(funkHubService.getInstalledEngines());
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
      appUpdate,
      appUpdateError,
      appUpdateChecking,
      checkAppUpdate,
      openAppUpdateDownload,
      downloadAppUpdate,
      installAppUpdate,
      appUpdateStatus,
      runningLaunchIds,
      killLaunch: async (launchId) => {
        await window.funkhubDesktop?.killLaunch?.({ launchId });
        setRunningLaunchIds((prev) => { const next = new Set(prev); next.delete(launchId); return next; });
      },
      clearModPlayTime: (installedId) => {
        funkHubService.clearPlayTime(installedId);
        setInstalledMods(funkHubService.getInstalledMods());
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
      appUpdate,
      appUpdateError,
      appUpdateChecking,
      appUpdateStatus,
      selectedCategoryId,
      discoverSort,
      discoverPage,
      discoverPerPage,
      hasMoreDiscover,
      searchQuery,
      refreshDiscover,
      refreshModUpdates,
      checkAppUpdate,
      openAppUpdateDownload,
      downloadAppUpdate,
      installAppUpdate,
      getModProfile,
      listModsBySubmitter,
      runningLaunchIds,
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
