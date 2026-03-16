#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[FunkHub] Installing dependencies"
bun install

echo "[FunkHub] Type checking"
bun run typecheck

echo "[FunkHub] Building desktop app (Linux)"
bun run build:desktop:linux

echo "[FunkHub] Done. Output: dist-desktop/"
