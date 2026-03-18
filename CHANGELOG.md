# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [v0.6.0] - 2026-03-17

### Added
- Stats page with overview, recently played, most played, mods by engine, and library health sections
- Achievements system with 40+ achievements across installs, playtime, engines, downloads, settings, collections, and usage streaks
- Achievement toast notifications when unlocking
- Dedicated Achievements page with progress tracking and reset
- `nav.achievements` nav item in sidebar
- Best Of hero carousel on Discover page with period picker
- Subfeed sort pills on Discover (Hot, New, Featured, etc.)
- Search field selection filter on Discover
- Sort order filter on Discover
- Release type filter (Studio, Indie, Redistribution)
- Content rating filter (17 categories) on Discover
- 16 color themes: funkhub, purple, pink, blue, green, red, alepsych, ocean, mint, rose, gold, lavender, midnight, coral, slate, gamebanana
- 6 display modes: light, dark, auto, vibrant, pastel, focus
- `ThemePicker` and `ModePicker` components in Settings > Appearance
- Data management section in Settings (clear mods, clear engines, clear download history, clear disabled mods, clear unpinned mods, reset play time, clear all data)
- Granular download clear buttons (active, completed, failed)
- Category breadcrumb display in mod detail/visualizer view
- `useEngineManage` and `useEngineWizard` extracted hooks
- `docs/RELEASE_GUIDE.md`

### Changed
- Home page fully redesigned: personal hero with last-played mod, quick-launch strip (pinned/recent), stats bar (active downloads, updates, engines), trending strip
- Discover page layout and filter UI overhauled
- Settings Appearance tab updated with theme/mode dropdown pickers
- Theme system rewritten to use CSS data-attributes (`data-theme`, `data-mode`, `data-effect-mode`)
- Chart colors replaced with CSS variables for theme awareness
- Engines page refactored with extracted state hooks
- Framer Motion animations added across Discover, Downloads, Engines, Home, Stats, and Updates pages
- GameBanana image hydration improved — missing thumbnails auto-fetched from mod profiles
- Updated AGENTS.md

### Fixed
- Vibrant/Pastel/Focus effect modes now correctly apply CSS filters
- Base mode (light/dark) tracked separately from effect modes — switching does not reset effects
- Auto mode respects system preference without breaking active effect modes
- Theme toggle correctly switches between light/dark when an effect mode is active

### Infrastructure
- Full translation pass for es-419, ru, pt-BR, id: stats, achievements, data management, theme/mode, discover filters, and download controls
- Weblate contributions for Indonesian (MTGC) and Russian (zokxamong)

## [v0.5.0] - 2026-03-16

### Added
- Collections/tags system for mod organization
- Mod enable/disable toggle
- Mod custom images and notes
- Resizable sidebar with drag handle
- Sidebar search/filter
- Multiple sort options (newest, oldest, name, most played, recent, engine, updates)
- Group mods by engine
- Keyboard navigation (arrow keys)
- Right-click context menu
- Engine folder scanning (`scanCommonEnginePaths`)
- Wine/Proton runtime detection (`detectWineRuntimes`)
- Engine update detection
- Release type filtering (Studio, Indie, Redistribution)
- Content rating filtering (17 categories)
- Search order/field selection
- Indonesian (`id`) language support
- Psych Online engine support

### Changed
- Complete Library page redesign
- Better search using GameBanana API
- Cross-device file move support
- Linux AppImage auto-update support
- Improved translations (Spanish, Portuguese, Indonesian, Russian)

### Fixed
- Cross-device file move failures
- Empty category name handling
- Various bug fixes and stability improvements

### Infrastructure
- Updated GitHub Actions build workflow
- Added labeler workflow
- Weblate sync improvements

## [v0.4.0] - 2026-03-15

