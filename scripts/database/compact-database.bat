@echo off
setlocal
title Compact H2 Database (reclaim space)
echo ============================================================
echo   COMPACT DATABASE  -  reclaim wasted space (SHUTDOWN DEFRAG)
echo.
echo   IMPORTANT: STOP the app first (Electron / Spring Boot).
echo   A timestamped backup is made automatically before shrinking.
echo ============================================================
echo.
set "CONFIRM="
set /p CONFIRM=Is the app STOPPED? Type Y then Enter to continue:
if /I not "%CONFIRM%"=="Y" (
    echo.
    echo Cancelled - nothing was changed.
    echo.
    pause
    exit /b 1
)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0h2-compact.ps1"
echo.
echo ------------------------------------------------------------
pause
