import {
  CategoryNode,
  FNF_CATEGORY_IDS,
  FNF_GAME_ID,
  GameBananaCategory,
  GameBananaFile,
  GameBananaModProfile,
  GameBananaModSummary,
  ListModsParams,
  SearchModsParams,
} from "./types";

const APIV11_BASE = "https://gamebanana.com/apiv11";
const APIV7_BASE = "https://gamebanana.com/apiv7";
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const METADATA_CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function firstImageUrl(previewMedia: unknown, preferredKey: "_sFile220" | "_sFile530" | "_sFile100" = "_sFile220"): string | undefined {
  if (!previewMedia || typeof previewMedia !== "object") {
    return undefined;
  }

  const images = (previewMedia as { _aImages?: unknown[] })._aImages;
  if (!Array.isArray(images) || images.length === 0) {
    return undefined;
  }

  const first = images[0] as { _sBaseUrl?: string; _sFile?: string; _sFile220?: string; _sFile530?: string; _sFile100?: string };
  const base = first._sBaseUrl;
  const file = first[preferredKey] ?? first._sFile;
  if (!base || !file) {
    return undefined;
  }

  return `${base}/${file}`;
}

function allImageUrls(previewMedia: unknown, preferredKey: "_sFile220" | "_sFile530" | "_sFile100" = "_sFile530"): string[] {
  if (!previewMedia || typeof previewMedia !== "object") {
    return [];
  }

  const images = (previewMedia as { _aImages?: unknown[] })._aImages;
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return images
    .map((entry) => {
      const image = entry as { _sBaseUrl?: string; _sFile?: string; _sFile220?: string; _sFile530?: string; _sFile100?: string };
      const base = image._sBaseUrl;
      const file = image[preferredKey] ?? image._sFile;
      if (!base || !file) {
        return undefined;
      }
      return `${base}/${file}`;
    })
    .filter((value): value is string => Boolean(value));
}

function normalizeFile(file: Record<string, unknown>): GameBananaFile {
  return {
    id: toNumber(file._idRow),
    fileName: String(file._sFile ?? "unknown"),
    fileSize: toNumber(file._nFilesize),
    dateAdded: toNumber(file._tsDateAdded),
    downloadCount: toNumber(file._nDownloadCount),
    downloadUrl: String(file._sDownloadUrl ?? ""),
    md5Checksum: typeof file._sMd5Checksum === "string" ? file._sMd5Checksum : undefined,
    hasArchiveContents: Boolean(file._bHasContents),
  };
}

function normalizeSummary(record: Record<string, unknown>): GameBananaModSummary {
  const submitter = (record._aSubmitter ?? {}) as Record<string, unknown>;
  const game = (record._aGame ?? {}) as Record<string, unknown>;
  const rootCategory = (record._aRootCategory ?? {}) as Record<string, unknown>;

  const rootCategoryId = typeof rootCategory._sProfileUrl === "string"
    ? Number(rootCategory._sProfileUrl.split("/").at(-1))
    : 0;

  return {
    id: toNumber(record._idRow),
    modelName: String(record._sModelName ?? "Mod"),
    name: String(record._sName ?? "Unknown Mod"),
    profileUrl: String(record._sProfileUrl ?? ""),
    version: typeof record._sVersion === "string" ? record._sVersion : undefined,
    description: typeof record._sDescription === "string" ? record._sDescription : undefined,
    imageUrl: firstImageUrl(record._aPreviewMedia, "_sFile530"),
    thumbnailUrl: firstImageUrl(record._aPreviewMedia, "_sFile220"),
    screenshotUrls: allImageUrls(record._aPreviewMedia, "_sFile530"),
    dateAdded: toNumber(record._tsDateAdded),
    dateModified: toNumber(record._tsDateModified),
    dateUpdated: toNumber(record._tsDateUpdated),
    likeCount: toNumber(record._nLikeCount),
    postCount: toNumber(record._nPostCount),
    viewCount: toNumber(record._nViewCount),
    downloadCount: toNumber(record._nDownloadCount),
    isObsolete: Boolean(record._bIsObsolete),
    submitter: {
      id: toNumber(submitter._idRow),
      name: String(submitter._sName ?? "Unknown"),
      profileUrl: String(submitter._sProfileUrl ?? ""),
      avatarUrl: typeof submitter._sAvatarUrl === "string" ? submitter._sAvatarUrl : undefined,
    },
    game: {
      id: toNumber(game._idRow),
      name: String(game._sName ?? "Unknown Game"),
    },
    rootCategory: {
      id: rootCategoryId,
      name: String(rootCategory._sName ?? "Unknown"),
      profileUrl: String(rootCategory._sProfileUrl ?? ""),
      iconUrl: typeof rootCategory._sIconUrl === "string" ? rootCategory._sIconUrl : undefined,
    },
  };
}

