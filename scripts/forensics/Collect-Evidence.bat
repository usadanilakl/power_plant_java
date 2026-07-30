@echo off
REM ============================================================================
REM  Collect-Evidence.bat
REM
REM  Double-click launcher for Get-ElectronBrowsingEvidence.ps1.
REM  Finds the .ps1 next to itself, so the whole folder can be copied to a USB
REM  stick or a network share and run from anywhere.
REM
REM  NO ADMINISTRATOR RIGHTS REQUIRED. Log in as the account that actually runs
REM  DK Power Manager, then double-click this file.
REM ============================================================================

setlocal EnableExtensions

REM %~dp0 is this file's own folder (with a trailing backslash - strip it).
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "PS1=%SCRIPT_DIR%\Get-ElectronBrowsingEvidence.ps1"

if not exist "%PS1%" (
    echo.
    echo  ERROR: Get-ElectronBrowsingEvidence.ps1 was not found next to this file.
    echo         Looked for: "%PS1%"
    echo.
    echo  Keep Collect-Evidence.bat and Get-ElectronBrowsingEvidence.ps1
    echo  together in the same folder.
    echo.
    pause
    exit /b 1
)

REM Write results next to this file when possible - that way a USB stick gathers
REM every machine's output in one place. Fall back to the Desktop if this folder
REM is read-only (network share, locked-down machine).
set "OUTDIR=%SCRIPT_DIR%"
copy /y nul "%SCRIPT_DIR%\.writeprobe" >nul 2>&1
if exist "%SCRIPT_DIR%\.writeprobe" (
    del "%SCRIPT_DIR%\.writeprobe" >nul 2>&1
) else (
    set "OUTDIR=%USERPROFILE%\Desktop"
)

set "LOG=%OUTDIR%\electron-evidence-%COMPUTERNAME%.txt"

echo ============================================================
echo   Electron browsing evidence collector
echo ============================================================
echo   Machine : %COMPUTERNAME%
echo   User    : %USERNAME%
echo   Results : %OUTDIR%
echo ============================================================
echo.
echo  No administrator rights are needed.
echo  Close DK Power Manager first if you can - it keeps the cookie
echo  files open, and a closed app gives a cleaner read.
echo.
echo  Scanning... this usually takes under a minute. Please wait.
echo.

REM Output is redirected to the log and printed afterwards. The script writes via
REM Write-Host, which Tee-Object would NOT capture - a plain stdout redirect does.
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -OutputDir "%OUTDIR%" > "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"

type "%LOG%"

echo.
echo ============================================================
if not "%RC%"=="0" (
    echo   PowerShell exited with code %RC%.
    echo.
    echo   If the log says running scripts is disabled, Group Policy is
    echo   overriding the bypass. Run this from this folder instead - it
    echo   needs no admin and is not affected by execution policy:
    echo.
    echo     powershell -NoProfile -Command "Get-Content '.\Get-ElectronBrowsingEvidence.ps1' -Raw ^| Invoke-Expression"
    echo.
) else (
    echo   Done.
)
echo   Console log : %LOG%
echo   JSON dump   : %OUTDIR%\electron-evidence-%COMPUTERNAME%-*.json
echo.
echo   Send BOTH files from EACH machine - the two that had the popup
echo   AND one that did not. The clean machine is the baseline; without
echo   it the ad domains mean nothing on their own.
echo ============================================================
echo.
pause
endlocal
