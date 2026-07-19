<#
  h2-compact.ps1  -  Inspect + shrink a bloated H2 database file (reclaim dead space).

  You normally do NOT run this directly - double-click one of the .bat files next to it:
    inspect-database.bat    -> read-only: shows size + biggest tables (changes nothing)
    compact-database.bat    -> backs up, then shrinks the file (SHUTDOWN DEFRAG)
    drop-audit-tables.bat   -> backs up, drops leftover Envers *_AUD / REVINFO tables, then shrinks

  It locates the DB, Java and the H2 jar automatically. Default DB = <repo-root>\db\proddb
  (this script lives in <repo-root>\scripts\database). Pure PowerShell - no git bash needed.

  Manual usage / overrides:
    .\h2-compact.ps1 -ReportOnly                       # just inspect
    .\h2-compact.ps1                                    # inspect + backup + shrink
    .\h2-compact.ps1 -Db C:\other\path\proddb          # different DB (NO .mv.db extension)
    .\h2-compact.ps1 -Password 'yourpass'              # different DB password
    .\h2-compact.ps1 -Jar "C:\...\h2-2.2.224.jar"      # if no local Maven cache on this machine
#>
param(
  [string]$Db       = "",              # DB path WITHOUT .mv.db; blank = <repo-root>\db\proddb
  [string]$User     = "sa",
  [string]$Password = "password",
  [string]$Jar      = "",              # optional: path to an h2-*.jar (auto-found if blank)
  [int]$MinDeadMB   = 0,               # only compact if dead space exceeds this many MB (0 = always)
  [switch]$ReportOnly,                 # only inspect; make no changes
  [switch]$DropAudit                   # also drop leftover Envers *_AUD / REVINFO tables before shrinking
)
$ErrorActionPreference = "Stop"
function Fail($m) { Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }

# --- default DB path is resolved relative to THIS script, not the current directory ---
if (-not $Db) { $Db = Join-Path $PSScriptRoot "..\..\db\proddb" }

# --- locate the DB file ---
$mv = "$Db.mv.db"
if (-not (Test-Path $mv)) { Fail "No database file found at: $mv" }
$mvFull = (Resolve-Path $mv).Path
$dbFull = $mvFull.Substring(0, $mvFull.Length - ".mv.db".Length)   # strip extension for JDBC url

# --- locate java ---
$java = (Get-Command java -ErrorAction SilentlyContinue).Source
if (-not $java -and $env:JAVA_HOME) { $java = Join-Path $env:JAVA_HOME "bin\java.exe" }
if (-not $java -or -not (Test-Path $java)) { Fail "Java not found on PATH or JAVA_HOME." }

# --- locate the H2 jar (prefer 2.2.x = the version the app uses; a NEWER one would upgrade the file format) ---
if (-not $Jar) {
  # 1) a jar bundled next to this script -> fully portable (works on a server with NO Maven cache)
  $pick = Get-ChildItem (Join-Path $PSScriptRoot "h2-*.jar") -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch 'sources|javadoc' } | Sort-Object Name | Select-Object -First 1
  # 2) fall back to the local Maven cache
  if (-not $pick) {
    $repo = Join-Path $env:USERPROFILE ".m2\repository\com\h2database\h2"
    $pick = Get-ChildItem "$repo\2.2.224\h2-2.2.224.jar" -ErrorAction SilentlyContinue
    if (-not $pick) { $pick = Get-ChildItem "$repo\2.2.*\h2-2.2.*.jar" -ErrorAction SilentlyContinue | Select-Object -First 1 }
    if (-not $pick) { $pick = Get-ChildItem "$repo\*\h2-*.jar" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch 'sources|javadoc' } | Sort-Object Name | Select-Object -First 1 }
  }
  if (-not $pick) { Fail "No H2 jar found. Put h2-2.2.224.jar next to this script (scripts\database\), or pass -Jar C:\path\to\h2-2.2.224.jar" }
  $Jar = $pick.FullName
}
if (-not (Test-Path $Jar)) { Fail "H2 jar not found: $Jar" }

function Run-Sql([string]$url, [string]$sql) { & $java -cp $Jar org.h2.tools.Shell -url $url -user $User -password $Password -sql $sql 2>&1 }

# --- fail fast + friendly if the DB is open (app running) — DEFRAG/inspect needs exclusive-ish access ---
$prevEap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
$probe = (& $java -cp $Jar org.h2.tools.Shell -url "jdbc:h2:file:$dbFull;ACCESS_MODE_DATA=r;IFEXISTS=TRUE" -user $User -password $Password -sql "SELECT 1" 2>&1 | Out-String)
$ErrorActionPreference = $prevEap
if ($probe -match "already in use|Locked|Database may be already") {
    Fail "The database is IN USE (the app/service is running). Stop it completely, then run this again."
}

$sizeBefore = (Get-Item $mvFull).Length
Write-Host ""
Write-Host "DB file : $mvFull"
Write-Host "H2 jar  : $Jar"
Write-Host "Java    : $java"
Write-Host ("Size now: {0:N0} bytes  ({1:N2} GB)" -f $sizeBefore, ($sizeBefore/1GB)) -ForegroundColor Cyan

