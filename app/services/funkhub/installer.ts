import {
  DesktopInstallRequest,
  EngineSlug,
  GameBananaFile,
  GameBananaModProfile,
  InstallPlan,
  InstalledEngine,
  InstalledMod,
} from "./types";

const EXECUTABLE_EXTENSIONS = [".exe", ".msi", ".app", ".dmg", ".pkg", ".appimage", ".sh", ".bat"];
const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z"];

function sanitizeFileStem(fileName: string): string {
  const stem = fileName.replace(/\.[^/.]+$/, "").trim();
  return stem.replace(/[^A-Za-z0-9._ -]/g, "_") || "mod";
}

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

export class ModInstallerService {
  detectRequiredEngine(mod: Pick<GameBananaModProfile, "requiredEngine" | "name" | "text" | "rootCategory">): EngineSlug | undefined {
    if (mod.requiredEngine) {
      return mod.requiredEngine;
    }

    const haystack = `${mod.name} ${mod.text ?? ""} ${mod.rootCategory?.name ?? ""}`.toLowerCase();
    if (includesAny(haystack, ["psych", "psych engine", "psychengine"])) {
      return "psych";
    }
    if (includesAny(haystack, ["codename", "codename engine"])) {
      return "codename";
    }
    if (includesAny(haystack, ["fps+", "fps plus"])) {
      return "fps-plus";
    }
    if (includesAny(haystack, ["js engine", "fnf js"])) {
      return "js-engine";
    }
    if (includesAny(haystack, ["p-slice", "pslice"])) {
      return "p-slice";
    }
    if (includesAny(haystack, ["ale psych", "ale engine"])) {
      return "ale-psych";
    }
    if (includesAny(haystack, ["base game", "basegame", "v-slice", "vanilla"])) {
      return "basegame";
    }

    return undefined;
  }

  isArchive(file: Pick<GameBananaFile, "fileName">): boolean {
    const lower = file.fileName.toLowerCase();
    return ARCHIVE_EXTENSIONS.some((extension) => lower.endsWith(extension));
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
        reason: "Category or extension indicates executable/engine package.",
      };
    }

    const fallbackEnginePath = input.selectedEngine?.modsPath ?? `engines/${requiredEngine ?? "basegame"}/mods`;
    return {
      type: "standard_mod",
      requiredEngine,
      targetPath: fallbackEnginePath,
      reason: "Standard mod package installed into selected engine mods folder.",
    };
  }

  validateEngineCompatibility(input: {
    requiredEngine?: EngineSlug;
    selectedEngine?: InstalledEngine;
    plan: InstallPlan;
  }): { compatible: boolean; warning?: string } {
    if (input.plan.type === "executable") {
      return { compatible: true };
    }

    if (!input.requiredEngine || !input.selectedEngine) {
      return { compatible: true };
    }

    if (input.requiredEngine !== input.selectedEngine.slug) {
      return {
        compatible: false,
        warning: `This mod targets ${input.requiredEngine} but selected engine is ${input.selectedEngine.slug}.`,
      };
    }

    return { compatible: true };
  }

  createDesktopInstallRequest(input: {
    jobId: string;
    plan: InstallPlan;
    file: Pick<GameBananaFile, "fileName" | "downloadUrl">;
    modName: string;
  }): DesktopInstallRequest {
    return {
      jobId: input.jobId,
      fileName: input.file.fileName,
      mode: input.plan.type === "executable" ? "engine" : "mod",
      installPath: input.plan.targetPath,
      installSubdir: sanitizeFileStem(input.modName),
      downloadUrl: input.file.downloadUrl,
    };
  }

  async installViaDesktopBridge(input: {
    request: DesktopInstallRequest;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies">;
    sourceFileId: number;
    requiredEngine?: EngineSlug;
  }): Promise<InstalledMod> {
    if (!window.funkhubDesktop) {
      throw new Error("Desktop bridge is unavailable");
    }

    const result = await window.funkhubDesktop.installArchive(input.request);

    return {
      id: crypto.randomUUID(),
      modId: input.mod.id,
      modName: input.mod.name,
      version: input.mod.version || result.versionDetected,
      author: input.mod.submitter?.name,
      thumbnailUrl: input.mod.imageUrl ?? input.mod.thumbnailUrl,
      gamebananaUrl: input.mod.profileUrl,
      installedAt: Date.now(),
      installPath: result.installPath,
      engine: input.requiredEngine ?? "basegame",
      requiredEngine: input.requiredEngine,
      dependencies: input.mod.dependencies,
      sourceFileId: input.sourceFileId,
    };
  }

  createFallbackInstalledRecord(input: {
    plan: InstallPlan;
    fileName: string;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies">;
    sourceFileId: number;
  }): InstalledMod {
    const fallbackPath = `${input.plan.targetPath}/${sanitizeFileStem(input.fileName)}`;
    return {
      id: crypto.randomUUID(),
      modId: input.mod.id,
      modName: input.mod.name,
      version: input.mod.version,
      author: input.mod.submitter?.name,
      thumbnailUrl: input.mod.imageUrl ?? input.mod.thumbnailUrl,
      gamebananaUrl: input.mod.profileUrl,
      installedAt: Date.now(),
      installPath: fallbackPath,
      engine: input.plan.requiredEngine ?? "basegame",
      requiredEngine: input.plan.requiredEngine,
      dependencies: input.mod.dependencies,
      sourceFileId: input.sourceFileId,
    };
  }
}

export const modInstallerService = new ModInstallerService();
