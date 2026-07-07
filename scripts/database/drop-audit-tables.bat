@echo off
setlocal
title Drop Envers Audit Tables + Compact
echo ============================================================
echo   DROP ENVERS AUDIT TABLES  (*_AUD / REVINFO)  then COMPACT
echo.
echo   Envers is no longer used by the app; these tables are dead
echo   weight. This backs up first, drops them, then shrinks the
echo   file (SHUTDOWN DEFRAG).
echo.
echo   IMPORTANT: STOP the app first (Electron / Spring Boot).
echo   Tip: run inspect-database.bat first to see if any exist.
echo ============================================================
echo.
set "CONFIRM="
set /p CONFIRM=App stopped and you want to proceed? Type DROP then Enter:
if /I not "%CONFIRM%"=="DROP" (
    echo.
    echo Cancelled - nothing was changed.
    echo.
    pause
    exit /b 1
)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0h2-compact.ps1" -DropAudit
echo.
echo ------------------------------------------------------------
pause