# --- STEP 1: inspect (read-only; ACCESS_MODE_DATA=r cannot modify the file) ---
$roUrl = "jdbc:h2:file:$dbFull;ACCESS_MODE_DATA=r;IFEXISTS=TRUE"
Write-Host ""
Write-Host "Biggest tables (logical bytes):" -ForegroundColor Cyan
Run-Sql $roUrl "SELECT TABLE_NAME, DISK_SPACE_USED(TABLE_NAME) AS BYTES FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC' ORDER BY BYTES DESC LIMIT 20" | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Leftover Envers audit tables (*_AUD / REVINFO). If any appear here, tell me and I will drop them safely:" -ForegroundColor Yellow
Run-Sql $roUrl "SELECT TABLE_NAME, DISK_SPACE_USED(TABLE_NAME) AS BYTES FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC' AND (TABLE_NAME='REVINFO' OR RIGHT(TABLE_NAME,4)='_AUD') ORDER BY BYTES DESC" | ForEach-Object { Write-Host "  $_" }

if ($ReportOnly) { Write-Host ""; Write-Host "ReportOnly: no changes made." -ForegroundColor Green; exit 0 }

# --- STEP 1b: dead-space gate (used by automated callers: -MinDeadMB 200) ---
$logicalRaw = Run-Sql $roUrl "SELECT SUM(DISK_SPACE_USED(TABLE_NAME)) AS TOTAL FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC'"
$logLine = ($logicalRaw | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' } | Select-Object -First 1)
$logical = if ($logLine) { [long]$logLine } else { 0L }
$dead = $sizeBefore - $logical
if ($dead -lt 0) { $dead = 0 }
Write-Host ""
Write-Host ("Dead space: {0:N0} bytes ({1:N2} GB)   real data: {2:N0} bytes" -f $dead, ($dead/1GB), $logical) -ForegroundColor Cyan
if ($MinDeadMB -gt 0 -and $dead -lt ($MinDeadMB * 1MB)) {
    Write-Host ("Dead space is below the {0} MB threshold - skipping compaction (no changes)." -f $MinDeadMB) -ForegroundColor Green
    exit 0
}

# --- STEP 2: backup (timestamped, alongside the DB) ---
$stamp  = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$mvFull.$stamp.bak"
Write-Host ""
Write-Host "Backing up -> $backup ..." -ForegroundColor Yellow
Copy-Item -LiteralPath $mvFull -Destination $backup
Write-Host "Backup done." -ForegroundColor Green

# --- STEP 2b (optional): drop leftover Envers audit tables ---
if ($DropAudit) {
  Write-Host ""
  Write-Host "Looking for Envers audit tables to drop (*_AUD / REVINFO)..." -ForegroundColor Yellow
  $auditRaw = Run-Sql $roUrl "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC' AND (TABLE_NAME='REVINFO' OR RIGHT(TABLE_NAME,4)='_AUD') ORDER BY TABLE_NAME"
  $auditTables = @($auditRaw | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[A-Z0-9_]+$' -and $_ -ne 'TABLE_NAME' })
  if ($auditTables.Count -eq 0) {
    Write-Host "None found - nothing to drop (this DB has no Envers audit tables)." -ForegroundColor Green
  } else {
    $wUrl = "jdbc:h2:file:$dbFull;IFEXISTS=TRUE"
    foreach ($t in $auditTables) {
      Write-Host ("Dropping {0} ..." -f $t) -ForegroundColor Yellow
      Run-Sql $wUrl ('DROP TABLE IF EXISTS "' + $t + '" CASCADE') | ForEach-Object { Write-Host "  $_" }
    }
    Write-Host ("Dropped {0} audit table(s)." -f $auditTables.Count) -ForegroundColor Green
  }
}

# --- STEP 3: compact ---
Write-Host "Running SHUTDOWN DEFRAG (can take a minute on a large file)..." -ForegroundColor Yellow
$out = Run-Sql "jdbc:h2:file:$dbFull;IFEXISTS=TRUE" "SHUTDOWN DEFRAG"
$out | ForEach-Object { Write-Host "  $_" }
if ($out -match "already in use|Locked|Database may be already open") {
  Fail "The database is still IN USE. Stop the app completely, then run this again. (Your backup is safe.)"
}

# --- STEP 4: report ---
Start-Sleep -Milliseconds 300
$sizeAfter = (Get-Item $mvFull).Length
$saved = $sizeBefore - $sizeAfter
Write-Host ""
Write-Host ("Before   : {0:N0} bytes ({1:N2} GB)" -f $sizeBefore, ($sizeBefore/1GB))
Write-Host ("After    : {0:N0} bytes ({1:N2} GB)" -f $sizeAfter,  ($sizeAfter/1GB)) -ForegroundColor Green
Write-Host ("Reclaimed: {0:N0} bytes ({1:N2} GB)" -f $saved,      ($saved/1GB)) -ForegroundColor Green
Write-Host ""
Write-Host "Next: start the app and confirm it works. Once verified, delete the backup file:" -ForegroundColor Cyan
Write-Host ("  Remove-Item " + [char]34 + $backup + [char]34)
