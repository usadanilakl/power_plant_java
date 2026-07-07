@echo off
setlocal
title Inspect H2 Database (read-only)
echo ============================================================
echo   INSPECT DATABASE  (read-only - nothing is changed)
echo   Shows the file size and the biggest tables.
echo ============================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0h2-compact.ps1" -ReportOnly
echo.
echo ------------------------------------------------------------
pause