function detectRequiredEngine(mod: Pick<GameBananaModProfile, "name" | "text" | "rootCategory">): GameBananaModProfile["requiredEngine"] {
  const haystack = `${mod.name} ${mod.text ?? ""} ${mod.rootCategory?.name ?? ""}`.toLowerCase();

  if (haystack.includes("p-slice") || haystack.includes("pslice")) {
    return "p-slice";
  }

  if (haystack.includes("fps+") || haystack.includes("fps plus")) {
    return "fps-plus";
  }

  if (haystack.includes("ale psych") || haystack.includes("ale engine")) {
    return "ale-psych";
  }

  if (haystack.includes("js engine") || haystack.includes("fnf js")) {
    return "js-engine";
  }

  if (haystack.includes("codename")) {
    return "codename";
  }

  if (haystack.includes("psych")) {
    return "psych";
  }

  if (haystack.includes("v-slice") || haystack.includes("base game") || haystack.includes("basegame")) {
    return "basegame";
  }

  return undefined;
}

function detectDependencies(text?: string): string[] {
  if (!text) {
    return [];
  }

  const patterns = [
    /requires?\s+([A-Za-z0-9\-+' ]{2,80})/gi,
    /dependency[:\s]+([A-Za-z0-9\-+' ]{2,80})/gi,
    /needs?\s+([A-Za-z0-9\-+' ]{2,80})/gi,
  ];

  const dependencies = new Set<string>();

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = null;
    match = pattern.exec(text);
    while (match) {
      const dep = match[1]?.trim();
      if (dep) {
        dependencies.add(dep.replace(/[.,;!?]+$/, ""));
      }
      match = pattern.exec(text);
    }
  }

  return [...dependencies].slice(0, 8);
}

export class GameBananaApiService {
  private listCache = new Map<string, CacheEntry<unknown>>();

  private metadataCache = new Map<string, CacheEntry<unknown>>();

  private thumbnailPrefetchCache = new Set<string>();

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GameBanana request failed (${response.status}): ${url}`);
    }

    return response.json() as Promise<T>;
  }

  private getCached<T>(cache: Map<string, CacheEntry<unknown>>, key: string): T | undefined {
    const hit = cache.get(key);
    if (!hit) {
      return undefined;
    }

    if (Date.now() > hit.expiresAt) {
      cache.delete(key);
      return undefined;
    }

    return hit.value as T;
  }

  private setCached<T>(cache: Map<string, CacheEntry<unknown>>, key: string, value: T, ttlMs: number): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private async fetchJsonCached<T>(input: {
    key: string;
    cache: Map<string, CacheEntry<unknown>>;
    ttlMs: number;
    url: string;
  }): Promise<T> {
    const cached = this.getCached<T>(input.cache, input.key);
    if (cached) {
      return cached;
    }

    const value = await this.fetchJson<T>(input.url);
    this.setCached(input.cache, input.key, value, input.ttlMs);
    return value;
  }

  private prefetchThumbnails(mods: GameBananaModSummary[]): void {
    if (typeof window === "undefined") {
      return;
    }

    for (const mod of mods.slice(0, 24)) {
      const thumbnail = mod.thumbnailUrl;
      if (!thumbnail || this.thumbnailPrefetchCache.has(thumbnail)) {
        continue;
      }
      this.thumbnailPrefetchCache.add(thumbnail);
      const image = new Image();
      image.loading = "eager";
      image.src = thumbnail;
    }
  }

  private withFallbackErrorContext(error: unknown, context: string): Error {
    if (error instanceof Error) {
      return new Error(`${context}: ${error.message}`);
    }
    return new Error(context);
  }

  async getModListFilterConfig(): Promise<{
    sorts: Array<{ alias: string; title: string }>;
  }> {
    const key = "mod-list-filter-config";
    const payload = await this.fetchJsonCached<{ _aSorts?: Array<{ _sAlias: string; _sTitle: string }> }>({
      key,
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url: `${APIV11_BASE}/Mod/ListFilterConfig?_idGameRow=${FNF_GAME_ID}`,
    });

    return {
      sorts: (payload._aSorts ?? []).map((sort) => ({ alias: sort._sAlias, title: sort._sTitle })),
    };
  }

  async listMods({ page = 1, perPage = 20, categoryId, submitterId, sort = "Generic_NewAndUpdated" }: ListModsParams = {}): Promise<GameBananaModSummary[]> {
    const url = new URL(`${APIV11_BASE}/Mod/Index`);
    url.searchParams.set("_nPage", String(page));
    url.searchParams.set("_nPerpage", String(Math.min(50, Math.max(1, perPage))));
    url.searchParams.set("_sSort", sort);
    url.searchParams.set("_idGameRow", String(FNF_GAME_ID));

    if (categoryId) {
      url.searchParams.set("_aFilters[Generic_Category]", String(categoryId));
    }
    if (submitterId) {
      url.searchParams.set("_aFilters[Generic_Submitter]", String(submitterId));
    }

    const cacheKey = `listMods:${url.toString()}`;
    const payload = await this.fetchJsonCached<{ _aRecords?: Record<string, unknown>[] }>({
      key: cacheKey,
      cache: this.listCache,
      ttlMs: LIST_CACHE_TTL_MS,
      url: url.toString(),
    });
    const records = payload._aRecords ?? [];
    const normalized = records.map(normalizeSummary).filter((mod) => mod.modelName === "Mod" && mod.game?.id === FNF_GAME_ID);
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  async searchMods({ query, page = 1, perPage = 15 }: SearchModsParams): Promise<GameBananaModSummary[]> {
    if (query.trim().length < 2) {
      return [];
    }

    const url = new URL(`${APIV11_BASE}/Util/Search/Results`);
    url.searchParams.set("_sSearchString", query.trim());
    url.searchParams.set("_nPage", String(page));
    url.searchParams.set("_nPerpage", String(Math.min(50, Math.max(1, perPage))));

    const cacheKey = `searchMods:${url.toString()}`;
    const payload = await this.fetchJsonCached<{ _aRecords?: Record<string, unknown>[] }>({
      key: cacheKey,
      cache: this.listCache,
      ttlMs: LIST_CACHE_TTL_MS,
      url: url.toString(),
    });
    const records = payload._aRecords ?? [];

    const normalized = records
      .map(normalizeSummary)
      .filter((mod) => mod.modelName === "Mod" && mod.game?.id === FNF_GAME_ID);
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  async getTrendingMods(): Promise<GameBananaModSummary[]> {
    const url = `${APIV11_BASE}/Game/${FNF_GAME_ID}/TopSubs`;
    const payload = await this.fetchJsonCached<Record<string, unknown>[]>({
      key: "trendingMods",
      cache: this.listCache,
      ttlMs: LIST_CACHE_TTL_MS,
      url,
    });

    const normalized = payload
      .map(normalizeSummary)
      .filter((mod) => mod.modelName === "Mod" && mod.game?.id === FNF_GAME_ID);
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  async getModFiles(modId: number): Promise<GameBananaFile[]> {
    const payload = await this.fetchJsonCached<Record<string, unknown>[]>({
      key: `modFiles:${modId}`,
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url: `${APIV11_BASE}/Mod/${modId}/Files`,
    });
    return payload.map(normalizeFile);
  }

  async getModProfile(modId: number): Promise<GameBananaModProfile> {
    const cacheKey = `modProfile:${modId}`;
    const cached = this.getCached<GameBananaModProfile>(this.metadataCache, cacheKey);
    if (cached) {
      return cached;
    }

    let payload: Record<string, unknown>;
    try {
      payload = await this.fetchJson<Record<string, unknown>>(`${APIV11_BASE}/Mod/${modId}/ProfilePage`);
    } catch (error) {
      const fallback = await this.getModProfileFromApiv7(modId);
      if (!fallback.id) {
        throw this.withFallbackErrorContext(error, "Mod metadata unavailable");
      }
      const fallbackProfile: GameBananaModProfile = {
        id: fallback.id,
        modelName: "Mod",
        name: fallback.name ?? `Mod ${modId}`,
        profileUrl: `https://gamebanana.com/mods/${modId}`,
        description: fallback.description,
        text: fallback.text,
        dateAdded: 0,
        files: fallback.files ?? [],
        credits: [],
        dependencies: detectDependencies(fallback.text),
        requiredEngine: detectRequiredEngine({ name: fallback.name ?? "", text: fallback.text, rootCategory: undefined }),
      };
      this.setCached(this.metadataCache, cacheKey, fallbackProfile, METADATA_CACHE_TTL_MS);
      return fallbackProfile;
    }

    const summary = normalizeSummary(payload);

    const categoryRaw = (payload._aCategory ?? {}) as Record<string, unknown>;
    const superCategoryRaw = (payload._aSuperCategory ?? {}) as Record<string, unknown>;
    const creditsRaw = Array.isArray(payload._aCredits) ? payload._aCredits : [];
    const filesRaw = Array.isArray(payload._aFiles) ? payload._aFiles : [];

    const credits = creditsRaw
      .map((entry) => {
        const group = entry as Record<string, unknown>;
        const authorsRaw = Array.isArray(group._aAuthors) ? group._aAuthors : [];
        return {
          groupName: String(group._sGroupName ?? "Credits"),
          authors: authorsRaw.map((author) => {
            const authorRecord = author as Record<string, unknown>;
            return {
              id: toNumber(authorRecord._idRow),
              name: String(authorRecord._sName ?? "Unknown"),
              role: typeof authorRecord._sRole === "string" ? authorRecord._sRole : undefined,
              profileUrl: String(authorRecord._sProfileUrl ?? ""),
              avatarUrl: typeof authorRecord._sAvatarUrl === "string"
                ? authorRecord._sAvatarUrl
                : (typeof authorRecord._sIconUrl === "string" ? authorRecord._sIconUrl : undefined),
            };
          }),
        };
      })
      .filter((group) => group.authors.length > 0);

    const profile: GameBananaModProfile = {
      ...summary,
      text: typeof payload._sText === "string" ? payload._sText : undefined,
      category: {
        id: toNumber(categoryRaw._idRow),
        name: String(categoryRaw._sName ?? "Unknown"),
        profileUrl: String(categoryRaw._sProfileUrl ?? ""),
        iconUrl: typeof categoryRaw._sIconUrl === "string" ? categoryRaw._sIconUrl : undefined,
      },
      superCategory: {
        id: toNumber(superCategoryRaw._idRow),
        name: String(superCategoryRaw._sName ?? "Unknown"),
        profileUrl: String(superCategoryRaw._sProfileUrl ?? ""),
        iconUrl: typeof superCategoryRaw._sIconUrl === "string" ? superCategoryRaw._sIconUrl : undefined,
      },
      files: filesRaw.map((entry) => normalizeFile(entry as Record<string, unknown>)),
      screenshotUrls: allImageUrls(payload._aPreviewMedia, "_sFile530"),
      credits,
      requiredEngine: undefined,
      dependencies: [],
    };

    profile.requiredEngine = detectRequiredEngine(profile);
    profile.dependencies = detectDependencies(profile.text);
    this.setCached(this.metadataCache, cacheKey, profile, METADATA_CACHE_TTL_MS);

    return profile;
  }

  async getModProfileFromApiv7(modId: number): Promise<Partial<GameBananaModProfile>> {
    const properties = ["_idRow", "_sName", "_nDownloadCount", "_aSubmitter", "_aFiles", "_sDescription", "_sText"];
    const url = `${APIV7_BASE}/Mod/${modId}?_csvProperties=${encodeURIComponent(properties.join(","))}`;
    const payload = await this.fetchJsonCached<Record<string, unknown>>({
      key: `modProfileV7:${modId}`,
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url,
    });

    return {
      id: toNumber(payload._idRow),
      name: String(payload._sName ?? "Unknown Mod"),
      description: typeof payload._sDescription === "string" ? payload._sDescription : undefined,
      text: typeof payload._sText === "string" ? payload._sText : undefined,
      downloadCount: toNumber(payload._nDownloadCount),
      files: Array.isArray(payload._aFiles)
        ? payload._aFiles.map((entry) => normalizeFile(entry as Record<string, unknown>))
        : [],
    };
  }

  async getCategoryById(categoryId: number): Promise<GameBananaCategory> {
    const fields = "_idRow,_sName,_sProfileUrl,_sIconUrl,_idParentCategoryRow,_aGame,_tsDateAdded,_tsDateModified";
    const url = `${APIV11_BASE}/ModCategory/${categoryId}?_csvProperties=${encodeURIComponent(fields)}`;
    const payload = await this.fetchJsonCached<Record<string, unknown>>({
      key: `category:${categoryId}`,
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url,
    });
    const game = (payload._aGame ?? {}) as Record<string, unknown>;

    return {
      id: toNumber(payload._idRow),
      name: String(payload._sName ?? "Unknown Category"),
      profileUrl: String(payload._sProfileUrl ?? ""),
      iconUrl: typeof payload._sIconUrl === "string" ? payload._sIconUrl : undefined,
      parentId: toNumber(payload._idParentCategoryRow),
      gameId: toNumber(game._idRow),
      gameName: String(game._sName ?? ""),
    };
  }

  async getSubCategories(categoryId: number): Promise<GameBananaCategory[]> {
    const payload = await this.fetchJsonCached<Array<Record<string, unknown>>>({
      key: `subCategories:${categoryId}`,
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url: `${APIV11_BASE}/ModCategory/${categoryId}/SubCategories`,
    });

    return payload.map((entry) => {
      const profileUrl = String(entry._sUrl ?? "");
      const parsedId = Number(profileUrl.split("/").at(-1));
      return {
        id: Number.isNaN(parsedId) ? 0 : parsedId,
        name: String(entry._sName ?? "Unknown Category"),
        profileUrl,
        iconUrl: typeof entry._sIconUrl === "string" ? entry._sIconUrl : undefined,
        itemCount: toNumber(entry._nItemCount),
        parentId: categoryId,
        gameId: FNF_GAME_ID,
        gameName: "Friday Night Funkin'",
      };
    });
  }

  async getRootCategories(): Promise<GameBananaCategory[]> {
    const url = `${APIV11_BASE}/Mod/Categories?_sSort=a_to_z&_idGameRow=${FNF_GAME_ID}`;
    const payload = await this.fetchJsonCached<Array<Record<string, unknown>>>({
      key: "rootCategories",
      cache: this.metadataCache,
      ttlMs: METADATA_CACHE_TTL_MS,
      url,
    });

    return payload.map((entry) => {
      const profileUrl = String(entry._sUrl ?? "");
      const parsedId = Number(profileUrl.split("/").at(-1));
      return {
        id: Number.isNaN(parsedId) ? 0 : parsedId,
        name: String(entry._sName ?? "Unknown Category"),
        profileUrl,
        iconUrl: typeof entry._sIconUrl === "string" ? entry._sIconUrl : undefined,
        itemCount: toNumber(entry._nItemCount),
        gameId: FNF_GAME_ID,
        gameName: "Friday Night Funkin'",
      };
    });
  }

  async getFunkHubCategories(): Promise<CategoryNode[]> {
    const roots = await this.getRootCategories();
    const map = new Map<number, CategoryNode>();

    for (const root of roots) {
      map.set(root.id, { ...root, children: [] });
    }

    const modFolders = map.get(43771);
    if (modFolders) {
      const modFolderChildren = await this.getSubCategories(43771);
      for (const child of modFolderChildren) {
        const node: CategoryNode = { ...child, children: [] };
        map.set(node.id, node);
        modFolders.children.push(node);
      }
    }

    const otherModFolders = map.get(43773);
    if (otherModFolders) {
      const engineChildren = await this.getSubCategories(43773);
      otherModFolders.children = engineChildren.map((category) => ({ ...category, children: [] }));
      for (const child of otherModFolders.children) {
        map.set(child.id, child);
      }
    }

    for (const targetId of FNF_CATEGORY_IDS) {
      if (!map.has(targetId)) {
        const category = await this.getCategoryById(targetId);
        map.set(targetId, { ...category, children: [] });
      }
    }

    const selectedIds = new Set<number>([3827, 43771, 43773, ...FNF_CATEGORY_IDS]);
    const selectedRoots = [...map.values()].filter((node) => selectedIds.has(node.id) && (node.parentId ?? 0) === 0);

    if (selectedRoots.length > 0) {
      return selectedRoots;
    }

    return [...map.values()].filter((node) => selectedIds.has(node.id));
  }

  async downloadModArchive(fileId: number, onProgress?: (downloadedBytes: number, totalBytes?: number) => void): Promise<Blob> {
    const response = await fetch(`https://gamebanana.com/dl/${fileId}`);

    if (!response.ok) {
      throw new Error(`Failed to download file ${fileId}`);
    }

    if (!response.body) {
      return response.blob();
    }

    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? Number(contentLength) : undefined;
    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    let downloaded = 0;

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
        downloaded += value.byteLength;
        onProgress?.(downloaded, totalBytes);
      }
    }

    return new Blob(chunks);
  }
}

export const gameBananaApiService = new GameBananaApiService();
