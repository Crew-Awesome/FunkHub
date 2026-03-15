# FunkHub

<p>
  <img src="assets/art/logo/funkhub-logo-256.png" alt="FunkHub Logo" width="96" />
</p>

**A Friday Night Funkin Mod Launcher**

FunkHub is a desktop app for discovering, installing, and launching Friday Night Funkin' mods and engine instances.

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
bun run build:desktop:linux   # AppImage + .deb (x64)
bun run build:desktop:win     # NSIS + portable (x64)
bun run build:desktop:mac     # DMG + ZIP
```

## Release workflow

GitHub Release automation is in `.github/workflows/release.yml` and runs on tags named `v*`.

1. Update `version` in `package.json`
2. Commit and push to `main`
3. Create and push a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds Linux (AppImage + .deb), Windows (.exe), and macOS (.dmg + .zip), then publishes them to the GitHub Release.
