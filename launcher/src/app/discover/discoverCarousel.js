if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};

window.launcher.discover.carousel = {
  renderHero: (hero) => {
    const container = document.getElementById("hero-main-banner");
    const title = document.getElementById("hero-title");
    const desc = document.getElementById("hero-desc");
    const contentBox = document.getElementById("hero-content");

    if (!container || !hero) return;

    const oldImg = container.querySelector(".hero-bg-layer.active");
    const newImg = document.createElement("img");

    newImg.className = "hero-bg-layer entering";
    newImg.src = hero.imageUrl || hero.thumbnailUrl || "public/icons/icon.png";

    const gradient = container.querySelector(".hero-gradient");
    container.insertBefore(newImg, gradient);

    void newImg.offsetWidth;

    newImg.classList.remove("entering");
    newImg.classList.add("active");

    if (oldImg) {
      oldImg.classList.remove("active");
      oldImg.classList.add("exiting");
      setTimeout(() => oldImg.remove(), 600);
    }

    if (contentBox) {
      contentBox.classList.add("changing");
      setTimeout(() => {
        if (title) title.textContent = hero.name;
        if (desc) desc.textContent = hero.description ?? "";
        contentBox.classList.remove("changing");
      }, 150);
    }
  },

  renderHeroStrip: (heroIndex, trendingMods, onThumbnailClick) => {
    const container = document.getElementById("hero-strip-container");
    if (!container) return;

    if (container.children.length === 0) {
      trendingMods.forEach((mod, idx) => {
        const thumb = document.createElement("div");
        thumb.className = "strip-item";
        thumb.dataset.index = idx;

        const img = mod.thumbnailUrl || mod.imageUrl || "public/icons/icon.png";
        thumb.innerHTML = `<img src="${img}" alt="${mod.name}" loading="lazy">`;

        thumb.addEventListener("click", (e) => {
          e.stopPropagation();
          onThumbnailClick(idx);
        });

        container.appendChild(thumb);
      });
    }

    const items = container.querySelectorAll(".strip-item");
    items.forEach((item) => item.classList.remove("active"));

    const activeItem = container.querySelector(`.strip-item[data-index="${heroIndex}"]`);
    if (activeItem) activeItem.classList.add("active");

    const maxVisible = 4;
    let shiftIndex = heroIndex;

    if (heroIndex > trendingMods.length - maxVisible) {
      shiftIndex = trendingMods.length - maxVisible;
    }

    if (shiftIndex < 0) shiftIndex = 0;

    const shiftPercent = shiftIndex * 25;
    container.style.transform = `translateX(-${shiftPercent}%)`;
  },

  shiftHero: (direction, onHeroChange) => {
    const state = window.launcher.discover.state;
    const total = state.trendingMods.length;

    if (total === 0) return;

    let newIndex = state.heroIndex + direction;

    if (newIndex < 0) newIndex = total - 1;
    if (newIndex >= total) newIndex = 0;

    state.heroIndex = newIndex;
    onHeroChange();
  },

  startAutoAdvance: (onHeroChange) => {
    const state = window.launcher.discover.state;
    clearInterval(state.autoAdvanceInterval);

    const progressFill = document.getElementById("hero-progress");

    if (progressFill) {
      progressFill.style.transition = "none";
      progressFill.style.width = "0%";

      requestAnimationFrame(() => {
        progressFill.style.transition = "width 4s linear";
        progressFill.style.width = "100%";
      });
    }

    state.autoAdvanceInterval = setInterval(() => {
      window.launcher.discover.carousel.shiftHero(1, onHeroChange);
    }, 4000);
  }
};