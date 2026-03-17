# Changelog

This changelog tracks release history from Git tags used for GitHub Releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v0.5.0] - 2026-03-16

### Release Notes

## FunkHub v0.5.0 — Massive Library Overhaul, Advanced Filtering, and Engine Scanning

This release brings a complete reimagining of the Library page with collections, pinning, and mod organization, advanced search and filtering on the Discover page, automatic engine folder scanning, Wine/Proton runtime detection, and numerous quality-of-life improvements across the app.

**Range:** `v0.4.0..HEAD`  
**First commit in range:** `c9cd67f`  
**Latest commit in range:** `ba52f86`

---

### Highlights

#### Library Page Overhaul
- **Collections/Tags System** — Add tags to mods and organize them into custom collections. Filter your library by collection with one click.
- **Mod Pinning** — Pin your favorite mods to the top of the library for quick access.
- **Mod Enable/Disable** — Toggle mods on/off without uninstalling. Disabled mods appear dimmed and won't load when launching.
- **Mod Custom Images** — Set custom thumbnails for any installed mod.
- **Mod Notes** — Add personal notes to mods for tracking what you've played, tips, or reminders.
- **Mod Renaming** — Rename installed mods to anything you want.
- **Resizable Sidebar** — Drag to resize the mod list sidebar (200px - 480px).
- **Sidebar Search** — Quick search/filter your installed mods by name or author.
- **Multiple Sort Options** — Sort by newest, oldest, name, most played, recently played, engine, or available updates. Toggle ascending/descending.
- **Group by Engine** — Group mods in your library by the engine they require.
- **Keyboard Navigation** — Arrow keys navigate through your mod list.
- **Context Menu** — Right-click mods for quick actions.

#### Discover Page Advanced Filtering
- **Release Type Filter** — Filter mods by Studio, Indie, or Redistribution release types.
- **Content Rating Filter** — Filter by content ratings (Crude/Profane, Sexual Themes, Violence, etc.)
- **Search Sorting** — Sort search results by Best Match, Most Popular, Newest, or Recently Updated.
- **Search Field Selection** — Choose which fields to search: name, description, blurb/tags, submitter, studio, or credits.
- **Improved Search** — Search now uses GameBanana's native API for better results.

#### Engine Management Improvements
- **Engine Folder Scanning** — Scan common directories on your computer to find existing engine installations and import them.
- **Wine/Proton Detection** — Automatically detect Wine, Wine64, and Steam Proton installations for running Windows mods on Linux.
- **Engine Update Detection** — FunkHub now checks for engine updates automatically. See which engines have newer versions available.
- **Auto-Update Engines Setting** — New setting to automatically update engines (disabled by default).
- **Better Icon Management** — Browse for custom engine icons from your local files.
- **Custom Icon URLs** — Support for local `file://` URLs in addition to remote URLs.

