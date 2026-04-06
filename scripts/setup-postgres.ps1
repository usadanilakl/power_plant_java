<#
.SYNOPSIS
    Sets up PostgreSQL database for the hub and writes credentials to application-secrets.properties.

.DESCRIPTION
    1. Creates the 'power_plant' database and 'power_plant' user in PostgreSQL
    2. Appends PG credentials to application-secrets.properties (gitignored)
    3. Verifies the connection works

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
    .\setup-postgres.ps1 -PgHost 10.10.190.122 -PgPort 5432
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

# --- Verify psql is available ---
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "ERROR: psql not found. Install PostgreSQL and ensure it's on PATH." -ForegroundColor Red
    Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using psql: $($psql.Source)" -ForegroundColor Cyan

# --- Generate password if not provided ---
if ([string]::IsNullOrEmpty($DbPassword)) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
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
try {
    $version = & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -t -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Cannot connect to PostgreSQL: $version" -ForegroundColor Red
        exit 1
    }
    Write-Host "Connected: $($version.Trim())" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Cannot connect to PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

# --- Create user if not exists ---
Write-Host ""
Write-Host "Creating user '$DbUser'..." -ForegroundColor Cyan
$userExists = & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname = '$DbUser';" 2>&1
if ($userExists.Trim() -eq "1") {
    Write-Host "User '$DbUser' already exists — updating password" -ForegroundColor Yellow
    & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -c "ALTER USER $DbUser WITH PASSWORD '$DbPassword';" 2>&1 | Out-Null
} else {
    & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword';" 2>&1 | Out-Null
    Write-Host "User '$DbUser' created" -ForegroundColor Green
}

# --- Create database if not exists ---
Write-Host "Creating database '$DbName'..." -ForegroundColor Cyan
$dbExists = & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DbName';" 2>&1
if ($dbExists.Trim() -eq "1") {
    Write-Host "Database '$DbName' already exists" -ForegroundColor Yellow
} else {
    & psql -h $PgHost -p $PgPort -U $PgAdminUser -d postgres -c "CREATE DATABASE $DbName OWNER $DbUser;" 2>&1 | Out-Null
    Write-Host "Database '$DbName' created" -ForegroundColor Green
}

# --- Grant privileges ---
Write-Host "Granting privileges..." -ForegroundColor Cyan
& psql -h $PgHost -p $PgPort -U $PgAdminUser -d $DbName -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>&1 | Out-Null
& psql -h $PgHost -p $PgPort -U $PgAdminUser -d $DbName -c "GRANT ALL ON SCHEMA public TO $DbUser;" 2>&1 | Out-Null
& psql -h $PgHost -p $PgPort -U $PgAdminUser -d $DbName -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DbUser;" 2>&1 | Out-Null
& psql -h $PgHost -p $PgPort -U $PgAdminUser -d $DbName -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DbUser;" 2>&1 | Out-Null
Write-Host "Privileges granted" -ForegroundColor Green

# --- Verify connection with app user ---
Write-Host ""
Write-Host "Verifying connection with app user '$DbUser'..." -ForegroundColor Cyan
$env:PGPASSWORD = $DbPassword
$testResult = & psql -h $PgHost -p $PgPort -U $DbUser -d $DbName -t -c "SELECT 'connection_ok';" 2>&1
if ($testResult.Trim() -eq "connection_ok") {
    Write-Host "Connection verified successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: Connection test failed: $testResult" -ForegroundColor Yellow
}

# --- Write credentials to application-secrets.properties ---
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$secretsFile = Join-Path $projectRoot "src\main\resources\application-secrets.properties"

# Check if PG section already exists
$existingContent = ""
if (Test-Path $secretsFile) {
    $existingContent = Get-Content $secretsFile -Raw
}

$pgSection = @"

######################################################################################
# PostgreSQL Hub Database
######################################################################################

PG_USERNAME=$DbUser
PG_PASSWORD=$DbPassword
"@

if ($existingContent -match "PG_USERNAME") {
    # Update existing entries
    $existingContent = $existingContent -replace "PG_USERNAME=.*", "PG_USERNAME=$DbUser"
    $existingContent = $existingContent -replace "PG_PASSWORD=.*", "PG_PASSWORD=$DbPassword"
    Set-Content -Path $secretsFile -Value $existingContent -NoNewline
    Write-Host "Updated PG credentials in $secretsFile" -ForegroundColor Green
} else {
    # Append new section
    Add-Content -Path $secretsFile -Value $pgSection
    Write-Host "Added PG credentials to $secretsFile" -ForegroundColor Green
}

# --- Clean up ---
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# --- Summary ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Setup Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Host:     ${PgHost}:${PgPort}" -ForegroundColor White
Write-Host "  Database: $DbName" -ForegroundColor White
Write-Host "  User:     $DbUser" -ForegroundColor White
Write-Host "  Password: (written to application-secrets.properties)" -ForegroundColor White
Write-Host ""
Write-Host "  JDBC URL: jdbc:postgresql://${PgHost}:${PgPort}/${DbName}" -ForegroundColor White
Write-Host ""
Write-Host "  Credentials file: $secretsFile" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
