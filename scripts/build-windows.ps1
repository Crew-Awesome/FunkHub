$ErrorActionPreference = 'Stop'

Write-Host "[FunkHub] Installing dependencies"
bun install --frozen-lockfile

Write-Host "[FunkHub] Type checking"
bun run typecheck

Write-Host "[FunkHub] Building desktop app (Windows)"
bun run build:desktop:win

Write-Host "[FunkHub] Done. Output: dist-desktop/"
