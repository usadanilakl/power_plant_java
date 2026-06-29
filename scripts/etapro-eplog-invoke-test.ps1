# EtaPro EPLog - Live Invoke Test
#
# Goal: prove we can trigger "Refresh EPLog" via UI Automation, and learn HOW to
# detect when the refresh has finished (the one thing we can't see by inspection).
#
# WHAT IT DOES (and DOESN'T):
#   - Reads your current Event-Time window (D6/D7) and the current log table.
#   - TEMPORARILY narrows the Start time to (End - 2 hours) so the refreshed result
#     is visibly different -> that difference proves the Invoke actually fired.
#   - Triggers refresh via UIA and POLLS the table, logging row count + timing,
#     so we can see how long the query takes and how completion looks.
#   - RESTORES your original window and refreshes again to put the sheet back.
#   - Does NOT save the workbook. If anything looks off, just close Excel WITHOUT
#     saving and you lose nothing.
#
# BEFORE RUNNING:
#   1. Excel open with LOG.xlsx, EtaPRO add-in loaded, window RESTORED (not minimized).
#   2. The sheet with the EPLog is the active sheet.
#   (You do NOT need to pre-select the EtaPRO tab - the script selects it via UIA.)
#
# Pure ASCII so it survives copying between machines.

$ErrorActionPreference = "Continue"
$outFile = Join-Path $env:TEMP "etapro-eplog-invoke-test-output.txt"
Start-Transcript -Path $outFile -Force | Out-Null

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Banner($t) { Write-Host ""; Write-Host ("=" * 72); Write-Host "  $t"; Write-Host ("=" * 72) }

# ---- config: cell layout discovered by probe #1 ----
$startCell    = "D6"     # Event Time - Start
$endCell      = "D7"     # Event Time - End
$dataCol      = 2        # column B
$headerRow    = 20       # 'Description' header row
$sampleDesc   = "B21"    # first data row description
$sampleTime   = "F21"    # first data row create time
$xlUp         = -4162
$xlNormal     = -4143
$narrowHours  = 2.0      # temporary window size for the test
$pollMs       = 400
$timeoutSec   = 90
$stableReads  = 4        # consecutive unchanged reads = settled

function Invoke-EtaProRibbonButton {
    param([string]$tabName = "EtaPRO", [string]$buttonName = "Refresh EPLog")
    $AE = [System.Windows.Automation.AutomationElement]
    $TS = [System.Windows.Automation.TreeScope]::Descendants
    $CT = [System.Windows.Automation.ControlType]
    $proc = Get-Process EXCEL -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($null -eq $proc) { throw "No Excel window handle (minimized to tray?)" }
    $root = $AE::FromHandle($proc.MainWindowHandle)

    $tabCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::TabItem)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $tabName)))
    $tab = $root.FindFirst($TS, $tabCond)
    if ($tab) {
        $sel = $null
        if ($tab.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$sel)) {
            $sel.Select(); Start-Sleep -Milliseconds 300
        }
    } else { Write-Host "  WARN: tab '$tabName' not found (continuing - button may still be reachable)" }

    $btnCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Button)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $buttonName)))
    $btn = $root.FindFirst($TS, $btnCond)
    if ($null -eq $btn) { throw "Button '$buttonName' not found" }
    $inv = $null
    if (-not $btn.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$inv)) {
        throw "Button '$buttonName' has no Invoke pattern"
    }
    $inv.Invoke()
}

# Read the table state; returns a hashtable. Catches COM-busy (query running).
function Get-State($ws) {
    try {
        $last = $ws.Cells($ws.Rows.Count, $dataCol).End($xlUp).Row
        $d = "$($ws.Range($sampleDesc).Value2)"
        $t = "$($ws.Range($sampleTime).Value2)"
        if ($d.Length -gt 40) { $d = $d.Substring(0,40) }
        return @{ busy=$false; lastRow=$last; rows=($last - $headerRow); fp="$last|$d|$t" }
    } catch {
        return @{ busy=$true; lastRow=-1; rows=-1; fp="BUSY" }
    }
}

# Poll until the fingerprint changes from baseline AND then stays stable.
function Wait-Settle($ws, $baselineFp, $label) {
    Write-Host "  [$label] polling (baseline rows below)..."
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    $start = Get-Date
    $changed = $false
    $stable = 0
    $lastFp = ""
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds $pollMs
        $s = Get-State $ws
        $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
        $ch = if ($s.busy) { "busy" } elseif ($s.fp -ne $baselineFp) { "CHANGED" } else { "same-as-baseline" }
        Write-Host ("    t=+{0,5}s  rows={1,4}  {2}" -f $elapsed, $s.rows, $ch)
        if ($s.busy) { $stable = 0; continue }
        if ($s.fp -ne $baselineFp) { $changed = $true }
        if ($s.fp -eq $lastFp) { $stable++ } else { $stable = 0; $lastFp = $s.fp }
        if ($changed -and $stable -ge $stableReads) {
            Write-Host ("  [$label] SETTLED after {0}s (stable for {1} reads)" -f $elapsed, $stableReads)
            return $s
        }
    }
    Write-Host "  [$label] TIMEOUT after $timeoutSec s (changed=$changed)"
    return (Get-State $ws)
}

