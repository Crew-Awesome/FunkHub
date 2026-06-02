import { FNF_GAME_ID, type ListModsParams, type SearchModsParams, type SubfeedParams } from "../../types";
import {
  GameBananaOpenApiClient,
  ModCategoriesResponse,
  ModFilesResponse,
  ModIndexResponse,
  ModProfilePageResponse,
  SearchResultsResponse,
  SubfeedResponse,
  TopSubsResponse,
} from "./generatedClient";

export class GameBananaOpenApiAdapter {
  constructor(private readonly client = new GameBananaOpenApiClient()) {}

  getModIndex(params: ListModsParams): Promise<ModIndexResponse> {
    const query: Record<string, string | number | boolean | undefined> = {
      _nPage: params.page ?? 1,
      _nPerpage: Math.min(50, Math.max(1, params.perPage ?? 20)),
      _sSort: params.sort ?? "Generic_NewAndUpdated",
      _idGameRow: FNF_GAME_ID,
    };
    if (params.categoryId) query["_aFilters[Generic_Category]"] = params.categoryId;
    if (params.submitterId) query["_aFilters[Generic_Submitter]"] = params.submitterId;
    if (params.releaseType) query["_aFilters[Generic_ReleaseType]"] = params.releaseType;
    if (params.contentRatings && params.contentRatings.length > 0) {
      query["_aFilters[Generic_ContentRatings]"] = params.contentRatings.join(",");
    }
    return this.client.get<ModIndexResponse>("/Mod/Index", { query });
  }

  getSearchResults(params: SearchModsParams): Promise<SearchResultsResponse> {
    return this.client.get<SearchResultsResponse>("/Util/Search/Results", {
      query: {
        _sSearchString: params.query.trim(),
        _nPage: params.page ?? 1,
        _nPerpage: Math.min(50, Math.max(1, params.perPage ?? 15)),
        _sModelName: "Mod",
        _idGameRow: FNF_GAME_ID,
        _sOrder: params.order ?? "best_match",
        _csvFields: params.fields && params.fields.length > 0 ? params.fields.join(",") : undefined,
      },
    });
  }

  getTopSubs(): Promise<TopSubsResponse> {
    return this.client.get<TopSubsResponse>(`/Game/${FNF_GAME_ID}/TopSubs`, {
      query: {
        _csvFields: "_idRow,_sModelName,_sName,_sProfileUrl,_sPeriod,_aPreviewMedia,_aSubmitter,_nLikeCount,_nViewCount,_nDownloadCount,_sDescription",
      },
    });
  }

  getSubfeed(params: SubfeedParams): Promise<SubfeedResponse> {
    return this.client.get<SubfeedResponse>(`/Game/${FNF_GAME_ID}/Subfeed`, {
      query: {
        _sSort: params.sort ?? "default",
        _nPage: params.page ?? 1,
        _nPerpage: Math.min(50, Math.max(1, params.perPage ?? 15)),
      },
    });
  }

  getModFiles(modId: number): Promise<ModFilesResponse> {
    return this.client.get<ModFilesResponse>(`/Mod/${modId}/Files`);
  }

  getModProfilePage(modId: number): Promise<ModProfilePageResponse> {
    return this.client.get<ModProfilePageResponse>(`/Mod/${modId}/ProfilePage`);
  }

  getRootCategories(): Promise<ModCategoriesResponse> {
    return this.client.get<ModCategoriesResponse>("/Mod/Categories", {
      query: {
        _sSort: "a_to_z",
        _idGameRow: FNF_GAME_ID,
      },
    });
  }
}

export const gameBananaOpenApiAdapter = new GameBananaOpenApiAdapter();
