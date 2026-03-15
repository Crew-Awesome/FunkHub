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
const EXECUTABLE_CATEGORY_IDS = new Set([3827]);
const HYBRID_EXECUTABLE_CATEGORY_IDS = new Set([3046, 3828]);
const EXECUTABLE_HINTS = ["standalone", "portable", "launcher", "runtime", "binary", "exec"];

function sanitizeFileStem(fileName: string): string {
  const stem = fileName.replace(/\.[^/.]+$/, "").trim();
  return stem.replace(/[^A-Za-z0-9._ -]/g, "_") || "mod";
}

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

export class ModInstallerService {
  private extractDevelopers(mod: Pick<GameBananaModProfile, "credits" | "submitter">): string[] {
    const fromCredits = (mod.credits ?? []).flatMap((group) => group.authors.map((author) => author.name));
    const fromSubmitter = mod.submitter?.name ? [mod.submitter.name] : [];
    return Array.from(new Set([...fromSubmitter, ...fromCredits].map((name) => name.trim()).filter(Boolean))).slice(0, 12);
  }

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

    const categoryId = mod.rootCategory?.id;
    if (categoryId && EXECUTABLE_CATEGORY_IDS.has(categoryId)) {
      return true;
    }

    if (categoryId && HYBRID_EXECUTABLE_CATEGORY_IDS.has(categoryId)) {
      return EXECUTABLE_HINTS.some((hint) => lowerFileName.includes(hint));
    }

    if (categoryId && categoryId !== 43771) {
      return true;
    }

    return mod.rootCategory?.name.toLowerCase().includes("executables") === true;
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
        targetPath: "executables",
        reason: "Category or extension indicates standalone executable package.",
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
      mode: "mod",
      installPath: input.plan.targetPath,
      installSubdir: sanitizeFileStem(input.modName),
      downloadUrl: input.file.downloadUrl,
    };
  }

  async installViaDesktopBridge(input: {
    request: DesktopInstallRequest;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies" | "description" | "text" | "rootCategory" | "screenshotUrls" | "credits">;
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
      description: input.mod.description ?? input.mod.text,
      developers: this.extractDevelopers(input.mod),
      categoryName: input.mod.rootCategory?.name,
      screenshotUrls: input.mod.screenshotUrls,
      standalone: input.request.installPath.startsWith("executables/"),
    };
  }

  createFallbackInstalledRecord(input: {
    plan: InstallPlan;
    fileName: string;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies" | "description" | "text" | "rootCategory" | "screenshotUrls" | "credits">;
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
      description: input.mod.description ?? input.mod.text,
      developers: this.extractDevelopers(input.mod),
      categoryName: input.mod.rootCategory?.name,
      screenshotUrls: input.mod.screenshotUrls,
      standalone: input.plan.type === "executable",
    };
  }
}

export const modInstallerService = new ModInstallerService();
