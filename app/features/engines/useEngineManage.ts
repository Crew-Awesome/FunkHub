import { useState } from "react";

export function useEngineManage() {
  const [manageEngineId, setManageEngineId] = useState<string | null>(null);
  const [manageLauncher, setManageLauncher] = useState<"native" | "wine" | "wine64" | "proton">("native");
  const [manageLauncherPath, setManageLauncherPath] = useState("");
  const [manageExecutablePath, setManageExecutablePath] = useState("");
  const [manageCustomName, setManageCustomName] = useState("");
  const [manageCustomIconUrl, setManageCustomIconUrl] = useState("");
  const [detectedRuntimes, setDetectedRuntimes] = useState<Array<{
    type: "wine" | "wine64" | "proton";
    path: string;
    label: string;
  }> | null>(null);

  const openManage = (params: {
    engineId: string;
    launcher: "native" | "wine" | "wine64" | "proton";
    launcherPath?: string;
    executablePath?: string;
    customName?: string;
    customIconUrl?: string;
  }) => {
    setManageEngineId(params.engineId);
    setManageLauncher(params.launcher);
    setManageLauncherPath(params.launcherPath ?? "");
    setManageExecutablePath(params.executablePath ?? "");
    setManageCustomName(params.customName ?? "");
    setManageCustomIconUrl(params.customIconUrl ?? "");
    setDetectedRuntimes(null);
  };

  const closeManage = () => {
    setManageEngineId(null);
    setDetectedRuntimes(null);
  };

  return {
    manageEngineId, setManageEngineId,
    manageLauncher, setManageLauncher,
    manageLauncherPath, setManageLauncherPath,
    manageExecutablePath, setManageExecutablePath,
    manageCustomName, setManageCustomName,
    manageCustomIconUrl, setManageCustomIconUrl,
    detectedRuntimes, setDetectedRuntimes,
    openManage,
    closeManage,
  };
}
