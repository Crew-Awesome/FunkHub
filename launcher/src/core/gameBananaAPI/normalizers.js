window.launcher = window.launcher || {};
window.launcher.gameBananaAPI = window.launcher.gameBananaAPI || {};

/**
 * Functions that transform chaotic API data into structured JSON format.
 */
window.launcher.gameBananaAPI.normalizers = {
  /**
   * Standardizes file attachment data.
   * @param {Object} file
   * @returns {Object}
   */
  normalizeFile: (file) => {
    const utils = window.launcher.gameBananaAPI.utils; // Helper reference shortcut
    
    return {
      id: utils.toNumber(file._idRow),
      fileName: String(file._sFile ?? "unknown"),
      fileSize: utils.toNumber(file._nFilesize),
      dateAdded: utils.toNumber(file._tsDateAdded),
      downloadCount: utils.toNumber(file._nDownloadCount),
      downloadUrl: String(file._sDownloadUrl ?? ""),
      md5Checksum: typeof file._sMd5Checksum === "string" ? file._sMd5Checksum : undefined,
      hasArchiveContents: Boolean(file._bHasContents),
    };
  },

  /**
   * Standardizes core mod profile metadata.
   * @param {Object} record
   * @returns {Object}
   */
  normalizeSummary: (record) => {
    const utils = window.launcher.gameBananaAPI.utils; // Helper reference shortcut
    const constants = window.launcher.gameBananaAPI.constants; // Constants reference shortcut
    
    const submitter = record._aSubmitter ?? {}; // Raw submitter dictionary
    const game = record._aGame ?? {}; // Raw game target dictionary
    const rootCategory = record._aRootCategory ?? {}; // Raw category grouping dictionary

    const rootCategoryId = typeof rootCategory._sProfileUrl === "string"
      ? Number(rootCategory._sProfileUrl.split("/").at(-1))
      : 0; // Extracted ID value from categorical profile url

    return {
      id: utils.toNumber(record._idRow),
      modelName: String(record._sModelName ?? "Mod"),
      name: String(record._sName ?? "Unknown Mod"),
      profileUrl: String(record._sProfileUrl ?? ""),
      version: typeof record._sVersion === "string" ? record._sVersion : undefined,
      description: typeof record._sDescription === "string" ? record._sDescription : undefined,
      imageUrl: utils.firstImageUrl(record._aPreviewMedia, "_sFile530") ?? (typeof record._sImageUrl === "string" ? record._sImageUrl : undefined),
      thumbnailUrl: utils.firstImageUrl(record._aPreviewMedia, "_sFile220") ?? (typeof record._sThumbnailUrl === "string" ? record._sThumbnailUrl : undefined),
      screenshotUrls: utils.allImageUrls(record._aPreviewMedia, "_sFile530"),
      dateAdded: utils.toNumber(record._tsDateAdded),
      dateModified: utils.toNumber(record._tsDateModified),
      dateUpdated: utils.toNumber(record._tsDateUpdated),
      likeCount: utils.firstDefinedNumber(record._nLikeCount, record._nLikes),
      postCount: utils.toNumber(record._nPostCount),
      viewCount: utils.firstDefinedNumber(record._nViewCount, record._nViews),
      downloadCount: utils.firstDefinedNumber(record._nDownloadCount, record._nDownloads),
      isObsolete: Boolean(record._bIsObsolete),
      submitter: {
        id: utils.toNumber(submitter._idRow),
        name: String(submitter._sName ?? "Unknown"),
        profileUrl: String(submitter._sProfileUrl ?? ""),
        avatarUrl: typeof submitter._sAvatarUrl === "string" ? submitter._sAvatarUrl : undefined,
      },
      game: {
        id: utils.toNumber(game._idRow),
        name: String(game._sName ?? "Unknown Game"),
      },
      rootCategory: {
        id: rootCategoryId,
        name: rootCategory._sName ? String(rootCategory._sName) : "",
        profileUrl: String(rootCategory._sProfileUrl ?? ""),
        iconUrl: typeof rootCategory._sIconUrl === "string" ? rootCategory._sIconUrl : undefined,
      },
    };
  }
};