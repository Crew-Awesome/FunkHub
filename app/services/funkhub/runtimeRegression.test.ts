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
});
