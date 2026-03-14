# GameBanana API Research for FunkHub

This document records live endpoint tests completed before implementing the FunkHub API layer.

Date tested: 2026-03-14

## Base APIs

- `https://gamebanana.com/apiv11/` (web JSON API used by site pages)
- `https://gamebanana.com/apiv7/` (legacy JSON API with `_csvProperties` field selection)
- `https://api.gamebanana.com/` (official Core/RSS API)
- `https://gamebanana.com/dl/{fileId}` (download redirect)
- `https://files.gamebanana.com/` (CDN and file cache)

## apiv11: listing, search, categories, metadata, files

### List mods

Endpoint:

```bash
curl -sG "https://gamebanana.com/apiv11/Mod/Index" \
  --data-urlencode "_idGameRow=8694" \
  --data-urlencode "_nPage=1" \
  --data-urlencode "_nPerpage=5"
```

Observed shape:

- `_aMetadata`: `_nRecordCount`, `_bIsComplete`, `_nPerpage`
- `_aRecords[]`: `_idRow`, `_sName`, `_sProfileUrl`, `_aPreviewMedia`, `_aSubmitter`, `_aGame`, `_aRootCategory`, stats fields

### List mods by category

Endpoint:

```bash
curl -sG "https://gamebanana.com/apiv11/Mod/Index" \
  --data-urlencode "_nPage=1" \
  --data-urlencode "_nPerpage=5" \
  --data-urlencode "_aFilters[Generic_Category]=3827"
```

Observed:

- Returns records whose `_aRootCategory` is category `3827` (Executables)
- `_aGame._idRow` can be used client-side to keep only FNF (`8694`)

### Search mods

`/apiv11/Search` is not valid (returns `NO_SUCH_ROUTE`).

Working endpoint:

```bash
curl -s "https://gamebanana.com/apiv11/Util/Search/Results?_sSearchString=whitty&_nPage=1&_nPerpage=5"
```

Observed shape:

- `_aMetadata._aSectionMatchCounts[]` gives hit counts per model (`Mod`, `Wip`, `Tool`, etc.)
- `_aRecords[]` is mixed models; filter by `_sModelName === "Mod"` and `_aGame._idRow === 8694` for FunkHub

### Category trees

Root categories for FNF mods:

```bash
curl -s "https://gamebanana.com/apiv11/Mod/Categories?_sSort=a_to_z&_idGameRow=8694"
```

Observed shape:

- Array entries with `_idRow`, `_sName`, `_nItemCount`, `_nCategoryCount`, `_sUrl`, `_sIconUrl`

Subcategories by category id:

```bash
curl -s "https://gamebanana.com/apiv11/ModCategory/43771/SubCategories"
curl -s "https://gamebanana.com/apiv11/ModCategory/43773/SubCategories"
```

Observed shape:

- Array entries with `_sName`, `_sUrl`, `_sIconUrl`, `_nItemCount`

Category metadata by id:

```bash
curl -s "https://gamebanana.com/apiv11/ModCategory/28367?_csvProperties=_idRow,_sName,_sProfileUrl,_sIconUrl,_idParentCategoryRow,_aGame,_tsDateAdded,_tsDateModified"
```

### Mod metadata and files

Rich metadata:

```bash
curl -s "https://gamebanana.com/apiv11/Mod/461929/ProfilePage"
```

Observed shape includes:

- `_idRow`, `_sName`, `_sDescription`, `_sText`, `_sVersion`
- `_aSubmitter`, `_aGame`, `_aCategory`, `_aSuperCategory`
- `_aFiles[]` with file ids and download URLs
- `_aCredits` and additional profile data

Files list only:

```bash
curl -s "https://gamebanana.com/apiv11/Mod/461929/Files"
curl -s "https://gamebanana.com/apiv11/File/1035440"
```

Observed file fields:

- `_idRow`, `_sFile`, `_nFilesize`, `_nDownloadCount`, `_sDownloadUrl`, `_sMd5Checksum`
- AV/analysis fields and optional `_aArchiveFileTree`

