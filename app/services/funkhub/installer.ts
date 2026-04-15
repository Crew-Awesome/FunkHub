import {
  DesktopInstallRequest,
  EngineSlug,
  GameBananaFile,
  GameBananaModProfile,
  InstallPlan,
  InstalledEngine,
  InstalledMod,
} from "./types";
import { detectExecutableFromCategories, detectRequiredEngineFromCategories } from "./engineDetection";

const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z"];

type ModCategoryLike = {
  id?: number;
  name?: string;
  profileUrl?: string;
};

type ModCategorySource = {
  rootCategory?: ModCategoryLike;
  category?: ModCategoryLike;
  superCategory?: ModCategoryLike;
};

function sanitizeFileStem(fileName: string): string {
  const stem = fileName.replace(/\.[^/.]+$/, "").trim();
  return stem.replace(/[^A-Za-z0-9._ -]/g, "_") || "mod";
}

export class ModInstallerService {
  isExecutableCategoryMod(mod: ModCategorySource): boolean {
    return detectExecutableFromCategories(mod);
  }

  private extractDevelopers(mod: Pick<GameBananaModProfile, "credits" | "submitter">): string[] {
    const fromCredits = (mod.credits ?? []).flatMap((group) => group.authors.map((author) => author.name));
    const fromSubmitter = mod.submitter?.name ? [mod.submitter.name] : [];
    return Array.from(new Set([...fromSubmitter, ...fromCredits].map((name) => name.trim()).filter(Boolean))).slice(0, 12);
  }

  detectRequiredEngine(mod: Pick<GameBananaModProfile, "requiredEngine" | "rootCategory" | "category" | "superCategory">): EngineSlug | undefined {
    if (mod.requiredEngine) {
      return mod.requiredEngine;
    }

    return detectRequiredEngineFromCategories(mod);
  }

  isArchive(file: Pick<GameBananaFile, "fileName">): boolean {
    const lower = file.fileName.toLowerCase();
    return ARCHIVE_EXTENSIONS.some((extension) => lower.endsWith(extension));
  }

  isExecutableMod(mod: Pick<GameBananaModProfile, "rootCategory" | "category" | "superCategory">, file: Pick<GameBananaFile, "fileName">): boolean {
    void file;
    return detectExecutableFromCategories(mod);
  }

  createInstallPlan(input: {
    mod: Pick<GameBananaModProfile, "requiredEngine" | "rootCategory" | "category" | "superCategory">;
    file: Pick<GameBananaFile, "fileName">;
    selectedEngine?: InstalledEngine;
    forceInstallType?: "executable" | "standard_mod";
  }): InstallPlan {
    const requiredEngine = this.detectRequiredEngine(input.mod);
    const executable = input.forceInstallType
      ? input.forceInstallType === "executable"
      : this.isExecutableMod(input.mod, input.file);

    if (executable) {
      return {
        type: "executable",
        requiredEngine,
        targetPath: "executables",
        reason: "Category indicates standalone executable package.",
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
    userSelectedEngine?: boolean;
  }): { compatible: boolean; warning?: string } {
    if (input.plan.type === "executable") {
      return { compatible: true };
    }

    if (!input.requiredEngine || !input.selectedEngine) {
      return { compatible: true };
    }

    if (input.requiredEngine !== input.selectedEngine.slug) {
      if (input.userSelectedEngine) {
        return {
          compatible: true,
          warning: `Continuing with selected engine ${input.selectedEngine.slug} even though metadata suggests ${input.requiredEngine}.`,
        };
      }

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
    file: Pick<GameBananaFile, "id" | "fileName" | "downloadUrl">;
    modId: number;
    modName: string;
  }): DesktopInstallRequest {
    const installSubdir = sanitizeFileStem(`${input.modName}-${input.modId}-${input.file.id}`);
    const installPath = input.plan.type === "executable"
      ? `${input.plan.targetPath}/${installSubdir}`
      : input.plan.targetPath;

    return {
      jobId: input.jobId,
      fileName: input.file.fileName,
      mode: "mod",
      installPath,
      installSubdir: input.plan.type === "executable" ? undefined : installSubdir,
      downloadUrl: input.file.downloadUrl || `https://gamebanana.com/dl/${input.file.id}`,
    };
  }

  async installViaDesktopBridge(input: {
    request: DesktopInstallRequest;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies" | "description" | "text" | "rootCategory" | "screenshotUrls" | "credits">;
    sourceFileId: number;
    requiredEngine?: EngineSlug;
    installedEngine?: EngineSlug;
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
      engine: input.installedEngine ?? input.requiredEngine ?? "basegame",
      requiredEngine: input.requiredEngine,
      dependencies: input.mod.dependencies,
      sourceFileId: input.sourceFileId,
      description: input.mod.description ?? input.mod.text,
      developers: this.extractDevelopers(input.mod),
      categoryName: input.mod.rootCategory?.name,
      screenshotUrls: input.mod.screenshotUrls,
      standalone: input.request.installPath.startsWith("executables"),
    };
  }

  createFallbackInstalledRecord(input: {
    plan: InstallPlan;
    fileName: string;
    mod: Pick<GameBananaModProfile, "id" | "name" | "version" | "profileUrl" | "submitter" | "thumbnailUrl" | "imageUrl" | "dependencies" | "description" | "text" | "rootCategory" | "screenshotUrls" | "credits">;
    sourceFileId: number;
    installedEngine?: EngineSlug;
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
      engine: input.installedEngine ?? input.plan.requiredEngine ?? "basegame",
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
