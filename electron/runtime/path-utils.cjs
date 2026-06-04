const path = require("node:path");

const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z"];

function stripKnownArchiveExtension(fileName) {
  const parsed = path.parse(String(fileName || ""));
  return ARCHIVE_EXTENSIONS.includes(parsed.ext.toLowerCase())
    ? parsed.name
    : String(fileName || "");
}

function sanitizeInstallFolderName(value, fallback = "mod") {
  const normalized = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+$/, "")
    .trim();
  return normalized || fallback;
}

function sanitizeArchiveFileName(value, fallback = "package.bin") {
  return path.basename(String(value || fallback))
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .trim() || fallback;
}

function sanitizePathSegment(value, fallback = "imported") {
  return String(value || fallback)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function safeJoin(base, requestedPath) {
  const normalized = path
    .normalize(requestedPath || "")
    .replace(/^([A-Za-z]:)?[\\/]+/, "")
    .replace(/\.\.(?:[\\/]|$)/g, "");
  return path.join(base, normalized);
}

function isPathInside(basePath, targetPath) {
  const baseResolved = path.resolve(basePath);
  const targetResolved = path.resolve(targetPath);
  const relative = path.relative(baseResolved, targetResolved);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveRuntimePath(rootPath, targetPath, options = {}) {
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : safeJoin(rootPath, targetPath);

  if (!options.allowExternal && !isPathInside(rootPath, absolutePath)) {
    throw new Error(options.errorMessage || "targetPath must be inside FunkHub data root");
  }

  return absolutePath;
}

module.exports = {
  ARCHIVE_EXTENSIONS,
  stripKnownArchiveExtension,
  sanitizeInstallFolderName,
  sanitizeArchiveFileName,
  sanitizePathSegment,
  safeJoin,
  isPathInside,
  resolveRuntimePath,
};
