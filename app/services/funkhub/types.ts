export const FNF_GAME_ID = 8694;

export const FNF_CATEGORY_IDS = [3827, 29202, 34764, 28367, 44037, 43850, 44036, 43798] as const;

export type FunkHubCategoryId = (typeof FNF_CATEGORY_IDS)[number];

export interface GameBananaMember {
  id: number;
  name: string;
  profileUrl: string;
  avatarUrl?: string;
}

export interface GameBananaCategory {
  id: number;
  name: string;
  profileUrl: string;
  iconUrl?: string;
  itemCount?: number;
  parentId?: number;
  gameId?: number;
  gameName?: string;
}

export interface GameBananaFile {
  id: number;
  fileName: string;
  fileSize: number;
  dateAdded: number;
  downloadCount: number;
  downloadUrl: string;
  md5Checksum?: string;
  hasArchiveContents?: boolean;
}

export interface GameBananaModSummary {
  id: number;
  modelName: string;
  name: string;
  profileUrl: string;
  version?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  screenshotUrls?: string[];
  dateAdded: number;
  dateModified?: number;
  dateUpdated?: number;
  likeCount?: number;
  postCount?: number;
  viewCount?: number;
  downloadCount?: number;
  isObsolete?: boolean;
  submitter?: GameBananaMember;
  game?: { id: number; name: string };
  rootCategory?: Pick<GameBananaCategory, "id" | "name" | "profileUrl" | "iconUrl">;
}

export interface GameBananaCredit {
  groupName: string;
  authors: Array<{ id: number; name: string; role?: string; profileUrl: string; avatarUrl?: string }>;
}

export interface GameBananaModProfile extends GameBananaModSummary {
  text?: string;
  files: GameBananaFile[];
  category?: Pick<GameBananaCategory, "id" | "name" | "profileUrl" | "iconUrl">;
  superCategory?: Pick<GameBananaCategory, "id" | "name" | "profileUrl" | "iconUrl">;
  credits: GameBananaCredit[];
  requiredEngine?: EngineSlug;
  dependencies: string[];
}

