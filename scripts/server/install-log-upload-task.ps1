<#
.SYNOPSIS
  Registers a Scheduled Task that uploads hub logs to SharePoint every few minutes,
  and once at boot. Runs headless (no login) under SYSTEM.

.EXAMPLE
  # Elevated PowerShell:
  .\install-log-upload-task.ps1 -AppDir C:\apps\power-plant-hub -IntervalMinutes 5
#>
[CmdletBinding()]
param(
  [string]$AppDir = (Resolve-Path "$PSScriptRoot\..\..").Path,
  [int]$IntervalMinutes = 5,
  [string]$TaskName = "PowerPlantHub-LogUpload"
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'upload-logs-to-sharepoint.ps1'
if (-not (Test-Path $script)) { throw "Uploader not found: $script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -AppDir `"$AppDir`""

# Repeat forever at the chosen interval, starting now; also fire once at startup.
$now      = Get-Date
$tInterval = New-ScheduledTaskTrigger -Once -At $now `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$tBoot    = New-ScheduledTaskTrigger -AtStartup

# SYSTEM account => no login required, can read the cert + logs.
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($tInterval, $tBoot) `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Registered scheduled task '$TaskName' (every $IntervalMinutes min + at startup)."
Write-Host "Test it now with:  Start-ScheduledTask -TaskName $TaskName"
