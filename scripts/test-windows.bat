@echo off
setlocal

cd /d "%~dp0.."

where npm >nul 2>&1
if errorlevel 1 (
  echo [FunkHub] npm was not found in PATH.
  echo Install Node.js first: https://nodejs.org/
  exit /b 1
)

if not exist "node_modules" (
  echo [FunkHub] Installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [FunkHub] Failed to install dependencies.
    exit /b 1
  )
)

echo [FunkHub] Starting renderer dev server on 127.0.0.1:5173...
start "FunkHub Dev Server" cmd /k "cd /d "%CD%" && npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo [FunkHub] Waiting for dev server...
timeout /t 4 /nobreak >nul

echo [FunkHub] Launching Electron app...
call npm.cmd run electron:start
set "APP_EXIT=%ERRORLEVEL%"

echo.
echo [FunkHub] Electron exited with code %APP_EXIT%.
echo [FunkHub] Dev server is still running in the "FunkHub Dev Server" window.
echo [FunkHub] Close that window when you are done testing.

exit /b %APP_EXIT%