export interface DownloadTask {
  id: string;
  modId: number;
  fileId: number;
  fileName: string;
  selectedEngineId?: string;
  priority?: number;
  totalBytes?: number;
  downloadedBytes: number;
  progress: number;
  speedBytesPerSecond?: number;
  phase?: "download" | "extract" | "validate" | "install" | "error";
  message?: string;
  status: "queued" | "downloading" | "installing" | "completed" | "cancelled" | "failed";
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InstalledMod {
  id: string;
  modId: number;
  modName: string;
  version?: string;
  author?: string;
  thumbnailUrl?: string;
  gamebananaUrl: string;
  installedAt: number;
  installPath: string;
  engine: EngineSlug;
  requiredEngine?: EngineSlug;
  dependencies?: string[];
  sourceFileId: number;
  description?: string;
  developers?: string[];
  categoryName?: string;
  screenshotUrls?: string[];
  manual?: boolean;
  enabled?: boolean;
  tags?: string[];
  standalone?: boolean;
  launcher?: "native" | "wine" | "wine64" | "proton";
  launcherPath?: string;
  executablePath?: string;
  updateAvailable?: boolean;
  latestVersion?: string;
  totalPlayTimeMs?: number;
}

export type EngineSlug =
  | "psych"
  | "basegame"
  | "codename"
  | "fps-plus"
  | "js-engine"
  | "ale-psych"
  | "p-slice"
;

export interface EngineRelease {
  platform: "windows" | "macos" | "linux" | "any";
  version: string;
  downloadUrl: string;
  sourceUrl: string;
  fileName?: string;
  isPrerelease?: boolean;
}

export interface EngineDefinition {
  slug: EngineSlug;
  name: string;
  description: string;
  releases: EngineRelease[];
}

export interface DesktopInstallRequest {
  jobId: string;
  fileName: string;
  mode: "engine" | "mod";
  installPath: string;
  installSubdir?: string;
  downloadUrl?: string;
  archiveBase64?: string;
  allowMissingExecutable?: boolean;
}

export interface DesktopInstallProgress {
  jobId: string;
  phase: "download" | "extract" | "validate" | "install" | "error";
  progress: number;
  message?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBytesPerSecond?: number;
  timestamp: number;
}

export interface DesktopInstallResult {
  installPath: string;
  versionDetected?: string;
  normalized?: boolean;
}

export interface FunkHubSettings {
  locale: string;
  gameDirectory: string;
  downloadsDirectory: string;
  dataRootDirectory: string;
  firstRunCompleted: boolean;
  maxConcurrentDownloads: number;
  compatibilityChecks: boolean;
  checkAppUpdatesOnStartup: boolean;
  autoDownloadAppUpdates: boolean;
  autoUpdateMods: boolean;
  sendAnalytics: boolean;
  showAnimations: boolean;
  gameBananaIntegration: {
    pollingIntervalSeconds: number;
    memberId?: number;
    secretKey?: string;
    pairedAt?: number;
    lastPairUrl?: string;
  };
  engineLaunchOverrides: Record<string, {
    launcher: "native" | "wine" | "wine64" | "proton";
    launcherPath?: string;
    executablePath?: string;
  }>;
}

export interface DesktopBridge {
  installArchive: (payload: DesktopInstallRequest) => Promise<DesktopInstallResult>;
  installEngine: (payload: DesktopInstallRequest) => Promise<DesktopInstallResult>;
  cancelInstall: (payload: { jobId: string }) => Promise<{ ok: boolean }>;
  onInstallProgress: (listener: (payload: DesktopInstallProgress) => void) => () => void;
  launchEngine: (payload: {
    installPath: string;
    launcher?: "native" | "wine" | "wine64" | "proton";
    launcherPath?: string;
    executablePath?: string;
    args?: string[];
    launchId?: string;
  }) => Promise<{ ok: boolean; launchedPath?: string }>;
  getRunningLaunches: () => Promise<{ launches: Array<{ launchId: string; installPath: string; startTime: number }> }>;
  killLaunch: (payload: { launchId: string }) => Promise<{ ok: boolean; message?: string }>;
  onLaunchExit: (listener: (payload: { launchId: string }) => void) => () => void;
  detectWineRuntimes: () => Promise<{ runtimes: Array<{ type: "wine" | "wine64" | "proton"; path: string; label: string }> }>;
  scanCommonEnginePaths: () => Promise<{ paths: string[] }>;
  openPath: (payload: { targetPath: string }) => Promise<{ ok: boolean; openedPath?: string; error?: string }>;
  deletePath: (payload: { targetPath: string }) => Promise<{ ok: boolean; deletedPath?: string; error?: string }>;
  getItchAuthStatus: () => Promise<{ connected: boolean; connectedAt?: number; scopes?: string[] }>;
  clearItchAuth: () => Promise<{ ok: boolean }>;
  startItchOAuth: (payload: {
    clientId: string;
    scopes?: string[];
    redirectPort?: number;
  }) => Promise<{ ok: boolean }>;
  listItchBaseGameReleases: () => Promise<{
    ok: boolean;
    requiresAuth?: boolean;
    message?: string;
    releases: Array<{
      platform: "windows" | "linux" | "macos" | "any";
      version: string;
      fileName: string;
      uploadId: number;
      downloadUrl: string;
      sourceUrl: string;
    }>;
  }>;
  resolveItchBaseGameDownload: (payload: { platform: "windows" | "linux" | "macos" | "unknown"; uploadId?: number }) => Promise<{
    ok: boolean;
    requiresAuth?: boolean;
    message?: string;
    downloadUrl?: string;
    fileName?: string;
    version?: string;
  }>;
  inspectEngineInstall: (payload: { installPath: string }) => Promise<{
    ok: boolean;
    health: "ready" | "missing_binary" | "broken_install";
    launchablePath?: string;
    message?: string;
  }>;
  importEngineFolder: (payload: {
    sourcePath: string;
    slug: EngineSlug;
    version?: string;
  }) => Promise<{
    ok: boolean;
    installPath?: string;
    modsPath?: string;
    detectedVersion?: string;
    error?: string;
  }>;
  importModFolder: (payload: {
    sourcePath: string;
    targetModsPath: string;
    installSubdir: string;
  }) => Promise<{
    ok: boolean;
    installPath?: string;
    error?: string;
  }>;
  inspectPath: (payload: { targetPath: string }) => Promise<{
    ok: boolean;
    exists: boolean;
    isDirectory?: boolean;
    absolutePath?: string;
    error?: string;
  }>;
  pickFolder: (payload?: { title?: string; defaultPath?: string }) => Promise<{ canceled: boolean; path?: string }>;
  pickFile: (payload?: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ canceled: boolean; path?: string }>;
  openAnyPath: (payload: { targetPath: string }) => Promise<{ ok: boolean; openedPath?: string; error?: string }>;
  openExternalUrl: (payload: { url: string }) => Promise<{ ok: boolean; error?: string }>;
  checkAppUpdate: () => Promise<{ ok: boolean; info?: AppUpdateInfo; error?: string }>;
  downloadAppUpdate: () => Promise<{ ok: boolean; error?: string }>;
  installAppUpdate: () => Promise<{ ok: boolean; error?: string }>;
  getSettings: () => Promise<Partial<FunkHubSettings>>;
  updateSettings: (payload: Partial<FunkHubSettings>) => Promise<Partial<FunkHubSettings>>;
  getPendingDeepLinks: () => Promise<{ links: string[] }>;
  onDeepLink: (listener: (payload: { url: string }) => void) => () => void;
  onAppUpdateStatus: (listener: (payload: DesktopAppUpdateStatus) => void) => () => void;
}

export interface ModUpdateInfo {
  installedId: string;
  modId: number;
  modName: string;
  currentVersion: string;
  latestVersion: string;
  engine: EngineSlug;
  sourceFileId: number;
}

export interface AppUpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseUrl: string;
  publishedAt?: string;
  notes?: string;
  downloadUrl?: string;
}

