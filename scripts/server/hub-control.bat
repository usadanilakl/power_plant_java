@echo off
:: ============================================================================
::  Power Plant Hub - service control menu
::  Double-click to run. Self-elevates to Administrator (required for the
::  service start/stop/restart/uninstall commands).
:: ============================================================================

:: --- Paths (edit if you move things) ---
set "EXE=C:\forms\power_plant\scripts\server\power-plant-hub.exe"
set "OUTLOG=C:\forms\power_plant\scripts\server\power-plant-hub.out.log"
set "ERRLOG=C:\forms\power_plant\scripts\server\power-plant-hub.err.log"
set "SVC=PowerPlantHub"
set "PORT=8085"

:: --- Self-elevate to admin if not already ---
net session >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator rights...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:menu
cls
echo ============================================
echo    Power Plant Hub - Service Control
echo ============================================
echo.
echo   1. Start service
echo   2. Stop service
echo   3. Restart service
echo   4. Status (service + port %PORT%)
echo   5. Watch live log  (Ctrl+C to stop watching)
echo   6. Debug in console (foreground; Ctrl+C to quit)
echo   7. Uninstall service
echo   8. Compact database now (stop, reclaim dead space, restart)
echo   0. Exit
echo.
set /p choice="Choose: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto watch
if "%choice%"=="6" goto debug
if "%choice%"=="7" goto uninstall
if "%choice%"=="8" goto compact
if "%choice%"=="0" exit /b
goto menu

:start
echo.
"%EXE%" start
echo.
pause
goto menu

:stop
echo.
"%EXE%" stop
echo.
pause
goto menu

:restart
echo.
"%EXE%" restart
echo.
pause
goto menu

:status
echo.
powershell -NoProfile -Command "Get-Service %SVC% | Format-Table -Auto; Write-Host 'Port %PORT%:'; (Test-NetConnection localhost -Port %PORT%).TcpTestSucceeded"
echo.
pause
goto menu

:watch
echo.
echo Showing live log. Press Ctrl+C to stop watching (this does NOT stop the app).
echo.
powershell -NoProfile -Command "Get-Content '%OUTLOG%' -Tail 40 -Wait"
goto menu

:debug
echo.
echo Stopping the service so it can run in the foreground...
"%EXE%" stop
echo.
echo Running in console. Press Ctrl+C to quit, then choose option 1 to restart as a service.
echo.
"%EXE%" test
goto menu

:compact
echo.
echo This stops the hub, reclaims H2 dead space (SHUTDOWN DEFRAG, backs up first), then restarts.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0hub-maintenance-compact.ps1" -MinDeadMB 0 -PrecheckFloorMB 0
echo.
pause
goto menu

:uninstall
echo.
echo This removes the Windows service (the app files and jar are NOT deleted).
set /p confirm="Type YES to confirm: "
if /i "%confirm%"=="YES" (
    "%EXE%" stop
    "%EXE%" uninstall
)
echo.
pause
goto menu
