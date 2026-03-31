if (!window.launcher) window.launcher = {};

if (!window.launcher.router) {
  class Router {
    constructor() {
      this.routes = [
        "home",
        "discover",
        "library",
        "downloads",
        "updates",
        "engines",
        "settings"
      ]; // Array of application valid routes
      this.currentRoute = null; // Currently active route string
      this.loadedScripts = new Set(); // Cache for dynamically loaded script paths
      this.baseScriptPath = "src/app"; // Base directory for dynamic scripts
    }

    /**
     * Initializes the router and sets the default view to discover.
     */
    init() {
      console.log("Initializing router");
      this.navigate("discover");
    }

    /**
     * Dynamically loads a route manager script if it has not been loaded yet.
     * @param {string} src
     * @returns {Promise<void>}
     */
    loadRouteScript(src) {
      if (this.loadedScripts.has(src)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement("script"); // DOM script element
        script.src = src;
        script.async = false;

        script.onload = () => {
          console.log(`Dynamically loaded route script: ${src}`);
          this.loadedScripts.add(src);
          resolve();
        };

        script.onerror = () => {
          console.error(`Failed to dynamically load script: ${src}`);
          reject(new Error(`Script load failed: ${src}`));
        };

        document.body.appendChild(script);
      });
    }

    /**
     * Navigates to a requested route, loading its manager dynamically.
     * @param {string} route
     */
    async navigate(route) {
      if (!this.routes.includes(route)) {
        console.error(`Navigation failed invalid route: ${route}`);
        return;
      }

      this.currentRoute = route; // Assigns requested route to active state
      console.log(`Navigating to route: ${route}`);

      if (window.launcher.topbarManager) {
        window.launcher.topbarManager.setActiveItem(route);
      }

      const scriptPath = `${this.baseScriptPath}/${route}/${route}Manager.js`; // File path to fetch
      const managerName = `${route}Manager`; // Global object name mapping

      try {
        await this.loadRouteScript(scriptPath);

        if (window.launcher[managerName]) {
          const htmlContent = await window.launcher[managerName].getTemplate(); // Fetched raw HTML
          window.launcher.app.renderView(htmlContent);
        } else {
          console.error(`Manager ${managerName} not found after loading script`);
        }
      } catch (error) {
        console.error(`Failed to complete navigation to ${route}`, error);
      }
    }
  }

  window.launcher.router = new Router();
}