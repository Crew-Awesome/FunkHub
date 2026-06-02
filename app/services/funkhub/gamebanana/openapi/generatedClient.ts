export interface OpenApiClientRequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export class GameBananaOpenApiClient {
  constructor(private readonly baseUrl = "https://gamebanana.com/apiv11") {}

  async get<T>(path: string, options?: OpenApiClientRequestOptions): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    const query = options?.query ?? {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GameBanana request failed (${response.status}): ${url.toString()}`);
    }

    return response.json() as Promise<T>;
  }
}

export interface ModIndexResponse {
  _aMetadata?: Record<string, unknown>;
  _aRecords?: Record<string, unknown>[];
}

export interface SearchResultsResponse {
  _aMetadata?: Record<string, unknown>;
  _aRecords?: Record<string, unknown>[];
}

export type TopSubsResponse = Record<string, unknown>[];
export interface SubfeedResponse extends ModIndexResponse {}
export type ModFilesResponse = Record<string, unknown>[];
export type ModProfilePageResponse = Record<string, unknown>;
export type ModCategoriesResponse = Array<Record<string, unknown>>;
