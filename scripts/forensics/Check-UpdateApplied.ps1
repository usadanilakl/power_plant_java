<#
    Check-UpdateApplied.ps1

    Answers "did the Electron update actually apply on this client?" without needing the console.

    Why this exists: a failed update USED to look identical to a successful one - the app restarts
    either way. Twice during testing an update was reported as successful when it had not applied at
    all (see project/architecture/security/remediation-plan-2026-07.md). Judge by artifacts on disk,
    never by "it restarted".

    Run on the client. No admin needed.
#>

[CmdletBinding()]
param()

function Get-AppBase {
    foreach ($r in @("$env:APPDATA\DK Power Manager", "$env:APPDATA\electron-manager")) {
        if (Test-Path (Join-Path $r 'Local State')) { return $r }
    }
    return $null
}

$workingDir = Join-Path $env:PROGRAMDATA 'DK Power Manager\managed_apps\pid'
if (-not (Test-Path $workingDir)) {
    Write-Host "Working dir not found: $workingDir" -ForegroundColor Red
    Write-Host "(dev installs use <repo>\electron-manager\managed_apps\pid instead)"
    exit 1
}

Write-Host "=== Electron update status on $env:COMPUTERNAME ===" -ForegroundColor Cyan
Write-Host ""

# 1. Version record - written ONLY after a verified, completed apply.
$verFile = Join-Path $workingDir 'electron-version.json'
if (Test-Path $verFile) {
    $v = Get-Content $verFile -Raw | ConvertFrom-Json
    Write-Host "APPLIED VERSION" -ForegroundColor Green
    Write-Host ("  applied at : {0}" -f $v.appliedAt)
    Write-Host ("  file       : {0}" -f $v.fileName)
    Write-Host ("  checksum   : {0}..." -f $v.checksum.Substring(0, 16))
} else {
    Write-Host "NO VERSION RECORD - no update has ever completed on this machine" -ForegroundColor Yellow
}
Write-Host ""

# 2. Staging: deleted on success, PRESERVED on failure so the ZIP can be retried.
$staging = Join-Path $workingDir 'electron-update-staging'
if (Test-Path $staging) {
    Write-Host "STAGING DIR STILL PRESENT -> the last attempt FAILED (or one is pending)" -ForegroundColor Red
    Get-ChildItem $staging | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize | Out-String | Write-Host
    $log = Join-Path $staging 'update.log'
    if (Test-Path $log) {
        Write-Host "--- update.log (last 25 lines) ---" -ForegroundColor Yellow
        Get-Content $log -Tail 25 | ForEach-Object { Write-Host "  $_" }
    }
} else {
    Write-Host "Staging dir gone -> the last attempt reached the SUCCESS path" -ForegroundColor Green
}
Write-Host ""

# 3. Rollback copy - created by the swap, so its presence proves a swap happened.
$exe = Get-Process -Name 'DK Power Manager' -ErrorAction SilentlyContinue |
       Select-Object -First 1 -ExpandProperty Path
if (-not $exe) {
    $guess = Join-Path ${env:ProgramFiles} 'DK Power Manager\DK Power Manager.exe'
    if (Test-Path $guess) { $exe = $guess }
}
if ($exe) {
    $installDir = Split-Path $exe -Parent
    Write-Host ("Install dir : {0}" -f $installDir)
    foreach ($suffix in @('.prev', '.new')) {
        $d = "$installDir$suffix"
        if (Test-Path $d) {
            $when = (Get-Item $d).LastWriteTime
            if ($suffix -eq '.prev') {
                Write-Host ("  {0,-6} EXISTS ({1}) -> rollback available" -f $suffix, $when) -ForegroundColor Green
            } else {
                Write-Host ("  {0,-6} EXISTS ({1}) -> LEFTOVER, an apply did not finish" -f $suffix, $when) -ForegroundColor Red
            }
        } else {
            Write-Host ("  {0,-6} absent" -f $suffix)
        }
    }
} else {
    Write-Host "Could not locate the install dir (app not running and not in Program Files)." -ForegroundColor Yellow
}
Write-Host ""

# 4. One-click recovery script.
$rb = Join-Path $workingDir 'rollback.cmd'
if (Test-Path $rb) {
    Write-Host ("rollback.cmd present : {0}" -f $rb) -ForegroundColor Green
    Write-Host "  (close the app, then double-click it to restore the previous version)"
} else {
    Write-Host "rollback.cmd missing - no one-click recovery on this machine" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== VERDICT ===" -ForegroundColor Cyan
if ((Test-Path $verFile) -and -not (Test-Path $staging)) {
    Write-Host "Update applied successfully." -ForegroundColor Green
    Write-Host "Cross-check the 'applied at' timestamp above against when you published the build."
} elseif (Test-Path $staging) {
    Write-Host "Last update attempt FAILED. The previous version is still installed and running;" -ForegroundColor Red
    Write-Host "the ZIP is preserved, so 'Apply Update' can be retried. See update.log above."
} else {
    Write-Host "Inconclusive - no version record and no staging dir. Probably never updated." -ForegroundColor Yellow
}
