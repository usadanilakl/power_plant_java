
@echo off
setlocal enabledelayedexpansion

set PROJECT_ROOT=c:\Users\usada\my_projects\power_plant_java\loto-boxes
set DIST_FOLDER=%PROJECT_ROOT%\dist\loto-boxes\browser
set OUTPUT_FOLDER=%PROJECT_ROOT%\loto-boxes-app
set BUILD_LOG=%PROJECT_ROOT%\build_log.txt

REM Start logging
echo Build started at %date% %time% > "%BUILD_LOG%"
echo. >> "%BUILD_LOG%"

echo.
echo ========================================
echo LOTO Boxes - Build Script
echo ========================================
echo.
echo Logging to: %BUILD_LOG%
echo.

REM Step 1: Check dependencies
echo [1/6] Checking dependencies...
echo [1/6] Checking dependencies... >> "%BUILD_LOG%"
if not exist "%PROJECT_ROOT%\node_modules\" (
    echo Installing dependencies...
    echo Installing dependencies... >> "%BUILD_LOG%"
    cd /d %PROJECT_ROOT%
    call npm install >> "%BUILD_LOG%" 2>&1
    if errorlevel 1 (
        echo ERROR: npm install failed! | tee -a "%BUILD_LOG%"
        pause
        exit /b 1
    )
) else (
    echo Dependencies OK
    echo Dependencies OK >> "%BUILD_LOG%"
)

REM Step 2: Build Angular
echo.
echo [2/6] Building Angular project...
echo [2/6] Building Angular project... >> "%BUILD_LOG%"
cd /d %PROJECT_ROOT%
call ng build --configuration production --base-href "./" >> "%BUILD_LOG%" 2>&1
if errorlevel 1 (
    echo ERROR: Angular build failed!
    echo ERROR: Angular build failed! >> "%BUILD_LOG%"
    echo Check log file: %BUILD_LOG%
    pause
    exit /b 1
)
echo Angular build OK
echo Angular build OK >> "%BUILD_LOG%"

REM Step 3: Prepare output folder
echo.
echo [3/6] Preparing output folder...
echo [3/6] Preparing output folder... >> "%BUILD_LOG%"
if exist "%OUTPUT_FOLDER%" (
    echo Removing old output folder...
    echo Removing old output folder... >> "%BUILD_LOG%"
    rmdir /s /q "%OUTPUT_FOLDER%" >> "%BUILD_LOG%" 2>&1
)
mkdir "%OUTPUT_FOLDER%" >> "%BUILD_LOG%" 2>&1
mkdir "%OUTPUT_FOLDER%\browser" >> "%BUILD_LOG%" 2>&1
echo Output folder ready
echo Output folder ready >> "%BUILD_LOG%"

REM Step 4: Create executable
echo.
echo [4/6] Creating executable...
echo [4/6] Creating executable... >> "%BUILD_LOG%"
cd /d %PROJECT_ROOT%

REM Check if server.js exists
if not exist "server.js" (
    echo ERROR: server.js not found!
    echo ERROR: server.js not found! >> "%BUILD_LOG%"
    echo Current directory: %CD%
    echo Current directory: %CD% >> "%BUILD_LOG%"
    dir server.js >> "%BUILD_LOG%" 2>&1
    pause
    exit /b 1
)

echo Running pkg...
echo Running pkg... >> "%BUILD_LOG%"
echo Command: pkg server.js --compress Brotli --target node18-win-x64 --output "%OUTPUT_FOLDER%\start.exe"
echo Command: pkg server.js --compress Brotli --target node18-win-x64 --output "%OUTPUT_FOLDER%\start.exe" >> "%BUILD_LOG%"
echo.
echo Starting pkg process...
echo Starting pkg process... >> "%BUILD_LOG%"

REM Run pkg with output redirection to log file
call pkg server.js --compress Brotli --target node18-win-x64 --output "%OUTPUT_FOLDER%\start.exe" >> "%BUILD_LOG%" 2>&1

echo.
echo pkg process finished
echo pkg process finished >> "%BUILD_LOG%"

REM Wait for file system to catch up
echo Waiting for file system...
echo Waiting for file system... >> "%BUILD_LOG%"
timeout /t 3 /nobreak >nul

REM Check if executable was created
echo Checking if executable exists...
echo Checking if executable exists... >> "%BUILD_LOG%"
if exist "%OUTPUT_FOLDER%\start.exe" (
    echo SUCCESS: Executable found!
    echo SUCCESS: Executable found! >> "%BUILD_LOG%"
    for %%F in ("%OUTPUT_FOLDER%\start.exe") do (
        echo File size: %%~zF bytes
        echo File size: %%~zF bytes >> "%BUILD_LOG%"
    )
) else (
    echo.
    echo WARNING: start.exe was not created with compression!
    echo WARNING: start.exe was not created with compression! >> "%BUILD_LOG%"
    echo.
    echo Trying without compression...
    echo Trying without compression... >> "%BUILD_LOG%"
    call pkg server.js --target node18-win-x64 --output "%OUTPUT_FOLDER%\start.exe" >> "%BUILD_LOG%" 2>&1
    
    timeout /t 3 /nobreak >nul
    
    if not exist "%OUTPUT_FOLDER%\start.exe" (
        echo.
        echo ERROR: Still failed to create executable!
        echo ERROR: Still failed to create executable! >> "%BUILD_LOG%"
        echo.
        echo Please check:
        echo 1. Is pkg installed? Run: npm install -g pkg
        echo 2. Do you have write permissions to: %OUTPUT_FOLDER%
        echo 3. Is antivirus blocking the creation?
        echo.
        echo Log file saved at: %BUILD_LOG%
        pause
        exit /b 1
    ) else (
        echo SUCCESS: Executable created without compression!
        echo SUCCESS: Executable created without compression! >> "%BUILD_LOG%"
        for %%F in ("%OUTPUT_FOLDER%\start.exe") do (
            echo File size: %%~zF bytes
            echo File size: %%~zF bytes >> "%BUILD_LOG%"
        )
    )
)

