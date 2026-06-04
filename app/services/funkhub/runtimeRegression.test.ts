// @ts-expect-error The app tsconfig intentionally excludes Node globals; Vitest runs this in Node.
import { createRequire } from "node:module";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { FunkHubService, sanitizeModFolderName } from "./funkhubService";
import { modInstallerService } from "./installer";
import type { InstalledEngine, InstalledMod } from "./types";

const require = createRequire(import.meta.url);
const pathUtils = require("../../../electron/runtime/path-utils.cjs") as {
  stripKnownArchiveExtension: (fileName: string) => string;
};
const directory = require("../../../electron/runtime/directory.cjs") as {
  listDirectoryEntries: (
    fs: { readdir: (path: string, options: { withFileTypes: true }) => Promise<Array<{ name: string; isFile: () => boolean; isDirectory: () => boolean }>> },
    absolutePath: string,
    options?: { limit?: number; directoriesOnly?: boolean; filesOnly?: boolean },
  ) => Promise<{ entries: Array<{ name: string; path: string; isDirectory: boolean }>; truncated: boolean; total: number; limit: number }>;
};

function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

describe("runtime regressions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("crypto", {
      ...crypto,
      randomUUID: () => "test-uuid",
    });
  });

  it("preserves VS-prefixed names when sanitizing install folders", () => {
    expect(sanitizeModFolderName("VS. Sky Reborn")).toBe("VS. Sky Reborn");
    expect(pathUtils.stripKnownArchiveExtension("VS. Sky Reborn")).toBe("VS. Sky Reborn");
    expect(pathUtils.stripKnownArchiveExtension("VS. Sky Reborn.rar")).toBe("VS. Sky Reborn");
  });

  it("keeps rar recognized as an archive", () => {
    expect(modInstallerService.isArchive({ fileName: "mod.rar" })).toBe(true);
  });

  it("sorts and limits directory entries", async () => {
    const fakeFs = {
      readdir: vi.fn(async () => [
        { name: "z-file.txt", isFile: () => true, isDirectory: () => false },
        { name: "b-dir", isFile: () => false, isDirectory: () => true },
        { name: "a-dir", isFile: () => false, isDirectory: () => true },
      ]),
    };

    const result = await directory.listDirectoryEntries(fakeFs, "C:\\root", { limit: 2 });

    expect(result.entries.map((entry) => entry.name)).toEqual(["a-dir", "b-dir"]);
    expect(result.truncated).toBe(true);
    expect(result.total).toBe(3);
    expect(result.limit).toBe(2);
  });

  it("launches standalone mods without requiring an installed engine", async () => {
    const standalone: InstalledMod = {
      id: "mod-1",
      modId: -1,
      modName: "Standalone",
      gamebananaUrl: "",
      installedAt: Date.now(),
      installPath: "executables/standalone",
      engine: "basegame",
      sourceFileId: 0,
      standalone: true,
    };
    writeStorage("funkhub-installed-mods", [standalone]);
    writeStorage("funkhub-installed-engines", []);
    const launchEngine = vi.fn(async () => ({ ok: true }));
    window.funkhubDesktop = { launchEngine } as unknown as typeof window.funkhubDesktop;

    const service = new FunkHubService();
    await service.launchInstalledMod("mod-1");

    expect(launchEngine).toHaveBeenCalledWith(expect.objectContaining({
      installPath: "executables/standalone",
      launchId: "mod-1",
    }));
  });

  it("records linked manual mod imports without copying into the data root", async () => {
    const engine: InstalledEngine = {
      id: "engine-1",
      slug: "psych",
      name: "Psych Engine",
      version: "1.0.0",
      installPath: "engines/psych/1",
      modsPath: "engines/psych/1/mods",
      isDefault: true,
      installedAt: Date.now(),
    };
    writeStorage("funkhub-installed-engines", [engine]);
    const importModFolder = vi.fn(async () => ({
      ok: true,
      installPath: "C:\\External\\VS. Sky Reborn",
      linked: true,
    }));
    window.funkhubDesktop = {
      importModFolder,
      pickFolder: vi.fn(async () => ({ canceled: false, path: "C:\\External\\VS. Sky Reborn" })),
    } as unknown as typeof window.funkhubDesktop;

    const service = new FunkHubService();
    const installed = await service.addManualModFromFolder({ engineId: "engine-1", importMode: "link" });

    expect(importModFolder).toHaveBeenCalledWith(expect.objectContaining({ importMode: "link" }));
    expect(installed.linked).toBe(true);
    expect(installed.installPath).toBe("C:\\External\\VS. Sky Reborn");
  });
});
