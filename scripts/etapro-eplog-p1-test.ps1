# EtaPro EPLog - P1 Verification Harness
#
# Validates the EPLog scrape logic end-to-end (UI Automation trigger + settle + CSV
# export with newline flattening) against a real template, WITHOUT needing the full
# live/history scraper. Mirrors the logic now in scripts/etapro-scrape.ps1.
#
# BEFORE RUNNING:
#   1. Build template-eplog.xlsx (fixed anchor: Event-Time Start=D6, End=D7;
#      output table header at row 20, B='Description'..I='Crew'). Use your LOG.xlsx
#      layout as the model. (No Event ID column available - that's expected.)
#   2. Open that template-eplog.xlsx in Excel (EtaPRO add-in loaded, window RESTORED).
#   3. Run this script. It writes the date window, clicks Refresh EPLog via UIA,
#      waits for settle, exports a CSV, and prints the first rows.
#
# It does NOT save the workbook. Pure ASCII (safe to copy between machines).

param(
    [string]$startDate  = "",                                   # ISO; default = now-24h
    [string]$endDate    = "",                                   # ISO; default = now
    [string]$outputPath = "$env:TEMP\etapro_eplog_test.csv"
)

$ErrorActionPreference = "Continue"
$outFile = Join-Path $env:TEMP "etapro-eplog-p1-test-output.txt"
Start-Transcript -Path $outFile -Force | Out-Null

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

# ---- EPLog layout constants (must match template-eplog.xlsx / etapro-scrape.ps1) ----
$xlUp = -4162; $xlToLeft = -4159; $xlNormal = -4143
$EPLOG_START_CELL = "D6"; $EPLOG_END_CELL = "D7"
$EPLOG_HEADER_ROW = 20; $EPLOG_FIRST_COL = 2; $EPLOG_SELECT_CELL = "B21"
$POLL_MS = 400; $STABLE_READS = 4; $TIMEOUT_SEC = 90

function Banner($t) { Write-Host ""; Write-Host ("=" * 72); Write-Host "  $t"; Write-Host ("=" * 72) }

function Invoke-EtaProRibbonButton {
    param([string]$windowTitleHint, [string]$tabName = "EtaPRO", [string]$buttonName = "Refresh EPLog")
    $AE = [System.Windows.Automation.AutomationElement]
    $TSd = [System.Windows.Automation.TreeScope]::Descendants
    $TSc = [System.Windows.Automation.TreeScope]::Children
    $CT = [System.Windows.Automation.ControlType]
    $root = $AE::RootElement
    $winCond = New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Window)
    $wins = $root.FindAll($TSc, $winCond)
    $target = $null; $hint = $windowTitleHint.ToLower()
    foreach ($w in $wins) {
        try { $n = "$($w.Current.Name)".ToLower(); if ($n.Contains($hint) -and $n.Contains("excel")) { $target = $w; break } } catch {}
    }
    if ($null -eq $target) { throw "Could not find Excel window matching '$windowTitleHint'" }
    $tabCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::TabItem)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $tabName)))
    $tab = $target.FindFirst($TSd, $tabCond)
    if ($tab) {
        $sel = $null
        if ($tab.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$sel)) { $sel.Select(); Start-Sleep -Milliseconds 300 }
    } else { Write-Host "  WARN: tab '$tabName' not found" }
    $btnCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Button)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $buttonName)))
    $btn = $target.FindFirst($TSd, $btnCond)
    if ($null -eq $btn) { throw "Button '$buttonName' not found" }
    $inv = $null
    if (-not $btn.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$inv)) { throw "Button '$buttonName' has no Invoke pattern" }
    $inv.Invoke()
}

function Get-State($ws) {
    try {
        $last = $ws.Cells($ws.Rows.Count, $EPLOG_FIRST_COL).End($xlUp).Row
        $d = "$($ws.Cells($EPLOG_HEADER_ROW + 1, $EPLOG_FIRST_COL).Value2)"
        $t = "$($ws.Cells($EPLOG_HEADER_ROW + 1, 6).Value2)"
        if ($d.Length -gt 40) { $d = $d.Substring(0,40) }
        return @{ busy=$false; lastRow=$last; rows=($last - $EPLOG_HEADER_ROW); fp="$last|$d|$t" }
    } catch { return @{ busy=$true; lastRow=-1; rows=-1; fp="BUSY" } }
}

function Wait-Settle($ws, $baselineFp) {
    $deadline = (Get-Date).AddSeconds($TIMEOUT_SEC); $start = Get-Date
    $changed=$false; $stable=0; $lastFp=""
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds $POLL_MS
        $s = Get-State $ws
        $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
        $ch = if ($s.busy) { "busy" } elseif ($s.fp -ne $baselineFp) { "CHANGED" } else { "same" }
        Write-Host ("    t=+{0,5}s  rows={1,4}  {2}" -f $elapsed, $s.rows, $ch)
        if ($s.busy) { $stable=0; continue }
        if ($s.fp -ne $baselineFp) { $changed=$true }
        if ($s.fp -eq $lastFp) { $stable++ } else { $stable=0; $lastFp=$s.fp }
        if ($changed -and $stable -ge $STABLE_READS) { Write-Host "  SETTLED after $elapsed s"; return $s }
    }
    Write-Host "  TIMEOUT after $TIMEOUT_SEC s (changed=$changed)"; return (Get-State $ws)
}

