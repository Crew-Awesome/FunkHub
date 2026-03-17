# Changelog

This changelog tracks release history from Git tags used for GitHub Releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v0.5.0] - 2026-03-16

### Release Notes

## FunkHub v0.5.0 — "I Found My Mods"

This release brings a complete reimagining of the Library page with collections, pinning, and mod organization, advanced search and filtering on the Discover page, automatic engine folder scanning, Wine/Proton runtime detection, and numerous quality-of-life improvements.

**Range:** `v0.4.0..HEAD`  
**First commit in range:** `c9cd67f`  
**Latest commit in range:** `ba52f86`

---

### Highlights

#### 🏠 Library Page Overhaul — "I Found My Mods"
- Collections/Tags System — Add tags to mods and organize them into custom collections
- Mod Pinning — Pin favorite mods to the top
- Mod Enable/Disable — Toggle mods on/off without uninstalling
- Mod Custom Images — Set custom thumbnails
- Mod Notes — Add personal notes to mods
- Mod Renaming — Rename installed mods
- Resizable Sidebar — Drag to resize (200px - 480px)
- Sidebar Search — Quick filter by name or author
- Multiple Sort Options — newest, oldest, name, most played, recent, engine, updates
- Group by Engine — Group mods by required engine
- Keyboard Navigation — Arrow keys navigate mod list
- Context Menu — Right-click for quick actions

#### 🔍 Discover Page Advanced Filtering
- Release Type Filter — Studio, Indie, Redistribution
- Content Rating Filter — 17 rating categories
- Search Sorting — Best Match, Most Popular, Newest, Recently Updated
- Search Field Selection — name, description, tags, submitter, studio, credits

#### ⚙️ Engine Management
- Engine Folder Scanning — Scan common directories for existing engines
- Wine/Proton Detection — Detect Wine, Wine64, Steam Proton
- Engine Update Detection — See which engines have newer versions
- Auto-Update Engines Setting

#### 🎮 Psych Online Engine Support
- Added support for Psych Online engine

#### 🌍 Internationalization
- Added Indonesian (`id`) language

---

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.4.0...v0.5.0`

---

## [v0.4.0] - 2026-03-15

### Release Notes

## FunkHub v0.4.0 — "Time Well Spent"

This release brings mod playtime tracking, overhauled engine and library pages, a redesigned downloads panel, app updater integration, and numerous quality-of-life improvements.

**Range:** `v0.3.0..HEAD`  
**First commit in range:** `459df7f`  
**Latest commit in range:** `48fda84`

---

### Highlights

#### ⏱️ Mod Playtime Tracking — "Time Well Spent"
- Track playtime per mod while it's running
- View total playtime in Library
- Clear playtime history

#### 🔄 App Auto-Updater
- Check for app updates from GitHub
- Download and install updates
- `onAppUpdateStatus` event listener
- Auto-check on startup setting

#### 🎨 Engine Page Redesign
- Health indicators (`ready`, `missing_binary`, `broken_install`)
- Running state with kill button
- Custom names and icons
- Group by version

#### 📥 Downloads Panel Redesign
- Sectioned layout (active/completed/failed)
- Progress animations with shimmer
- Download speed display

#### 🔧 Engine Detection
- ALE Psych binary detection
- Codename Engine detection
- Launch arguments support

---

### Added
- `totalPlayTimeMs`, `addPlayTime`, `clearPlayTime`
- `checkAppUpdate`, `downloadAppUpdate`, `installAppUpdate`
- Engine health status display
- Running launch state with `killLaunch`
- Engine rename and custom icons
- Download section redesign
- Launch arguments for engines

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.3.0...v0.4.0`

---

## [v0.3.0] - 2026-03-15

### Release Notes

## FunkHub v0.3.0 — "Lost in Translation"

This release focuses on internationalization rollout, Weblate automation, and UI quality fixes.

**Range:** `v0.2.0..HEAD`  
**First commit in range:** `427de26`  
**Latest commit in range:** `ca698ea`

---

### Highlights

#### 🌍 Internationalization — "Lost in Translation"
- 4 Languages: English, Spanish (Latin America), Portuguese (Brazil), Russian
- Runtime language switching
- Complete UI translation coverage

#### 🤖 Weblate Integration
- Automated translation sync workflow
- `configure-weblate.mjs` script

#### 🔍 Discover Page
- Category search
- Category panel (slide-out)
- Expand/collapse tree view

#### 🖼️ Library Improvements
- Screenshot preview modal
- Carousel navigation
- Responsive design

---

### Added
- `I18nProvider` and `useI18n()` hook
- Locale files: `en.json`, `es-419.json`, `pt-BR.json`, `ru.json`
- Weblate sync workflow
- Category search and panel

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.2.0...v0.3.0`

---

## [v0.2.0] - 2026-03-15

### Release Notes

## FunkHub v0.2.0 — "Click & Install"

This release focuses on reliability, executable-package support, deep-link improvements, and UI/UX enhancements.

**Range:** `v0.1.3..HEAD`  
**First commit in range:** `10f443e`  
**Latest commit in range:** `afd1f69`

---

### Highlights

#### 🎯 Engine Auto-Detection — "Click & Install"
- Automatic engine detection from mod metadata
- Supports: Base Game, ALE Psych, Psych Engine, Codename Engine
- Parses name, description, category

#### 🔗 Deep Link Improvements
- Case-insensitive protocol parsing
- New formats: `funkhub://mod/install/` and `funkhub://gamebanana/pair/`
- Better retry logic

