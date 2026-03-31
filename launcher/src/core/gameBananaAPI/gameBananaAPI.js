window.launcher = window.launcher || {};
window.launcher.gameBananaAPI = window.launcher.gameBananaAPI || {};

/**
 * Main service handling network requests, caching and business logic for GameBanana.
 */
class GameBananaApiService {
  constructor() {
    this.listCache = new Map(); // Memory storage for pagination records
    this.metadataCache = new Map(); // Memory storage for specific entity details
    this.thumbnailPrefetchCache = new Set(); // URL tracker avoiding duplicated image preloading
    
    // Namespace shortcuts mapped for internal usage
    this.constants = window.launcher.gameBananaAPI.constants;
    this.utils = window.launcher.gameBananaAPI.utils;
    this.normalizers = window.launcher.gameBananaAPI.normalizers;
    this.engineDetection = window.launcher.gameBananaAPI.engineDetection;
  }

  /**
   * Native fetch wrapper forcing JSON expectations.
   * @param {string} url
   * @param {Object} [init]
   * @returns {Promise<Object>}
   */
  async fetchJson(url, init = {}) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GameBanana request failed (${response.status}): ${url}`);
    }

    return response.json();
  }

  /**
   * Evaluates memory map validating structural TTL expiration.
   * @param {Map} cache
   * @param {string} key
   * @returns {Object|undefined}
   */
  getCached(cache, key) {
    const hit = cache.get(key); // Stored memory payload payload reference
    
    if (!hit) {
      return undefined;
    }

    if (Date.now() > hit.expiresAt) {
      cache.delete(key);
      return undefined;
    }

    return hit.value;
  }

  /**
   * Registers a new memory map entry calculating its specific deadline.
   * @param {Map} cache
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs
   */
  setCached(cache, key, value, ttlMs) {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Combines cache lookup and fetching strategy.
   * @param {Object} input
   * @returns {Promise<Object>}
   */
  async fetchJsonCached(input) {
    const cached = this.getCached(input.cache, input.key);
    
    if (cached) {
      return cached;
    }

    const value = await this.fetchJson(input.url);
    this.setCached(input.cache, input.key, value, input.ttlMs);
    
    return value;
  }

  /**
   * Injects image nodes silently forcing browser network cache usage.
   * @param {Array} mods
   */
  prefetchThumbnails(mods) {
    if (typeof window === "undefined") {
      return;
    }

    for (const mod of mods.slice(0, 24)) {
      const thumbnail = mod.thumbnailUrl;
      
      if (!thumbnail || this.thumbnailPrefetchCache.has(thumbnail)) {
        continue;
      }
      
      this.thumbnailPrefetchCache.add(thumbnail);
      const image = new Image(); // Silent DOM node
      image.loading = "eager";
      image.src = thumbnail;
    }
  }

  /**
   * Wraps an unknown execution exception into standard Error tracking context.
   * @param {*} error
   * @param {string} context
   * @returns {Error}
   */
  withFallbackErrorContext(error, context) {
    if (error instanceof Error) {
      return new Error(`${context}: ${error.message}`);
    }
    return new Error(context);
  }

  /**
   * Retrieves active filtering criteria options.
   * @returns {Promise<Object>}
   */
  async getModListFilterConfig() {
    const key = "mod-list-filter-config";
    const payload = await this.fetchJsonCached({
      key,
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url: `${this.constants.APIV11_BASE}/Mod/ListFilterConfig?_idGameRow=${this.constants.FNF_GAME_ID}`,
    });

    return {
      sorts: (payload._aSorts ?? []).map((sort) => ({ alias: sort._sAlias, title: sort._sTitle })),
    };
  }

  /**
   * Queries catalog entries using pagination and complex filters.
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async listMods({ page = 1, perPage = 20, categoryId, submitterId, sort = "Generic_NewAndUpdated", releaseType, contentRatings } = {}) {
    const url = new URL(`${this.constants.APIV11_BASE}/Mod/Index`);
    url.searchParams.set("_nPage", String(page));
    url.searchParams.set("_nPerpage", String(Math.min(50, Math.max(1, perPage))));
    url.searchParams.set("_sSort", sort);
    url.searchParams.set("_idGameRow", String(this.constants.FNF_GAME_ID));

    if (categoryId) url.searchParams.set("_aFilters[Generic_Category]", String(categoryId));
    if (submitterId) url.searchParams.set("_aFilters[Generic_Submitter]", String(submitterId));
    if (releaseType) url.searchParams.set("_aFilters[Generic_ReleaseType]", releaseType);
    if (contentRatings && contentRatings.length > 0) url.searchParams.set("_aFilters[Generic_ContentRatings]", contentRatings.join(","));

    const cacheKey = `listMods:${url.toString()}`;
    const payload = await this.fetchJsonCached({
      key: cacheKey,
      cache: this.listCache,
      ttlMs: this.constants.LIST_CACHE_TTL_MS,
      url: url.toString(),
    });
    
    const records = payload._aRecords ?? [];
    const normalized = records.map(this.normalizers.normalizeSummary).filter((mod) => mod.modelName === "Mod" && mod.game?.id === this.constants.FNF_GAME_ID);
    
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  /**
   * Executes a text search validating direct url pasting gracefully.
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async searchMods({ query, page = 1, perPage = 15, order = "best_match", fields }) {
    const normalizedQuery = query.trim();
    
    if (normalizedQuery.length < 2) {
      return [];
    }

    const directModIdMatch = normalizedQuery.match(/gamebanana\.com\/mods\/(\d+)/i); // Extract ID from pasted url
    
    if (directModIdMatch) {
      const modId = Number(directModIdMatch[1]);
      if (Number.isFinite(modId) && modId > 0) {
        try {
          const profile = await this.getModProfile(modId);
          return [profile];
        } catch {
          console.warn("Direct url lookup failed fallback to API search triggered");
        }
      }
    }

    const url = new URL(`${this.constants.APIV11_BASE}/Util/Search/Results`);
    url.searchParams.set("_sSearchString", normalizedQuery);
    url.searchParams.set("_nPage", String(page));
    url.searchParams.set("_nPerpage", String(Math.min(50, Math.max(1, perPage))));
    url.searchParams.set("_sModelName", "Mod");
    url.searchParams.set("_idGameRow", String(this.constants.FNF_GAME_ID));
    url.searchParams.set("_sOrder", order);
    
    if (fields && fields.length > 0) {
      url.searchParams.set("_csvFields", fields.join(","));
    }

    const cacheKey = `searchMods:${url.toString()}`;
    const payload = await this.fetchJsonCached({
      key: cacheKey,
      cache: this.listCache,
      ttlMs: this.constants.LIST_CACHE_TTL_MS,
      url: url.toString(),
    });
    
    const records = payload._aRecords ?? [];
    const normalized = records
      .map(this.normalizers.normalizeSummary)
      .filter((mod) => mod.modelName === "Mod" && mod.game?.id === this.constants.FNF_GAME_ID);
      
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  /**
   * Retrieves popular items interpolating missing image data sequentially.
   * @returns {Promise<Array>}
   */
  async getTrendingMods() {
    const url = `${this.constants.APIV11_BASE}/Game/${this.constants.FNF_GAME_ID}/TopSubs?_csvFields=_idRow,_sModelName,_sName,_sProfileUrl,_sPeriod,_aPreviewMedia,_aSubmitter,_nLikeCount,_nViewCount,_nDownloadCount,_sDescription`;
    const payload = await this.fetchJsonCached({
      key: "trendingMods",
      cache: this.listCache,
      ttlMs: this.constants.LIST_CACHE_TTL_MS,
      url,
    });

    const normalized = payload
      .filter((record) => String(record._sModelName ?? "Mod") === "Mod")
      .map((record) => ({
        ...this.normalizers.normalizeSummary(record),
        period: typeof record._sPeriod === "string" ? record._sPeriod : undefined,
      }));

    const result = await Promise.all(
      normalized.map(async (mod) => {
        if (mod.imageUrl || mod.thumbnailUrl) return mod;
        try {
          const profile = await this.fetchJsonCached({
            key: `modPreviewMedia:${mod.id}`,
            cache: this.listCache,
            ttlMs: this.constants.LIST_CACHE_TTL_MS,
            url: `${this.constants.APIV11_BASE}/Mod/${mod.id}?_csvFields=_aPreviewMedia`,
          });
          return {
            ...mod,
            imageUrl: this.utils.firstImageUrl(profile._aPreviewMedia, "_sFile530"),
            thumbnailUrl: this.utils.firstImageUrl(profile._aPreviewMedia, "_sFile220"),
            screenshotUrls: this.utils.allImageUrls(profile._aPreviewMedia, "_sFile530"),
          };
        } catch {
          return mod;
        }
      })
    );

    this.prefetchThumbnails(result);
    return result;
  }

  /**
   * Collects content specifically mapped under the game subfeed endpoints.
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getSubfeed({ sort = "default", page = 1, perPage = 15 } = {}) {
    const url = new URL(`${this.constants.APIV11_BASE}/Game/${this.constants.FNF_GAME_ID}/Subfeed`);
    url.searchParams.set("_sSort", sort);
    url.searchParams.set("_nPage", String(page));
    url.searchParams.set("_nPerpage", String(Math.min(50, Math.max(1, perPage))));
    
    const cacheKey = `subfeed:${url.toString()}`;
    const payload = await this.fetchJsonCached({
      key: cacheKey,
      cache: this.listCache,
      ttlMs: this.constants.LIST_CACHE_TTL_MS,
      url: url.toString(),
    });
    
    const records = payload._aRecords ?? [];
    const normalized = records.map(this.normalizers.normalizeSummary).filter((mod) => mod.modelName === "Mod");
    
    this.prefetchThumbnails(normalized);
    return normalized;
  }

  /**
   * Analyzes an archive remote structure providing internal paths.
   * @param {number} fileId
   * @returns {Promise<Array<string>>}
   */
  async getRawFileList(fileId) {
    try {
      const data = await this.fetchJson(`${this.constants.APIV11_BASE}/File/${fileId}/RawFileList`);
      if (Array.isArray(data)) return data.filter((x) => typeof x === "string");
    } catch {
      console.warn(`Failed reading file index for file block ${fileId}`);
    }
    return [];
  }

  /**
   * Retrieves mapped download variants tied to a project record.
   * @param {number} modId
   * @returns {Promise<Array>}
   */
  async getModFiles(modId) {
    const payload = await this.fetchJsonCached({
      key: `modFiles:${modId}`,
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url: `${this.constants.APIV11_BASE}/Mod/${modId}/Files`,
    });
    return payload.map(this.normalizers.normalizeFile);
  }

  /**
   * Collects full descriptive and related categorical profile data.
   * @param {number} modId
   * @returns {Promise<Object>}
   */
  async getModProfile(modId) {
    const cacheKey = `modProfile:${modId}`;
    const cached = this.getCached(this.metadataCache, cacheKey);
    
    if (cached) {
      return cached;
    }

    let payload;
    try {
      payload = await this.fetchJson(`${this.constants.APIV11_BASE}/Mod/${modId}/ProfilePage`);
    } catch (error) {
      const fallback = await this.getModProfileFromApiv7(modId);
      
      if (!fallback.id) {
        throw this.withFallbackErrorContext(error, "Mod metadata unavailable");
      }
      
      const fallbackProfile = {
        id: fallback.id,
        modelName: "Mod",
        name: fallback.name ?? `Mod ${modId}`,
        profileUrl: `https://gamebanana.com/mods/${modId}`,
        description: fallback.description,
        text: fallback.text,
        dateAdded: 0,
        files: fallback.files ?? [],
        credits: [],
        dependencies: this.engineDetection.detectDependencies(fallback.text),
        requiredEngine: this.engineDetection.detectRequiredEngineFromMetadata({ name: fallback.name ?? "", text: fallback.text, rootCategoryName: undefined }),
      };
      
      this.setCached(this.metadataCache, cacheKey, fallbackProfile, this.constants.METADATA_CACHE_TTL_MS);
      return fallbackProfile;
    }

    const summary = this.normalizers.normalizeSummary(payload);
    const categoryRaw = payload._aCategory ?? {};
    const superCategoryRaw = payload._aSuperCategory ?? {};
    const creditsRaw = Array.isArray(payload._aCredits) ? payload._aCredits : [];
    const filesRaw = Array.isArray(payload._aFiles) ? payload._aFiles : [];

    const credits = creditsRaw
      .map((entry) => {
        const group = entry;
        const authorsRaw = Array.isArray(group._aAuthors) ? group._aAuthors : [];
        return {
          groupName: String(group._sGroupName ?? "Credits"),
          authors: authorsRaw.map((author) => ({
            id: this.utils.toNumber(author._idRow),
            name: String(author._sName ?? "Unknown"),
            role: typeof author._sRole === "string" ? author._sRole : undefined,
            profileUrl: String(author._sProfileUrl ?? ""),
            avatarUrl: typeof author._sAvatarUrl === "string" ? author._sAvatarUrl : (typeof author._sIconUrl === "string" ? author._sIconUrl : undefined),
          })),
        };
      })
      .filter((group) => group.authors.length > 0);

    const profile = {
      ...summary,
      text: typeof payload._sText === "string" ? payload._sText : undefined,
      category: {
        id: this.utils.toNumber(categoryRaw._idRow),
        name: String(categoryRaw._sName ?? "Unknown"),
        profileUrl: String(categoryRaw._sProfileUrl ?? ""),
        iconUrl: typeof categoryRaw._sIconUrl === "string" ? categoryRaw._sIconUrl : undefined,
      },
      superCategory: {
        id: this.utils.toNumber(superCategoryRaw._idRow),
        name: String(superCategoryRaw._sName ?? "Unknown"),
        profileUrl: String(superCategoryRaw._sProfileUrl ?? ""),
        iconUrl: typeof superCategoryRaw._sIconUrl === "string" ? superCategoryRaw._sIconUrl : undefined,
      },
      files: filesRaw.map((entry) => this.normalizers.normalizeFile(entry)),
      screenshotUrls: this.utils.allImageUrls(payload._aPreviewMedia, "_sFile530"),
      credits,
      requiredEngine: undefined,
      dependencies: [],
    };

    profile.requiredEngine = this.engineDetection.detectRequiredEngineFromMetadata({ name: profile.name, text: profile.text, rootCategoryName: profile.rootCategory.name });
    profile.dependencies = this.engineDetection.detectDependencies(profile.text);
    
    this.setCached(this.metadataCache, cacheKey, profile, this.constants.METADATA_CACHE_TTL_MS);

    return profile;
  }

  /**
   * Secondary data retrieval hitting legacy endpoints minimizing errors.
   * @param {number} modId
   * @returns {Promise<Object>}
   */
  async getModProfileFromApiv7(modId) {
    const properties = ["_idRow", "_sName", "_nDownloadCount", "_aSubmitter", "_aFiles", "_sDescription", "_sText"];
    const url = `${this.constants.APIV7_BASE}/Mod/${modId}?_csvProperties=${encodeURIComponent(properties.join(","))}`;
    
    const payload = await this.fetchJsonCached({
      key: `modProfileV7:${modId}`,
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url,
    });

    return {
      id: this.utils.toNumber(payload._idRow),
      name: String(payload._sName ?? "Unknown Mod"),
      description: typeof payload._sDescription === "string" ? payload._sDescription : undefined,
      text: typeof payload._sText === "string" ? payload._sText : undefined,
      downloadCount: this.utils.toNumber(payload._nDownloadCount),
      files: Array.isArray(payload._aFiles) ? payload._aFiles.map((entry) => this.normalizers.normalizeFile(entry)) : [],
    };
  }

  /**
   * Retrieves explicit group configuration filtering records.
   * @param {number} categoryId
   * @returns {Promise<Object>}
   */
  async getCategoryById(categoryId) {
    const fields = "_idRow,_sName,_sProfileUrl,_sIconUrl,_idParentCategoryRow,_aGame,_tsDateAdded,_tsDateModified";
    const url = `${this.constants.APIV11_BASE}/ModCategory/${categoryId}?_csvProperties=${encodeURIComponent(fields)}`;
    
    const payload = await this.fetchJsonCached({
      key: `category:${categoryId}`,
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url,
    });
    
    const game = payload._aGame ?? {};

    return {
      id: this.utils.toNumber(payload._idRow),
      name: String(payload._sName ?? "Unknown Category"),
      profileUrl: String(payload._sProfileUrl ?? ""),
      iconUrl: typeof payload._sIconUrl === "string" ? payload._sIconUrl : undefined,
      parentId: this.utils.toNumber(payload._idParentCategoryRow),
      gameId: this.utils.toNumber(game._idRow),
      gameName: String(game._sName ?? ""),
    };
  }

  /**
   * Assembles a hierarchical node representation mapping category children.
   * @param {number} categoryId
   * @returns {Promise<Array>}
   */
  async getSubCategories(categoryId) {
    const payload = await this.fetchJsonCached({
      key: `subCategories:${categoryId}`,
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url: `${this.constants.APIV11_BASE}/ModCategory/${categoryId}/SubCategories`,
    });

    return payload.map((entry) => {
      const profileUrl = String(entry._sUrl ?? "");
      const parsedId = Number(profileUrl.split("/").at(-1)); // URL matching segment indicating category
      const explicitId = this.utils.toNumber(entry._idRow);
      
      return {
        id: Number.isNaN(parsedId) || parsedId <= 0 ? explicitId : parsedId,
        name: String(entry._sName ?? "Unknown Category"),
        profileUrl,
        iconUrl: typeof entry._sIconUrl === "string" ? entry._sIconUrl : undefined,
        itemCount: this.utils.toNumber(entry._nItemCount),
        parentId: categoryId,
        gameId: this.constants.FNF_GAME_ID,
        gameName: "Friday Night Funkin'",
      };
    });
  }

  /**
   * Scans primary root groups tied exclusively to the mapped game identifier.
   * @returns {Promise<Array>}
   */
  async getRootCategories() {
    const url = `${this.constants.APIV11_BASE}/Mod/Categories?_sSort=a_to_z&_idGameRow=${this.constants.FNF_GAME_ID}`;
    const payload = await this.fetchJsonCached({
      key: "rootCategories",
      cache: this.metadataCache,
      ttlMs: this.constants.METADATA_CACHE_TTL_MS,
      url,
    });

    return payload.map((entry) => {
      const profileUrl = String(entry._sUrl ?? "");
      const parsedId = Number(profileUrl.split("/").at(-1));
      const explicitId = this.utils.toNumber(entry._idRow);
      
      return {
        id: Number.isNaN(parsedId) || parsedId <= 0 ? explicitId : parsedId,
        name: String(entry._sName ?? "Unknown Category"),
        profileUrl,
        iconUrl: typeof entry._sIconUrl === "string" ? entry._sIconUrl : undefined,
        itemCount: this.utils.toNumber(entry._nItemCount),
        gameId: this.constants.FNF_GAME_ID,
        gameName: "Friday Night Funkin'",
      };
    });
  }

  /**
   * Recursive graph construction mapping group connections.
   * @param {Object} category
   * @param {Set} visited
   * @returns {Promise<Object>}
   */
  async buildCategoryTree(category, visited) {
    const node = {
      ...category,
      children: [],
    };

    if (!node.id || visited.has(node.id)) {
      return node;
    }

    visited.add(node.id);
    const children = await this.getSubCategories(node.id);

    const builtChildren = await Promise.all(
      children
        .filter((child) => child.id > 0)
        .map((child) => this.buildCategoryTree(child, visited))
    );

    node.children = builtChildren.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return node;
  }

  /**
   * Wrapper building tree node specifically mapped to FNF layout.
   * @returns {Promise<Array>}
   */
  async getFunkHubCategories() {
    const roots = await this.getRootCategories();
    const visited = new Set();
    
    const tree = await Promise.all(
      roots
        .filter((root) => root.id > 0)
        .map((root) => this.buildCategoryTree(root, visited))
    );

    return tree.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }

  /**
   * Raw streaming wrapper tracking buffer aggregation locally.
   * @param {number} fileId
   * @param {Function} [onProgress]
   * @returns {Promise<Blob>}
   */
  async downloadModArchive(fileId, onProgress) {
    const response = await fetch(`https://gamebanana.com/dl/${fileId}`);

    if (!response.ok) {
      throw new Error(`Failed network request downloading file chunk ${fileId}`);
    }

    if (!response.body) {
      return response.blob();
    }

    const contentLength = response.headers.get("content-length"); // Target file weight expected block size
    const totalBytes = contentLength ? Number(contentLength) : undefined;
    const reader = response.body.getReader(); // Network reading mechanism matching byte array
    const chunks = [];
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

window.launcher.gameBananaAPI.apiService = new GameBananaApiService();