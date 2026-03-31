const scriptsToLoad = [
  // GameBanana API Core
  "src/core/gameBananaAPI/constants.js",
  "src/core/gameBananaAPI/utils.js",
  "src/core/gameBananaAPI/engineDetection.js",
  "src/core/gameBananaAPI/normalizers.js",
  "src/core/gameBananaAPI/gameBananaAPI.js",

  // Global Utils
  "src/utils/debounce.js",

  // Discover Utilities
  "src/app/discover/utils/cache.js",
  "src/app/discover/utils/formatters.js",
  "src/app/discover/utils/colorExtractor.js",
  
  // Discover Data and View state
  "src/app/discover/discoverState.js",
  "src/app/discover/filterModal.js",
  "src/app/discover/discoverUI.js",
  "src/app/discover/discoverCarousel.js",
  
  // Discover Modals
  "src/app/discover/modsModal/modVisualizerState.js",
  "src/app/discover/modsModal/modVisualizerUI.js",
  "src/app/discover/modsModal/modVisualizerManager.js",
  "src/app/discover/modsModal/userProfile.js",

  // Discover Core
  "src/app/discover/discoverManager.js",

  // Application Core
  "src/app/app.js",
  "src/app/topbar.js", // Replaced sidebar.js
  "src/app/router.js"
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;

    script.onload = () => {
      console.log(`Successfully loaded script: ${src}`);
      resolve();
    };

    script.onerror = () => {
      console.error(`Error loading script: ${src}`);
      reject(new Error(`Failed to load: ${src}`));
    };

    document.body.appendChild(script);
  });
}

async function initLauncher() {
  console.log("Starting core script loading process");

  try {
    for (const src of scriptsToLoad) {
      await loadScript(src);
    }

    console.log("Core scripts loaded successfully");

    if (window.launcher && window.launcher.topbarManager) {
      await window.launcher.topbarManager.init();
    }

    if (window.launcher && window.launcher.router) {
      window.launcher.router.init();
    }
  } catch (error) {
    console.error("Critical failure during script loading", error);
  }
}

initLauncher();