#### 📦 Executable Mod Support
- Category 3827 as standalone installs
- Raw archive installation
- 7z handling with exit code 2

#### 🖥️ Engine Page Redesign
- Dialog-based "Add Engine" UI
- Version picker dropdown
- Platform warnings

---

### Added
- `engineDetection.ts` service
- Deep link parsing (`deepLink.ts`)
- Raw archive installation
- Engine installation dialog

### Compare
- `https://github.com/Crew-Awesome/FunkHub/compare/v0.1.3...v0.2.0`

---

## [v0.1.2] - 2026-03-15

### Release Notes

## FunkHub v0.1.2 — "First Steps"

This release brings the onboarding wizard, deep-link improvements, GameBanana integration, and update settings.

**Range:** `v0.1.1..HEAD`  
**First commit in range:** `8b92f0d`  
**Latest commit in range:** `6b8b26d`

---

### Highlights

#### 🚀 Onboarding Wizard
- First-run setup dialog
- Choose game folder
- Choose data root (engine installs)
- Install engine prompt
- Mark as complete / dismiss

#### 🔗 Deep Link V2
- New parser: `parseFunkHubDeepLink()`
- Multiple format support:
  - `funkhub://mod/install/{ModId}/{FileId}`
  - `funkhub://install?mod={ModId}&file={FileId}`
  - Legacy comma-separated format
- `funkhub://gamebanana/pair/{MemberId}/{SecretKey}` for pairing

#### 🎮 GameBanana Integration
- Pairing system for remote installs
- Polling interval setting
- Display current pairing status
- Clear stored pairing

#### ⚙️ Update Settings
- Check for app updates button
- Auto-update mods toggle
- Check on startup toggle
- Auto-download app updates toggle

#### 🐛 Bug Fixes
- Settings merge behavior fixed (nested config regression)
- Version/channel handling for InDev builds

---

### Added
- Onboarding dialog with folder selection
- `deepLink.ts` service with `parseFunkHubDeepLink()`
- GameBanana pairing (`memberId`, `secretKey`, `pairedAt`)
- Update settings: `checkAppUpdatesOnStartup`, `autoDownloadAppUpdates`
- `firstRunCompleted` setting
- `gameBananaIntegration` config object
- `openExternalUrl()` bridge method

### Changed
- Version display now shows "InDev" for non-release builds
- Settings merge now properly handles nested objects

### Fixed
- Settings merge regression with nested configs
- Version string parsing

---

## [v0.1.1] - 2026-03-14

### Release Notes

## FunkHub v0.1.1 — "Release Pipeline"

This minor release improves the GitHub Actions release workflow for better packaging and publishing.

**Range:** `v0.1.0..HEAD`  
**First commit in range:** `904de87`  
**Latest commit in range:** `a2029cb`

---

### Highlights

#### 🔧 Release Workflow Improvements
- Better artifact handling
- Improved macOS signing/ notarization
- Better version tagging

---

### Changed
- `.github/workflows/release.yml` updated for reliability

---

## [v0.1.0] - 2026-03-14

### Release Notes

## FunkHub v0.1.0 — "Hello World"

Initial public release! This release bootstraps the entire FunkHub application with core mod and engine management functionality.

**First commit:** `5c96000`  
**Latest commit in range:** `119fe03`

---

### Highlights

#### 🎮 Core Functionality
- **Mod Discovery** — Browse mods from GameBanana
- **Mod Installation** — One-click install from GameBanana
- **Engine Management** — Install and manage Friday Night Funkin' engines
- **Engine Launching** — Launch mods with their required engines
- **Library** — View installed mods with details

#### 💻 Desktop Features
- **Electron App** — Native desktop application
- **Protocol Handler** — `funkhub://` deep links
- **itch.io Integration** — Connect itch.io account for base game
- **File Management** — Browse, open, delete files

#### 📦 Packaging
- **Windows** — NSIS installer (.exe)
- **Linux** — AppImage and DEB packages
- **macOS** — DMG package

#### 🖥️ User Interface
- **Discover Page** — Browse and search GameBanana mods
- **Engines Page** — Install and manage engines
- **Library Page** — View installed mods
- **Settings Page** — Configure paths and preferences
- **Updates Page** — Check for mod updates
- **Downloads Panel** — Track installation progress

#### 🌐 Multi-Language Support (Infrastructure)
- i18n system scaffolded
- Translation infrastructure in place

---

### Added
- Full Electron desktop application
- GameBanana API integration (`gamebananaApi.ts`)
- Installer service (`installer.ts`)
- Engine catalog (`engineCatalog.ts`)
- Storage service (`storage.ts`)
- Deep link handling (early version)
- Desktop bridge (`runtime-bridge.cjs`)
- React UI with discover, engines, library, settings, updates pages
- Responsive design with dark mode support
- GitHub Actions CI/CD for building and releasing
- GPL-3.0 license

### Compare
- `https://github.com/Crew-Awesome/FunkHub/releases/tag/v0.1.0`
