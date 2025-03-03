# Load environment variables
Get-Content .\global.env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}

# Run tests
mvn test

# Check if tests passed
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tests passed. Proceeding with deployment..."

    # Build with Maven (skipping tests as they've already run)
    mvn package -DskipTests

    # Create the remote directory if it doesn't exist
    ssh ${env:SERVER_USER}@${env:SERVER_HOST} "mkdir -p ${env:REMOTE_DIR}"

    # Stop the running service before uploading new JAR
    ssh ${env:SERVER_USER}@${env:SERVER_HOST} "sudo systemctl stop forms-app"

    # Copy JAR to server
    scp .\target\$env:JAR_FILE ${env:SERVER_USER}@${env:SERVER_HOST}:${env:REMOTE_DIR}/app.jar

# Start the service with the new JAR
$command = @"
cd $env:REMOTE_DIR
sudo systemctl start pid_project
sudo systemctl status pid_project
"@ -replace "`r`n", "`n"

    ssh ${env:SERVER_USER}@${env:SERVER_HOST} "bash -c '$command'"

    Write-Host "Deployment completed successfully."
} else {
    Write-Host "Tests failed. Deployment aborted."
    exit 1
}