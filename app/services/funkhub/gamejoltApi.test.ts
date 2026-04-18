import { beforeEach, describe, expect, it, vi } from "vitest";
import { gameJoltApiService } from "./gamejoltApi";

function mockFetchResponse(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("gameJoltApiService", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a valid URL when API base is relative", async () => {
    mockFetchResponse(new Response(JSON.stringify({ payload: { games: [], gamesCount: 0, perPage: 36 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await gameJoltApiService.listGames({ section: "featured", tag: "fnf" });

    const fetchMock = vi.mocked(fetch);
    const firstArg = fetchMock.mock.calls[0]?.[0];
    const requestUrl = typeof firstArg === "string" ? firstArg : String(firstArg);
    expect(requestUrl).toContain("/discover/games");
    expect(() => new URL(requestUrl)).not.toThrow();
  });

  it("throws a clear error when Cloudflare challenge blocks the request", async () => {
    mockFetchResponse(new Response("challenge", {
      status: 403,
      headers: { "cf-mitigated": "challenge", "Content-Type": "text/html" },
    }));

    await expect(gameJoltApiService.listGames()).rejects.toThrow(
      "GameJolt blocked this request with a Cloudflare challenge.",
    );
  });

  it("falls back to canonical GameJolt profile URL for untrusted hosts", async () => {
    mockFetchResponse(new Response(JSON.stringify({
      payload: {
        games: [
          { id: 123, title: "Demo", slug: "demo", url: "https://evil.example/phish" },
        ],
        gamesCount: 1,
        perPage: 36,
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    const result = await gameJoltApiService.listGames();
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.profileUrl).toBe("https://gamejolt.com/games/demo/123");
  });

  it("adds selected filters and page to request URL", async () => {
    mockFetchResponse(new Response(JSON.stringify({ payload: { games: [], gamesCount: 0, perPage: 36 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await gameJoltApiService.listGames({
      section: "hot",
      tag: "fnf",
      page: 2,
      os: "windows",
      browser: "html",
      priceBucket: "5-less",
      status: "wip",
      maturity: "teen",
      partnersOnly: true,
    });

    const firstArg = vi.mocked(fetch).mock.calls[0]?.[0];
    const requestUrl = typeof firstArg === "string" ? firstArg : String(firstArg);
    const parsed = new URL(requestUrl, window.location.origin);

    expect(parsed.searchParams.get("section")).toBe("hot");
    expect(parsed.searchParams.get("tag")).toBe("fnf");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("f_price")).toBe("5-less");
    expect(parsed.searchParams.getAll("f_os[]")).toEqual(["windows"]);
    expect(parsed.searchParams.getAll("f_browser[]")).toEqual(["html"]);
    expect(parsed.searchParams.getAll("f_status[]")).toEqual(["wip"]);
    expect(parsed.searchParams.getAll("f_maturity[]")).toEqual(["teen"]);
    expect(parsed.searchParams.getAll("f_partners[]")).toEqual(["partners"]);
  });
});
