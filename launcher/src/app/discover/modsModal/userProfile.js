if (!window.launcher) window.launcher = {};
if (!window.launcher.modsModal) window.launcher.modsModal = {};

window.launcher.modsModal.userProfile = {
  api: null,

  init: function () {
    this.api = window.launcher.gameBananaAPI.apiService;
    this.createModalDOM();
  },

  createModalDOM: function () {
    if (document.getElementById("user-profile-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "user-profile-overlay";
    overlay.className = "modal-overlay";

    overlay.innerHTML = `
      <div class="modal-content modal-user-content">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <img id="user-profile-avatar" src="" style="width:40px; height:40px; border-radius:50%; object-fit:cover; display:none;">
            <div>
              <h2 class="modal-title" id="user-profile-name">User Profile</h2>
              <div style="font-size:0.75rem; color:var(--muted-foreground)">Submissions</div>
            </div>
          </div>
          <button class="modal-close-btn" id="user-profile-close"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body modal-user-body" id="user-profile-body"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("user-profile-close").addEventListener("click", () => this.close());

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });
  },

  open: async function (submitter) {
    if (!this.api) this.init();

    const overlay = document.getElementById("user-profile-overlay");
    const body = document.getElementById("user-profile-body");
    const nameEl = document.getElementById("user-profile-name");
    const avatarEl = document.getElementById("user-profile-avatar");
    const appRoot = document.getElementById("app-root");

    if (appRoot) appRoot.style.overflow = "hidden";

    nameEl.textContent = submitter.name;

    if (submitter.avatarUrl) {
      avatarEl.src = submitter.avatarUrl;
      avatarEl.style.display = "block";
    } else {
      avatarEl.style.display = "none";
    }

    overlay.classList.add("active");
    body.innerHTML = `
      <div class="modal-loader">
        <div class="modal-spinner"></div>
        <span>Loading submissions...</span>
      </div>
    `;

    try {
      const results = await this.api.listMods({ submitterId: submitter.id, perPage: 50 });
      this.renderMods(results);
    } catch (error) {
      body.innerHTML = `<div style="color: var(--destructive); padding: 24px;">Failed to load user submissions: ${error.message}</div>`;
    }
  },

  close: function () {
    const overlay = document.getElementById("user-profile-overlay");
    const appRoot = document.getElementById("app-root");

    if (overlay) overlay.classList.remove("active");
    if (appRoot) appRoot.style.overflow = "";
  },

  renderMods: function (mods) {
    const body = document.getElementById("user-profile-body");
    const formatCompact = window.launcher.discover.utils.formatters.formatCompactNumber;

    if (mods.length === 0) {
      body.innerHTML = `<div style="color:var(--muted-foreground); text-align:center; padding: 40px;">No submissions found for this user.</div>`;
      return;
    }

    let listHTML = "";

    mods.forEach((mod) => {
      const thumb = mod.imageUrl || mod.thumbnailUrl || "public/icons/icon.png";

      listHTML += `
        <div class="modal-file-item" style="display:flex; gap:16px; align-items:center; cursor:pointer;" onclick="window.launcher.modsModal.userProfile.openMod(${mod.id})">
          <img src="${thumb}" style="width:60px; height:60px; border-radius:var(--radius); object-fit:cover;" loading="lazy">
          <div style="flex:1;">
            <div style="font-weight:600; font-size:0.875rem;">${mod.name}</div>
            <div style="font-size:0.75rem; color:var(--muted-foreground); margin-top:4px;">
              <i data-lucide="heart" style="width:12px;height:12px;"></i> ${formatCompact(mod.likeCount)} &nbsp;&nbsp;
              <i data-lucide="download" style="width:12px;height:12px;"></i> ${formatCompact(mod.downloadCount)}
            </div>
          </div>
        </div>
      `;
    });

    body.innerHTML = `<div style="display:flex; flex-direction:column; gap:8px;">${listHTML}</div>`;

    if (window.lucide) window.lucide.createIcons();
  },

  openMod: function (modId) {
    this.close();
    window.launcher.modsModal.modVisualizer.open(modId);
  }
};