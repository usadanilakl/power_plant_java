<#
  hub-maintenance-compact.ps1  -  Reclaim H2 dead space on the hub, safely.

  WHAT IT DOES:
    1. Physical-size precheck: if db\proddb.mv.db is small, do nothing (no service bounce).
    2. Stop the PowerPlantHub service (releases the H2 file lock).
    3. Run the gated compaction (../database/h2-compact.ps1 -MinDeadMB): backs up first, and
       only SHUTDOWN DEFRAGs if dead space exceeds the threshold; otherwise skips.
    4. Start the service again (always, even if the compaction step fails).

  Intended for a Scheduled Task (see install-compact-task.ps1), but safe to run manually in an
  elevated shell. DEFRAG requires the app stopped, which is exactly what this does.

  USAGE (elevated):
    .\hub-maintenance-compact.ps1                       # gated: only compacts if dead space > 200MB
    .\hub-maintenance-compact.ps1 -MinDeadMB 0 -PrecheckFloorMB 0   # force compaction now
#>
[CmdletBinding()]
param(
  [string]$ServiceExe      = "C:\forms\power_plant\scripts\server\power-plant-hub.exe",
  [string]$ServiceName     = "PowerPlantHub",
  [string]$Db              = "",     # blank => <repo-root>\db\proddb (relative to this script)
  [string]$Java            = "",     # optional: path to java.exe if the hub has no java on PATH/JAVA_HOME
  [int]$MinDeadMB          = 200,    # only DEFRAG when reclaimable dead space exceeds this
  [int]$PrecheckFloorMB    = 250,    # don't even stop the service if the file is smaller than this
  [int]$LockWaitSeconds    = 10      # wait for the H2 lock to release after stopping
)
$ErrorActionPreference = "Stop"
function Log($m) { Write-Host ("[HubCompact] " + $m) }

$compact = Join-Path $PSScriptRoot "..\database\h2-compact.ps1"
if (-not (Test-Path $compact)) { throw "compaction script not found: $compact" }

# Resolve the DB file for the cheap precheck (avoid bouncing the service for a small DB).
$dbBase = if ($Db) { $Db } else { Join-Path $PSScriptRoot "..\..\db\proddb" }
$mv = "$dbBase.mv.db"
if (-not (Test-Path $mv)) { Log "DB not found: $mv - nothing to do."; exit 0 }
$sizeMB = [math]::Round((Get-Item $mv).Length / 1MB)
Log "$mv is $sizeMB MB (dead-space threshold ${MinDeadMB}MB, precheck floor ${PrecheckFloorMB}MB)"
if ($sizeMB -lt $PrecheckFloorMB) {
    Log "under the ${PrecheckFloorMB}MB floor - skipping (service NOT bounced)."
    exit 0
}

Log "stopping service $ServiceName ..."
& $ServiceExe stop | Out-Host
Start-Sleep -Seconds $LockWaitSeconds

try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $compact -Db $dbBase -MinDeadMB $MinDeadMB -Java $Java | Out-Host
} finally {
    Log "starting service $ServiceName ..."
    & $ServiceExe start | Out-Host
}
Log "done."
