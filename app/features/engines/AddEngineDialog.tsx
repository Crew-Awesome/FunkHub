import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Cpu, Download, FolderSearch, Loader2, Plus, Search } from "lucide-react";
import { useFunkHub, useI18n } from "../../providers";
import { detectClientPlatform, type EngineSlug } from "../../services/funkhub";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shared/ui/dialog";
import { getEngineIcon } from "./engineIcons";
import { useEngineWizard } from "./useEngineWizard";
import { buildEngineInstallPackages, buildPackageOptions, buildReleaseOptions, buildSourceOptions } from "./engineInstallerFlow";

interface AddEngineDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

function formatVersionLabel(version: string): string {
  const trimmed = version.trim();
  if (!trimmed || trimmed === "latest") {
    return "Latest";
  }
  return /^[0-9]/.test(trimmed) ? `v${trimmed}` : trimmed;
}

export function AddEngineDialog({ open, onOpenChange }: AddEngineDialogProps) {
  const { t } = useI18n();
  const {
    enginesCatalog,
    installedEngines,
    downloads,
    installEngine,
    importEngineFromFolder,
    refreshEngineHealth,
    browseFolder,
    scanCommonEnginePaths,
  } = useFunkHub();
  const {
    installingSlug,
    setInstallingSlug,
    installError,
    setInstallError,
    scannedPaths,
    setScannedPaths,
    scanningPaths,
    setScanningPaths,
    platformWarning,
    setPlatformWarning,
    resetWizard,
  } = useEngineWizard();

  const [query, setQuery] = useState("");
  const [selectedEngineSlug, setSelectedEngineSlug] = useState<EngineSlug | null>(null);
  const [selectedReleaseKey, setSelectedReleaseKey] = useState<string | null>(null);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const [selectedPackageKey, setSelectedPackageKey] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"engine" | "release" | "source" | "package">("engine");
  const deferredQuery = useDeferredValue(query);
  const currentPlatform = detectClientPlatform();

  useEffect(() => {
    if (open) {
      resetWizard();
      setCurrentStep("engine");
      return;
    }

    setQuery("");
    setSelectedEngineSlug(null);
    setSelectedReleaseKey(null);
    setSelectedSourceKey(null);
    setSelectedPackageKey(null);
    setCurrentStep("engine");
    resetWizard();
  }, [open]);

  const installedCountBySlug = useMemo(() => {
    const counts = new Map<EngineSlug, number>();
    for (const engine of installedEngines) {
      counts.set(engine.slug, (counts.get(engine.slug) ?? 0) + 1);
    }
    return counts;
  }, [installedEngines]);

  const engineDownloads = downloads
    .filter((task) => task.modId === -1)
    .filter((task) => ["queued", "downloading", "installing", "failed"].includes(task.status));

  const filteredEngines = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return enginesCatalog;
    }

    return enginesCatalog.filter((engine) => {
      const haystack = `${engine.name} ${engine.slug} ${engine.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [deferredQuery, enginesCatalog]);

  const selectedEngine = selectedEngineSlug
    ? enginesCatalog.find((engine) => engine.slug === selectedEngineSlug) ?? null
    : null;

  const installPackages = useMemo(
    () => buildEngineInstallPackages(selectedEngine, currentPlatform),
    [selectedEngine, currentPlatform],
  );
  const releaseOptions = useMemo(() => buildReleaseOptions(installPackages), [installPackages]);
  const hasReleaseStep = releaseOptions.length > 1;

  useEffect(() => {
    setSelectedReleaseKey(null);
    setSelectedSourceKey(null);
    setSelectedPackageKey(null);
    setCurrentStep("engine");
  }, [selectedEngineSlug]);

  useEffect(() => {
    if (releaseOptions.length === 1) {
      setSelectedReleaseKey(releaseOptions[0].key);
      return;
    }
    if (selectedReleaseKey && !releaseOptions.some((option) => option.key === selectedReleaseKey)) {
      setSelectedReleaseKey(null);
    }
  }, [releaseOptions, selectedReleaseKey]);

  const effectiveReleaseKey = hasReleaseStep ? selectedReleaseKey : releaseOptions[0]?.key ?? null;
  const sourceOptions = useMemo(
    () => buildSourceOptions(installPackages, effectiveReleaseKey),
    [installPackages, effectiveReleaseKey],
  );
  const hasSourceStep = sourceOptions.length > 1;

  useEffect(() => {
    if (sourceOptions.length === 1) {
      setSelectedSourceKey(sourceOptions[0].key);
      return;
    }
    if (selectedSourceKey && !sourceOptions.some((option) => option.key === selectedSourceKey)) {
      setSelectedSourceKey(null);
    }
  }, [sourceOptions, selectedSourceKey]);

  const effectiveSourceKey = hasSourceStep ? selectedSourceKey : sourceOptions[0]?.key ?? null;
  const packageOptions = useMemo(
    () => buildPackageOptions(installPackages, effectiveReleaseKey, effectiveSourceKey),
    [installPackages, effectiveReleaseKey, effectiveSourceKey],
  );
  const hasPackageStep = packageOptions.length > 1;

  useEffect(() => {
    if (packageOptions.length === 1) {
      setSelectedPackageKey(packageOptions[0].packageKey);
      return;
    }
    if (selectedPackageKey && !packageOptions.some((option) => option.packageKey === selectedPackageKey)) {
      setSelectedPackageKey(null);
    }
  }, [packageOptions, selectedPackageKey]);

  const selectedRelease = releaseOptions.find((option) => option.key === effectiveReleaseKey) ?? null;
  const selectedSource = sourceOptions.find((option) => option.key === effectiveSourceKey) ?? null;
  const selectedPackage = (hasPackageStep
    ? packageOptions.find((option) => option.packageKey === selectedPackageKey)
    : packageOptions[0]) ?? null;

  const installSelectedEngine = async (
    engineSlug: EngineSlug,
    releaseUrl: string,
    releaseVersion: string,
    options?: { allowMissingExecutable?: boolean },
  ) => {
    setInstallError(null);
    setPlatformWarning(null);
    setInstallingSlug(engineSlug);
    try {
      await installEngine(engineSlug, releaseUrl, releaseVersion, options);
      await refreshEngineHealth();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("engines.installFailed", "Engine install failed");
      if (/launchable executable for this platform/i.test(message) && !options?.allowMissingExecutable) {
        setPlatformWarning({ slug: engineSlug, releaseUrl, releaseVersion, message });
      } else {
        setInstallError(message);
      }
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleBack = () => {
    setInstallError(null);
    setPlatformWarning(null);

    if (currentStep === "package" && hasPackageStep) {
      setSelectedPackageKey(null);
      setCurrentStep(hasSourceStep ? "source" : "release");
      return;
    }
    if (currentStep === "source" && hasSourceStep) {
      setSelectedSourceKey(null);
      setSelectedPackageKey(null);
      setCurrentStep("release");
      return;
    }
    if (currentStep === "release" && hasReleaseStep) {
      setSelectedReleaseKey(null);
      setSelectedSourceKey(null);
      setSelectedPackageKey(null);
      setCurrentStep("engine");
      return;
    }
    setSelectedEngineSlug(null);
    setCurrentStep("engine");
  };

  const importCustomEngine = async () => {
    const sourcePath = await browseFolder({ title: t("engines.selectEngineFolder", "Select engine folder to import") });
    if (!sourcePath) {
      return;
    }

    const suggested = sourcePath.split(/[\\/]/).filter(Boolean).pop() || "Custom Engine";
    const customName = window.prompt(t("engines.customEngineNamePrompt", "Custom engine name"), suggested)?.trim();
    if (!customName) {
      return;
    }

    setInstallError(null);
    setInstallingSlug("custom");
    try {
      await importEngineFromFolder("custom", "imported", sourcePath, customName);
      await refreshEngineHealth();
      onOpenChange(false);
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : t("engines.importFailed", "Engine import failed"));
    } finally {
      setInstallingSlug(null);
    }
  };

  const scanExistingEngines = async () => {
    setScanningPaths(true);
    try {
      const paths = await scanCommonEnginePaths();
      setScannedPaths(paths);
    } finally {
      setScanningPaths(false);
    }
  };

  const stepItems = [
    { key: "browse", label: t("engines.installerStepBrowse", "Browse"), active: !selectedEngine, complete: Boolean(selectedEngine) },
    ...(hasReleaseStep ? [{ key: "release", label: t("engines.installerStepRelease", "Release"), active: Boolean(selectedEngine) && !selectedRelease, complete: Boolean(selectedRelease) }] : []),
    ...(hasSourceStep ? [{ key: "source", label: t("engines.installerStepSource", "Source"), active: Boolean(selectedRelease) && !selectedSource, complete: Boolean(selectedSource) }] : []),
    ...(hasPackageStep ? [{ key: "package", label: t("engines.installerStepPackage", "Package"), active: Boolean((!hasReleaseStep || selectedRelease) && (!hasSourceStep || selectedSource)) && !selectedPackage, complete: Boolean(selectedPackage) }] : []),
    ...(selectedEngine ? [{ key: "install", label: t("engines.installerStepInstall", "Install"), active: Boolean(selectedPackage), complete: false }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[95vh] w-[min(97vw,900px)] max-w-none overflow-hidden p-0">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border bg-card/95 px-6 py-5 backdrop-blur">
            <DialogHeader>
              <DialogTitle>{t("engines.addEngine", "Add Engine")}</DialogTitle>
              <DialogDescription>
                {t("engines.addEngineDesc", "Browse engines, pick a release path, and install the package that fits your platform.")}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[320px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("engines.searchPlaceholder", "Search engines by name or description")}
                  className="w-full rounded-lg border border-border bg-input-background py-2.5 pl-10 pr-3 text-sm text-foreground"
                />
              </div>
              <button
                onClick={scanExistingEngines}
                disabled={scanningPaths}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {scanningPaths ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderSearch className="h-3.5 w-3.5" />}
                {scanningPaths ? t("engines.scanning", "Scanning…") : t("engines.scanNow", "Scan Now")}
              </button>
              <button
                onClick={importCustomEngine}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs text-foreground hover:bg-secondary"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("engines.importCustom", "Import Custom")}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {stepItems.map((step) => (
                <span
                  key={step.key}
                  className={`rounded-full border px-3 py-1 ${step.complete ? "border-primary/25 bg-primary/10 text-primary" : step.active ? "border-border bg-secondary text-foreground" : "border-border bg-background"}`}
                >
                  {step.complete ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : null}
                  {step.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.6fr)_360px]">
            <div className="min-h-0 overflow-y-auto px-6 py-5">
              {!selectedEngine ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("engines.availableCount", "{{count}} engines available", { count: filteredEngines.length })}</span>
                    
                  </div>
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredEngines.map((engine) => {
                      const installedCount = installedCountBySlug.get(engine.slug) ?? 0;
                      const iconSrc = getEngineIcon(engine.slug);
                      const releasePreview = buildReleaseOptions(buildEngineInstallPackages(engine, currentPlatform)).slice(0, 2);
                      return (
                        <button
                          key={engine.slug}
                          type="button"
                          onClick={() => {
                          setSelectedEngineSlug(engine.slug);
                          const pkgs = buildEngineInstallPackages(engine, currentPlatform);
                          const relOpts = buildReleaseOptions(pkgs);
                          const srcOpts = buildSourceOptions(pkgs, relOpts[0]?.key);
                          const pkgOpts = buildPackageOptions(pkgs, relOpts[0]?.key, srcOpts[0]?.key);
                          setCurrentStep(relOpts.length > 1 ? "release" : (srcOpts.length > 1 ? "source" : "package"));
                        }}
                          className="rounded-xl border border-border bg-secondary/20 p-4 text-left transition-colors hover:bg-secondary/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
                              {iconSrc ? <img src={iconSrc} alt="" className="h-7 w-7 object-contain" loading="lazy" /> : <Cpu className="h-5 w-5 text-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-foreground">{engine.name}</p>
                                {installedCount > 0 ? <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success">{t("engines.installed", "Installed")}</span> : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{engine.description}</p>
                              {releasePreview.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {releasePreview.map((option) => (
                                    <span key={option.key} className="rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
                                      {option.badge} · {option.title}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {filteredEngines.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                      {t("engines.searchNoResults", "No engines match your search.")}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/20 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{selectedEngine.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{selectedEngine.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-secondary"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t("engines.previous", "Back")}
                    </button>
                  </div>

{hasReleaseStep && currentStep === "release" ? (
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("engines.installerStepRelease", "Release")}</p>
                      </div>
                      <div className="grid gap-3">
                        {releaseOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setSelectedReleaseKey(option.key);
                              setSelectedSourceKey(null);
                              setSelectedPackageKey(null);
                              if (hasSourceStep) {
                                setCurrentStep("source");
                              } else {
                                setCurrentStep("package");
                              }
                            }}
                            className={`rounded-xl border p-4 text-left transition-colors ${effectiveReleaseKey === option.key ? "border-primary/30 bg-primary/10" : "border-border bg-secondary/20 hover:bg-secondary/30"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{option.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                              </div>
                              <span className="rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground">{option.badge}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : !hasReleaseStep && selectedRelease ? (
                    <div className="rounded-xl border border-border bg-secondary/15 px-4 py-3 text-sm text-foreground">
                      <span className="text-muted-foreground">{t("engines.installerStepRelease", "Release")}:</span> {selectedRelease.badge} · {selectedRelease.title}
                    </div>
                  ) : null}

                  {(!hasReleaseStep || selectedRelease) && hasSourceStep && currentStep === "source" ? (
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("engines.installerStepSource", "Source")}</p>
                      </div>
                      <div className="grid gap-3">
                        {sourceOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setSelectedSourceKey(option.key);
                              setSelectedPackageKey(null);
                              setCurrentStep("package");
                            }}
                            className={`rounded-xl border p-4 text-left transition-colors ${effectiveSourceKey === option.key ? "border-primary/30 bg-primary/10" : "border-border bg-secondary/20 hover:bg-secondary/30"}`}
                          >
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{option.hint || option.description}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : !hasSourceStep && selectedSource ? (
                    <div className="rounded-xl border border-border bg-secondary/15 px-4 py-3 text-sm text-foreground">
                      <span className="text-muted-foreground">{t("engines.installerStepSource", "Source")}:</span> {selectedSource.label}
                    </div>
                  ) : null}

                  {(!hasReleaseStep || selectedRelease) && (!hasSourceStep || selectedSource) && currentStep === "package" ? (
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("engines.installerStepPackage", "Package")}</p>
                      </div>
                      <div className="grid gap-3">
                        {packageOptions.map((pkg) => (
                          <button
                            key={pkg.packageKey}
                            type="button"
                            onClick={() => setSelectedPackageKey(pkg.packageKey)}
                            className={`rounded-xl border p-4 text-left transition-colors ${selectedPackage?.packageKey === pkg.packageKey ? "border-primary/30 bg-primary/10" : "border-border bg-secondary/20 hover:bg-secondary/30"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{pkg.packageLabel}</p>
                              {pkg.platform === currentPlatform ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{t("engines.recommended", "Recommended")}</span> : null}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{pkg.packageHint || formatVersionLabel(pkg.version)}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  </div>
              )}

              {installError ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {installError}
                </div>
              ) : null}

              {platformWarning ? (
                <div className="mt-4 space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  <p className="font-medium">{t("engines.crossPlatformWarning", "Cross-platform executable warning")}</p>
                  <p className="text-xs opacity-90">{t("engines.crossPlatformWarningDesc", "This engine may still work with a custom launcher (Wine/Proton) after install. Continue anyway?")}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const pending = platformWarning;
                        setPlatformWarning(null);
                        installSelectedEngine(pending.slug, pending.releaseUrl, pending.releaseVersion, { allowMissingExecutable: true }).catch(() => undefined);
                      }}
                      className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                    >
                      {t("engines.keepDownloading", "Keep Downloading")}
                    </button>
                    <button
                      onClick={() => setPlatformWarning(null)}
                      className="rounded bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80"
                    >
                      {t("engines.cancel", "Cancel")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="min-h-0 overflow-y-auto border-l border-border bg-secondary/10 px-5 py-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-medium text-foreground">{t("engines.installerSummary", "Install summary")}</p>
                  {!selectedEngine ? (
                    <p className="mt-2 text-xs text-muted-foreground">{t("engines.installerSummaryIdle", "Select an engine to build the shortest valid install path.")}</p>
                  ) : (
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("engines.installerStepBrowse", "Browse")}</p>
                        <p className="font-medium text-foreground">{selectedEngine.name}</p>
                      </div>
                      {selectedRelease ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("engines.installerStepRelease", "Release")}</p>
                          <p className="font-medium text-foreground">{selectedRelease.title}</p>
                          <p className="text-xs text-muted-foreground">{selectedRelease.badge}</p>
                        </div>
                      ) : null}
                      {selectedSource ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("engines.installerStepSource", "Source")}</p>
                          <p className="font-medium text-foreground">{selectedSource.label}</p>
                          {selectedSource.hint ? <p className="text-xs text-muted-foreground">{selectedSource.hint}</p> : null}
                        </div>
                      ) : null}
                      {selectedPackage ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("engines.installerStepPackage", "Package")}</p>
                          <p className="font-medium text-foreground">{selectedPackage.packageLabel}</p>
                          <p className="text-xs text-muted-foreground">{selectedPackage.packageHint || formatVersionLabel(selectedPackage.version)}</p>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => selectedPackage && installSelectedEngine(selectedEngine.slug, selectedPackage.downloadUrl, selectedPackage.version)}
                        disabled={!selectedPackage || installingSlug === selectedEngine.slug}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {installingSlug === selectedEngine.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {t("engines.install", "Install")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{t("engines.scanTitle", "Scan for existing engines")}</p>
                    <button
                      onClick={scanExistingEngines}
                      disabled={scanningPaths}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      {scanningPaths ? t("engines.scanning", "Scanning…") : t("engines.scanNow", "Scan Now")}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t("engines.scanHint", "Use Scan Now to auto-detect old installs.")}</p>
                  {scannedPaths !== null && scannedPaths.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">{t("engines.scanNoneFound", "No engine folders found in common locations.")}</p>
                  ) : null}
                  {scannedPaths !== null && scannedPaths.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {scannedPaths.map((foundPath) => (
                        <div key={foundPath} className="rounded-lg border border-border bg-secondary/20 p-3">
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{foundPath}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {enginesCatalog.map((engine) => (
                              <button
                                key={`${foundPath}-${engine.slug}`}
                                onClick={async () => {
                                  setInstallingSlug(engine.slug);
                                  try {
                                    await importEngineFromFolder(engine.slug, "imported", foundPath);
                                    await refreshEngineHealth();
                                    setScannedPaths((previous) => previous ? previous.filter((entry) => entry !== foundPath) : previous);
                                    onOpenChange(false);
                                  } catch (error) {
                                    setInstallError(error instanceof Error ? error.message : t("engines.importFailed", "Engine import failed"));
                                  } finally {
                                    setInstallingSlug(null);
                                  }
                                }}
                                disabled={installingSlug === engine.slug}
                                className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                              >
                                {engine.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {engineDownloads.length > 0 ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-medium text-foreground">{t("engines.activeDownloads", "Active engine downloads")}</p>
                    <div className="mt-3 space-y-2">
                      {engineDownloads.map((task) => (
                        <div key={task.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{task.fileName}</span>
                            <span className="text-muted-foreground">{Math.round(task.progress * 100)}%</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full origin-left bg-primary transition-transform" style={{ transform: `scaleX(${Math.max(0, Math.min(1, task.progress))})` }} />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{task.message ?? task.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
