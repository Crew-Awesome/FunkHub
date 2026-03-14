# FunkHub Desktop Bridge

FunkHub now includes an Electron desktop bridge implementation used by the frontend via `window.funkhubDesktop`.

## Runtime files

- `electron/main.cjs`
- `electron/preload.cjs`
- `electron/runtime-bridge.cjs`

## Supported bridge methods

- `installArchive(payload)`
- `installEngine(payload)`
- `cancelInstall({ jobId })`
- `onInstallProgress(listener)`

## Installation flow

1. Download archive from `downloadUrl` (or accept `archiveBase64` fallback).
2. Extract archive (`zip`, `rar`, `7z`) using `7zip-bin`.
3. Normalize layout:
   - flatten single top-level folder
   - detect and extract nested archive if present
   - for mods, enforce a mod root folder
4. Install destinations:
   - engines -> `/engines/<slug>`
   - mods -> `/engines/<slug>/mods/<mod-folder>`
5. Emit progress updates for `download`, `extract`, `install`, and `error` phases.

## Start commands

- `bun run dev` for web-only development.
- `bun run electron:dev` for desktop development with Vite + Electron.
- `bun run electron:start` to launch Electron directly (expects built frontend in `dist/` for packaged use).

## Data root

Desktop installs are written under Electron user data directory:

- `<userData>/funkhub/engines/`
- `<userData>/funkhub/downloads/`

## Notes

- Download cancellation propagates from UI queue into Electron bridge via `cancelInstall`.
- Engine installs auto-create `mods` folder if missing.
