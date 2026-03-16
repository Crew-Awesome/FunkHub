# FunkHub v0.4.0 - Category Comeback

## Release Name
Category Comeback

## Summary
FunkHub v0.4.0 includes all changes from `v0.3.0` to the latest local `HEAD`, including unpushed local commits. This release combines Discover/category restoration, installer/runtime reliability work, updater and launcher fixes, i18n sync, and repo/workflow cleanup.

## Scope Metadata
- Range: `v0.3.0..HEAD`
- First commit in range: `459df7f`
- Latest local commit in range: `6704ef6`
- Total commits: `28`
- Translation sync commits: `8`
- Merge commits: `4`
- Feature/fix/workflow/docs commits: `16`

## Unpushed Local Commits Included
- `efc544c` - fix discovery page :C messsed it up
- `6704ef6` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub

## Highlights
- Restored Discover category browsing on desktop and mobile with category search, expansion, and all-category reset.
- Restored provider-side category filtering and pagination reset behavior so Discover loads and navigates correctly again.
- Improved executable/archive install behavior and fallback handling in desktop runtime.
- Improved Windows engine launch behavior and expanded playtime tracking support.
- Continued updater, UI quality, and translation-sync improvements.
- Cleaned repository/workflow config and removed stale automation config.

## Notable Technical Changes
- Discover
  - Reintroduced category panel/sheet UX and category tree interaction flow.
  - Rewired provider filtering pipeline to apply selected category/subtree for browsing/search.
  - Added/kept page reset behavior on category/sort/search change.
- Installer/runtime
  - Strengthened zip/executable install handling and fallback behavior in runtime bridge.
- Updater/launch
  - Added updater follow-up improvements.
  - Improved launch behavior for engines on Windows and tracked mod playtime.
- Workflow/docs
  - Updated workflow/repo metadata and docs files.
  - Removed `dependabot.yml`.

## Full Commit List (Oldest -> Newest)
- `459df7f` - changelog
- `1a87254` - Update translations via Weblate
- `ba440cf` - Update translations via Weblate
- `30b949e` - implemented empty translations cus its fucking stupid
- `e14d630` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub
- `cafac6c` - fix zip mod and executables
- `39c3329` - Open Mod Folder + Agents for contribbutors
- `d646ff9` - attempt to fix engine background launch :C
- `df9a6b8` - Update translations via Weblate
- `f5acd83` - updater?
- `d0af719` - ale psych/cne detection and ui fixes
- `91c0558` - .
- `e4b7a21` - configure more gitshit
- `9bb4c93` - Delete dependabot.yml
- `acea876` - engine card, engines page, library page edits
- `7092ebd` - Update translations via Weblate
- `c6db26c` - add playtime, wait, POPPY PLAYTIME
- `f94e933` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub
- `e960160` - Update translations via Weblate
- `a6e9f22` - Update translations via Weblate
- `9f1d3da` - OPTIMIZATIONS TIME :) and clean translations
- `c2df951` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub
- `41f80d2` - Update translations via Weblate
- `172b151` - fucking optimizations broke my butt
- `cb142d5` - no skip to main content, it sucks booty cheeks
- `68a8635` - Update translations via Weblate
- `efc544c` - fix discovery page :C messsed it up
- `6704ef6` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub

## Full Commit Range
- `v0.3.0..HEAD`
- Compare: `https://github.com/Crew-Awesome/FunkHub/compare/v0.3.0...v0.4.0`
