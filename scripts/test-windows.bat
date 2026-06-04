@echo off
setlocal

cd /d "%~dp0.."

where bun >nul 2>&1
if errorlevel 1 (
  echo [FunkHub] Bun was not found in PATH.
  echo Install Bun first: https://bun.sh/
  exit /b 1
)

if not exist "node_modules" (
  echo [FunkHub] Installing dependencies...
  call bun install --frozen-lockfile
  if errorlevel 1 (
    echo [FunkHub] Failed to install dependencies.
    exit /b 1
  )
)

echo [FunkHub] Building Windows desktop app...
call bun run build:desktop:win
if errorlevel 1 (
  echo [FunkHub] Build failed.
  exit /b 1
)

set "APP_EXE="
for /f "delims=" %%f in ('powershell -NoProfile -Command "Get-ChildItem -Path 'dist-desktop' -Filter '*.exe' -File | Where-Object { $_.Name -notmatch 'Setup' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"') do set "APP_EXE=%%f"

if "%APP_EXE%"=="" (
  echo [FunkHub] Could not find portable app executable in dist-desktop.
  exit /b 1
)

echo [FunkHub] Launching packaged app: %APP_EXE%
start "" "%APP_EXE%"
exit /b 0
