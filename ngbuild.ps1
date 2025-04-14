# Navigate to the frontend directory
Set-Location -Path .\frontend

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in the PATH. Please install Node.js and try again."
    exit 1
}

# Check if Angular CLI is installed
if (-not (Get-Command ng -ErrorAction SilentlyContinue)) {
    Write-Host "Angular CLI is not installed globally. Attempting to use local installation..."
    $ngCommand = "npx ng"
} else {
    $ngCommand = "ng"
}

# Run the Angular build command
Write-Host "Building Angular application..."
Invoke-Expression "$ngCommand build --configuration production --base-href=/angular/browser/"

# Check if the build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Angular build completed successfully." -ForegroundColor Green
} else {
    Write-Error "Angular build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Navigate back to the root directory
Set-Location -Path ..

Write-Host "Build process completed."