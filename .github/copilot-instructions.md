# GitHub Copilot Instructions

See [AGENTS.md](../AGENTS.md) for full agent/contributor guidance.

## Key rules

- Stack: Bun + React 19 + TypeScript + Vite + Electron (`electron/*.cjs`)
- Styling: Tailwind v4, CSS tokens in `styles/theme.css` — no inline styles, no arbitrary Tailwind values
- All user-facing strings go through `useI18n()` / `t()` — never hardcode English in JSX
- Desktop IPC lives in `electron/runtime-bridge.cjs` and is exposed via `electron/preload.cjs`; never call Node APIs directly from `app/`
- Prefer small, focused changes — do not refactor surrounding code unless asked
- Run `bun run typecheck` before finishing any change
