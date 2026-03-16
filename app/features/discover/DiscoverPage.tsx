import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, UserCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ModCard, ModVisualizerModal, UserProfileModal } from "../mods";
import { useFunkHub, useI18n } from "../../providers";
import type { GameBananaMember } from "../../services/funkhub";
import type { SupportedLocale } from "../../i18n";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

export function Discover() {
  const { t, locale, locales, setLocale } = useI18n();
  const {
    loading,
    discoverMods,
    modSortOptions,
    discoverSort,
    setDiscoverSort,
    discoverPage,
    setDiscoverPage,
    hasMoreDiscover,
    searchQuery,
    setSearchQuery,
    installedMods,
    modUpdates,
    settings,
    updateSettings,
    browseFolder,
  } = useFunkHub();
  const navigate = useNavigate();

  const [selectedModId, setSelectedModId] = useState<number | undefined>(undefined);
  const [selectedSubmitter, setSelectedSubmitter] = useState<Pick<GameBananaMember, "id" | "name" | "avatarUrl"> | undefined>(undefined);
  const [onboardingOpen, setOnboardingOpen] = useState(!settings.firstRunCompleted);

  const needsOnboarding = !settings.firstRunCompleted;

  useEffect(() => {
    if (needsOnboarding) {
      setOnboardingOpen(true);
    }
  }, [needsOnboarding]);

  const completeOnboarding = async () => {
    await updateSettings({ firstRunCompleted: true });
    setOnboardingOpen(false);
  };

  const usernameFilter = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.startsWith("@")) {
      return trimmed.slice(1).trim().toLowerCase();
    }
    const prefixed = trimmed.match(/^user:\s*(.+)$/i);
    if (prefixed?.[1]) {
      return prefixed[1].trim().toLowerCase();
    }
    return "";
  }, [searchQuery]);

  const visibleMods = useMemo(() => {
    if (!usernameFilter) {
      return discoverMods;
    }
    return discoverMods.filter((mod) => (mod.submitter?.name ?? "").toLowerCase().includes(usernameFilter));
  }, [discoverMods, usernameFilter]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">{t("discover.title", "Discover Mods")}</h1>

        {needsOnboarding && (
          <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("discover.quickStart", "Quick Start Setup")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("discover.quickStartDesc", "Set your folders, install an engine, and test one-click installs before browsing mods.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("discover.openWizard", "Open Wizard")}
                </button>
                <button
                  onClick={completeOnboarding}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  {t("discover.dismiss", "Dismiss")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("discover.searchMods", "Search for mods...")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {modSortOptions.map((option) => {
            const isSelected = discoverSort === option.alias;
            return (
              <motion.button
                key={option.alias}
                onClick={() => setDiscoverSort(option.alias)}
                whileTap={{ scale: 0.92 }}
                animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                  ${
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-card hover:bg-secondary text-muted-foreground border border-border"
                  }
                `}
              >
                {option.title}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? t("discover.loadingMods", "Loading mods...") : `Showing ${visibleMods.length} mods`}
      </div>

      {usernameFilter && (
        <div className="mb-4 text-sm text-muted-foreground inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <UserCircle2 className="w-4 h-4" />
          {t("discover.filteredByUser", "Filtered by user")}: <span className="text-foreground">{usernameFilter}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {visibleMods.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
          >
            <ModCard
              id={mod.id}
              title={mod.name}
              author={mod.submitter?.name ?? t("discover.communityUploader", "Community uploader")}
              thumbnail={mod.imageUrl ?? mod.thumbnailUrl ?? "/mod-placeholder.svg"}
              likes={mod.likeCount}
              downloads={mod.downloadCount}
              onView={() => setSelectedModId(mod.id)}
              onAuthorClick={() => {
                if (mod.submitter?.id) {
                  setSelectedSubmitter({
                    id: mod.submitter.id,
                    name: mod.submitter.name,
                    avatarUrl: mod.submitter.avatarUrl,
                  });
                }
              }}
              categoryLabel={mod.rootCategory?.name}
              statusLabel={(() => {
                const installed = installedMods.find((entry) => entry.modId === mod.id);
                if (!installed) {
                  return undefined;
                }
                return modUpdates.some((update) => update.installedId === installed.id)
                  ? t("discover.update", "Update")
                  : t("discover.installed", "Installed");
              })()}
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setDiscoverPage(Math.max(1, discoverPage - 1))}
          disabled={discoverPage <= 1}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("discover.previous", "Previous")}
        </button>
        <span className="text-sm text-muted-foreground">{t("discover.page", "Page")} {discoverPage}</span>
        <button
          onClick={() => setDiscoverPage(discoverPage + 1)}
          disabled={!hasMoreDiscover}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          {t("discover.next", "Next")}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ModVisualizerModal
        modId={selectedModId}
        open={Boolean(selectedModId)}
        onClose={() => setSelectedModId(undefined)}
        onOpenSubmitter={(submitter) => setSelectedSubmitter(submitter)}
      />

      <UserProfileModal
        open={Boolean(selectedSubmitter)}
        submitter={selectedSubmitter}
        onClose={() => setSelectedSubmitter(undefined)}
        onOpenMod={(modId) => {
          setSelectedSubmitter(undefined);
          setSelectedModId(modId);
        }}
      />

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("discover.welcome", "Welcome to FunkHub")}</DialogTitle>
            <DialogDescription>
              {t("discover.welcomeDesc", "Finish these setup steps so installs and launches work correctly.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step0", "0) Choose your language")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step0Desc", "Pick your preferred UI language before continuing setup.")}</p>
              <select
                value={locale}
                onChange={(event) => {
                  void setLocale(event.target.value as SupportedLocale);
                }}
                className="mt-2 w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground"
              >
                {locales.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step1", "1) Choose your game folder")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step1Desc", "Pick your Friday Night Funkin' directory so FunkHub can open and reference local files.")}</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: t("discover.chooseGameFolder", "Choose your FNF game folder"),
                    defaultPath: settings.gameDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ gameDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                {t("discover.chooseGameFolderBtn", "Choose Game Folder")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">{t("discover.current", "Current")}: {settings.gameDirectory || t("discover.notSet", "Not set")}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step2", "2) Choose data root (engine installs)")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step2Desc", "This is where FunkHub stores engine installs and imported content.")}</p>
              <button
                onClick={async () => {
                  const selected = await browseFolder({
                    title: t("discover.chooseEngineRoot", "Choose engine install root"),
                    defaultPath: settings.dataRootDirectory || undefined,
                  });
                  if (selected) {
                    await updateSettings({ dataRootDirectory: selected });
                  }
                }}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
              >
                {t("discover.chooseDataRoot", "Choose Data Root")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground break-all">{t("discover.current", "Current")}: {settings.dataRootDirectory || t("discover.notSetDefault", "Not set (app default)")}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{t("discover.step3", "3) Install an engine and test one-click")}</p>
              <p className="mt-1 text-muted-foreground">{t("discover.step3Desc", "After installing an engine, test with a URL like:")}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{t("discover.exampleDeepLink", "funkhub://mod/install/<ModId>/<FileId>")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/engines")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  {t("discover.openEngines", "Open Engines")}
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-secondary"
                >
                  {t("discover.openSettings", "Open Settings")}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={completeOnboarding}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("discover.markSetupComplete", "Mark Setup Complete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
