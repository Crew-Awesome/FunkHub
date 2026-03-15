import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Folder, Download, Palette, Sliders, Info, Twitter, MessageCircle, FolderOpen, Link2, Copy } from "lucide-react";
import { useFunkHub, useI18n, useTheme } from "../../providers";

const ITCH_OAUTH_CLIENT_ID = "4f345ebf07699f30d702a69fd6dca358";

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const {
    settings,
    itchAuth,
    installedEngines,
    setDefaultEngine,
    updateSettings,
    browseFolder,
    openFolderPath,
    connectItch,
    disconnectItch,
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
      window.alert(error instanceof Error ? error.message : t("settings.failedOpenFolder", "Failed to open folder"));
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

      <div className="space-y-6">
        {/* General Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${activeSection === "setup" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
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
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className={`${activeSection === "setup" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-sky-500" />
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
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className={`${activeSection === "integrations" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-indigo-500" />
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
        </motion.section>

        {/* Download Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${activeSection === "setup" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
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

        </motion.section>

        {/* Appearance Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${activeSection === "appearance" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("settings.tabs.appearance", "Appearance")}</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">{t("settings.darkTheme", "Dark Theme")}</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark"
                    ? t("settings.darkModeEnabled", "Dark mode is enabled")
                    : t("settings.lightModeEnabled", "Light mode is enabled")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
                className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                         checked:bg-primary transition-colors
                         after:content-[''] after:absolute after:top-1 after:left-1 
                         after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                         checked:after:translate-x-5"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">{t("settings.showAnimations", "Show animations")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.showAnimationsDesc", "Enable smooth transitions and effects")}</p>
              </div>
              <input
                type="checkbox"
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

          </div>
        </motion.section>

        {/* Base Game Install & itch.io */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`${activeSection === "integrations" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("settings.baseGameInstall", "Base Game Install")}</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-200">{t("settings.itchBaseInstall", "itch.io base game install")}</p>
              <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-100/90">
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
        </motion.section>

        {/* Advanced Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${activeSection === "advanced" ? "" : "hidden"} bg-card border border-border rounded-xl p-6`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("settings.tabs.advanced", "Advanced")}</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">{t("settings.compatibilityChecks", "Enable compatibility checks")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.compatibilityChecksDesc", "Verify mod compatibility before installation")}
                </p>
              </div>
              <input
                type="checkbox"
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
                <p className="font-medium text-foreground">{t("settings.autoUpdateMods", "Auto-update mods")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.autoUpdateModsDesc", "Automatically download updates for installed mods")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoUpdateMods}
                onChange={(event) => {
                  updateSettings({ autoUpdateMods: event.target.checked });
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
                <p className="text-sm text-muted-foreground">
                  {t("settings.sendAnalyticsDesc", "Help improve FunkHub by sharing usage data")}
                </p>
              </div>
              <input
                type="checkbox"
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
        </motion.section>

        {/* About */}
        <div className={`${activeSection === "about" ? "" : "hidden"} bg-card border border-border rounded-xl p-6 text-center`}>
          <h3 className="font-semibold text-foreground mb-2">{t("settings.aboutTitle", "FunkHub")} {displayVersion}</h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.aboutDescription", "A Friday Night Funkin Mod Launcher")}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="https://x.com/immalloy"
              target="_blank"
              rel="noopener noreferrer"
              title={t("settings.creator", "Creator")}
              aria-label={t("settings.creator", "Creator")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a
              href="https://discord.gg/cdP7JhDv4u"
              target="_blank"
              rel="noopener noreferrer"
              title={t("settings.discordServer", "Discord Server")}
              aria-label={t("settings.discordServer", "Discord Server")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <MessageCircle className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
