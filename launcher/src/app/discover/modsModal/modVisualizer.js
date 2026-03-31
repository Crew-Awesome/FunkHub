window.launcher = window.launcher || {};
window.launcher.modsModal = window.launcher.modsModal || {};

window.launcher.modsModal.modVisualizer = {
  api: null,
  currentMediaIndex: 0,
  mediaGallery: [],

  init: function() {
    this.api = window.launcher.gameBananaAPI.apiService;
    this.createModalDOM();
  },

  createModalDOM: function() {
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
        <div class="modal-body" id="mod-visualizer-body">
          </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    document.getElementById("mod-visualizer-close").addEventListener("click", () => this.close());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
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

  open: async function(modId) {
    if (!this.api) this.init();

    const overlay = document.getElementById("mod-visualizer-overlay");
    const body = document.getElementById("mod-visualizer-body");
    
    overlay.classList.add("active");
    body.innerHTML = `
      <div class="modal-loader" style="grid-column: 1/-1;">
        <div class="modal-spinner"></div>
        <span>Loading mod details...</span>
      </div>
    `;

    try {
      const profile = await this.api.getModProfile(modId);
      this.renderProfile(profile);
    } catch (error) {
      body.innerHTML = `<div style="grid-column: 1/-1; color: var(--destructive); padding: 24px;">Failed to load mod profile: ${error.message}</div>`;
    }
  },

  close: function() {
    const overlay = document.getElementById("mod-visualizer-overlay");
    if (overlay) overlay.classList.remove("active");
  },

  updateGalleryImage: function(index) {
    if (this.mediaGallery.length === 0) return;
    this.currentMediaIndex = index;
    const img = document.getElementById("modal-main-gallery-img");
    if (img) img.src = this.mediaGallery[this.currentMediaIndex];

    const thumbs = document.querySelectorAll(".modal-gallery-thumb");
    thumbs.forEach((thumb, idx) => {
      if (idx === index) thumb.classList.add("active");
      else thumb.classList.remove("active");
    });
  },

  renderProfile: function(profile) {
    const body = document.getElementById("mod-visualizer-body");

    this.mediaGallery = [profile.imageUrl, profile.thumbnailUrl, ...(profile.screenshotUrls ?? [])].filter(Boolean);
    this.mediaGallery = Array.from(new Set(this.mediaGallery));
    this.currentMediaIndex = 0;

    let galleryHTML = `<div class="modal-card-panel" style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--muted-foreground)">No preview image</div>`;
    
    if (this.mediaGallery.length > 0) {
      galleryHTML = `
        <div class="modal-card-panel" style="padding: 0; overflow: hidden;">
          <div class="modal-gallery-wrapper">
            <img id="modal-main-gallery-img" src="${this.mediaGallery[0]}" class="modal-gallery-img" loading="lazy">
            ${this.mediaGallery.length > 1 ? `
              <button class="modal-gallery-btn prev" id="modal-gallery-prev"><i data-lucide="chevron-left"></i></button>
              <button class="modal-gallery-btn next" id="modal-gallery-next"><i data-lucide="chevron-right"></i></button>
            ` : ''}
          </div>
          ${this.mediaGallery.length > 1 ? `
            <div class="modal-gallery-thumbs" id="modal-gallery-thumbs" style="padding: 12px;">
              ${this.mediaGallery.map((img, idx) => `<img src="${img}" class="modal-gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}" loading="lazy">`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    const descHTML = `<div class="modal-card-panel"><h4 style="margin:0 0 12px 0;">Description</h4><p style="font-size: 0.875rem; color: var(--muted-foreground); line-height: 1.6;">${(profile.description ?? profile.text ?? "").replace(/<[^>]+>/g, " ").trim()}</p></div>`;

    const filesHTML = profile.files.map(file => `
      <div class="modal-file-item">
        <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 8px; word-break: break-all;">${file.fileName}</div>
        <div style="display:flex; gap:12px; font-size: 0.75rem; color: var(--muted-foreground); margin-bottom: 12px;">
          <span><i data-lucide="download" style="width:12px;height:12px;"></i> ${file.downloadCount ?? 0}</span>
          <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ${this.formatDate(file.dateAdded)}</span>
          <span>${this.formatBytes(file.fileSize)}</span>
        </div>
        <button class="modal-install-btn" onclick="console.log('Install', ${file.id})">
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
            <div class="modal-stat-box"><div class="modal-stat-label">Downloads</div><div class="modal-stat-value">${profile.downloadCount ?? 0}</div></div>
            <div class="modal-stat-box"><div class="modal-stat-label">Version</div><div class="modal-stat-value">${profile.version ?? "—"}</div></div>
            <div class="modal-stat-box" id="modal-author-btn" style="cursor:pointer;"><div class="modal-stat-label">Author</div><div class="modal-stat-value" style="color:var(--primary)">${profile.submitter?.name ?? "—"}</div></div>
            <div class="modal-stat-box"><div class="modal-stat-label">Updated</div><div class="modal-stat-value">${this.formatDate(profile.dateUpdated || profile.dateModified)}</div></div>
          </div>
        </div>
        <div class="modal-card-panel">
          <h4 style="margin:0 0 16px 0;">Files</h4>
          ${filesHTML || `<div style="font-size:0.875rem; color:var(--muted-foreground)">No files available.</div>`}
        </div>
      </aside>
    `;

    if (this.mediaGallery.length > 1) {
      document.getElementById("modal-gallery-prev").addEventListener("click", () => {
        const nextIdx = (this.currentMediaIndex - 1 + this.mediaGallery.length) % this.mediaGallery.length;
        this.updateGalleryImage(nextIdx);
      });
      document.getElementById("modal-gallery-next").addEventListener("click", () => {
        const nextIdx = (this.currentMediaIndex + 1) % this.mediaGallery.length;
        this.updateGalleryImage(nextIdx);
      });
      document.querySelectorAll(".modal-gallery-thumb").forEach(thumb => {
        thumb.addEventListener("click", (e) => this.updateGalleryImage(parseInt(e.target.dataset.index)));
      });
    }

    const authorBtn = document.getElementById("modal-author-btn");
    if (authorBtn && profile.submitter) {
      authorBtn.addEventListener("click", () => {
        this.close();
        window.launcher.modsModal.userProfile.open(profile.submitter);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }
};