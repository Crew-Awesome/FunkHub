# Changelog

This changelog tracks release history from Git tags used for GitHub Releases.

Notes:
- Commit messages in early history are informal; explanations below translate likely intent.
- Version sections map to release tags.

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

## [v0.1.1] - 2026-03-14

### Summary
- Release workflow reliability improved.
- Packaging/release process stabilized after first release.

### Commit-by-commit
- `904de87` - `Update release.yml`  
  Updated GitHub release workflow configuration.
- `a2029cb` - `fixed, hopefully :C`  
  Follow-up release pipeline fixes and stabilization.

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
