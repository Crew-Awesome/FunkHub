const configuredApiBase = import.meta.env.VITE_GAMEJOLT_API_BASE?.trim();
const GAMEJOLT_API_BASE = configuredApiBase
  || (import.meta.env.DEV
    ? "/api/gamejolt/site-api/web"
    : "https://gamejolt.com/site-api/web");
const GAMEJOLT_BASE = "https://gamejolt.com";

function isTrustedGameJoltHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return normalizedHost === "gamejolt.com" || normalizedHost.endsWith(".gamejolt.com");
}

function buildApiUrl(pathname: string): URL {
  const joinedPath = `${GAMEJOLT_API_BASE.replace(/\/$/, "")}/${pathname.replace(/^\//, "")}`;
  if (/^https?:\/\//i.test(joinedPath)) {
    const parsed = new URL(joinedPath);
    if (import.meta.env.PROD && !isTrustedGameJoltHost(parsed.hostname)) {
      throw new Error("VITE_GAMEJOLT_API_BASE must point to gamejolt.com in production.");
    }
    return parsed;
  }
  return new URL(joinedPath, window.location.origin);
}

export interface GameJoltListGamesParams {
  section?: string;
  tag?: string;
  page?: number;
  os?: string;
  browser?: string;
  priceBucket?: string;
  status?: string;
  maturity?: string;
  partnersOnly?: boolean;
}

export interface GameJoltGameSummary {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  profileUrl: string;
  authorName?: string;
  authorAvatarUrl?: string;
  likeCount?: number;
  downloadCount?: number;
  platforms?: string[];
}

function readPath(record: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = record;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function pickFirstString(record: Record<string, unknown>, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = readPath(record, path);
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function pickFirstNumber(record: Record<string, unknown>, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = readPath(record, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, "").trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function toArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
  }

  return [];
}

function absoluteUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith("//")) {
    return `https:${pathOrUrl}`;
  }

  if (pathOrUrl.startsWith("/")) {
    return `${GAMEJOLT_BASE}${pathOrUrl}`;
  }

  return `${GAMEJOLT_BASE}/${pathOrUrl}`;
}

