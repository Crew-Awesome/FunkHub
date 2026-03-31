window.launcher = window.launcher || {};
window.launcher.gameBananaAPI = window.launcher.gameBananaAPI || {};

/**
 * Global configuration constants for the GameBanana API
 */
window.launcher.gameBananaAPI.constants = {
  APIV11_BASE: "https://gamebanana.com/apiv11", // Primary API endpoint
  APIV7_BASE: "https://gamebanana.com/apiv7", // Legacy API endpoint for fallbacks
  LIST_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes cache limit for lists
  METADATA_CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes cache limit for profiles
  FNF_GAME_ID: 8694 // Internal GameBanana ID for Friday Night Funkin'
};