
@echo off
echo Testing pkg command...
echo.

cd /d c:\Users\usada\my_projects\power_plant_java\loto-boxes

echo Checking if server.js exists...
if exist "server.js" (
    echo server.js found!
    echo.
    echo First 10 lines of server.js:
    echo ========================================
    powershell -Command "Get-Content server.js -Head 10"
    echo ========================================
    echo.
) else (
    echo ERROR: server.js not found!
    pause
    exit /b 1
)

echo.
echo Testing pkg command directly...
echo.

pkg server.js --target node18-win-x64 --output test-output\test.exe

echo.
echo Exit code: %errorlevel%
echo.

if exist "test-output\test.exe" (
    echo SUCCESS: test.exe was created!
    echo File size:
    dir "test-output\test.exe"
) else (
    echo FAILED: test.exe was not created
)

echo.
pause