function toTrustedGameJoltUrl(pathOrUrl: string | undefined): string | undefined {
  const resolved = absoluteUrl(pathOrUrl);
  if (!resolved) {
    return undefined;
  }

  try {
    const parsed = new URL(resolved);
    if (!isTrustedGameJoltHost(parsed.hostname)) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function extractPlatforms(record: Record<string, unknown>): string[] {
  const compatibility = readPath(record, "compatibility");
  if (!compatibility || typeof compatibility !== "object") {
    return [];
  }

  const map: Array<[string, string]> = [
    ["os_windows", "windows"],
    ["os_mac", "mac"],
    ["os_linux", "linux"],
    ["type_html", "html"],
    ["type_flash", "flash"],
    ["type_unity", "unity"],
    ["type_rom", "rom"],
  ];

  const platforms: string[] = [];
  for (const [sourceKey, targetKey] of map) {
    if ((compatibility as Record<string, unknown>)[sourceKey]) {
      platforms.push(targetKey);
    }
  }

  return platforms;
}

function normalizeGame(record: Record<string, unknown>): GameJoltGameSummary | undefined {
  const id = pickFirstNumber(record, ["id", "game_id", "_id", "_idRow"]);
  const name = pickFirstString(record, ["title", "name", "display_title", "displayName"]);
  if (!id || !name) {
    return undefined;
  }

  const slug = pickFirstString(record, ["slug"]);
  const profileUrl = toTrustedGameJoltUrl(pickFirstString(record, ["url", "profile_url", "permalink"]))
    ?? (slug ? `${GAMEJOLT_BASE}/games/${slug}/${id}` : `${GAMEJOLT_BASE}/games/${id}`);

  const thumbnailUrl = absoluteUrl(pickFirstString(record, [
    "thumbnail_img_url",
    "thumbnail",
    "thumbnail_url",
    "thumbnail_media_item.img_url",
    "img_thumbnail",
    "img_url",
    "media_item.img_url",
  ]));

  const imageUrl = absoluteUrl(pickFirstString(record, [
    "img_url",
    "header_img_url",
    "image_url",
    "imgCover",
    "media_item.img_url",
  ])) ?? thumbnailUrl;

  return {
    id,
    name,
    description: pickFirstString(record, ["description_content", "description", "summary"]),
    thumbnailUrl,
    imageUrl,
    profileUrl,
    authorName: pickFirstString(record, ["developer.display_name", "developer.name", "user.display_name", "user.username"]),
    authorAvatarUrl: absoluteUrl(pickFirstString(record, ["developer.img_avatar", "user.img_avatar", "developer.avatar_url"])),
    likeCount: pickFirstNumber(record, ["like_count", "likes_count", "likes"]),
    downloadCount: pickFirstNumber(record, ["download_count", "downloads_count", "downloads", "install_count"]),
    platforms: extractPlatforms(record),
  };
}

export class GameJoltApiService {
  private async fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      const cloudflareMitigated = response.headers.get("cf-mitigated");
      if (response.status === 403 && cloudflareMitigated === "challenge") {
        throw new Error("GameJolt blocked this request with a Cloudflare challenge.");
      }
      throw new Error(`GameJolt request failed (${response.status})`);
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      const cloudflareMitigated = response.headers.get("cf-mitigated");
      if (cloudflareMitigated === "challenge" || contentType.includes("text/html")) {
        throw new Error("GameJolt returned a challenge page instead of JSON.");
      }
      throw new Error(`GameJolt returned unexpected content type: ${contentType || "unknown"}`);
    }

    return response.json() as Promise<T>;
  }

  async listGames(
    params: GameJoltListGamesParams = {},
    signal?: AbortSignal,
  ): Promise<{ records: GameJoltGameSummary[]; hasMore: boolean; totalCount?: number; perPage?: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const url = buildApiUrl("discover/games");
    url.searchParams.set("section", params.section ?? "featured");
    url.searchParams.set("tag", params.tag ?? "fnf");

    if (params.os) {
      url.searchParams.append("f_os[]", params.os);
    }
    if (params.browser) {
      url.searchParams.append("f_browser[]", params.browser);
    }
    if (params.priceBucket) {
      url.searchParams.set("f_price", params.priceBucket);
    }
    if (params.status) {
      url.searchParams.append("f_status[]", params.status);
    }
    if (params.maturity) {
      url.searchParams.append("f_maturity[]", params.maturity);
    }
    if (params.partnersOnly) {
      url.searchParams.append("f_partners[]", "partners");
    }
    if (page > 1) {
      url.searchParams.set("page", String(page));
    }

    const payload = await this.fetchJson<Record<string, unknown>>(url.toString(), signal);

    const records = toArray(payload.games)
      .concat(toArray((payload.payload as Record<string, unknown> | undefined)?.games))
      .concat(toArray(payload.items))
      .concat(toArray((payload.payload as Record<string, unknown> | undefined)?.items));

    const normalized = records
      .map(normalizeGame)
      .filter((entry): entry is GameJoltGameSummary => Boolean(entry));

    const byId = new Map<number, GameJoltGameSummary>();
    for (const game of normalized) {
      if (!byId.has(game.id)) {
        byId.set(game.id, game);
      }
    }
    const deduped = [...byId.values()];

    const perPage = pickFirstNumber(payload, ["payload.perPage", "perPage"]);
    const totalCount = pickFirstNumber(payload, ["payload.gamesCount", "gamesCount"]);

    const hasMoreFromTotals = (
      typeof totalCount === "number"
      && typeof perPage === "number"
      && perPage > 0
      && (page * perPage) < totalCount
    );

    const nextPageNumeric = pickFirstNumber(payload, ["nextPage", "next_page", "payload.nextPage", "payload.next_page"]);
    const parseBoolean = (value: unknown): boolean | undefined => {
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "number") {
        return value !== 0;
      }
      if (typeof value === "string") {
        const normalizedValue = value.trim().toLowerCase();
        if (["true", "1", "yes"].includes(normalizedValue)) {
          return true;
        }
        if (["false", "0", "no", ""].includes(normalizedValue)) {
          return false;
        }
      }
      return undefined;
    };

    const hasMoreBool = parseBoolean(readPath(payload, "hasMore"))
      ?? parseBoolean(readPath(payload, "payload.hasMore"));

    const hasMore = hasMoreFromTotals
      || (typeof nextPageNumeric === "number" && nextPageNumeric > page)
      || hasMoreBool === true;

    return {
      records: deduped,
      hasMore,
      totalCount,
      perPage,
    };
  }
}

export const gameJoltApiService = new GameJoltApiService();
