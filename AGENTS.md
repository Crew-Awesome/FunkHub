# AGENTS.md

Agent guide for working in `FunkHub`.

## Scope

- This file is for coding agents operating in this repository.
- Follow repository conventions already present in the code.
- Prefer small, focused changes over broad rewrites.

## Rule Files Check

- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: **present** — treat as higher-priority repo rules.

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

# Renderer production build
bun run build

# Renderer build alias used by packaging
bun run build:renderer

# Desktop packaging
bun run build:desktop:linux
bun run build:desktop:linux:appimage
bun run build:desktop:linux:deb
bun run build:desktop:win
bun run build:desktop:mac
```

### Lint status

- There is currently no configured lint script in `package.json`.
- There is also no ESLint/Prettier config committed.
- Use TypeScript strictness + existing code style as the quality baseline.

### Test status

- There is currently no automated test runner configured (`vitest`, `jest`, `playwright` configs are absent).
- Therefore, there is no "single test" command available right now.
- If tests are added later, document exact commands here, including single-test usage.

## CI Expectations to Mirror Locally

- CI runs `bun install --frozen-lockfile`, `bun run typecheck`, and `bun run build:renderer`.
- Before handing off significant changes, at least run:
  - `bun run typecheck`
  - `bun run build`

## Translation Rule (Mandatory)

- If you add, remove, or change UI text keys, update the English source dictionary:
  - `app/i18n/locales/en.json`
- Treat English as the source-of-truth locale.
- Do not block a change on other locale updates unless explicitly requested.
- Avoid leaving newly referenced i18n keys missing in `en.json`.

## Code Style Guidelines

### General formatting

- Use TypeScript strict-friendly code; avoid `any` unless truly unavoidable.
- Use semicolons and double quotes, matching repository style.
- Keep functions and components focused; extract helpers when logic grows.
- Prefer early returns to reduce nesting.

### Imports

- Group imports by source type in this order when possible:
  1. external packages
  2. internal absolute/relative modules
  3. type imports (`type ...`) co-located with source import when used
- Keep import paths consistent with nearby files.
- Avoid unused imports; remove during edits.

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

- When adding bridge capabilities, keep all layers in sync:
  - `electron/runtime-bridge.cjs`
  - `electron/main.cjs`
  - `electron/preload.cjs`
  - `app/services/funkhub/types.ts` (`DesktopBridge` typing)
- Validate path safety and keep existing security checks intact.

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
