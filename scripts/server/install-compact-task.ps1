<#
.SYNOPSIS
  Registers a Scheduled Task that reclaims H2 dead space on the hub weekly, off-hours, under SYSTEM.
  It stops the service, compacts ONLY if dead space exceeds the threshold, then restarts. Mirrors
  install-log-upload-task.ps1.

.EXAMPLE
  # Elevated PowerShell:
  .\install-compact-task.ps1
  .\install-compact-task.ps1 -DayOfWeek Sunday -At 3:30AM -MinDeadMB 200
#>
[CmdletBinding()]
param(
  [string]$TaskName  = "PowerPlantHub-Compact",
  [string]$DayOfWeek = "Sunday",
  [string]$At        = "3:30AM",
  [int]$MinDeadMB    = 200
)
$ErrorActionPreference = 'Stop'

$script = Join-Path $PSScriptRoot 'hub-maintenance-compact.ps1'
if (-not (Test-Path $script)) { throw "Maintenance script not found: $script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -MinDeadMB $MinDeadMB"

# Weekly, off-hours. The dead-space gate means most weeks it stops+checks+starts in seconds and
# skips the (expensive) DEFRAG entirely; it only reclaims when there is > $MinDeadMB MB to reclaim.
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $DayOfWeek -At $At

# SYSTEM => no login required, has rights to control the service and read/write the DB files.
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Registered scheduled task '$TaskName' ($DayOfWeek $At, only compacts when dead space > ${MinDeadMB}MB)."
Write-Host "Test it now with:  Start-ScheduledTask -TaskName $TaskName"
