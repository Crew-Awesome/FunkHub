if (!window.launcher) window.launcher = {};

if (!window.launcher.topbarManager) {
  class TopbarManager {
    constructor() {
      this.container = document.getElementById("topbar-root"); // Target DOM element
      this.templateUrl = "public/app/topbar.html"; // View template relative path
      this.currentActiveRoute = null; // Currently active route string identifier
      this.lastScrollTop = 0; // Previous scroll offset value
    }

    async init() {
      if (!this.container) {
        console.error("Container not found in DOM");
        return;
      }

      try {
        const response = await fetch(this.templateUrl);

        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }

        const htmlData = await response.text();
        this.container.innerHTML = htmlData;

        if (window.lucide) {
          window.lucide.createIcons();
        }

        this.initScrollBehavior();
        this.initResizeBehavior();

        console.log("Topbar initialized successfully");
      } catch (error) {
        console.error("Failed to fetch topbar template", error);
      }
    }

    initScrollBehavior() {
      const appRoot = document.getElementById("app-root");

      if (!appRoot) return;

      appRoot.addEventListener("scroll", () => {
        const currentScroll = appRoot.scrollTop;

        if (currentScroll > this.lastScrollTop && currentScroll > 64) {
          this.container.classList.add("topbar-hidden");
        } else if (currentScroll < this.lastScrollTop) {
          this.container.classList.remove("topbar-hidden");
        }

        this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      });
    }

    /**
     * Listens for window dimension changes to realign the visual indicator.
     */
    initResizeBehavior() {
      let resizeTimeout;

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
          if (this.currentActiveRoute) {
            this.updateIndicatorPosition(this.currentActiveRoute);
          }
        }, 100);
      });
    }

    /**
     * @param {string} currentRoute
     */
    setActiveItem(currentRoute) {
      if (!this.container) return;

      this.currentActiveRoute = currentRoute;
      const items = this.container.querySelectorAll(".topbar-item");

      items.forEach((item) => {
        item.classList.remove("active");

        if (item.getAttribute("data-route") === currentRoute) {
          item.classList.add("active");
        }
      });

      this.updateIndicatorPosition(currentRoute);
    }

    /**
     * @param {string} route
     */
    updateIndicatorPosition(route) {
      if (!route) return;

      const activeItem = this.container.querySelector(`.topbar-item[data-route="${route}"]`);

      if (activeItem) {
        this.moveIndicatorTo(activeItem);
      }
    }

    /**
     * @param {HTMLElement} target
     */
    moveIndicatorTo(target) {
      const indicator = document.getElementById("topbar-active-indicator");

      if (!indicator || !target) return;

      const targetWidth = target.offsetWidth; // Computed element width
      const targetLeft = target.offsetLeft; // Distance from parent container start

      indicator.style.opacity = "1";
      indicator.style.transform = `translateX(${targetLeft}px)`;
      indicator.style.width = `${targetWidth}px`;
    }
  }

  window.launcher.topbarManager = new TopbarManager();
}