function Export-EpLog($ws, $path) {
    $lastRow = $ws.Cells($ws.Rows.Count, $EPLOG_FIRST_COL).End($xlUp).Row
    $lastCol = $ws.Cells($EPLOG_HEADER_ROW, $ws.Columns.Count).End($xlToLeft).Column
    if ($lastRow -lt $EPLOG_HEADER_ROW) { $lastRow = $EPLOG_HEADER_ROW }
    if ($lastCol -lt $EPLOG_FIRST_COL) { $lastCol = $EPLOG_FIRST_COL }
    $sb = New-Object System.Text.StringBuilder
    for ($r = $EPLOG_HEADER_ROW; $r -le $lastRow; $r++) {
        $fields = @()
        for ($c = $EPLOG_FIRST_COL; $c -le $lastCol; $c++) {
            $v = [string]$ws.Cells($r, $c).Value2
            $v = $v -replace "`r`n", " | " -replace "`n", " | " -replace "`r", " | "
            if ($v -match '[,"]') { $v = '"' + ($v -replace '"', '""') + '"' }
            $fields += $v
        }
        [void]$sb.AppendLine(($fields -join ","))
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $sb.ToString(), $utf8NoBom)
}

# ---- attach ----
Banner "ATTACH"
$excel = $null
try { $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") }
catch { Write-Host "FAILED to attach: $($_.Exception.Message)"; Stop-Transcript | Out-Null; return }
try { $excel.WindowState = $xlNormal } catch {}
$wb = $excel.ActiveWorkbook
$ws = $excel.ActiveSheet
$wbName = [System.IO.Path]::GetFileNameWithoutExtension($wb.Name)
Write-Host "Workbook: $($wb.Name)   Sheet: $($ws.Name)"

# ---- verify layout ----
Banner "VERIFY LAYOUT"
$lblStart = "$($ws.Range('C6').Value2)"; $lblHdr = "$($ws.Range('B20').Value2)"
Write-Host "C6='$lblStart' (expect 'Start Time:')   B20='$lblHdr' (expect 'Description')"
if ($lblStart -notlike "Start*" -or $lblHdr -ne "Description") {
    Write-Host "Layout does not match expected EPLog anchor. Aborting WITHOUT changes."
    Stop-Transcript | Out-Null; return
}

# ---- resolve window ----
Banner "PULL WINDOW"
if ([string]::IsNullOrWhiteSpace($endDate))   { $endOa = (Get-Date).ToOADate() }   else { $endOa = ([datetime]$endDate).ToOADate() }
if ([string]::IsNullOrWhiteSpace($startDate)) { $startOa = $endOa - 1.0 }           else { $startOa = ([datetime]$startDate).ToOADate() }
Write-Host ("Start ({0}) = {1}  [{2}]" -f $EPLOG_START_CELL, $startOa, ([DateTime]::FromOADate($startOa)))
Write-Host ("End   ({0}) = {1}  [{2}]" -f $EPLOG_END_CELL, $endOa, ([DateTime]::FromOADate($endOa)))

# ---- write window, refresh, settle ----
Banner "REFRESH VIA UIA"
$baseline = (Get-State $ws).fp
$ws.Range($EPLOG_START_CELL).Value2 = $startOa
$ws.Range($EPLOG_END_CELL).Value2   = $endOa
try { $ws.Range($EPLOG_SELECT_CELL).Select() | Out-Null } catch {}
Write-Host "Invoking 'Refresh EPLog' on window '$wbName'..."
try { Invoke-EtaProRibbonButton -windowTitleHint $wbName -buttonName "Refresh EPLog" }
catch {
    Write-Host "  'Refresh EPLog' failed: $($_.Exception.Message); trying 'Refresh Sheet'"
    try { Invoke-EtaProRibbonButton -windowTitleHint $wbName -buttonName "Refresh Sheet" } catch { Write-Host "  also failed: $($_.Exception.Message)" }
}
$final = Wait-Settle $ws $baseline
Write-Host "Final data rows: $($final.rows)"

# ---- export + preview ----
Banner "EXPORT CSV"
Export-EpLog $ws $outputPath
if (Test-Path $outputPath) {
    $lines = Get-Content $outputPath
    Write-Host "Wrote $($lines.Count) lines to: $outputPath"
    Write-Host "--- first rows (header + up to 5 data rows) ---"
    $lines | Select-Object -First 6 | ForEach-Object { Write-Host "  $_" }
} else { Write-Host "ERROR: no CSV produced at $outputPath" }

Banner "DONE"
Write-Host "Workbook NOT saved. Paste this file back:"
Write-Host "  $outFile"
Stop-Transcript | Out-Null
Write-Host ""
Write-Host "Saved to: $outFile"
