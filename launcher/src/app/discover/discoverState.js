if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};

window.launcher.discover.state = {
  page: 1, // Current active page for grid data
  perPage: 20, // Limit of items retrieved per page
  searchQuery: "", // Active string filter from search input
  selectedCategoryId: undefined, // Current category ID filter applied
  subfeedSort: "default", // Sort method applied to grid items
  expandedCategoryIds: [], // List of category IDs currently expanded in the tree
  trendingMods: [], // Cached carousel mod items
  currentMods: [], // Currently displayed grid mod items
  categories: [], // Cached full category tree
  heroIndex: 0, // Active position index in hero carousel
  isLoading: true, // Grid data fetching status
  hasMore: true, // Determines if infinite scroll should continue fetching
  autoAdvanceInterval: null // Interval reference for carousel auto advance
};