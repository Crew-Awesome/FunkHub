window.launcher = window.launcher || {};
window.launcher.gameBananaAPI = window.launcher.gameBananaAPI || {};

/**
 * Utility functions for parsing and resolving API data.
 */
window.launcher.gameBananaAPI.utils = {
  /**
   * Converts a variable type to a safe number.
   * @param {*} value
   * @returns {number}
   */
  toNumber: (value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, "").trim()); // Formatted numeric string
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  },

  /**
   * Finds the first valid numeric value from multiple arguments.
   * @param {...*} values
   * @returns {number|undefined}
   */
  firstDefinedNumber: (...values) => {
    for (const value of values) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      
      const parsed = window.launcher.gameBananaAPI.utils.toNumber(value); // Safe numeric cast
      
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  },

  /**
   * Normalizes the image payload shape into a predictable array.
   * @param {*} previewMedia
   * @returns {Array}
   */
  resolveImageList: (previewMedia) => {
    if (!previewMedia || typeof previewMedia !== "object") return [];
    
    const wrapped = previewMedia._aImages; // Embedded image array format
    if (Array.isArray(wrapped) && wrapped.length > 0) return wrapped;
    
    if (Array.isArray(previewMedia)) return previewMedia;
    
    const values = Object.values(previewMedia); // PHP-style numeric keys object format
    if (values.length > 0 && typeof values[0] === "object" && values[0] !== null) return values;
    
    return [];
  },

  /**
   * Extracts a single preferred resolution image url.
   * @param {*} previewMedia
   * @param {string} [preferredKey="_sFile220"]
   * @returns {string|undefined}
   */
  firstImageUrl: (previewMedia, preferredKey = "_sFile220") => {
    const utils = window.launcher.gameBananaAPI.utils;
    const images = utils.resolveImageList(previewMedia); // Normalized image collection
    
    if (images.length === 0) return undefined;

    const first = images[0]; // Primary thumbnail object
    const base = first._sBaseUrl;
    const file = first[preferredKey] ?? first._sFile530 ?? first._sFile220 ?? first._sFile;
    
    if (!base || !file) return undefined;

    return `${base}/${file}`;
  },

  /**
   * Extracts all available image urls for a mod gallery.
   * @param {*} previewMedia
   * @param {string} [preferredKey="_sFile530"]
   * @returns {Array<string>}
   */
  allImageUrls: (previewMedia, preferredKey = "_sFile530") => {
    const utils = window.launcher.gameBananaAPI.utils;
    const images = utils.resolveImageList(previewMedia); // Normalized image collection
    
    if (images.length === 0) return [];

    return images
      .map((entry) => {
        const base = entry._sBaseUrl; // Image server domain
        const file = entry[preferredKey] ?? entry._sFile; // Specific file path string
        
        if (!base || !file) {
          return undefined;
        }
        return `${base}/${file}`;
      })
      .filter((value) => Boolean(value));
  }
};