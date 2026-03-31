if (!window.launcher) window.launcher = {};

if (!window.launcher.discoverManager) {
  class DiscoverManager {
    constructor() {
      this.templateUrl = "public/app/discover.html";
      this.api = window.launcher.gameBananaAPI.apiService;
      this.cache = window.launcher.discover.utils.cache;
      this.scrollObserver = null;
    }

    async getTemplate() {
      try {
        const response = await fetch(this.templateUrl);
        if (!response.ok) throw new Error("Failed to load discover template");
        
        const html = await response.text();
        setTimeout(() => this.mount(), 0);
        
        return html;
      } catch (error) {
        console.error("Template error", error);
        return `<div>Error loading Discover view</div>`;
      }
    }

    async mount() {
      if (window.lucide) window.lucide.createIcons();

      this.attachEventListeners();
      this.initInfiniteScroll();

      try {
        const state = window.launcher.discover.state;
        
        let trending = await this.cache.get("discover_trending");
        let categories = await this.cache.get("discover_categories");

        if (!trending || !categories) {
          [trending, categories] = await Promise.all([
            this.api.getTrendingMods(),
            this.api.getFunkHubCategories()
          ]);
          await this.cache.set("discover_trending", trending, 300000); // 5 mins cache
          await this.cache.set("discover_categories", categories, 3600000); // 1 hr cache
        }

        state.trendingMods = trending;
        state.categories = categories;

        window.launcher.discover.ui.toggleViewMode(); // Start UI Grid/List setup
        this.updateHeroView();
        
        window.launcher.discover.ui.renderCategoriesAsPills(
          state.categories,
          { selectedCategoryId: state.selectedCategoryId, subfeedSort: state.subfeedSort },
          this.handleCategorySelect.bind(this)
        );

        await this.loadModsGrid(false);
      } catch (error) {
        console.error("Mount initialization failed", error);
      }
    }

    attachEventListeners() {
      const searchInput = document.getElementById("discover-search-input");
      const filterBtn = document.getElementById("discover-filter-btn");
      const viewToggleBtn = document.getElementById("discover-view-toggle");
      const heroPrev = document.getElementById("hero-prev");
      const heroNext = document.getElementById("hero-next");
      const state = window.launcher.discover.state;

      if (searchInput) {
        const debouncedSearch = window.launcher.utils.debounce((value) => {
          state.searchQuery = value;
          state.page = 1;
          this.loadModsGrid(false);
        }, 500);
        
        searchInput.addEventListener("input", (e) => debouncedSearch(e.target.value));
      }

      if (filterBtn) {
        filterBtn.addEventListener("click", (e) => {
          if (window.launcher.discover.filterModal) {
            window.launcher.discover.filterModal.open(this.handleCategorySelect.bind(this), e.currentTarget);
          }
        });
      }
      
      if (viewToggleBtn) {
        viewToggleBtn.addEventListener("click", () => {
          state.viewMode = state.viewMode === "grid" ? "list" : "grid";
          window.launcher.discover.ui.toggleViewMode();
        });
      }

      if (heroPrev) {
        heroPrev.addEventListener("click", (e) => {
          e.stopPropagation();
          window.launcher.discover.carousel.shiftHero(-1, this.updateHeroView.bind(this));
        });
      }

      if (heroNext) {
        heroNext.addEventListener("click", (e) => {
          e.stopPropagation();
          window.launcher.discover.carousel.shiftHero(1, this.updateHeroView.bind(this));
        });
      }
    }

    initInfiniteScroll() {
      const state = window.launcher.discover.state;
      const sentinel = document.getElementById("discover-scroll-sentinel");

      if (!sentinel) return;

      this.scrollObserver = new IntersectionObserver((entries) => {
        const target = entries[0];
        
        if (target.isIntersecting && !state.isLoading && state.hasMore) {
          state.page++;
          this.loadModsGrid(true);
        }
      }, { rootMargin: "300px" });

      this.scrollObserver.observe(sentinel);
    }

    async loadModsGrid(isAppend = false) {
      const state = window.launcher.discover.state;
      const ui = window.launcher.discover.ui;

      if (!isAppend) state.page = 1;

      state.isLoading = true;

      if (!isAppend) ui.setLoadingStatus(true, 0);
      ui.setSentinelVisibility(state.hasMore);

      try {
        let results = [];
        const cacheKey = `mods_${state.searchQuery}_${state.selectedCategoryId}_${state.subfeedSort}_${state.page}_${state.perPage}`;
        
        // Cache read verification
        let cachedResults = await this.cache.get(cacheKey);

        if (cachedResults) {
          results = cachedResults;
          
          if (state.searchQuery.trim().length >= 2 || state.selectedCategoryId || state.subfeedSort !== "default") {
             document.getElementById("discover-hero").classList.remove("active");
          } else {
             document.getElementById("discover-hero").classList.add("active");
          }
        } else {
          // Fresh API fetch fallback if no cache
          if (state.searchQuery.trim().length >= 2) {
            results = await this.api.searchMods({ query: state.searchQuery, page: state.page, perPage: state.perPage });
            document.getElementById("discover-hero").classList.remove("active");
          } else if (state.selectedCategoryId) {
            results = await this.api.listMods({ categoryId: state.selectedCategoryId, page: state.page, perPage: state.perPage });
            document.getElementById("discover-hero").classList.remove("active");
          } else {
            results = await this.api.getSubfeed({ sort: state.subfeedSort, page: state.page, perPage: state.perPage });
            document.getElementById("discover-hero").classList.add("active");
          }
          
          await this.cache.set(cacheKey, results, 60000); // Save query payload for 1 min
        }

        state.hasMore = results.length >= state.perPage;

        if (isAppend) {
          state.currentMods.push(...results);
        } else {
          state.currentMods = results;
        }

        ui.renderGrid(
          results,
          isAppend,
          (mod) => {
            if (window.launcher.modsModal && window.launcher.modsModal.modVisualizer) {
              window.launcher.modsModal.modVisualizer.open(mod.id);
            }
          },
          (submitter) => {
            if (window.launcher.modsModal && window.launcher.modsModal.userProfile) {
              window.launcher.modsModal.userProfile.open(submitter);
            }
          }
        );
      } catch (error) {
        console.error("Failed loading mods grid", error);
      } finally {
        state.isLoading = false;
        ui.setLoadingStatus(false, state.currentMods.length);
        ui.setSentinelVisibility(state.hasMore);
      }
    }

    updateHeroView() {
      const state = window.launcher.discover.state;
      const carousel = window.launcher.discover.carousel;

      if (state.trendingMods.length === 0) return;

      const hero = state.trendingMods[state.heroIndex];
      if (!hero) return;

      carousel.renderHero(hero);
      carousel.renderHeroStrip(state.heroIndex, state.trendingMods, (globalIdx) => {
        state.heroIndex = globalIdx;
        this.updateHeroView();
      });
      carousel.startAutoAdvance(this.updateHeroView.bind(this));
    }

    handleCategorySelect(categoryId, sortType) {
      const state = window.launcher.discover.state;

      if (state.selectedCategoryId === categoryId && state.subfeedSort === sortType) {
        return;
      }

      state.selectedCategoryId = categoryId;
      if (sortType) state.subfeedSort = sortType;

      state.page = 1;
      state.hasMore = true;

      const track = document.getElementById("discover-categories");

      if (track) {
        const targetPill = track.querySelector(`.category-pill[data-id="${categoryId || sortType}"]`);

        if (targetPill) {
          window.launcher.discover.ui.updatePillIndicator(targetPill);
          const viewport = document.getElementById("pills-viewport");

          if (viewport) {
            const scrollLeftTarget = targetPill.offsetLeft - viewport.offsetWidth / 2 + targetPill.offsetWidth / 2;
            viewport.scrollTo({ left: scrollLeftTarget, behavior: "smooth" });
          }
        }
      }

      this.loadModsGrid(false);
    }
  }

  window.launcher.discoverManager = new DiscoverManager();
}