import { motion } from "motion/react";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { useFunkHub, useI18n } from "../../providers";

export function Updates() {
  const { t } = useI18n();
  const {
    modUpdates,
    refreshModUpdates,
    installMod,
    settings,
    updateSettings,
    appUpdate,
    appUpdateError,
    appUpdateChecking,
    checkAppUpdate,
    openAppUpdateDownload,
    downloadAppUpdate,
    installAppUpdate,
    appUpdateStatus,
  } = useFunkHub();

  const autoUpdaterSupported = Boolean(window.funkhubDesktop?.downloadAppUpdate && window.funkhubDesktop?.installAppUpdate);
  const isDownloadingAppUpdate = appUpdateStatus?.status === "downloading";
  const appUpdateReadyToInstall = appUpdateStatus?.status === "downloaded";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t("updates.title", "Updates")}</h1>
        <button
          onClick={async () => {
            await refreshModUpdates();
            await checkAppUpdate();
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${appUpdateChecking ? "animate-spin" : ""}`} />
          {t("updates.check", "Check for Updates")}
        </button>
      </div>

      <div className="mb-6 bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-2">{t("updates.appUpdate", "FunkHub App Update")}</h3>
        {appUpdate?.available ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("updates.newVersion", "New version available")}: <span className="text-foreground font-medium">v{appUpdate.latestVersion}</span>
              {" "}{t("updates.currentVersionInline", "({label}: v{{version}})", {
                label: t("updates.current", "Current").toLowerCase(),
                version: appUpdate.currentVersion,
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {autoUpdaterSupported ? (
                appUpdateReadyToInstall ? (
                  <button
                    onClick={() => installAppUpdate().catch((error) => toast.error(error instanceof Error ? error.message : t("updates.installUpdateError", "Unable to install update")))}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    {t("updates.installAndRestart", "Install and Restart")}
                  </button>
                ) : (
                  <button
                    disabled={isDownloadingAppUpdate}
                    onClick={() => downloadAppUpdate().catch((error) => toast.error(error instanceof Error ? error.message : t("updates.downloadUpdateError", "Unable to download update")))}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    {isDownloadingAppUpdate
                      ? t("updates.downloadingUpdate", "Downloading Update...")
                      : t("updates.downloadUpdate", "Download Update")}
                  </button>
                )
              ) : (
                <button
                  onClick={() => openAppUpdateDownload().catch((error) => toast.error(error instanceof Error ? error.message : t("updates.openUpdateError", "Unable to open update")))}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
                >
                  {t("updates.downloadUpdate", "Download Update")}
                </button>
              )}
            </div>
            {isDownloadingAppUpdate && (
              <p className="text-xs text-muted-foreground">
                {t("updates.downloadProgress", "Download progress: {{progress}}%", {
                  progress: Math.max(0, Math.min(100, Math.round(appUpdateStatus?.progress || 0))),
                })}
              </p>
            )}
            {appUpdateReadyToInstall && (
              <p className="text-xs text-muted-foreground">{t("updates.readyToInstall", "Update downloaded. Install and restart to apply it.")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {appUpdateChecking
                ? t("updates.checkingAppUpdates", "Checking for app updates...")
                : appUpdate
                  ? t("updates.latestVersion", `You're on the latest version (v${appUpdate.currentVersion}).`)
                  : t("updates.noCheckYet", "No app update check has been run yet.")}
            </p>
          </div>
        )}
        {appUpdateError && <p className="mt-2 text-xs text-destructive">{appUpdateError}</p>}
      </div>

      {modUpdates.length > 0 ? (
        <div className="space-y-3">
          {modUpdates.map((update, index) => (
            <motion.div
              key={update.installedId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{update.modName}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                       <span className="text-muted-foreground">{t("updates.current", "Current")}:</span>
                      <span className="px-2 py-1 bg-secondary rounded text-foreground">
                        v{update.currentVersion}
                      </span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                       <span className="text-muted-foreground">{t("updates.new", "New")}:</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                        v{update.latestVersion}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => installMod(update.modId, update.sourceFileId, undefined, 10)}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                   {t("updates.update", "Update")}
                </button>
              </div>
            </motion.div>
          ))}

          <div className="mt-6">
            <button
              onClick={() => {
                modUpdates.forEach((update) => installMod(update.modId, update.sourceFileId, undefined, 10));
              }}
              className="w-full px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors"
            >
               {t("updates.updateAll", "Update All")} ({modUpdates.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <RefreshCw className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{t("updates.allUpToDate", "All mods are up to date!")}</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {t("updates.noneAvailable", "There are no updates available for your installed mods at this time.")}
          </p>
        </div>
      )}

      {/* Update Settings */}
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("updates.settings", "Update Settings")}</h3>
        <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">{t("updates.autoUpdateMods", "Auto-update mods")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("updates.autoUpdateModsDesc", "Automatically download and install mod updates")}
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
                <p className="font-medium text-foreground">{t("updates.checkOnStartup", "Check for updates on startup")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("updates.checkOnStartupDesc", "Scan for available updates when FunkHub launches")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.checkAppUpdatesOnStartup}
                onChange={(event) => {
                  updateSettings({ checkAppUpdatesOnStartup: event.target.checked });
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
                <p className="font-medium text-foreground">{t("updates.autoOpenUpdate", "Auto-open app update when found")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("updates.autoOpenUpdateDesc", "Opens your platform download link after startup update check")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoDownloadAppUpdates}
                onChange={(event) => {
                  updateSettings({ autoDownloadAppUpdates: event.target.checked });
                }}
                className="w-11 h-6 bg-secondary rounded-full appearance-none cursor-pointer relative
                       checked:bg-primary transition-colors
                       after:content-[''] after:absolute after:top-1 after:left-1 
                       after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                       checked:after:translate-x-5"
              />
            </label>
          </div>
        </div>
      </div>
  );
}