export interface DesktopAppUpdateStatus {
  status: "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";
  info?: AppUpdateInfo;
  progress?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speedBytesPerSecond?: number;
  message?: string;
  timestamp: number;
}

export interface InstalledEngine {
  id: string;
  slug: EngineSlug;
  name: string;
  customName?: string;
  customIconUrl?: string;
  version: string;
  installPath: string;
  modsPath: string;
  isDefault: boolean;
  installedAt: number;
}

export type EngineHealth = "ready" | "missing_binary" | "broken_install";

export interface InstallPlan {
  type: "executable" | "standard_mod";
  targetPath: string;
  reason: string;
  requiredEngine?: EngineSlug;
}

export interface InstallOptions {
  forceInstallType?: "executable" | "standard_mod";
}

export interface CategoryNode extends GameBananaCategory {
  children: CategoryNode[];
}

export type ReleaseType = "" | "studio" | "indie" | "redistribution";

export const RELEASE_TYPE_OPTIONS: Array<{ value: ReleaseType; label: string }> = [
  { value: "", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "indie", label: "Indie" },
  { value: "redistribution", label: "Redistribution" },
];

export type ContentRating =
  | "none" | "cp" | "st" | "sc" | "bg" | "au"
  | "tu" | "du" | "fl" | "sa" | "la" | "pn"
  | "fn" | "iv" | "ft" | "rp";

export const CONTENT_RATING_OPTIONS: Array<{ value: ContentRating; label: string }> = [
  { value: "none", label: "Unrated" },
  { value: "cp",   label: "Crude or Profane" },
  { value: "st",   label: "Sexual Themes" },
  { value: "sc",   label: "Sexual Content" },
  { value: "bg",   label: "Blood and Gore" },
  { value: "au",   label: "Alcohol Use" },
  { value: "tu",   label: "Tobacco Use" },
  { value: "du",   label: "Drug Use" },
  { value: "fl",   label: "Flashing Lights & Patterns" },
  { value: "sa",   label: "Skinny Attire" },
  { value: "la",   label: "Lewd Angles & Poses" },
  { value: "pn",   label: "Partial Nudity" },
  { value: "fn",   label: "Full Nudity" },
  { value: "iv",   label: "Intense Violence" },
  { value: "ft",   label: "Fetish Use" },
  { value: "rp",   label: "Rating Pending" },
];

export interface ListModsParams {
  page?: number;
  perPage?: number;
  categoryId?: number;
  submitterId?: number;
  sort?: string;
  releaseType?: ReleaseType;
  contentRatings?: ContentRating[];
}

export type SearchSortOrder = "best_match" | "popularity" | "date" | "udate";

export type SearchField = "name" | "description" | "article" | "attribs" | "owner" | "studio" | "credits";

export const SEARCH_SORT_OPTIONS: Array<{ value: SearchSortOrder; label: string }> = [
  { value: "best_match", label: "Best Match" },
  { value: "popularity", label: "Most Popular" },
  { value: "date", label: "Newest" },
  { value: "udate", label: "Recently Updated" },
];

export const SEARCH_FIELD_OPTIONS: Array<{ value: SearchField; label: string }> = [
  { value: "name", label: "Name" },
  { value: "description", label: "Description" },
  { value: "article", label: "Blurb/Readme" },
  { value: "attribs", label: "Tags" },
  { value: "owner", label: "Submitter" },
  { value: "studio", label: "Studio" },
  { value: "credits", label: "Credits" },
];

export const ALL_SEARCH_FIELDS: SearchField[] = ["name", "description", "article", "attribs", "owner", "studio", "credits"];

export interface SearchModsParams {
  query: string;
  page?: number;
  perPage?: number;
  order?: SearchSortOrder;
  fields?: SearchField[];
}
