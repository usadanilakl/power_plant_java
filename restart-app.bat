@echo off
:: Restart script for power_plant_java after resync
:: Uses graceful shutdown via Spring Boot Actuator

echo Restarting application after resync...

:: Get the directory where this script is located
set SCRIPT_DIR=%~dp0

:: Try graceful shutdown via actuator endpoint first
echo Attempting graceful shutdown...
curl -s -X POST http://localhost:8080/actuator/shutdown >nul 2>&1

:: Wait for the application to shut down gracefully (up to 35 seconds)
set /a WAIT_COUNT=0
:wait_loop
timeout /t 2 /nobreak >nul
set /a WAIT_COUNT+=1

:: Check if the app is still running by trying to connect
curl -s http://localhost:8080/actuator/health >nul 2>&1
if errorlevel 1 (
    echo Application shut down gracefully.
    goto start_app
)

if %WAIT_COUNT% lss 18 goto wait_loop

:: If still running after 35 seconds, force kill as fallback
echo Graceful shutdown timed out, forcing termination...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /f /pid %%a 2>nul
)
timeout /t 2 /nobreak >nul

:start_app
:: Start the application again
echo Starting application...
cd /d "%SCRIPT_DIR%"
start javaw -jar power_plant_java-1.jar

echo Application restart initiated.
exit
