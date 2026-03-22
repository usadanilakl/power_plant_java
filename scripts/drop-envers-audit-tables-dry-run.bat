@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

echo Running Envers audit-table cleanup in DRY RUN mode...
echo.
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%drop-envers-audit-tables.ps1"

echo.
pause
