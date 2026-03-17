import { useState } from "react";
import type { EngineSlug } from "../../services/funkhub";

export function useEngineWizard() {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardEngineSlug, setWizardEngineSlug] = useState<EngineSlug | null>(null);
  const [wizardVersion, setWizardVersion] = useState<string | null>(null);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [scannedPaths, setScannedPaths] = useState<string[] | null>(null);
  const [scanningPaths, setScanningPaths] = useState(false);
  const [platformWarning, setPlatformWarning] = useState<{
    slug: EngineSlug;
    releaseUrl: string;
    releaseVersion: string;
    message: string;
  } | null>(null);

  const resetWizard = () => {
    setWizardStep(1);
    setWizardEngineSlug(null);
    setWizardVersion(null);
    setInstallError(null);
    setPlatformWarning(null);
    setScannedPaths(null);
  };

  return {
    wizardStep, setWizardStep,
    wizardEngineSlug, setWizardEngineSlug,
    wizardVersion, setWizardVersion,
    installingSlug, setInstallingSlug,
    installError, setInstallError,
    scannedPaths, setScannedPaths,
    scanningPaths, setScanningPaths,
    platformWarning, setPlatformWarning,
    resetWizard,
  };
}
