#!/usr/bin/env bash
set -euo pipefail

echo "[FunkHub] Installing dependencies"
bun install --frozen-lockfile

echo "[FunkHub] Type checking"
bun run typecheck

echo "[FunkHub] Building desktop app (Linux)"
bun run build:desktop:linux

echo "[FunkHub] Done. Output: dist-desktop/"
