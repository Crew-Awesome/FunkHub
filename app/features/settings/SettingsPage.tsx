import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Folder, Download, Palette, Sliders, Info, MessageCircle, FolderOpen, Link2, Copy, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useFunkHub, useI18n, useTheme } from "../../providers";
import { ThemePicker } from "../../shared/ui/ThemePicker";
import { ModePicker } from "../../shared/ui/ModePicker";
import type { SupportedLocale } from "../../i18n";

const ITCH_OAUTH_CLIENT_ID = "4f345ebf07699f30d702a69fd6dca358";

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { t, locale, locales, setLocale } = useI18n();
  const {
    settings,
    itchAuth,
    installedEngines,
    installedMods,
    downloads,
    setDefaultEngine,
    updateSettings,
    browseFolder,
    openFolderPath,
    connectItch,
    disconnectItch,
    clearAllData,
    clearAllMods,
    clearAllEngines,
    clearAllDownloads,
    resetSettings,
    clearTheme,
    clearCompletedDownloads,
    clearFailedDownloads,
    clearActiveDownloads,
    clearDisabledMods,
    clearUnpinnedMods,
  } = useFunkHub();
  const [gameDirectory, setGameDirectory] = useState(settings.gameDirectory);
  const [downloadsDirectory, setDownloadsDirectory] = useState(settings.downloadsDirectory);
  const [dataRootDirectory, setDataRootDirectory] = useState(settings.dataRootDirectory);
  const [itchBusy, setItchBusy] = useState(false);
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState(String(settings.gameBananaIntegration.pollingIntervalSeconds || 300));
  const [activeSection, setActiveSection] = useState<"setup" | "integrations" | "appearance" | "advanced" | "about">("setup");
  const appVersion = (__FUNKHUB_VERSION__ || "0.0.0").trim().replace(/^v/i, "");
  const buildChannel = (__FUNKHUB_CHANNEL__ || "release").toLowerCase();
  const isInDevBuild = buildChannel !== "release";
  const displayVersion = isInDevBuild ? t("settings.version.indev", "InDev") : `v${appVersion}`;

  useEffect(() => {
    setGameDirectory(settings.gameDirectory);
    setDownloadsDirectory(settings.downloadsDirectory);
    setDataRootDirectory(settings.dataRootDirectory);
    setPollingIntervalSeconds(String(settings.gameBananaIntegration.pollingIntervalSeconds || 300));
  }, [
    settings.gameDirectory,
    settings.downloadsDirectory,
    settings.dataRootDirectory,
    settings.gameBananaIntegration.pollingIntervalSeconds,
  ]);

  const updateGameBananaSettings = async (patch: Partial<typeof settings.gameBananaIntegration>) => {
    await updateSettings({
      gameBananaIntegration: {
        ...settings.gameBananaIntegration,
        ...patch,
      },
    });
  };

  const pairFormat = "funkhub://gamebanana/pair/{MemberId}/{SecretKey}";
  const installFormat = "funkhub://mod/install/{ModId}/{FileId}";

  const defaultEngineId = installedEngines.find((engine) => engine.isDefault)?.id ?? "";
  const defaultEngine = installedEngines.find((engine) => engine.isDefault) ?? installedEngines[0];

  const saveStringSetting = async (
    key: "gameDirectory" | "downloadsDirectory" | "dataRootDirectory",
    value: string,
  ) => {
    await updateSettings({ [key]: value.trim() });
  };

  const browseForSetting = async (
    key: "gameDirectory" | "downloadsDirectory" | "dataRootDirectory",
    title: string,
    fallbackValue: string,
  ) => {
    const selected = await browseFolder({
      title,
      defaultPath: fallbackValue || undefined,
    });

    if (!selected) {
      return;
    }

    if (key === "gameDirectory") {
      setGameDirectory(selected);
    } else if (key === "downloadsDirectory") {
      setDownloadsDirectory(selected);
    } else {
      setDataRootDirectory(selected);
    }

    await updateSettings({ [key]: selected });
  };

  const openFolderSafe = async (targetPath: string) => {
    try {
      await openFolderPath(targetPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.failedOpenFolder", "Failed to open folder"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t("settings.title", "Settings")}</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "setup", label: t("settings.tabs.setup", "Setup") },
          { id: "integrations", label: t("settings.tabs.integrations", "Integrations") },
          { id: "appearance", label: t("settings.tabs.appearance", "Appearance") },
          { id: "advanced", label: t("settings.tabs.advanced", "Advanced") },
          { id: "about", label: t("settings.tabs.about", "About") },
        ].map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={[
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              activeSection === section.id
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-secondary",
            ].join(" ")}
          >
            {section.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="space-y-6">
            {/* General Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.general", "General")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.gameDirectory", "Game Directory")}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={gameDirectory}
                      onChange={(event) => setGameDirectory(event.target.value)}
                      onBlur={() => saveStringSetting("gameDirectory", gameDirectory)}
                      className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => browseForSetting("gameDirectory", t("settings.chooseGameFolder", "Choose your FNF game folder"), gameDirectory)}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      {t("settings.browse", "Browse")}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.defaultEngine", "Default Engine")}
                  </label>
                  <select
                    value={defaultEngineId}
                    onChange={(event) => {
                      if (event.target.value) {
                        setDefaultEngine(event.target.value);
                      }
                    }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" disabled={installedEngines.length > 0}>
                      {installedEngines.length > 0
                        ? t("settings.selectDefaultEngine", "Select default engine")
                        : t("settings.noInstalledEngines", "No installed engines")}
                    </option>
                    {installedEngines.map((engine) => (
                      <option key={engine.id} value={engine.id}>
                        {engine.name} ({engine.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Quick Folder Access */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.quickFolderAccess", "Quick Folder Access")}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button onClick={() => openFolderSafe(dataRootDirectory || ".")} className="px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-left text-sm">{t("settings.openDataRoot", "Open Data Root")}</button>
                <button onClick={() => openFolderSafe("engines")} className="px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-left text-sm">{t("settings.openEnginesFolder", "Open Engines Folder")}</button>
                <button onClick={() => openFolderSafe(downloadsDirectory || "downloads")} className="px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-left text-sm">{t("settings.openDownloadsFolder", "Open Downloads Folder")}</button>
                <button onClick={() => openFolderSafe(defaultEngine?.modsPath || "engines")} className="px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-left text-sm">{t("settings.openModsFolder", "Open Mods Folder")}</button>
                <button
                  onClick={() => gameDirectory.trim() && openFolderSafe(gameDirectory)}
                  disabled={!gameDirectory.trim()}
                  className="px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("settings.openGameFolder", "Open Game Folder")}
                </button>
              </div>
            </section>

            {/* Download Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Download className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.downloads", "Downloads")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.downloadLocation", "Download Location")}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={downloadsDirectory}
                      onChange={(event) => setDownloadsDirectory(event.target.value)}
                      onBlur={() => saveStringSetting("downloadsDirectory", downloadsDirectory)}
                      className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => browseForSetting("downloadsDirectory", t("settings.chooseDownloadTempFolder", "Choose a download temp folder"), downloadsDirectory)}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      {t("settings.browse", "Browse")}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.engineDataRoot", "Engine Data Root")}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={dataRootDirectory}
                      onChange={(event) => setDataRootDirectory(event.target.value)}
                      onBlur={() => saveStringSetting("dataRootDirectory", dataRootDirectory)}
                      className="flex-1 px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={t("settings.dataRootPlaceholder", "Defaults to app data directory")}
                    />
                    <button
                      onClick={() => browseForSetting("dataRootDirectory", t("settings.chooseEngineInstallRoot", "Choose engine install root"), dataRootDirectory)}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      {t("settings.browse", "Browse")}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.maxConcurrentDownloads", "Max Concurrent Downloads")}
                  </label>
                  <select
                    value={String(settings.maxConcurrentDownloads)}
                    onChange={(event) => {
                      updateSettings({ maxConcurrentDownloads: Number(event.target.value) });
                    }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "integrations" && (
          <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="space-y-6">
            {/* GameBanana One-Click */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.integration.oneClick", "GameBanana One-Click")}</h2>
              </div>

              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">{t("settings.integration.pairUrlFormat", "Pair URL format")}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{pairFormat}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pairFormat)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("settings.integration.copyPairFormat", "Copy Pair Format")}
                  </button>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">{t("settings.integration.installUrlFormat", "Install URL format")}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground break-all">{installFormat}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(installFormat)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("settings.integration.copyInstallFormat", "Copy Install Format")}
                  </button>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">{t("settings.integration.currentPairingStatus", "Current pairing status")}</p>
                  <p className="mt-1 text-muted-foreground">
                    {settings.gameBananaIntegration.memberId
                      ? t("settings.integration.pairedAsMember", "Paired as member {{memberId}}", { memberId: settings.gameBananaIntegration.memberId })
                      : t("settings.integration.notPaired", "Not paired")}
                  </p>
                  {settings.gameBananaIntegration.pairedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">{t("settings.lastPair", "Last pair")}: {new Date(settings.gameBananaIntegration.pairedAt).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.remoteQueuePolling", "Remote queue polling rate (seconds)")}
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={3600}
                    value={pollingIntervalSeconds}
                    onChange={(event) => setPollingIntervalSeconds(event.target.value)}
                    onBlur={() => {
                      const next = Math.min(3600, Math.max(30, Number(pollingIntervalSeconds) || 300));
                      setPollingIntervalSeconds(String(next));
                      updateGameBananaSettings({ pollingIntervalSeconds: next });
                    }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.recommendedPolling", "Recommended: 300 seconds (5 minutes).")}</p>
                </div>

                <div>
                  <button
                    onClick={() => updateGameBananaSettings({ memberId: undefined, secretKey: undefined, pairedAt: undefined, lastPairUrl: undefined })}
                    className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    {t("settings.clearStoredPairing", "Clear Stored Pairing")}
                  </button>
                </div>
              </div>
            </section>

            {/* Base Game Install & itch.io */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Download className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.baseGameInstall", "Base Game Install")}</h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
                  <p className="text-sm font-medium text-warning">{t("settings.itchBaseInstall", "itch.io base game install")}</p>
                  <p className="mt-1 text-xs text-warning/80">
                    {t("settings.itchBaseInstallDesc", "FunkHub may require an itch.io login/API session to resolve fresh download links for base game installers. If not connected, manual browser fallback will be used.")}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">{t("settings.itchConnection", "itch.io Connection")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("settings.connectItchDesc", "Connect your itch.io account for automatic base game download resolution.")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {itchAuth.connected ? (
                      <button
                        disabled={itchBusy}
                        onClick={async () => {
                          setItchBusy(true);
                          try {
                            await disconnectItch();
                          } finally {
                            setItchBusy(false);
                          }
                        }}
                        className="px-4 py-2 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm"
                      >
                        {t("settings.disconnect", "Disconnect")}
                      </button>
                    ) : (
                      <button
                        disabled={itchBusy}
                        onClick={async () => {
                          setItchBusy(true);
                          try {
                            await connectItch(ITCH_OAUTH_CLIENT_ID);
                          } finally {
                            setItchBusy(false);
                          }
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-lg text-sm"
                      >
                        {t("settings.connectItch", "Connect itch.io")}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("settings.status", "Status")}: {itchAuth.connected
                      ? t("settings.connected", "Connected")
                      : t("settings.notConnected", "Not connected")}
                  </p>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "appearance" && (
          <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {/* Appearance Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.tabs.appearance", "Appearance")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">{t("settings.theme", "Theme")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.themeDesc", "Choose your preferred color theme")}</p>
                </div>
                <ThemePicker />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">{t("settings.mode", "Mode")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.modeDesc", "Choose display mode")}</p>
                </div>
                <ModePicker />
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-foreground">{t("settings.showAnimations", "Show animations")}</p>
                    <p id="desc-show-animations" className="text-sm text-muted-foreground">{t("settings.showAnimationsDesc", "Enable smooth transitions and effects")}</p>
                  </div>
                  <input
                    type="checkbox"
                    aria-describedby="desc-show-animations"
                    checked={settings.showAnimations}
                    onChange={(event) => {
                      updateSettings({ showAnimations: event.target.checked });
                    }}
                    className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                             checked:bg-primary transition-colors
                             after:content-[''] after:absolute after:top-1 after:left-1
                             after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                             checked:after:translate-x-5"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.language", "Language")}
                  </label>
                  <select
                    value={locale}
                    onChange={(event) => {
                      void setLocale(event.target.value as SupportedLocale);
                    }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {locales.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">{t("settings.language.help", "UI language used by FunkHub")}</p>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "advanced" && (
          <motion.div key="advanced" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {/* Advanced Settings */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Info className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.tabs.advanced", "Advanced")}</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-foreground">{t("settings.compatibilityChecks", "Enable compatibility checks")}</p>
                    <p id="desc-compat-checks" className="text-sm text-muted-foreground">
                      {t("settings.compatibilityChecksDesc", "Verify mod compatibility before installation")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-describedby="desc-compat-checks"
                    checked={settings.compatibilityChecks}
                    onChange={(event) => {
                      updateSettings({ compatibilityChecks: event.target.checked });
                    }}
                    className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                             checked:bg-primary transition-colors
                             after:content-[''] after:absolute after:top-1 after:left-1
                             after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                             checked:after:translate-x-5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-foreground">{t("settings.sendAnalytics", "Send analytics")}</p>
                    <p id="desc-send-analytics" className="text-sm text-muted-foreground">
                      {t("settings.sendAnalyticsDesc", "Help improve FunkHub by sharing usage data")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-describedby="desc-send-analytics"
                    checked={settings.sendAnalytics}
                    onChange={(event) => {
                      updateSettings({ sendAnalytics: event.target.checked });
                    }}
                    className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                             checked:bg-primary transition-colors
                             after:content-[''] after:absolute after:top-1 after:left-1
                             after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                             checked:after:translate-x-5"
                  />
                </label>
              </div>
            </section>

            {/* Data Management */}
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{t("settings.dataManagement", "Data Management")}</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground">{t("settings.clearMods", "Clear All Mods")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clearModsDesc", "Remove {{count}} installed mods from library", { count: installedMods.length })}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (window.confirm(t("settings.confirmClearMods", "Are you sure you want to remove all installed mods? This cannot be undone."))) {
                        clearAllMods();
                        toast.success(t("settings.modsCleared", "All mods cleared"));
                      }
                    }}
                    disabled={installedMods.length === 0}
                    className="shrink-0 px-4 py-2 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground">{t("settings.clearEngines", "Clear All Engines")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clearEnginesDesc", "Remove {{count}} installed engines", { count: installedEngines.length })}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (window.confirm(t("settings.confirmClearEngines", "Are you sure you want to remove all installed engines? This cannot be undone."))) {
                        clearAllEngines();
                        toast.success(t("settings.enginesCleared", "All engines cleared"));
                      }
                    }}
                    disabled={installedEngines.length === 0}
                    className="shrink-0 px-4 py-2 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground">{t("settings.clearDownloads", "Clear Download History")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clearDownloadsDesc", "Clear {{count}} download tasks", { count: downloads.length })}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (window.confirm(t("settings.confirmClearDownloads", "Are you sure you want to clear the download history?"))) {
                        clearAllDownloads();
                        toast.success(t("settings.downloadsCleared", "Download history cleared"));
                      }
                    }}
                    disabled={downloads.length === 0}
                    className="shrink-0 px-4 py-2 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground">{t("settings.resetSettings", "Reset Settings")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.resetSettingsDesc", "Restore all settings to default values")}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (window.confirm(t("settings.confirmResetSettings", "Are you sure you want to reset all settings to defaults?"))) {
                        resetSettings();
                        toast.success(t("settings.settingsReset", "Settings reset to defaults"));
                      }
                    }}
                    className="shrink-0 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground">{t("settings.clearTheme", "Clear Theme Preference")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clearThemeDesc", "Reset to system theme")}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      clearTheme();
                      toast.success(t("settings.themeCleared", "Theme preference cleared"));
                    }}
                    className="shrink-0 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Downloads Sub-options */}
                <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.downloads", "Downloads")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        clearActiveDownloads();
                        toast.success(t("settings.activeDownloadsCleared", "Active downloads cleared"));
                      }}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium text-left"
                    >
                      {t("settings.clearActive", "Clear Active ({{count}})", { count: downloads.filter(d => ["queued", "downloading", "installing"].includes(d.status)).length })}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        clearCompletedDownloads();
                        toast.success(t("settings.completedDownloadsCleared", "Completed downloads cleared"));
                      }}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium text-left"
                    >
                      {t("settings.clearCompleted", "Clear Completed ({{count}})", { count: downloads.filter(d => d.status === "completed").length })}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        clearFailedDownloads();
                        toast.success(t("settings.failedDownloadsCleared", "Failed downloads cleared"));
                      }}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium text-left"
                    >
                      {t("settings.clearFailed", "Clear Failed ({{count}})", { count: downloads.filter(d => d.status === "failed").length })}
                    </motion.button>
                  </div>
                </div>

                {/* Mods Sub-options */}
                <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.mods", "Mods")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (window.confirm(t("settings.confirmClearDisabled", "Remove all disabled mods?"))) {
                          clearDisabledMods();
                          toast.success(t("settings.disabledModsCleared", "Disabled mods cleared"));
                        }
                      }}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium text-left"
                    >
                      {t("settings.clearDisabled", "Clear Disabled ({{count}})", { count: installedMods.filter(m => m.enabled === false).length })}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (window.confirm(t("settings.confirmClearUnpinned", "Remove all unpinned mods?"))) {
                          clearUnpinnedMods();
                          toast.success(t("settings.unpinnedModsCleared", "Unpinned mods cleared"));
                        }
                      }}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium text-left"
                    >
                      {t("settings.clearUnpinned", "Clear Unpinned ({{count}})", { count: installedMods.filter(m => !m.pinned).length })}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-destructive">{t("settings.clearAllData", "Clear All Data")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.clearAllDataDesc", "Remove all mods, engines, downloads and reset settings")}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (window.confirm(t("settings.confirmClearAllData", "WARNING: This will remove ALL data including mods, engines, and settings. This cannot be undone! Are you absolutely sure?"))) {
                        if (window.confirm(t("settings.confirmClearAllData2", "Are you REALLY sure? This is irreversible."))) {
                          clearAllData();
                        }
                      }
                    }}
                    className="shrink-0 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {t("settings.clearAll", "Clear All")}
                  </motion.button>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === "about" && (
          <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {/* About */}
            <section className="bg-card border border-border rounded-xl p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">{t("settings.aboutTitle", "FunkHub")} {displayVersion}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.aboutDescription", "A Friday Night Funkin Mod Launcher")}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href="https://x.com/immalloy"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("settings.creatorX", "Creator on X")}
                  aria-label={t("settings.creatorX", "Creator on X")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://discord.gg/cdP7JhDv4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("settings.discordServer", "Discord Server")}
                  aria-label={t("settings.discordServer", "Discord Server")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
