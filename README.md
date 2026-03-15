# FunkHub

<p align="center">
  <img src="assets/art/banner/funkhub-banner-2048x640.png" alt="FunkHub Banner" width="900" />
</p>

**A Friday Night Funkin Mod Launcher**

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