#### Psych Online Engine Support
- Added support for [Psych Online](https://github.com/Snirozu/Funkin-Psych-Online) engine
- Auto-detection of Psych Online mods

#### Internationalization
- Added Indonesian (`id`) language support
- Improved Spanish, Portuguese (Brazil), and Russian translations

#### Bug Fixes & Stability
- Fixed cross-device file moves (now uses copy+delete when move isn't possible)
- Improved search query handling and URL detection
- Fixed root category name handling for mods without categories

---

### Added

#### Features
- Collections/tags system for mod organization (`setModTags`, `setModPinned`)
- Mod enable/disable toggle (`setModEnabled`)
- Mod custom images (`setModCustomImage`)
- Mod notes (`setModNotes`)
- Mod renaming (`renameInstalledMod`)
- Resizable sidebar with drag handle
- Sidebar search/filter
- Multiple sort options: newest, oldest, name, nameDesc, mostPlayed, recent, engine, updates
- Group by engine toggle
- Keyboard navigation (arrow keys)
- Right-click context menu on mods
- Engine folder scanning (`scanCommonEnginePaths`)
- Wine/Proton runtime detection (`detectWineRuntimes`)
- Engine update detection system (`refreshEngineUpdates`, `EngineUpdateInfo`)
- `autoUpdateEngines` setting
- Psych Online engine support
- Indonesian language (`id` locale)
- Release type filtering (Studio, Indie, Redistribution)
- Content rating filtering (17 rating types)
- Search order selection (best_match, popularity, date, udate)
- Search field selection (name, description, article, attribs, owner, studio, credits)
- Browse button for custom engine icons

#### Desktop Bridge APIs
- `detectWineRuntimes()` — Detect Wine, Wine64, and Proton installations
- `scanCommonEnginePaths()` — Scan common directories for engine folders
- Local file URL support (`file://`) for custom icons
- Cross-device file move support (copy+delete fallback)

---

### Changed

#### UI/UX
- Complete Library page redesign with new sidebar layout
- Discover page now shows filter panel when browsing categories
- Improved engine card layout and health indicators
- Better error handling for missing thumbnails
- Smoother animations and transitions
- Support for pinned mods floating to top

#### Search & Discovery
- Search now uses GameBanana API's native ordering
- Removed fallback search behavior (now requires exact game match)
- Better search field specification
- Improved category filtering integration

#### Installer
- Directory moves now handle cross-device scenarios
- Better handling of nested archive structures
- Improved standalone mod detection

#### App Updates
- Linux AppImage now supports auto-updates (when APPIMAGE env var is set)
- Better messaging for Linux update availability

#### Translations
- Updated Spanish (`es-419`) translations
- Updated Portuguese Brazil (`pt-BR`) translations
- Added Indonesian (`id`) translations
- Improved Russian (`ru`) translations
- Added translation for new UI strings

---

### Fixed

- Cross-device file move failures now fallback to copy+delete
- Empty root category names now properly handled
- Search query URL detection improvements
- Various translation fallback issues
- Provider re-render optimization issues

---

### Infrastructure

- Updated GitHub Actions build workflow
- Added labeler workflow for issue/PR labeling
- Improved release workflow
- Weblate sync configuration improvements

---

### Full Commit List (Oldest → Newest)

- `c9cd67f` - REVAMPED CHANGELOG AND README
- `26e44a6` - REMOVE ACCIDENTAL JSON
- `15565b7` - Update translations via Weblate
- `22a8667` - Update translations via Weblate
- `d640689` - Update translations via Weblate
- `b32be97` - Update translations via Weblate
- `219c49a` - Update translations via Weblate
- `a3ba112` - fixed stuff and worked on 0.5.0
- `85eed67` - Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub
- `6921b6d` - uhm
- `08bf451` - more stuff
- `8133191` - uhm
- `5afc2e4` - uhm
- `5837ffd` - bum
- `4f950ad` - Update .weblate
- `1f4a773` - indonisea
- `708ff64` - Lots of Fixes + Finish Spanish
- `8ab4706` - uhm
- `4f5863e` - fix spanish, indonisean, and portugese
- `ba52f86` - engine updater and

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.4.0...v0.5.0`

---

## [v0.4.0] - 2026-03-15

### Release Notes

## FunkHub v0.4.0 - Playtime, Engines, and Polish

This release brings mod playtime tracking, overhauled engine and library pages, a redesigned downloads panel, ALE Psych / Codename Engine detection improvements, app updater integration, and a round of performance and i18n fixes.

**Range:** `v0.3.0..HEAD`
**First commit in range:** `459df7f`
**Latest commit in range:** `48fda84`

### Highlights

#### Mod Playtime Tracking
- Added per-mod playtime tracking. Time is recorded while a mod or engine is running.
- Library view now shows total playtime for each mod.
- Players can clear playtime per mod from the Library detail panel.

#### Engine & Library Page Overhaul
- Engine cards redesigned with cleaner layout, better visual hierarchy, and per-engine custom icons/names.
- Engine health state (`ready`, `missing_binary`, `broken_install`) now shown inline on each card.
- Running launch state tracked and shown live — stop button kills a running engine from the UI.
- Library detail panel reorganised: screenshot carousel, launch settings, and manual mod import all improved.
- Open Mod Folder action added — opens the installed mod's directory in the system file manager.

#### Downloads Panel Redesign
- Active, completed, and failed downloads split into distinct labelled sections.
- Progress bar now shows a shimmer animation while downloading and turns green during install phase.
- Download speed, phase label, and byte totals surfaced inline per item.
- `AnimatePresence` exit animations added so completed/cancelled tasks transition out smoothly.
- Summary count line (`N active · N completed · N failed`) added below page heading.

#### ALE Psych and Codename Engine Detection
- Improved engine binary detection for ALE Psych and Codename Engine installs.
- Engine-specific detection logic made more robust to handle variant install layouts.

#### App Updater Integration
- Native app update check, download, and install flow wired into Settings and the Updates page.
- Update status streamed through a dedicated event channel (`onAppUpdateStatus`).
- Auto-check on startup configurable via settings (`checkAppUpdatesOnStartup`).

#### Performance & i18n
- Optimization pass across provider re-render paths to reduce unnecessary work.
- Empty translation key fallback implemented so missing locale strings never render blank.
- Translation strings cleaned and synced via Weblate for `en`, `es-419`, `pt-BR`, `ru`.

#### Repo Cleanup
- Removed stale internal docs (`desktop-bridge.md`, `gamebanana-api-research.md`, `gamebanana-tool-page.md`).
- Removed `dependabot.yml` and cleaned up CI/workflow configuration.
- Added `AGENTS.md` with contributor/AI agent guidance.

### Full Commit List (Oldest → Newest)
- `459df7f` - changelog
- `1a87254` - Update translations via Weblate
- `ba440cf` - Update translations via Weblate
- `30b949e` - implemented empty translations cus its fucking stupid
- `e14d630` - Merge branch 'main'
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
- `f94e933` - Merge branch 'main'
- `e960160` - Update translations via Weblate
- `a6e9f22` - Update translations via Weblate
- `9f1d3da` - OPTIMIZATIONS TIME :) and clean translations
- `c2df951` - Merge branch 'main'
- `41f80d2` - Update translations via Weblate
- `172b151` - fucking optimizations broke my butt
- `cb142d5` - no skip to main content, it sucks booty cheeks
- `68a8635` - Update translations via Weblate
- `efc544c` - fix discovery page :C messsed it up
- `6704ef6` - Merge branch 'main'
- `2a1e70d` - CHANGELOG updates
- `668baf3` - release notes iteration
- `48fda84` - remove stale docs

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.3.0...v0.4.0`

---

## [v0.3.0] - 2026-03-15

### Public Release Summary (GitHub Release Body)

## FunkHub v0.3.0
This release focuses on internationalization rollout, Weblate automation hardening, language-selection UX, and follow-up UI quality fixes across core screens.

**Range:** `v0.2.0..HEAD`  
**First commit in range:** `427de26`  
**Latest commit in range:** `ca698ea`

### Highlights
#### Internationalization Rollout
- Added runtime language selection plumbing through i18n provider + settings/discover flows.
- Expanded translation coverage through Weblate-driven locale updates.
- Added and iterated locale files during rollout, then intentionally narrowed supported locales to a curated set.
- Final maintained locales in this release train: `en`, `es-419`, `pt-BR`, `ru`.

#### Weblate and Workflow Reliability
- Added and refined Weblate project/component configuration and synchronization logic.
- Hardened Weblate API patch/sync behavior for language configuration updates.
- Updated CI workflow orchestration around translation sync to reduce churn and improve operational stability.

#### UI and Content Polish
- Added missing translation keys and improved copy consistency in multiple pages/components.
- Applied targeted UI cleanup across settings, engines, topbar, library, discover, downloads, updates, and modal flows.
- Synced shared UI primitives and app shell pieces so localization surfaces are consistent.

### Full Changelog (Grouped)
- **Total commits in range:** `68`
- **Translation automation commits:** `49`
  - `25` x `Update translations via Weblate`
  - `20` x `Added translation using Weblate (...)`
  - `4` x `Deleted translation using Weblate (...)`
- **Code/workflow commits:** `19` (including i18n runtime plumbing, workflow updates, UI polish, and translation-config fixes)

### Key Code/Workflow Commits
- `427de26` — deep-link/provider follow-up fix in `FunkHubProvider`.
- `8d3998b` — package/dependency update.
- `3ce281f` — broad i18n/workflow/runtime integration pass (`I18nProvider`, workflows, settings/storage/runtime).
- `f3bd9a3` — Weblate config/sync follow-up fixes.
- `9b3b3f1` — broad UI + i18n polish across top-level feature pages.
- `63b0137` — fixed language patching behavior in Weblate config script.
- `b70b7f5` — added missing translation/UI strings and shared UI text surfaces.
- `5e2285b` — engines page translation/content updates.
- `6defe52` — additional translation/UI consistency fixes.
- `b9163de` — pruned locale set to `en`, `es-419`, `ru`, `pt-BR`.
- `9ca3396` — expanded locale/config scaffolding before final pruning.
- `acd28ab` — Weblate script/config adjustments.
- `ad3db2e` — Weblate project config tuning.
- `40258c0` — language selector + workflow updates.
- `257d15d` — Weblate workflow follow-up.
- `ca698ea` — Weblate workflow follow-up.

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.2.0...v0.3.0`

---

## [v0.2.0] - 2026-03-15

### Public Release Summary (GitHub Release Body)

## FunkHub v0.2.0
This release focuses on reliability, executable-package support, deep-link install correctness, and a major UI/UX pass across core screens.

**Range:** `v0.1.3..HEAD`  
**First commit in range:** `10f443e`  
**Latest commit in range:** `afd1f69`

### Highlights
#### Installer and One-Click Reliability
- Improved one-click install flow from `funkhub://` links, including better engine targeting and safer protocol handling.
- Fixed deep-link dedupe/retry behavior to prevent missed or ignored installs.
- Improved engine detection and matching consistency when deciding install targets.
- Added fallback handling for missing/empty download URLs.
- Fixed overwrite/collision behavior by ensuring safer install path handling.
- Hardened raw-package naming/sanitization in desktop extraction flow.

#### Executable Mod Support (Category 3827)
- Executable-category mods now route more consistently as standalone executable installs.
- Added/expanded executable install target behavior so executable packages are not treated like normal mod-folder installs by default.
- Added install-mode handling to support explicit executable vs standard-mod behavior in UI/service flow.
- Improved cross-platform install behavior for Windows-targeted packages on Linux with warning/continue handling.

#### UI/UX Overhaul
- Large UI cleanup across app shell and major pages (Discover, Engines, Library, Settings, Updates).
- Responsive improvements and layout restructuring for small/tight screens.
- Mod Visualizer received multiple structural passes and fixes.
- Engine management UX improved, including better visual hierarchy and controls.
- Theme/token polish and consistency cleanup across many components.
- CI type-check coverage tightened for UI paths.

#### Search & Discovery Improvements
- Search behavior improved with better matching and fallback handling.
- Better handling for direct mod URLs / non-ideal search cases.
- Discovery/category UX refinements and fallback label cleanup.

#### Docs & Community
- Added/updated contribution workflow docs and repo community health files:
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - PR/Issue templates
- Added changelog tracking updates.

### Full Changelog (Commit-by-Commit)
- `10f443e` — changelog updates (`CHANGELOG.md`).
- `39983a1` — one-click install reliability fixes + contribution/community workflow docs/templates.
- `55b0766` — engine detection improvements (`engineDetection`, API mapping, installer integration).
- `697d15f` — empty download URL handling fix.
- `69ea5b8` — install overwrite/collision fix.
- `d1894fc` — deep-link retry handling fix.
- `4c1e3e3` — default engine guard/fix.
- `cc63991` — deep-link parsing/handling fixes (`deepLink.ts`, provider flow).
- `b280bc9` — engine selection persistence/save correctness.
- `26bb7a8` — itch lookup/resolution fixes (service + runtime bridge).
- `3fc68ac` — repeated-link handling fix.
- `d7e1966` — raw package filename sanitization fix in desktop runtime.
- `d9c9dfd` — broad UI cleanup pass (app shell, discover, downloads, engines, library, settings, updates, routing, theme, CI TS config).
- `53365bf` — allow Windows-package workflow on Linux path with safer handling.
- `ea67c8e` — Mod Visualizer refinement pass.
- `fac97f2` — executable install target behavior updates (library/service/installer/runtime).
- `d4b8cec` — provider-side install/deep-link flow follow-up adjustments.
- `cad3a9f` — Mod Visualizer follow-up adjustments.
- `940d14d` — Mod Visualizer fixes + runtime extraction flow adjustment.
- `afd1f69` — search + install-mode plumbing updates (provider/service/API/installer/types + visualizer integration).

### Changed Areas
- **Frontend/UI:**  
  `app/App.tsx`, `app/router.tsx`, `app/app-shell/*`, `app/features/{discover,downloads,engines,library,mods,settings,updates}/*`, `styles/theme.css`
- **Installer/Core logic:**  
  `app/services/funkhub/{installer,funkhubService,types,deepLink,gamebananaApi,engineDetection}.ts`
- **Desktop runtime:**  
  `electron/{main,runtime-bridge}.cjs`
- **Project docs/templates:**  
  `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `README.md`, `CHANGELOG.md`

---

## [v0.1.2] - 2026-03-15

### Summary
- Deep-link parsing expanded and hardened (install + pair formats, legacy compatibility).
- Onboarding flow and settings UX improvements landed.
- Version/update logic was refined to avoid false update prompts.
- Settings merge behavior was fixed to avoid nested config regressions.

### Commit-by-commit
- `e60c874` - `bummrt`  
  Misc release-cycle cleanup and prep changes.
- `8b92f0d` - `deep link parsing and onboarding`  
  Added robust deep-link parsing and first-run onboarding flow.
- `fb4cb7d` - `uhm`  
  Follow-up polish/fixes on the above feature work.
- `60e3798` - `bruh`  
  Additional iteration fixes around update/deep-link behavior.
- `521db95` - `fix versioning`  
  Corrected version/channel handling for release vs InDev builds.
- `6b8b26d` - `fix merge bugs`  
  Fixed settings merge issues (especially nested config objects).

---

## [v0.1.1] - 2026-03-14

### Summary
- Release workflow reliability improved.
- Packaging/release process stabilized after first release.

### Commit-by-commit
- `904de87` - `Update release.yml`  
  Updated GitHub release workflow configuration.
- `a2029cb` - `fixed, hopefully :C`  
  Follow-up release pipeline fixes and stabilization.

---

## [v0.1.0] - 2026-03-14

### Summary
Initial public release cycle: core app implementation, engine/mod management functionality, packaging for desktop platforms, protocol handling, and docs/assets cleanup.

### Commit-by-commit
- `5c96000` - `Initial commit`  
  Project bootstrap and initial repository setup.
- `4ad0606` - `bum shit`  
  Early internal fixes/refactors during bootstrap.
- `bbb1270` - `say wallahi bro say wallahi`  
  Iteration pass on early app scaffolding.
- `75aadc4` - `services`  
  Added/expanded service-layer logic.
- `f45f61d` - `update`  
  General feature and wiring updates.
- `cc3d90a` - `make app building`  
  Build pipeline setup so the app compiles/runs.
- `e9f7cf5` - `real settings/path management end-to-end`  
  Implemented full settings and path management flow.
- `33773b4` - `updated package cus im a fat chud`  
  Package/dependency configuration updates.
- `29c2823` - `uhm`  
  General fixes and iteration pass.
- `f8cec4a` - `uhm`  
  Additional follow-up fixes.
- `d66d86e` - `fix`  
  Bug fix pass.
- `ec66e0e` - `uhm`  
  Further implementation cleanup.
- `dfe3b9c` - `try to fix`  
  Attempted fix for active issue(s).
- `b423c1c` - `change browse`  
  Updated browse/discovery behavior.
- `a371987` - `update images`  
  Updated visual/image assets.
- `adc341c` - `uhm`  
  Additional iteration/fixes.
- `ba5dbc5` - `uhm`  
  Additional iteration/fixes.
- `85aa726` - `shit`  
  General bugfix batch.
- `757711e` - `some fucking changes :)`  
  Multi-area functional updates.
- `1d2b651` - `shit ton of changes`  
  Large feature and refactor pass.
- `522fb19` - `itch io and other shit`  
  Added itch.io integration and related logic.
- `dc028c4` - `fixed versions and updated itch`  
  itch integration/version handling fixes.
- `eee6662` - `uhm`  
  Follow-up fixes.
- `83e2e17` - `fixes`  
  Bugfix pass.
- `9351f1b` - `fix`  
  Targeted fix.
- `e7e83fc` - `bum bullshit i forgot`  
  Post-merge cleanup/fix for missed issue.
- `a8f3365` - `boom more passes cus im back`  
  Additional polish and stabilization pass.
- `4a15677` - `cum`  
  Internal iteration commit during stabilization.
- `f386eb2` - `fixes, no cum this time`  
  Further bug fixes after previous pass.
- `ceaee23` - `fix launch or ima kms`  
  Critical launch/boot execution fix.
- `cea88f5` - `god fucking dammit`  
  Follow-up urgent fix after launch issues.
- `dc998e0` - `Delete .megamemory directory`  
  Removed `.megamemory` from repository.
- `dd69e7a` - `protocols and fix grid`  
  Added protocol handling and fixed UI grid behavior.
- `b0c4989` - `Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub`  
  Synced branch with upstream main.
- `d519506` - `gyatt`  
  Additional iteration changes.
- `86b49e7` - `add missing categories`  
  Added missing discovery/category entries.
- `e5a56d2` - `icons and stuff`  
  Icon/branding and related UI asset updates.
- `bfe9b05` - `more fixes oh and hello debian`  
  Added Debian packaging support and related fixes.
- `ac32a48` - `fix readme and also`  
  README and supporting adjustments.
- `c8d753c` - `bum stuff`  
  General cleanup/fix pass.
- `c70ea55` - `separate appimage from deb`  
  Split Linux packaging flow for AppImage vs DEB.
- `8831a58` - `even more bummer bullshit`  
  Additional packaging/build fixes.
- `7f3be8b` - `join deb and appimage, fix icons matrix`  
  Reworked Linux packaging matrix and icon handling.
- `d7d0efc` - `fix shit`  
  Stabilization bugfix pass.
- `def681d` - `screenshots in readme`  
  Added screenshots to README.
- `119fe03` - `GNU 3.0 LICENCE`  
  Added GPL-3.0 licensing metadata for first public release.
