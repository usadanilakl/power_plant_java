
@echo off
setlocal enabledelayedexpansion

set PROJECT_ROOT=c:\Users\usada\my_projects\power_plant_java\loto-boxes
set DIST_FOLDER=%PROJECT_ROOT%\dist\loto-boxes\browser
set OUTPUT_FOLDER=%PROJECT_ROOT%\loto-boxes-app

echo.
echo ========================================
echo LOTO Boxes - Build Script
echo ========================================
echo.

REM Step 1: Check dependencies
echo [1/6] Checking dependencies...
if not exist "%PROJECT_ROOT%\node_modules\" (
    echo Installing dependencies...
    cd /d %PROJECT_ROOT%
    call npm install || (echo ERROR: npm install failed! & pause & exit /b 1)
) else (
    echo Dependencies OK
)

REM Step 2: Build Angular
echo.
echo [2/6] Building Angular project...
cd /d %PROJECT_ROOT%
call ng build --configuration production --base-href "./" || (echo ERROR: Angular build failed! & pause & exit /b 1)
echo Angular build OK

REM Step 3: Prepare output folder
echo.
echo [3/6] Preparing output folder...
if exist "%OUTPUT_FOLDER%" rmdir /s /q "%OUTPUT_FOLDER%"
mkdir "%OUTPUT_FOLDER%"
mkdir "%OUTPUT_FOLDER%\browser"
echo Output folder ready

REM Step 4: Create executable
echo.
echo [4/6] Creating executable...
cd /d %PROJECT_ROOT%
pkg server.js --compress Brotli --target node18-win-x64 --output "%OUTPUT_FOLDER%\start.exe" || (echo ERROR: pkg failed! & pause & exit /b 1)

if not exist "%OUTPUT_FOLDER%\start.exe" (
    echo ERROR: start.exe not created!
    pause
    exit /b 1
)
echo Executable created

REM Step 5: Copy browser files
echo.
echo [5/6] Copying browser files...
cd /d "%DIST_FOLDER%"
xcopy *.* "%OUTPUT_FOLDER%\browser\" /E /I /Y /H /Q

if not exist "%OUTPUT_FOLDER%\browser\index.html" (
    echo ERROR: Files not copied!
    echo.
    echo Trying manual copy...
    cd /d %PROJECT_ROOT%
    xcopy "dist\loto-boxes\browser\*.*" "loto-boxes-app\browser\" /E /I /Y /H
    
    if not exist "%OUTPUT_FOLDER%\browser\index.html" (
        echo Manual copy also failed!
        pause
        exit /b 1
    )
)

echo Files copied successfully!

REM Step 6: Create launcher and documentation
echo.
echo [6/6] Creating launcher and documentation...

REM Create run.bat launcher
(
echo @echo off
echo echo.
echo echo ========================================
echo echo Starting LOTO Boxes Application
echo echo ========================================
echo echo.
echo echo Server will start on: http://localhost:4000
echo echo.
echo.
echo REM Start the server in a new window
echo start "LOTO Boxes Server" start.exe
echo.
echo REM Wait for server to start
echo echo Waiting for server to start...
echo timeout /t 3 /nobreak ^>nul
echo.
echo REM Open browser
echo echo Opening browser...
echo start http://localhost:4000
echo.
echo echo.
echo echo ========================================
echo echo Application is running!
echo echo ========================================
echo echo.
echo echo To stop the server:
echo echo - Close the "LOTO Boxes Server" window
echo echo - Or press Ctrl+C in that window
echo echo.
echo pause
) > "%OUTPUT_FOLDER%\run.bat"

REM Create README
(
echo LOTO Boxes Application
echo ======================
echo.
echo QUICK START
echo -----------
echo Double-click: run.bat
echo.
echo This will:
echo 1. Start the server
echo 2. Open your browser to http://localhost:4000
echo.
echo MANUAL START
echo ------------
echo 1. Double-click start.exe
echo 2. Open browser to http://localhost:4000
echo.
echo STOPPING THE APPLICATION
echo ------------------------
echo Close the "LOTO Boxes Server" window or press Ctrl+C
echo.
echo TROUBLESHOOTING
echo ---------------
echo If port 4000 is in use:
echo - Close any other applications using port 4000
echo - Check Task Manager for other start.exe processes
echo.
echo SYSTEM REQUIREMENTS
echo -------------------
echo - Windows 10 or later
echo - No additional software required
echo.
echo FILES
echo -----
echo - run.bat       : Quick launcher ^(recommended^)
echo - start.exe     : Server executable
echo - browser\      : Application files
echo - README.txt    : This file
echo.
) > "%OUTPUT_FOLDER%\README.txt"

echo Launcher and README created

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Output location: %OUTPUT_FOLDER%
echo.
echo Files created:
dir "%OUTPUT_FOLDER%" /b
echo.
echo ========================================
echo DEPLOYMENT
echo ========================================
echo.
echo Copy the entire folder to any Windows computer:
echo   %OUTPUT_FOLDER%
echo.
echo To run: Double-click run.bat
echo.
echo ========================================
echo.
choice /C YN /M "Do you want to test the build now"
if errorlevel 2 goto :skip_test

echo.
echo Testing the build...
cd /d "%OUTPUT_FOLDER%"
call run.bat

:skip_test
echo.
echo Build process complete!
pause