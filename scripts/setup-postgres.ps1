<#
.SYNOPSIS
    Sets up PostgreSQL database for the hub and writes credentials to application-secrets.properties.
.PARAMETER PgHost
    PostgreSQL host (default: localhost)
.PARAMETER PgPort
    PostgreSQL port (default: 5432)
.PARAMETER PgAdminUser
    PostgreSQL admin user for creating the database (default: postgres)
.PARAMETER DbName
    Database name to create (default: power_plant)
.PARAMETER DbUser
    Application database user to create (default: power_plant)
.PARAMETER DbPassword
    Password for the application user. If not provided, generates a random one.
.EXAMPLE
    .\setup-postgres.ps1
    .\setup-postgres.ps1 -DbPassword "mypassword"
#>

param(
    [string]$PgHost = "localhost",
    [string]$PgPort = "5432",
    [string]$PgAdminUser = "postgres",
    [string]$DbName = "power_plant",
    [string]$DbUser = "power_plant",
    [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"

# Helper: run psql with a SQL command
function Invoke-Psql {
    param([string]$Database, [string]$Sql, [string]$User = $PgAdminUser, [switch]$TuplesOnly)
    $args_ = @("-h", $PgHost, "-p", $PgPort, "-U", $User, "-d", $Database, "-c", $Sql)
    if ($TuplesOnly) { $args_ += "-t" }
    $result = & psql @args_ 2>&1
    return $result
}

# --- Verify psql is available ---
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
    Write-Host "ERROR: psql not found. Install PostgreSQL and ensure bin/ is on PATH." -ForegroundColor Red
    exit 1
}
Write-Host "Using psql: $($psqlCmd.Source)" -ForegroundColor Cyan

# --- Generate password if not provided ---
if ([string]::IsNullOrEmpty($DbPassword)) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $DbPassword = -join (1..24 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    Write-Host "Generated random password for user '$DbUser'" -ForegroundColor Green
}

# --- Prompt for admin password ---
Write-Host ""
Write-Host "Connecting to PostgreSQL as '$PgAdminUser' on ${PgHost}:${PgPort}" -ForegroundColor Cyan
$adminPassword = Read-Host "Enter password for PostgreSQL admin user '$PgAdminUser'" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
)
$env:PGPASSWORD = $adminPasswordPlain

# --- Check connection ---
Write-Host "Testing connection..." -ForegroundColor Cyan
$version = Invoke-Psql -Database "postgres" -Sql "SELECT version();" -TuplesOnly
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to PostgreSQL: $version" -ForegroundColor Red
    exit 1
}
Write-Host "Connected: $($version.ToString().Trim())" -ForegroundColor Green

# --- Create user if not exists ---
Write-Host ""
Write-Host "Creating user '$DbUser'..." -ForegroundColor Cyan
$userCheckSql = "SELECT 1 FROM pg_roles WHERE rolname = '$DbUser';"
$userExists = Invoke-Psql -Database "postgres" -Sql $userCheckSql -TuplesOnly
if ($userExists.ToString().Trim() -eq "1") {
    Write-Host "User '$DbUser' already exists - updating password" -ForegroundColor Yellow
    $alterSql = "ALTER USER $DbUser WITH PASSWORD '$DbPassword';"
    Invoke-Psql -Database "postgres" -Sql $alterSql | Out-Null
} else {
    $createUserSql = "CREATE USER $DbUser WITH PASSWORD '$DbPassword';"
    Invoke-Psql -Database "postgres" -Sql $createUserSql | Out-Null
    Write-Host "User '$DbUser' created" -ForegroundColor Green
}

# --- Create database if not exists ---
Write-Host "Creating database '$DbName'..." -ForegroundColor Cyan
$dbCheckSql = "SELECT 1 FROM pg_database WHERE datname = '$DbName';"
$dbExists = Invoke-Psql -Database "postgres" -Sql $dbCheckSql -TuplesOnly
if ($dbExists.ToString().Trim() -eq "1") {
    Write-Host "Database '$DbName' already exists" -ForegroundColor Yellow
} else {
    $createDbSql = "CREATE DATABASE $DbName OWNER $DbUser;"
    Invoke-Psql -Database "postgres" -Sql $createDbSql | Out-Null
    Write-Host "Database '$DbName' created" -ForegroundColor Green
}

# --- Grant privileges ---
Write-Host "Granting privileges..." -ForegroundColor Cyan
Invoke-Psql -Database $DbName -Sql "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" | Out-Null
Invoke-Psql -Database $DbName -Sql "GRANT ALL ON SCHEMA public TO $DbUser;" | Out-Null
Invoke-Psql -Database $DbName -Sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DbUser;" | Out-Null
Invoke-Psql -Database $DbName -Sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DbUser;" | Out-Null
Write-Host "Privileges granted" -ForegroundColor Green

# --- Verify connection with app user ---
Write-Host ""
Write-Host "Verifying connection with app user '$DbUser'..." -ForegroundColor Cyan
$env:PGPASSWORD = $DbPassword
$testSql = "SELECT 'connection_ok';"
$testResult = Invoke-Psql -Database $DbName -Sql $testSql -User $DbUser -TuplesOnly
if ($testResult.ToString().Trim() -eq "connection_ok") {
    Write-Host "Connection verified successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: Connection test failed: $testResult" -ForegroundColor Yellow
}

# --- Write credentials to application-secrets.properties ---
$secretsFile = Join-Path $PSScriptRoot "..\src\main\resources\application-secrets.properties"
$secretsFile = [System.IO.Path]::GetFullPath($secretsFile)

$existingContent = ""
if (Test-Path $secretsFile) {
    $existingContent = Get-Content $secretsFile -Raw
}

if ($existingContent -match "PG_USERNAME") {
    $existingContent = $existingContent -replace "PG_USERNAME=.*", "PG_USERNAME=$DbUser"
    $existingContent = $existingContent -replace "PG_PASSWORD=.*", "PG_PASSWORD=$DbPassword"
    Set-Content -Path $secretsFile -Value $existingContent -NoNewline
    Write-Host "Updated PG credentials in $secretsFile" -ForegroundColor Green
} else {
    $pgBlock = "`n######################################################################################`n# PostgreSQL Hub Database`n######################################################################################`nPG_USERNAME=$DbUser`nPG_PASSWORD=$DbPassword`n"
    Add-Content -Path $secretsFile -Value $pgBlock
    Write-Host "Added PG credentials to $secretsFile" -ForegroundColor Green
}

# --- Clean up ---
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# --- Summary ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Setup Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Host:     ${PgHost}:${PgPort}"
Write-Host "  Database: $DbName"
Write-Host "  User:     $DbUser"
Write-Host "  Password: (written to application-secrets.properties)"
Write-Host ""
Write-Host "  JDBC URL: jdbc:postgresql://${PgHost}:${PgPort}/${DbName}"
Write-Host ""
Write-Host "  Secrets:  $secretsFile" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
