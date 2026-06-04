const path = require("node:path");

const DEFAULT_DIRECTORY_LIMIT = 500;
const MAX_DIRECTORY_LIMIT = 2_000;

function normalizeDirectoryLimit(value) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) {
    return DEFAULT_DIRECTORY_LIMIT;
  }
  return Math.max(1, Math.min(MAX_DIRECTORY_LIMIT, Math.floor(requested)));
}

async function listDirectoryEntries(fs, absolutePath, options = {}) {
  const directoriesOnly = options.directoriesOnly === true;
  const filesOnly = options.filesOnly === true;
  const limit = normalizeDirectoryLimit(options.limit);

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const normalized = entries
    .filter((entry) => {
      if (directoriesOnly) return entry.isDirectory();
      if (filesOnly) return entry.isFile();
      return entry.isFile() || entry.isDirectory();
    })
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
    });

  return {
    entries: normalized.slice(0, limit).map((entry) => ({
      name: entry.name,
      path: path.join(absolutePath, entry.name),
      isDirectory: entry.isDirectory(),
    })),
    truncated: normalized.length > limit,
    total: normalized.length,
    limit,
  };
}

module.exports = {
  DEFAULT_DIRECTORY_LIMIT,
  MAX_DIRECTORY_LIMIT,
  normalizeDirectoryLimit,
  listDirectoryEntries,
};
