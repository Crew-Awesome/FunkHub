window.launcher = window.launcher || {};

window.launcher.home = {
  emit: {
    /**
     * Updates global state to reflect if the Home UI is currently active.
     * @param {boolean} isActive
     */
    event: (isActive) => {
      console.log(`Home UI state updated active: ${isActive}`);
    }
  }
};

/**
 * Handles logic and template fetching specific to the Home route.
 */
class HomeManager {
  constructor() {
    this.templateUrl = "public/app/home.html"; // Path to the view HTML file
  }

  /**
   * Fetches the view template and triggers the active state event.
   * @returns {Promise<string>}
   */
  async getTemplate() {
    try {
      const response = await fetch(this.templateUrl);

      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      const htmlData = await response.text();

      window.launcher.home.emit.event(true);

      return htmlData;
    } catch (error) {
      console.error("Failed to fetch home template", error);
      return `<div>Error loading home template</div>`;
    }
  }
}

window.launcher.homeManager = new HomeManager();