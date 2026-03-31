if (!window.launcher) window.launcher = {};
if (!window.launcher.modsModal) window.launcher.modsModal = {};

window.launcher.modsModal.modVisualizer = {
  init: function () {
    const state = window.launcher.modsModal.visualizerState;
    const ui = window.launcher.modsModal.visualizerUI;

    state.api = window.launcher.gameBananaAPI.apiService;
    ui.createModalDOM(this.close.bind(this));
  },

  open: async function (modId) {
    const state = window.launcher.modsModal.visualizerState;
    const ui = window.launcher.modsModal.visualizerUI;
    const appRoot = document.getElementById("app-root");

    if (!state.api) this.init();

    if (appRoot) appRoot.style.overflow = "hidden";

    ui.setLoading();

    try {
      const profile = await state.api.getModProfile(modId);
      ui.renderProfile(profile, (submitter) => {
        this.close();
        if (window.launcher.modsModal.userProfile) {
          window.launcher.modsModal.userProfile.open(submitter);
        }
      });
    } catch (error) {
      ui.setError(error.message);
    }
  },

  close: function () {
    const ui = window.launcher.modsModal.visualizerUI;
    const overlay = document.getElementById("mod-visualizer-overlay");
    const appRoot = document.getElementById("app-root");

    if (overlay) {
      overlay.classList.remove("active");
    }

    if (appRoot) appRoot.style.overflow = "";

    ui.stopAutoAdvance();
  }
};