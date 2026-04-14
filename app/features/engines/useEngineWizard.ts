import { useState } from "react";
import type { EngineSlug } from "../../services/funkhub";

export function useEngineWizard() {
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
    setInstallError(null);
    setPlatformWarning(null);
    setScannedPaths(null);
  };

  return {
    installingSlug, setInstallingSlug,
    installError, setInstallError,
    scannedPaths, setScannedPaths,
    scanningPaths, setScanningPaths,
    platformWarning, setPlatformWarning,
    resetWizard,
  };
}
