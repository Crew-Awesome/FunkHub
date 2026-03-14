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
  priority?: number;
  totalBytes?: number;
  downloadedBytes: number;
  progress: number;
  speedBytesPerSecond?: number;
  phase?: "download" | "extract" | "install" | "error";
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
  updateAvailable?: boolean;
  latestVersion?: string;
}

export type EngineSlug =
  | "psych"
  | "basegame"
  | "codename"
  | "fps-plus"
  | "js-engine"
  | "ale-psych"
  | "p-slice";

export interface EngineRelease {
  platform: "windows" | "macos" | "linux" | "any";
  version: string;
  downloadUrl: string;
  sourceUrl: string;
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
}

export interface DesktopInstallProgress {
  jobId: string;
  phase: "download" | "extract" | "install" | "error";
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
  gameDirectory: string;
  downloadsDirectory: string;
  dataRootDirectory: string;
  maxConcurrentDownloads: number;
  compatibilityChecks: boolean;
  autoUpdateMods: boolean;
  sendAnalytics: boolean;
  showAnimations: boolean;
}

export interface DesktopBridge {
  installArchive: (payload: DesktopInstallRequest) => Promise<DesktopInstallResult>;
  installEngine: (payload: DesktopInstallRequest) => Promise<DesktopInstallResult>;
  cancelInstall: (payload: { jobId: string }) => Promise<{ ok: boolean }>;
  onInstallProgress: (listener: (payload: DesktopInstallProgress) => void) => () => void;
  launchEngine: (payload: { installPath: string }) => Promise<{ ok: boolean; launchedPath?: string }>;
  openPath: (payload: { targetPath: string }) => Promise<{ ok: boolean; openedPath?: string; error?: string }>;
  deletePath: (payload: { targetPath: string }) => Promise<{ ok: boolean; deletedPath?: string; error?: string }>;
  pickFolder: (payload?: { title?: string; defaultPath?: string }) => Promise<{ canceled: boolean; path?: string }>;
  getSettings: () => Promise<Partial<FunkHubSettings>>;
  updateSettings: (payload: Partial<FunkHubSettings>) => Promise<Partial<FunkHubSettings>>;
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

export interface InstalledEngine {
  id: string;
  slug: EngineSlug;
  name: string;
  version: string;
  installPath: string;
  modsPath: string;
  isDefault: boolean;
  installedAt: number;
}

export interface InstallPlan {
  type: "executable" | "standard_mod";
  targetPath: string;
  reason: string;
  requiredEngine?: EngineSlug;
}

export interface CategoryNode extends GameBananaCategory {
  children: CategoryNode[];
}

export interface ListModsParams {
  page?: number;
  perPage?: number;
  categoryId?: number;
  sort?: string;
}

export interface SearchModsParams {
  query: string;
  page?: number;
  perPage?: number;
}
