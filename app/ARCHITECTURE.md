# App Architecture

The app uses a feature-first folder layout.

## Top-level folders

- `app/app-shell`: global chrome and frame (`Layout`, `Sidebar`, `Topbar`)
- `app/features`: domain features and route pages
- `app/providers`: app-wide providers (`ThemeProvider`)
- `app/shared`: reusable cross-feature code (`ui`, `figma`)
- `app/router.tsx`: route table and route composition
- `app/App.tsx`: application entry and provider wiring

## Feature conventions

Each feature lives under `app/features/<feature-name>`.

- Route features expose their page component via `index.ts`.
- Feature-internal components stay in the same feature folder.
- Cross-feature domain assets go into a dedicated feature (for example, `features/mods`).

Current route features:

- `home`
- `discover`
- `library`
- `downloads`
- `updates`
- `engines`
- `settings`

Shared domain feature:

- `mods` (shared `ModCard` and mock data)

## Imports

- Prefer barrel imports from `index.ts` for stability and shorter paths.
- Keep `shared` imports generic and reusable.
- Avoid importing across unrelated features unless the source is explicitly shared.