## apiv7: legacy metadata + selected fields

apiv7 requires `_csvProperties`.

Example:

```bash
curl -s "https://gamebanana.com/apiv7/Mod/461929?_csvProperties=_idRow,_sName,_nDownloadCount,_aSubmitter,_aFiles"
```

Observed:

- Cleanly returns minimal field-selected payload
- `_aFiles[]` contains `_sDownloadUrl` suitable for archive download flow

## Official API (`api.gamebanana.com`)

### New items list

```bash
curl -s "https://api.gamebanana.com/Core/List/New?gameid=8694&itemtype=Mod&page=1"
```

Observed shape:

- Array of tuples: `[["Mod", 660032], ["Mod", 660005], ...]`
- Use `Core/Item/Data` or apiv11/apiv7 to hydrate IDs

### RSS

```bash
curl -s "https://api.gamebanana.com/Rss/New?gameid=8694&itemtype=Mod&perpage=5"
```

Observed:

- XML RSS feed
- each `<item>` includes title, link, image, pubDate

## Download endpoint behavior

```bash
curl -sI "https://gamebanana.com/dl/1035440"
curl -sIL "https://gamebanana.com/dl/1035440"
```

Observed redirect chain:

1. `https://gamebanana.com/dl/1035440` -> `302` to `https://files.gamebanana.com/mods/ultimate_dimentio.rar`
2. CDN file URL -> `302` to a file cache host (`filecache*.gamebanana.com`)
3. Final `200` with binary content and `Content-Length`

This confirms FunkHub should follow redirects (`fetch` does by default) for archive download.

## Verified FNF category IDs (requested set)

Resolved through `apiv11/ModCategory/{id}` and subcategory endpoints.

| Category ID | Name | Parent ID | Parent Name |
|---|---|---:|---|
| 3827 | Executables | 0 | Root |
| 29202 | Base Game Mod Folders | 43771 | Mod Folders |
| 34764 | Codename Mod Folders | 43771 | Mod Folders |
| 28367 | Psych Mod Folders | 43771 | Mod Folders |
| 44037 | ALE Engine Mod Folders | 43773 | Other/Misc Mod Folders |
| 43850 | FPS+ Engine Mod Folders | 43773 | Other/Misc Mod Folders |
| 44036 | JS Engine Mod Folders | 43773 | Other/Misc Mod Folders |
| 43798 | P-Slice Engine Mod Folders | 43773 | Other/Misc Mod Folders |

Supporting hierarchy:

- `43771` = Mod Folders
- `43773` = Other/Misc Mod Folders (child of 43771)

## Engine sources for FunkHub (provided links)

Confirmed public release/workflow sources to integrate in engine service:

- FPS Plus: `https://github.com/ThatRozebudDude/FPS-Plus-Public/releases`
- JS Engine: `https://github.com/JordanSantiagoYT/FNF-JS-Engine/releases`
- ALE Psych: `https://github.com/ALE-Psych-Crew/ALE-Psych/actions`
- P-Slice: `https://github.com/Psych-Slice/P-Slice/releases`
- Base Game: `https://github.com/FunkinCrew/Funkin/releases`
- Psych Engine: `https://github.com/ShadowMario/FNF-PsychEngine/releases`
- Codename Engine nightlies:
  - `https://nightly.link/CodenameCrew/CodenameEngine/workflows/windows/main/Codename%20Engine.zip`
  - `https://nightly.link/CodenameCrew/CodenameEngine/workflows/macos/main/Codename%20Engine.zip`
  - `https://nightly.link/CodenameCrew/CodenameEngine/workflows/linux/main/Codename%20Engine.zip`

## Conclusions for implementation

- Use apiv11 as the primary listing/search/category API.
- Use `ProfilePage` and `.../Files` for rich per-mod metadata and file retrieval.
- Keep apiv7 support as fallback for selected fields.
- Use `dl/{fileId}` for downloads (redirect-friendly), not scraped web pages.
- Build category loading dynamically from `Mod/Categories` + `ModCategory/{id}/SubCategories`.
