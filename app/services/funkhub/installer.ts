import { EngineSlug, GameBananaFile, GameBananaModProfile, InstallPlan, InstalledEngine, InstalledMod } from "./types";

const EXECUTABLE_EXTENSIONS = [".exe", ".msi", ".app", ".dmg", ".pkg", ".appimage", ".sh", ".bat"];

declare global {
  interface Window {
    funkhubDesktop?: {
      installArchive: (payload: {
        fileName: string;
        archiveBase64: string;
        installPath: string;
        mode: "engine" | "mod";
      }) => Promise<{ installPath: string }>;
    };
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export class ModInstallerService {
  detectRequiredEngine(mod: Pick<GameBananaModProfile, "requiredEngine" | "name" | "text">): EngineSlug | undefined {
    if (mod.requiredEngine) {
      return mod.requiredEngine;
    }

    const haystack = `${mod.name} ${mod.text ?? ""}`.toLowerCase();
    if (haystack.includes("psych")) {
      return "psych";
    }
    if (haystack.includes("codename")) {
      return "codename";
    }
    if (haystack.includes("fps+")) {
      return "fps-plus";
    }
    if (haystack.includes("js engine")) {
      return "js-engine";
    }
    if (haystack.includes("p-slice")) {
      return "p-slice";
    }
    if (haystack.includes("ale")) {
      return "ale-psych";
    }

    return "basegame";
  }

  isExecutableMod(mod: Pick<GameBananaModProfile, "rootCategory">, file: Pick<GameBananaFile, "fileName">): boolean {
    const lowerFileName = file.fileName.toLowerCase();
    const fromExtension = EXECUTABLE_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));

    if (fromExtension) {
      return true;
    }

    return mod.rootCategory?.id === 3827 || mod.rootCategory?.name.toLowerCase().includes("executables") === true;
  }

  createInstallPlan(input: {
    mod: Pick<GameBananaModProfile, "requiredEngine" | "rootCategory" | "name" | "text">;
    file: Pick<GameBananaFile, "fileName">;
    selectedEngine?: InstalledEngine;
  }): InstallPlan {
    const requiredEngine = this.detectRequiredEngine(input.mod);
    const executable = this.isExecutableMod(input.mod, input.file);

    if (executable) {
      return {
        type: "executable",
        requiredEngine,
        targetPath: input.selectedEngine?.installPath ?? `engines/${requiredEngine ?? "unknown"}`,
        reason: "Category/extension indicates this is an executable or engine package.",
      };
    }

    const fallbackEnginePath = input.selectedEngine?.modsPath ?? `engines/${requiredEngine ?? "basegame"}/mods`;
    return {
      type: "standard_mod",
      requiredEngine,
      targetPath: fallbackEnginePath,
      reason: "Standard mod folder package; install into selected engine mods path.",
    };
  }

  async installDownloadedArchive(input: {
    plan: InstallPlan;
    blob: Blob;
    fileName: string;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl">;
    sourceFileId: number;
  }): Promise<InstalledMod> {
    const bytes = new Uint8Array(await input.blob.arrayBuffer());

    if (window.funkhubDesktop?.installArchive) {
      const result = await window.funkhubDesktop.installArchive({
        fileName: input.fileName,
        archiveBase64: bytesToBase64(bytes),
        installPath: input.plan.targetPath,
        mode: input.plan.type === "executable" ? "engine" : "mod",
      });

      return {
        id: crypto.randomUUID(),
        modId: input.mod.id,
        modName: input.mod.name,
        version: input.mod.version,
        author: input.mod.submitter?.name,
        thumbnailUrl: input.mod.thumbnailUrl,
        gamebananaUrl: input.mod.profileUrl,
        installedAt: Date.now(),
        installPath: result.installPath,
        engine: input.plan.requiredEngine ?? "basegame",
        sourceFileId: input.sourceFileId,
      };
    }

    const fallbackPath = `${input.plan.targetPath}/${input.fileName.replace(/\.[^/.]+$/, "")}`;
    return {
      id: crypto.randomUUID(),
      modId: input.mod.id,
      modName: input.mod.name,
      version: input.mod.version,
      author: input.mod.submitter?.name,
      thumbnailUrl: input.mod.thumbnailUrl,
      gamebananaUrl: input.mod.profileUrl,
      installedAt: Date.now(),
      installPath: fallbackPath,
      engine: input.plan.requiredEngine ?? "basegame",
      sourceFileId: input.sourceFileId,
    };
  }
}

export const modInstallerService = new ModInstallerService();