### Added
- Per-mod playtime tracking (`totalPlayTimeMs`, `addPlayTime`, `clearPlayTime`)
- App auto-updater (`checkAppUpdate`, `downloadAppUpdate`, `installAppUpdate`)
- `onAppUpdateStatus` event listener
- Engine health status display (ready, missing_binary, broken_install)
- Running launch state with kill button
- Engine rename and custom icons
- Multiple engine versions grouped
- Download sections (active, completed, failed)
- Progress bar animations with shimmer
- Download speed display
- Launch arguments support for engines
- `runningLaunchIds` tracking
- `killLaunch` method
- `getRunningLaunches` and `onLaunchExit` bridge methods
- Carousel navigation for mod screenshots
- Open Mod Folder action
- Skip to main content link

### Changed
- Engine cards redesigned with health indicators
- Downloads split into active/completed/failed sections
- Provider re-render optimizations
- UI cleanup across all pages

### Fixed
- Zip mod and executable handling
- Engine background launch issues
- Discovery page issues

### Removed
- Stale internal docs (desktop-bridge.md, gamebanana-api-research.md, gamebanana-tool-page.md)
- dependabot.yml

### Infrastructure
- Added AGENTS.md
- Added CODEOWNERS
- Added labeler workflow

## [v0.3.0] - 2026-03-15

### Added
- `I18nProvider` context and `useI18n()` hook
- Locale files: `en.json`, `es-419.json`, `pt-BR.json`, `ru.json`
- Weblate sync GitHub Actions workflow
- `configure-weblate.mjs` script
- Category search functionality
- Category panel (sheet/drawer)
- Screenshot preview modal with carousel
- Settings page translations

### Changed
- All UI strings refactored to use `t("key", fallback)` pattern
- Pruned locale set to 4 curated languages
- Weblate API behavior hardened

### Fixed
- Language patching behavior
- Various translation issues
- UI consistency issues

## [v0.2.0] - 2026-03-15

### Added
- Engine detection service (`engineDetection.ts`)
- Support for basegame, ale-psych, psych, codename engine detection
- Deep link parsing improvements (`deepLink.ts`)
- Case-insensitive protocol parsing
- `funkhub://gamebanana/pair/` format
- Raw archive installation
- 7z extraction with exit code 2 handling
- Engine installation dialog with version picker
- Platform-specific warnings

### Changed
- Search behavior improved
- Responsive library layout
- Category sidebar redesign
- Archive format detection

### Fixed
- Deep link retry issues
- Empty download URL handling
- Install overwrite collisions
- Itch.io resolution

### Infrastructure
- Added CONTRIBUTING.md
- Added CODE_OF_CONDUCT.md
- Added SECURITY.md
- PR/Issue templates

## [v0.1.3] - 2026-03-15

### Changed
- `.github/workflows/build.yml` updated for version tagging
- `.github/workflows/release.yml` updated for version handling

## [v0.1.2] - 2026-03-15

### Added
- Onboarding dialog with folder selection
- `parseFunkHubDeepLink()` service
- GameBanana pairing system (`memberId`, `secretKey`, `pairedAt`)
- `firstRunCompleted` setting
- `checkAppUpdatesOnStartup` setting
- `autoDownloadAppUpdates` setting
- `gameBananaIntegration` config object
- `openExternalUrl()` bridge method

### Changed
- Version display now shows "InDev" for non-release builds
- Settings merge now properly handles nested objects

### Fixed
- Settings merge regression with nested configs
- Version string parsing

## [v0.1.1] - 2026-03-14

### Changed
- `.github/workflows/release.yml` updated for reliability

## [v0.1.0] - 2026-03-14

### Added
- Full Electron desktop application
- GameBanana API integration
- Mod installer service
- Engine catalog with automatic release detection
- Protocol handler (`funkhub://`)
- Native file management
- React UI with Discover, Engines, Library, Settings, Updates pages
- Responsive design with dark mode support
- GitHub Actions CI/CD
- GPL-3.0 open source license

### Changed
- Initial release
