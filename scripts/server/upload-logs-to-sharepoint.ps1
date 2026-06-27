<#
.SYNOPSIS
  Uploads the hub's current log files to SharePoint so they survive an app crash.

.DESCRIPTION
  Runs INDEPENDENTLY of the app (scheduled task), so it captures the latest logs even
  when the app is dead. Reuses the existing Azure app registration + certificate.pfx
  that the Java app already uses for SharePoint access — no new credentials.

  Reads connection settings from application-secrets.properties by default, so there's
  a single source of truth. Override any value with a parameter.

.REQUIREMENTS
  - PowerShell module PnP.PowerShell:   Install-Module PnP.PowerShell -Scope AllUsers
  - The Azure app registration must have a SharePoint application permission
    (Sites.ReadWrite.All, or Sites.Selected granted on this site) with admin consent.
    The Java app already authenticates with this cert, so this is usually already in place.

.EXAMPLE
  .\upload-logs-to-sharepoint.ps1 -AppDir C:\apps\power-plant-hub
#>
[CmdletBinding()]
param(
  # Folder containing the running app (holds logs\, data\, and application-secrets.properties or it's on the classpath).
  [string]$AppDir = (Resolve-Path "$PSScriptRoot\..\..").Path,

  # Path to the secrets file. If not passed, the script searches the likely deploy locations
  # (next to the jar, a config\ subfolder, then the dev src tree). On the server the file
  # usually sits at C:\forms\power_plant\application-secrets.properties or config\.
  [string]$SecretsFile,

  # Folder with the .log files to upload.
  [string]$LogsDir = "$AppDir\logs",

  # Certificate used for app-only auth (Spring placeholder in the props file isn't resolvable here).
  [string]$CertPath = "$AppDir\data\certificate.pfx",

  # Server-relative SharePoint folder to upload into (created if missing).
  # Default puts logs in the default document library under ServerLogs\<machine>.
  [string]$TargetFolder = "Shared Documents/ServerLogs/$env:COMPUTERNAME",

  # Overrides (otherwise read from the secrets file).
  [string]$ClientId,
  [string]$TenantId,
  [string]$SiteUrl,
  [string]$PfxPassword
)

$ErrorActionPreference = 'Stop'

function Get-Prop([string[]]$lines, [string]$key) {
  $esc = [regex]::Escape($key)
  $line = $lines | Where-Object { $_ -match "^\s*$esc\s*=" } | Select-Object -First 1
  if ($null -eq $line) { return $null }
  return ($line -replace "^\s*$esc\s*=\s*", '').Trim()
}

# --- Resolve connection settings (params win, else read from secrets file) ---
if (-not ($ClientId -and $TenantId -and $SiteUrl -and $PfxPassword)) {
  if (-not $SecretsFile) {
    # Search the likely locations Spring loads application-secrets.properties from.
    $candidates = @(
      "$AppDir\application-secrets.properties",
      "$AppDir\config\application-secrets.properties",
      "$AppDir\src\main\resources\application-secrets.properties"
    )
    $SecretsFile = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  }
  if (-not $SecretsFile -or -not (Test-Path $SecretsFile)) {
    throw "Could not find application-secrets.properties (looked next to the jar, in config\, and in the src tree). Pass -SecretsFile, or pass -ClientId/-TenantId/-SiteUrl/-PfxPassword explicitly."
  }
  Write-Host "Reading SharePoint settings from $SecretsFile"
  $props = Get-Content $SecretsFile
  if (-not $ClientId)    { $ClientId    = Get-Prop $props 'sharepoint.azure.client-id' }
  if (-not $TenantId)    { $TenantId    = Get-Prop $props 'sharepoint.azure.tenant-id' }
  if (-not $PfxPassword) { $PfxPassword = Get-Prop $props 'sharepoint.azure.pfx-password' }
  if (-not $SiteUrl) {
    $host_ = Get-Prop $props 'sharepoint.site.hostname'
    $path  = Get-Prop $props 'sharepoint.site.path'
    if ($host_ -and $path) { $SiteUrl = "https://$host_$path" }
  }
}

foreach ($pair in @{ ClientId=$ClientId; TenantId=$TenantId; SiteUrl=$SiteUrl; PfxPassword=$PfxPassword }.GetEnumerator()) {
  if (-not $pair.Value) { throw "Missing required setting: $($pair.Key)" }
}
if (-not (Test-Path $CertPath))  { throw "Certificate not found: $CertPath" }
if (-not (Test-Path $LogsDir))   { throw "Logs folder not found: $LogsDir" }

Import-Module PnP.PowerShell -ErrorAction Stop

$securePfx = ConvertTo-SecureString $PfxPassword -AsPlainText -Force
Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Tenant $TenantId `
  -CertificatePath $CertPath -CertificatePassword $securePfx

# Ensure the target folder exists (Add-PnPFolder is idempotent per-segment).
$parts = $TargetFolder.Trim('/').Split('/')
$accum = $parts[0]            # the library, e.g. "Shared Documents"
for ($i = 1; $i -lt $parts.Count; $i++) {
  try { Add-PnPFolder -Name $parts[$i] -Folder $accum -ErrorAction Stop | Out-Null } catch {}
  $accum = "$accum/$($parts[$i])"
}

# Upload the current (non-archived) log files; overwrite so SharePoint always shows the latest.
$uploaded = 0
Get-ChildItem -Path $LogsDir -Filter *.log -File | ForEach-Object {
  Add-PnPFile -Path $_.FullName -Folder $TargetFolder -ErrorAction Stop | Out-Null
  Write-Host "Uploaded $($_.Name)"
  $uploaded++
}

Disconnect-PnPOnline
Write-Host "Done. $uploaded file(s) uploaded to $SiteUrl/$TargetFolder"
