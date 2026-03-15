export type ParsedDeepLink =
  | {
    kind: "install";
    modId: number;
    fileId?: number;
    archiveUrl?: string;
    engine?: string;
    source: "query" | "path" | "legacy";
  }
  | {
    kind: "pair";
    memberId: number;
    secretKey: string;
    source: "path";
  };

function decodePathToken(value?: string): string {
  if (!value) {
    return "";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parsePositiveNumber(raw: string, field: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${field} in deep link`);
  }
  return value;
}

type ParsedInstallDeepLink = Extract<ParsedDeepLink, { kind: "install" }>;

function parseInstallPathSegments(segments: string[]): ParsedInstallDeepLink | undefined {
  if (segments.length < 4) {
    return undefined;
  }

  const [root, action, modToken, fileToken] = segments;
  if (root !== "mod" || action !== "install") {
    return undefined;
  }

  return {
    kind: "install",
    modId: parsePositiveNumber(decodePathToken(modToken), "mod id"),
    fileId: parsePositiveNumber(decodePathToken(fileToken), "file id"),
    source: "path",
  };
}

export function parseFunkHubDeepLink(rawUrl: string): ParsedDeepLink {
  const normalized = rawUrl.trim();
  if (!normalized) {
    throw new Error("Empty deep link payload");
  }

  if (/^funkhub:install\?/i.test(normalized)) {
    const canonical = normalized.replace(/^funkhub:install\?/i, "funkhub://install?");
    return parseFunkHubDeepLink(canonical);
  }

  if (/^funkhub:\/\//i.test(normalized) || /^funkhub:/i.test(normalized)) {
    const parsedUrl = new URL(normalized);
    const host = (parsedUrl.host || "").toLowerCase();
    const pathTokens = parsedUrl.pathname.split("/").filter(Boolean).map((token) => token.toLowerCase());

    if (host === "install") {
      const modId = parsePositiveNumber(parsedUrl.searchParams.get("mod") || parsedUrl.searchParams.get("mod_id") || "", "mod id");
      const fileIdParam = parsedUrl.searchParams.get("file") || parsedUrl.searchParams.get("file_id") || "";
      const fileId = fileIdParam ? parsePositiveNumber(fileIdParam, "file id") : undefined;
      const engine = (parsedUrl.searchParams.get("engine") || "").trim().toLowerCase();
      const archiveUrl = (parsedUrl.searchParams.get("url") || parsedUrl.searchParams.get("archive") || "").trim();
      return {
        kind: "install",
        modId,
        fileId,
        engine: engine || undefined,
        archiveUrl: archiveUrl || undefined,
        source: "query",
      };
    }

    const fullSegments = [host, ...pathTokens];
    const install = parseInstallPathSegments(fullSegments);
    if (install) {
      const engine = (parsedUrl.searchParams.get("engine") || "").trim().toLowerCase();
      const archiveUrl = (parsedUrl.searchParams.get("url") || parsedUrl.searchParams.get("archive") || "").trim();
      return {
        ...install,
        engine: engine || undefined,
        archiveUrl: archiveUrl || undefined,
      };
    }

    if (fullSegments[0] === "gamebanana" && fullSegments[1] === "pair") {
      const memberId = parsePositiveNumber(decodePathToken(fullSegments[2] || ""), "member id");
      const secretKey = decodePathToken(fullSegments[3] || "").trim();
      if (!secretKey) {
        throw new Error("Missing pair secret key in deep link");
      }

      return {
        kind: "pair",
        memberId,
        secretKey,
        source: "path",
      };
    }

    const legacyPayload = normalized.replace(/^funkhub:\/\//i, "").replace(/^funkhub:/i, "");
    const legacyParts = legacyPayload.split(",");
    if (legacyParts.length >= 3) {
      const archiveUrl = decodePathToken(legacyParts[0]).trim();
      const modId = parsePositiveNumber(decodePathToken(legacyParts[2]).trim(), "mod id");
      const fileIdToken = decodePathToken(legacyParts[3] || "").trim();
      const fileId = fileIdToken ? parsePositiveNumber(fileIdToken, "file id") : undefined;

      return {
        kind: "install",
        modId,
        fileId,
        archiveUrl: archiveUrl || undefined,
        source: "legacy",
      };
    }
  }

  const rawSegments = normalized.split("/").filter(Boolean).map((token) => token.toLowerCase());
  const installFromRaw = parseInstallPathSegments(rawSegments);
  if (installFromRaw) {
    return installFromRaw;
  }

  throw new Error(
    "Unsupported deep link. Use funkhub://mod/install/{ModId}/{FileId}, "
    + "funkhub://install?mod={ModId}&file={FileId}, or funkhub://gamebanana/pair/{MemberId}/{SecretKey}",
  );
}
