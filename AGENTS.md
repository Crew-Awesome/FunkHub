# AGENTS.md

Agent guide for working in `FunkHub`.

## Scope

This file is for coding agents operating in this repository. Follow repository conventions already present in the code. Prefer small, focused changes over broad rewrites.

## Rule Files Check

- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: present - treat as higher-priority repo rules.

## Stack Overview

- Runtime: Bun + Node.js tooling.
- Frontend: React 19 + TypeScript + Vite 7.
- Desktop: Electron (`electron/*.cjs`) with renderer-desktop bridge APIs.
- Styling: Tailwind v4 + CSS tokens in `styles/theme.css`.
- Packaging: `electron-builder` for Linux/Windows/macOS.

## Source Layout

- `app/features/*`: page-level UI and feature flows.
- `app/providers/*`: global state/context (`FunkHubProvider`, `I18nProvider`, `ThemeProvider`).
- `app/services/funkhub/*`: business logic, API adapters, install/update logic.
- `app/shared/ui/*`: reusable UI primitives.
- `electron/*`: main process, preload bridge, runtime bridge.
- `app/i18n/locales/*.json`: translation dictionaries.
- `.github/workflows/*`: CI build/release/sync automation.

## Install and Local Run

```bash
bun install
bun run electron:dev
```

## Build, Lint, and Test Commands

### Core commands

```bash
# Type check (CI command)
bun run typecheck

# Renderer development
bun run dev

# Renderer production build
bun run build

# Desktop development (runs Vite + Electron)
bun run electron:dev

# Desktop packaging
bun run build:desktop:linux
bun run build:desktop:linux:appimage
bun run build:desktop:linux:deb
bun run build:desktop:win
bun run build:desktop:mac
```

### Lint status

There is currently no configured lint script in `package.json`. There is also no ESLint/Prettier config committed. Use TypeScript strictness + existing code style as the quality baseline.

### Test status

There is currently no automated test runner configured (`vitest`, `jest`, `playwright` configs are absent). Therefore, there is no "single test" command available right now. If tests are added later, document exact commands here, including single-test usage.

## CI Expectations to Mirror Locally

CI runs `bun install --frozen-lockfile`, `bun run typecheck`, and `bun run build:renderer`. Before handing off significant changes, at least run:

- `bun run typecheck`
- `bun run build`

## Translation Rule (Mandatory)

If you add, remove, or change UI text keys, update the English source dictionary:

- `app/i18n/locales/en.json`

Treat English as the source-of-truth locale. Do not block a change on other locale updates unless explicitly requested. Avoid leaving newly referenced i18n keys missing in `en.json`.

## Code Style Guidelines

### General formatting

- Use TypeScript strict-friendly code; avoid `any` unless truly unavoidable.
- Use semicolons and double quotes, matching repository style.
- Keep functions and components focused; extract helpers when logic grows.
- Prefer early returns to reduce nesting.

### Imports

Group imports by source type in this order when possible:

1. External packages (react, react-router, lucide-react, etc.)
2. Internal absolute/relative modules (../../services/funkhub)
3. Type imports (`type ...`) co-located with source import when used

Keep import paths consistent with nearby files. Avoid unused imports; remove during edits.

### Naming

- Components/providers/classes: `PascalCase`.
- Functions/variables: `camelCase`.
- Constants and fixed maps: `UPPER_SNAKE_CASE` when truly constant.
- Prefer descriptive names over abbreviations.

### Types and data modeling

- Put shared domain types in `app/services/funkhub/types.ts`.
- For local component props/state helper types, keep them near usage.
- Prefer narrow unions and explicit interfaces over broad structural types.
- Use `Pick`/`Partial` intentionally to model data slices.

### React patterns

- Use function components and hooks.
- Keep side effects in `useEffect`; include correct dependency arrays.
- Derive computed view state with `useMemo` when it prevents repeated work.
- Keep event handlers resilient; surface user-facing failures with clear messages.

### Service layer patterns

- Keep API/installer/business logic in `app/services/funkhub/*`, not inside UI components.
- Reuse existing service methods before adding new bridge calls.
- Preserve backward compatibility of stored data fields where possible.

### Error handling

- Throw `Error` with actionable messages at service boundaries.
- In UI, catch errors and show readable feedback (`window.alert` or UI state) rather than silent failures.
- Prefer defensive checks around desktop bridge presence (`window.funkhubDesktop?...`).

### Electron and bridge changes

When adding bridge capabilities, keep all layers in sync:

- `electron/runtime-bridge.cjs` - implementation
- `electron/main.cjs` - IPC handlers
- `electron/preload.cjs` - context bridge exposure
- `app/services/funkhub/types.ts` - `DesktopBridge` typing

Validate path safety and keep existing security checks intact.

### Styling

- Use Tailwind v4 utility classes.
- CSS tokens are in `styles/theme.css` - use these tokens for consistent theming.
- Do not use inline styles.
- Do not use arbitrary Tailwind values (e.g., `w-[123px]`) - use CSS tokens or add to theme.

### User-facing strings

All user-facing strings must use `useI18n()` hook with `t()` function. Never hardcode English strings directly in JSX. Example:

```tsx
const { t } = useI18n();
return <h1>{t("discover.title", "Discover Mods")}</h1>;
```

## Desktop Bridge API

The renderer communicates with Electron via `window.funkhubDesktop`:

- Never call Node.js or Electron APIs directly from `app/` code.
- All native functionality goes through the bridge defined in `electron/runtime-bridge.cjs`.
- Bridge methods are exposed via `electron/preload.cjs`.

### Adding new bridge methods

1. Implement in `electron/runtime-bridge.cjs`
2. Register IPC handler in `electron/main.cjs`
3. Expose via `electron/preload.cjs`
4. Add typing to `DesktopBridge` interface in `app/services/funkhub/types.ts`
5. Add wrapper method in `app/services/funkhub/funkhubService.ts` if needed

## Database and Storage

- Settings stored in localStorage via `FunkHubStorageService` (`app/services/funkhub/storage.ts`).
- Installed mods/engines stored in localStorage.
- No external database - all data is local.

## Release and Changelog

See `docs/RELEASE_GUIDE.md` for detailed instructions on creating release notes and maintaining the changelog.

### Quick release process

1. Update `CHANGELOG.md` with changes since last version
2. Create GitHub release with tag (e.g., `v0.5.0`)
3. Release notes follow format in `docs/RELEASE_GUIDE.md`
4. Compare URL: `https://github.com/Crew-Awesome/FunkHub/compare/v0.4.0...v0.5.0`

## Change Hygiene for Agents

- Do not introduce unrelated refactors in feature/fix patches.
- Keep commits/scopes coherent if asked to commit.
- Update docs when behavior changes materially.
- For new user-facing strings: update `app/i18n/locales/en.json` in the same patch.

## Quick Pre-PR Checklist

- Code compiles: `bun run typecheck`.
- Renderer build passes: `bun run build`.
- New/changed text keys added to `app/i18n/locales/en.json`.
- No stale imports, dead code, or obvious debug artifacts.
- All desktop bridge layers synced (if adding new functionality).
