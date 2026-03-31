window.launcher = window.launcher || {};

/**
 * Core application class responsible for rendering views.
 */
class App {
  constructor() {
    this.container = document.getElementById("app-root"); // Main DOM element where views are rendered
  }

  /**
   * Injects HTML content into the main application container.
   * @param {string} htmlContent
   */
  renderView(htmlContent) {
    if (!this.container) {
      console.error("Main app container not found in DOM");
      return;
    }

    this.container.innerHTML = htmlContent;
    console.log("View rendered to DOM");
  }
}

window.launcher.app = new App();