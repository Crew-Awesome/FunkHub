if (!window.launcher) window.launcher = {};
if (!window.launcher.modsModal) window.launcher.modsModal = {};

window.launcher.modsModal.visualizerUI = {
  createModalDOM: (onClose) => {
    if (document.getElementById("mod-visualizer-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "mod-visualizer-overlay";
    overlay.className = "modal-overlay";

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Mod Visualizer</h2>
          <button class="modal-close-btn" id="mod-visualizer-close"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body" id="mod-visualizer-body"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("mod-visualizer-close").addEventListener("click", onClose);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) onClose();
    });
  },

  formatBytes: (bytes) => {
    if (!bytes || bytes <= 0) return "—";

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }

    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  },

  formatDate: (ts) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString();
  },

  setLoading: () => {
    const overlay = document.getElementById("mod-visualizer-overlay");
    const body = document.getElementById("mod-visualizer-body");

    overlay.classList.add("active");

    body.innerHTML = `
      <div class="modal-loader" style="grid-column: 1/-1;">
        <div class="modal-spinner"></div>
        <span>Loading mod details...</span>
      </div>
    `;
  },

  setError: (message) => {
    const body = document.getElementById("mod-visualizer-body");
    body.innerHTML = `<div style="grid-column: 1/-1; color: var(--destructive); padding: 24px;">Failed to load mod profile: ${message}</div>`;
  },

  updateGalleryImage: (index) => {
    const state = window.launcher.modsModal.visualizerState;
    if (state.mediaGallery.length === 0) return;

    state.currentMediaIndex = index;
    const container = document.getElementById("modal-gallery-viewport");

    if (!container) return;

    const oldImg = container.querySelector(".modal-gallery-layer.active");
    const newImg = document.createElement("img");

    newImg.className = "modal-gallery-layer entering";
    newImg.src = state.mediaGallery[index];
    newImg.loading = "lazy";

    const nextBtn = document.getElementById("modal-gallery-next");
    if (nextBtn) {
      container.insertBefore(newImg, nextBtn);
    } else {
      container.appendChild(newImg);
    }

    void newImg.offsetWidth;
    newImg.classList.remove("entering");
    newImg.classList.add("active");

    if (oldImg) {
      oldImg.classList.remove("active");
      oldImg.classList.add("exiting");
      setTimeout(() => {
        if (oldImg.parentNode) oldImg.remove();
      }, 600);
    }

    const dots = document.querySelectorAll(".modal-dot");
    dots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add("active");
      else dot.classList.remove("active");
    });

    window.launcher.modsModal.visualizerUI.startAutoAdvance();
  },

  startAutoAdvance: () => {
    const state = window.launcher.modsModal.visualizerState;
    const ui = window.launcher.modsModal.visualizerUI;

    ui.stopAutoAdvance();

    if (state.mediaGallery.length <= 1) return;

    const progressFill = document.getElementById("modal-gallery-progress-fill");

    if (progressFill) {
      progressFill.style.transition = "none";
      progressFill.style.width = "0%";

      requestAnimationFrame(() => {
        progressFill.style.transition = "width 4s linear";
        progressFill.style.width = "100%";
      });
    }

    state.autoAdvanceInterval = setInterval(() => {
      const nextIdx = (state.currentMediaIndex + 1) % state.mediaGallery.length;
      ui.updateGalleryImage(nextIdx);
    }, 4000);
  },

  stopAutoAdvance: () => {
    const state = window.launcher.modsModal.visualizerState;

    if (state.autoAdvanceInterval) {
      clearInterval(state.autoAdvanceInterval);
      state.autoAdvanceInterval = null;
    }
  },

  renderProfile: (profile, onAuthorClick) => {
    const state = window.launcher.modsModal.visualizerState;
    const ui = window.launcher.modsModal.visualizerUI;
    const formatCompact = window.launcher.discover.utils.formatters.formatCompactNumber;
    const body = document.getElementById("mod-visualizer-body");

    state.mediaGallery = [profile.imageUrl, profile.thumbnailUrl, ...(profile.screenshotUrls ?? [])].filter(Boolean);
    state.mediaGallery = Array.from(new Set(state.mediaGallery));
    state.currentMediaIndex = 0;

    let galleryHTML = `<div class="modal-card-panel" style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--muted-foreground)">No preview image</div>`;

    if (state.mediaGallery.length > 0) {
      galleryHTML = `
        <div class="modal-card-panel" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; position: relative;">
          <div class="modal-gallery-wrapper" id="modal-gallery-viewport">
            <img src="${state.mediaGallery[0]}" class="modal-gallery-layer active" loading="lazy">
            ${state.mediaGallery.length > 1 ? `
              <button class="modal-gallery-btn prev" id="modal-gallery-prev"><i data-lucide="chevron-left"></i></button>
              <button class="modal-gallery-btn next" id="modal-gallery-next"><i data-lucide="chevron-right"></i></button>
              <div class="modal-gallery-progress">
                <div class="modal-gallery-progress-fill" id="modal-gallery-progress-fill"></div>
              </div>
            ` : ""}
          </div>
          ${state.mediaGallery.length > 1 ? `
            <div class="modal-gallery-dots" id="modal-gallery-dots">
              ${state.mediaGallery.map((img, idx) => `<div class="modal-dot ${idx === 0 ? "active" : ""}" data-index="${idx}"></div>`).join("")}
            </div>
          ` : ""}
        </div>
      `;
    }

    const cleanDesc = (profile.description ?? profile.text ?? "").replace(/<[^>]+>/g, " ").trim();
    const descHTML = `<div class="modal-card-panel"><h4 style="margin:0 0 12px 0;">Description</h4><p style="font-size: 0.875rem; color: var(--muted-foreground); line-height: 1.6;">${cleanDesc}</p></div>`;

    const filesHTML = profile.files.map((file) => `
      <div class="modal-file-item">
        <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 8px; word-break: break-all;">${file.fileName}</div>
        <div style="display:flex; gap:12px; font-size: 0.75rem; color: var(--muted-foreground); margin-bottom: 12px;">
          <span><i data-lucide="download" style="width:12px;height:12px;"></i> ${formatCompact(file.downloadCount)}</span>
          <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ${ui.formatDate(file.dateAdded)}</span>
          <span>${ui.formatBytes(file.fileSize)}</span>
        </div>
        <button class="modal-install-btn">
          <i data-lucide="download" style="width:16px;height:16px;"></i> Install
        </button>
      </div>
    `).join("");

    body.innerHTML = `
      <section style="overflow-y:auto; padding-right:8px;">
        <div class="modal-card-panel">
          <h3 style="font-size: 1.5rem; margin: 0 0 8px 0;">${profile.name}</h3>
          <div style="font-size: 0.875rem; color: var(--primary);">${profile.category?.name ?? "Uncategorized"}</div>
        </div>
        ${galleryHTML}
        ${descHTML}
      </section>
      <aside style="overflow-y:auto; padding-right:8px;">
        <div class="modal-card-panel">
          <div class="modal-stats-grid">
            <div class="modal-stat-box"><div class="modal-stat-label">Downloads</div><div class="modal-stat-value">${formatCompact(profile.downloadCount)}</div></div>
            <div class="modal-stat-box"><div class="modal-stat-label">Version</div><div class="modal-stat-value">${profile.version ?? "—"}</div></div>
            <div class="modal-stat-box" id="modal-author-btn" style="cursor:pointer;"><div class="modal-stat-label">Author</div><div class="modal-stat-value" style="color:var(--primary)">${profile.submitter?.name ?? "—"}</div></div>
            <div class="modal-stat-box"><div class="modal-stat-label">Updated</div><div class="modal-stat-value">${ui.formatDate(profile.dateUpdated || profile.dateModified)}</div></div>
          </div>
        </div>
        <div class="modal-card-panel">
          <h4 style="margin:0 0 16px 0;">Files</h4>
          ${filesHTML || `<div style="font-size:0.875rem; color:var(--muted-foreground)">No files available.</div>`}
        </div>
      </aside>
    `;

    if (state.mediaGallery.length > 1) {
      document.getElementById("modal-gallery-prev").addEventListener("click", () => {
        const nextIdx = (state.currentMediaIndex - 1 + state.mediaGallery.length) % state.mediaGallery.length;
        ui.updateGalleryImage(nextIdx);
      });

      document.getElementById("modal-gallery-next").addEventListener("click", () => {
        const nextIdx = (state.currentMediaIndex + 1) % state.mediaGallery.length;
        ui.updateGalleryImage(nextIdx);
      });

      document.querySelectorAll(".modal-dot").forEach((dot) => {
        dot.addEventListener("click", (e) => ui.updateGalleryImage(parseInt(e.target.dataset.index)));
      });

      ui.startAutoAdvance();
    }

    const authorBtn = document.getElementById("modal-author-btn");

    if (authorBtn && profile.submitter) {
      authorBtn.addEventListener("click", () => onAuthorClick(profile.submitter));
    }

    if (window.lucide) window.lucide.createIcons();
  }
};