# ---- attach ----
Banner "ATTACH"
$excel = $null
try { $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") }
catch { Write-Host "FAILED to attach: $($_.Exception.Message)"; Stop-Transcript | Out-Null; return }
try { $excel.WindowState = $xlNormal } catch {}
$ws = $excel.ActiveSheet
$wb = $excel.ActiveWorkbook
Write-Host "Workbook: $($wb.Name)   Sheet: $($ws.Name)"
try { $ws.Activate() } catch {}

# ---- verify layout before touching anything ----
Banner "VERIFY LAYOUT (safety check)"
$lblStart = "$($ws.Range('C6').Value2)"
$lblHdr   = "$($ws.Range('B20').Value2)"
Write-Host "C6='$lblStart'  (expect 'Start Time:')   B20='$lblHdr'  (expect 'Description')"
if ($lblStart -notlike "Start*" -or $lblHdr -ne "Description") {
    Write-Host ""
    Write-Host "Layout does NOT match the probed LOG.xlsx. Aborting WITHOUT changes."
    Write-Host "Make sure the EPLog sheet is active and matches the original layout."
    Stop-Transcript | Out-Null; return
}

# ---- capture original ----
Banner "CAPTURE ORIGINAL WINDOW + TABLE"
$origStart = $ws.Range($startCell).Value2
$origEnd   = $ws.Range($endCell).Value2
function Oa($v) { try { return [DateTime]::FromOADate([double]$v).ToString("yyyy-MM-dd HH:mm") } catch { return "<n/a>" } }
Write-Host "Start ($startCell) = $origStart  [$(Oa $origStart)]"
Write-Host "End   ($endCell) = $origEnd  [$(Oa $origEnd)]"
$before = Get-State $ws
Write-Host "Current table: lastRow=$($before.lastRow)  dataRows=$($before.rows)  fp='$($before.fp)'"

# ---- TEST: narrow window, refresh, measure ----
Banner "TEST REFRESH (window narrowed to last $narrowHours h)"
$newStart = [double]$origEnd - ($narrowHours / 24.0)
Write-Host "Setting Start ($startCell) = $newStart  [$(Oa $newStart)]   (End unchanged)"
$ws.Range($startCell).Value2 = $newStart
try { $ws.Range($sampleDesc).Select() | Out-Null } catch {}   # select a cell inside the log
Write-Host "Invoking 'Refresh EPLog'..."
$invokeOk = $true
try { Invoke-EtaProRibbonButton -buttonName "Refresh EPLog" }
catch {
    Write-Host "  'Refresh EPLog' failed: $($_.Exception.Message)"
    Write-Host "  Falling back to 'Refresh Sheet'..."
    try { Invoke-EtaProRibbonButton -buttonName "Refresh Sheet" } catch { Write-Host "  'Refresh Sheet' also failed: $($_.Exception.Message)"; $invokeOk = $false }
}
if ($invokeOk) {
    $after = Wait-Settle $ws $before.fp "TEST"
    Write-Host ""
    Write-Host "RESULT: before dataRows=$($before.rows)  ->  after dataRows=$($after.rows)"
    if ($after.fp -ne $before.fp) { Write-Host "  => Table CHANGED: Invoke confirmed working." }
    else { Write-Host "  => Table did NOT change (window may have had same rows, or Invoke had no effect)." }
}

# ---- RESTORE ----
Banner "RESTORE ORIGINAL WINDOW"
Write-Host "Restoring Start=$origStart, End=$origEnd and refreshing again..."
$ws.Range($startCell).Value2 = $origStart
$ws.Range($endCell).Value2   = $origEnd
try { $ws.Range($sampleDesc).Select() | Out-Null } catch {}
try {
    try { Invoke-EtaProRibbonButton -buttonName "Refresh EPLog" } catch { Invoke-EtaProRibbonButton -buttonName "Refresh Sheet" }
    $restored = Wait-Settle $ws "force-change-marker" "RESTORE"
    Write-Host "Restored table: dataRows=$($restored.rows)  (original was $($before.rows))"
} catch { Write-Host "Restore refresh failed: $($_.Exception.Message)" }

Banner "DONE"
Write-Host "Workbook was NOT saved. If anything looks wrong, close Excel WITHOUT saving."
Write-Host "Paste this file back:"
Write-Host "  $outFile"
Stop-Transcript | Out-Null
Write-Host ""
Write-Host "Saved to: $outFile"
