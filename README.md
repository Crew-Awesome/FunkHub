# FunkHub

<p align="center">
  <img src="assets/art/banner/funkhub-banner-2048x640.png" alt="FunkHub Banner" width="900" />
</p>

**A Friday Night Funkin Mod Launcher**

[![Build](https://github.com/Crew-Awesome/FunkHub/actions/workflows/build.yml/badge.svg)](https://github.com/Crew-Awesome/FunkHub/actions/workflows/build.yml)
[![Release](https://github.com/Crew-Awesome/FunkHub/actions/workflows/release.yml/badge.svg)](https://github.com/Crew-Awesome/FunkHub/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/Crew-Awesome/FunkHub?display_name=tag)](https://github.com/Crew-Awesome/FunkHub/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://spdx.org/licenses/GPL-3.0-only.html)

FunkHub is a simple desktop app for finding, installing, and launching Friday Night Funkin' mods.
It is made to be easy to use, fast to navigate, and fun to mess around with.

made using the Gamebanana API.

## What it does

- Discover mods and browse categories from GameBanana
- Install mods into engine mod folders
- Install standalone executable packages
- Manage engine instances and launch them directly
- Track downloads and basic update status
- Handle one-click protocol installs (`funkhub://`)

## Supported engines

- Psych Engine
- Base Game / V-Slice
- Codename Engine
- FPS Plus
- JS Engine
- ALE Psych
- P-Slice

## Screenshots

<p align="center">
  <img src="assets/art/screenshots/funkhub-screenshot-discover.png" alt="Discover Mods" width="900" />
</p>

<p align="center">
  <img src="assets/art/screenshots/funkhub-screenshot-library.png" alt="Library" width="900" />
</p>

<p align="center">
  <img src="assets/art/screenshots/funkhub-screenshot-engines.png" alt="Instances" width="900" />
</p>

## Run locally

```bash
bun install
bun run electron:dev
```

## Build

```bash
# Renderer only
bun run build

# Desktop packages
bun run build:desktop:linux:appimage   # AppImage (x64)
bun run build:desktop:linux:deb        # .deb (x64)
bun run build:desktop:linux            # AppImage + .deb (x64)
bun run build:desktop:win     # NSIS + portable (x64)
bun run build:desktop:mac     # DMG + ZIP
```

## Download Guide

Windows releases include two `.exe` files:

- `FunkHub Setup <version>.exe` - installer (recommended for most users)
- `FunkHub <version>.exe` - portable build (no install)

Release downloads: https://github.com/Crew-Awesome/FunkHub/releases

Nightly CI artifacts (temporary, 14-day retention):

- https://nightly.link/Crew-Awesome/FunkHub/workflows/build.yml/main/FunkHub-linux-appimage.zip
- https://nightly.link/Crew-Awesome/FunkHub/workflows/build.yml/main/FunkHub-linux-deb.zip
- https://nightly.link/Crew-Awesome/FunkHub/workflows/build.yml/main/FunkHub-windows.zip
- https://nightly.link/Crew-Awesome/FunkHub/workflows/build.yml/main/FunkHub-macos.zip