echo.
echo Step 4 completed successfully!
echo Step 4 completed successfully! >> "%BUILD_LOG%"
echo.
echo Press any key to continue to step 5...
pause >nul

REM Step 5: Copy browser files
echo.
echo [5/6] Copying browser files...
echo [5/6] Copying browser files... >> "%BUILD_LOG%"

REM Verify source exists
if not exist "%DIST_FOLDER%" (
    echo ERROR: Build folder not found: %DIST_FOLDER%
    echo ERROR: Build folder not found: %DIST_FOLDER% >> "%BUILD_LOG%"
    pause
    exit /b 1
)

echo Source folder: %DIST_FOLDER%
echo Source folder: %DIST_FOLDER% >> "%BUILD_LOG%"
echo Target folder: %OUTPUT_FOLDER%\browser\
echo Target folder: %OUTPUT_FOLDER%\browser\ >> "%BUILD_LOG%"
echo.
echo Listing source files:
echo Listing source files: >> "%BUILD_LOG%"
dir "%DIST_FOLDER%" /b
dir "%DIST_FOLDER%" /b >> "%BUILD_LOG%"
echo.

echo Starting copy operation...
echo Starting copy operation... >> "%BUILD_LOG%"
cd /d "%PROJECT_ROOT%"

REM Use robocopy with full logging
echo Running robocopy command... >> "%BUILD_LOG%"
robocopy "%DIST_FOLDER%" "%OUTPUT_FOLDER%\browser" /E /V /LOG+:"%BUILD_LOG%"

REM Capture robocopy exit code
set ROBOCOPY_EXIT=%errorlevel%
echo Robocopy exit code: %ROBOCOPY_EXIT%
echo Robocopy exit code: %ROBOCOPY_EXIT% >> "%BUILD_LOG%"

REM robocopy returns 0-7 for success, 8+ for errors
if %ROBOCOPY_EXIT% GEQ 8 (
    echo.
    echo ERROR: Robocopy failed with error level %ROBOCOPY_EXIT%
    echo ERROR: Robocopy failed with error level %ROBOCOPY_EXIT% >> "%BUILD_LOG%"
    echo.
    echo Trying with xcopy...
    echo Trying with xcopy... >> "%BUILD_LOG%"
    xcopy "%DIST_FOLDER%\*.*" "%OUTPUT_FOLDER%\browser\" /E /I /Y /H /V >> "%BUILD_LOG%" 2>&1
    
    if errorlevel 1 (
        echo.
        echo ERROR: xcopy also failed!
        echo ERROR: xcopy also failed! >> "%BUILD_LOG%"
        echo Check log file: %BUILD_LOG%
        pause
        exit /b 1
    )
) else (
    REM Reset error level for successful robocopy (0-7 are all success codes)
    echo Robocopy completed successfully
    echo Robocopy completed successfully >> "%BUILD_LOG%"
    ver >nul
)

echo.
echo Verifying copied files...
echo Verifying copied files... >> "%BUILD_LOG%"
if exist "%OUTPUT_FOLDER%\browser\index.html" (
    echo ✓ index.html found
    echo ✓ index.html found >> "%BUILD_LOG%"
    echo.
    echo Browser files:
    echo Browser files: >> "%BUILD_LOG%"
    dir "%OUTPUT_FOLDER%\browser" /b
    dir "%OUTPUT_FOLDER%\browser" /b >> "%BUILD_LOG%"
) else (
    echo ✗ index.html NOT found!
    echo ✗ index.html NOT found! >> "%BUILD_LOG%"
    echo.
    echo Contents of output folder:
    echo Contents of output folder: >> "%BUILD_LOG%"
    dir "%OUTPUT_FOLDER%\browser" /b
    dir "%OUTPUT_FOLDER%\browser" /b >> "%BUILD_LOG%"
    echo.
    echo Check log file: %BUILD_LOG%
    pause
    exit /b 1
)

echo.
echo Files copied successfully!
echo Files copied successfully! >> "%BUILD_LOG%"
echo.

REM Step 6: Create launcher and documentation
echo.
echo [6/6] Creating launcher and documentation...
echo [6/6] Creating launcher and documentation... >> "%BUILD_LOG%"

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

if not exist "%OUTPUT_FOLDER%\run.bat" (
    echo ERROR: Failed to create run.bat!
    echo ERROR: Failed to create run.bat! >> "%BUILD_LOG%"
    pause
    exit /b 1
)

echo ✓ run.bat created
echo ✓ run.bat created >> "%BUILD_LOG%"

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