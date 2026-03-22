@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

echo This will permanently drop REVINFO and all *_AUD tables from the H2 database.
echo Make sure the app is stopped and you have a backup first.
echo.
set /p CONFIRM=Type DROP to continue: 

if /I not "%CONFIRM%"=="DROP" (
    echo Cancelled.
    echo.
    pause
    exit /b 1
)

echo.
echo Running Envers audit-table cleanup in EXECUTE mode...
echo.
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%drop-envers-audit-tables.ps1" -Execute

echo.
pause
