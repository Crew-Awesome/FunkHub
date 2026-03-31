if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};

window.launcher.discover.ui = {
  setLoadingStatus: (isLoading, resultsCount) => {
    const statusEl = document.getElementById("discover-status");
    if (statusEl) {
      statusEl.textContent = isLoading ? "Loading mods..." : `Showing ${resultsCount} results`;
    }
  },

  setSentinelVisibility: (visible) => {
    const sentinel = document.getElementById("discover-scroll-sentinel");
    if (sentinel) {
      if (visible) sentinel.classList.add("visible");
      else sentinel.classList.remove("visible");
    }
  },

  /**
   * Toggles classes and icons for Grid / List visual representations.
   */
  toggleViewMode: () => {
    const state = window.launcher.discover.state;
    const grid = document.getElementById("discover-grid");
    const toggleBtn = document.getElementById("discover-view-toggle");

    if (!grid) return;

    if (state.viewMode === "list") {
      grid.classList.remove("mods-layout-grid");
      grid.classList.add("mods-layout-list");
      if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="layout-grid"></i>';
    } else {
      grid.classList.remove("mods-layout-list");
      grid.classList.add("mods-layout-grid");
      if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="list"></i>';
    }
    
    const cards = grid.querySelectorAll(".mod-card");
    cards.forEach(c => {
      if (state.viewMode === "list") c.classList.add("list-mode");
      else c.classList.remove("list-mode");
    });

    if (window.lucide) window.lucide.createIcons();
  },

  renderGrid: (mods, isAppend, onModClick, onAuthorClick) => {
    const grid = document.getElementById("discover-grid");
    const state = window.launcher.discover.state;
    const formatCompact = window.launcher.discover.utils.formatters.formatCompactNumber;
    const colorExtractor = window.launcher.discover.utils.colorExtractor;

    if (!grid) return;

    if (!isAppend) grid.innerHTML = "";

    if (mods.length === 0 && !isAppend) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted-foreground);">No mods found.</div>`;
      return;
    }

    mods.forEach((mod) => {
      const card = document.createElement("div");
      card.className = `mod-card ${state.viewMode === "list" ? "list-mode" : ""}`;

      const thumb = mod.imageUrl || mod.thumbnailUrl || "public/icons/icon.png";
      const author = mod.submitter?.name ?? "Community Uploader";

      card.innerHTML = `
        <div class="mod-card-thumb">
          <img src="${thumb}" alt="${mod.name}" loading="lazy" onerror="this.src='public/icons/icon.png'">
        </div>
        <div class="mod-card-body">
          <h3 class="mod-card-title" title="${mod.name}">${mod.name}</h3>
          <p class="mod-card-author author-link" style="cursor:pointer;">${author}</p>
          <div class="mod-card-stats">
            <span><i data-lucide="heart" style="width:12px; height:12px;"></i> ${formatCompact(mod.likeCount)}</span>
            <span><i data-lucide="download" style="width:12px; height:12px;"></i> ${formatCompact(mod.downloadCount)}</span>
          </div>
        </div>
      `;

      colorExtractor.getDominantColor(thumb, (rgb) => {
        card.style.setProperty("--dominant-color", rgb);
        const body = card.querySelector(".mod-card-body");
        
        card.addEventListener("mouseenter", () => {
          body.style.backgroundColor = `rgba(${rgb}, 0.15)`;
          body.style.boxShadow = `0 -15px 30px rgba(${rgb}, 0.15)`;
        });
        
        card.addEventListener("mouseleave", () => {
          body.style.backgroundColor = "transparent";
          body.style.boxShadow = "none";
        });
      });

      card.addEventListener("click", () => onModClick(mod));

      const authorLink = card.querySelector(".author-link");
      if (authorLink && mod.submitter) {
        authorLink.addEventListener("click", (e) => {
          e.stopPropagation();
          onAuthorClick(mod.submitter);
        });
      }

      grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  },

  renderCategoriesAsPills: (categories, stateData, onCategorySelect) => {
    const track = document.getElementById("discover-categories");
    const indicator = document.getElementById("pills-indicator");

    if (!track || !indicator) return;

    Array.from(track.children).forEach((child) => {
      if (child.id !== "pills-indicator") child.remove();
    });

    const createPill = (id, label, iconClass, sortType) => {
      const pill = document.createElement("div");
      const isActive = stateData.selectedCategoryId === id && stateData.subfeedSort === sortType;
      
      pill.className = `category-pill ${isActive ? "active" : ""}`;
      pill.dataset.id = id || sortType;
      pill.innerHTML = `<i data-lucide="${iconClass}" style="width:16px;height:16px;"></i> <span>${label}</span>`;

      pill.addEventListener("click", () => {
        onCategorySelect(id, sortType);
        window.launcher.discover.ui.updatePillIndicator(pill);
      });

      track.appendChild(pill);
    };

    createPill(undefined, "All Mods", "layers", "default");
    createPill(undefined, "Ripe", "star", "default");
    createPill(undefined, "New", "sparkles", "new");
    createPill(undefined, "Updated", "refresh-cw", "updated");

    categories.forEach((cat) => {
      const isActive = stateData.selectedCategoryId === cat.id;
      const pill = document.createElement("div");
      
      pill.className = `category-pill ${isActive ? "active" : ""}`;
      pill.dataset.id = cat.id;

      const iconHTML = cat.iconUrl
        ? `<img src="${cat.iconUrl}" style="width:16px; height:16px; object-fit:contain;">`
        : `<i data-lucide="folder-tree" style="width:16px;height:16px;"></i>`;

      pill.innerHTML = `${iconHTML} <span>${cat.name}</span>`;

      pill.addEventListener("click", () => {
        onCategorySelect(cat.id, "default");
        window.launcher.discover.ui.updatePillIndicator(pill);
      });

      track.appendChild(pill);
    });

    if (window.lucide) window.lucide.createIcons();
    
    // Position indicator accurately
    setTimeout(() => {
      const activePill = track.querySelector(".category-pill.active") || track.querySelector(".category-pill");
      if (activePill) window.launcher.discover.ui.updatePillIndicator(activePill);
    }, 100);

    window.launcher.discover.ui.initPillCarousel();
  },

  updatePillIndicator: (activeElement) => {
    const indicator = document.getElementById("pills-indicator");
    
    if (!indicator || !activeElement) return;

    indicator.classList.add("active");
    indicator.style.width = `${activeElement.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeElement.offsetLeft}px)`;

    const allPills = document.querySelectorAll(".category-pill");
    allPills.forEach((p) => p.classList.remove("active"));
    activeElement.classList.add("active");
  },

  initPillCarousel: () => {
    const prevBtn = document.getElementById("pill-nav-prev");
    const nextBtn = document.getElementById("pill-nav-next");
    const viewport = document.getElementById("pills-viewport");

    if (!prevBtn || !nextBtn || !viewport) return;

    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.replaceWith(newPrevBtn);
    nextBtn.replaceWith(newNextBtn);

    const updateButtonVisibility = () => {
      newPrevBtn.classList.toggle("hidden", viewport.scrollLeft <= 0);
      newNextBtn.classList.toggle("hidden", viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 5);
    };

    newPrevBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: -viewport.offsetWidth * 0.8, behavior: "smooth" });
    });

    newNextBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: viewport.offsetWidth * 0.8, behavior: "smooth" });
    });

    viewport.addEventListener("scroll", updateButtonVisibility);
    
    setTimeout(updateButtonVisibility, 100);
  },

  triggerHeroClick: () => {
    const state = window.launcher.discover.state;
    const hero = state.trendingMods[state.heroIndex];
    if (hero && window.launcher.modsModal && window.launcher.modsModal.modVisualizer) {
      window.launcher.modsModal.modVisualizer.open(hero.id);
    }
  }
};