# EtaPro Excel Scraper — Persistent Dual-Template COM Automation
#
# Runs as a long-lived process. Excel + EtaPro add-in stay open.
# Up to three workbooks are kept open simultaneously:
#   - template-live.xlsx    : column layout, GetEPCurrent formulas, 100 slots
#   - template-history.xlsx : pivot layout, Calculated Values array formulas, 20 slots
#   - template-eplog.xlsx   : (optional) Event Log; refreshed via UI Automation
#
# Live/History need no VBA macros - Excel's built-in recalc + EtaPro's async query
# functions do the work. EPLog is command-driven (changing date cells does NOT recalc),
# so the "eplog" branch clicks the "Refresh EPLog" Ribbon button via UI Automation.
# Templates are plain .xlsx workbooks.
#
# Java communicates via signal files in the working directory:
#   Java writes:  request.json  → { template, startDate, endDate, pointIds, outputPath }
#   Script writes: response.json → { status, message, lineCount }
#
# request.json schema:
#   {
#     "template":   "live" | "history" | "eplog",
#     "startDate":  "2026-04-09T10:00:00",  // history/eplog window start (ignored for live)
#     "endDate":    "2026-04-09T10:05:00",  // history/eplog window end   (ignored for live)
#     "pointIds":   "P1,P2,P3",              // live/history only; ignored for eplog
#     "outputPath": "C:\\...\\output\\etapro_data.csv"
#   }
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File etapro-scrape.ps1 `
#     -liveTemplatePath "etapro/template-live.xlsx" `
#     -historyTemplatePath "etapro/template-history.xlsx" `
#     -signalDir "etapro/signal" `
#     -eplogTemplatePath "etapro/template-eplog.xlsx"   # optional

param(
    [Parameter(Mandatory=$true)]
    [string]$liveTemplatePath,

    [Parameter(Mandatory=$true)]
    [string]$historyTemplatePath,

    [Parameter(Mandatory=$true)]
    [string]$signalDir,

    # Optional: EtaPRO Event Log (EPLog) template. When set, a third workbook is
    # opened and "eplog" requests are served via UI Automation (Refresh EPLog).
    [Parameter(Mandatory=$false)]
    [string]$eplogTemplatePath = ""
)

$ErrorActionPreference = "Stop"

# ── Constants ───────────────────────────────────────────────────
$LIVE_MAX_POINTS = 100
$HISTORY_MAX_POINTS = 20
$xlUp = -4162
$xlToLeft = -4159
$xlNormal = -4143
$xlMinimized = -4140

# EPLog (Event Log) template layout - fixed anchor (see eplog-scraper-plan.md):
#   D6 = Event-Time Start, D7 = Event-Time End (Excel serial date-times)
#   row 20 = column headers (B='Description' ... I='Crew'), data from row 21
$EPLOG_START_CELL = "D6"
$EPLOG_END_CELL   = "D7"
$EPLOG_HEADER_ROW = 20
$EPLOG_FIRST_COL  = 2          # column B
$EPLOG_SELECT_CELL = "B21"     # a cell inside the log (refresh context)
$EPLOG_POLL_MS    = 400
$EPLOG_STABLE_READS = 4
$EPLOG_SETTLE_TIMEOUT_SEC = 90

# Load UI Automation (used only by the EPLog branch to click "Refresh EPLog").
try {
    Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop
    Add-Type -AssemblyName UIAutomationTypes -ErrorAction Stop
    $script:uiaAvailable = $true
} catch {
    $script:uiaAvailable = $false
    Write-Host "[EtaPro] WARN: UI Automation not available - EPLog requests will fail: $($_.Exception.Message)"
}

# ── Helpers ─────────────────────────────────────────────────────

function CsvEscape {
    param([string]$value)
    if ($null -eq $value) { return "" }
    if ($value -match '[,"\r\n]') {
        return '"' + ($value -replace '"', '""') + '"'
    }
    return $value
}

function WriteResponse {
    param(
        [string]$signalDir,
        [string]$status,
        [string]$message,
        $rawLineCount = 0
    )
    # Safely extract a plain number — COM output leaks can make this an Object[]
    $lc = 0
    try { $lc = [int]"$rawLineCount" } catch { $lc = 0 }

    $resp = @{
        status = $status
        message = $message
        lineCount = $lc
        timestamp = (Get-Date -Format "o")
    } | ConvertTo-Json
    # Use UTF8NoBOM — PowerShell 5.1's [System.Text.Encoding]::UTF8 emits a BOM
    # which Jackson can't parse. New-Object gives us the no-BOM variant.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText("$signalDir\response.json", $resp, $utf8NoBom)
}

# ── EPLog UI Automation helpers ─────────────────────────────────
# EtaPRO is a VSTO/COM add-in with no callable refresh API (no VBA, no CommandBar,
# COMAddIns(...).Object is null). The only way to trigger a log refresh is to invoke
# the "Refresh EPLog" Ribbon button via UI Automation. Excel 2013+ is SDI (one window
# per workbook), so we locate the EPLog workbook's window by title, then invoke.

function Invoke-EtaProRibbonButton {
    param(
        [string]$windowTitleHint,           # e.g. the EPLog workbook name
        [string]$tabName = "EtaPRO",
        [string]$buttonName = "Refresh EPLog"
    )
    $AE  = [System.Windows.Automation.AutomationElement]
    $TSd = [System.Windows.Automation.TreeScope]::Descendants
    $TSc = [System.Windows.Automation.TreeScope]::Children
    $CT  = [System.Windows.Automation.ControlType]

    # Find the Excel top-level window for the EPLog workbook (SDI = one window per wb)
    $root = $AE::RootElement
    $winCond = New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Window)
    $wins = $root.FindAll($TSc, $winCond)
    $target = $null
    $hint = $windowTitleHint.ToLower()
    foreach ($w in $wins) {
        try {
            $n = "$($w.Current.Name)".ToLower()
            if ($n.Contains($hint) -and $n.Contains("excel")) { $target = $w; break }
        } catch {}
    }
    if ($null -eq $target) { throw "Could not find Excel window matching '$windowTitleHint'" }

    # Select the EtaPRO ribbon tab so its controls are realized in the tree
    $tabCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::TabItem)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $tabName)))
    $tab = $target.FindFirst($TSd, $tabCond)
    if ($tab) {
        $sel = $null
        if ($tab.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$sel)) {
            $sel.Select(); Start-Sleep -Milliseconds 300
        }
    } else {
        Write-Host "[EtaPro] WARN: ribbon tab '$tabName' not found (button may still be reachable)"
    }

    # Find the button by Name (AutomationId is empty for VSTO ribbon buttons) and Invoke
    $btnCond = New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Button)),
        (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, $buttonName)))
    $btn = $target.FindFirst($TSd, $btnCond)
    if ($null -eq $btn) { throw "Button '$buttonName' not found on window '$windowTitleHint'" }
    $inv = $null
    if (-not $btn.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$inv)) {
        throw "Button '$buttonName' does not support Invoke"
    }
    $inv.Invoke()
}

# Read the EPLog table state (last data row + a fingerprint). Catches COM-busy while
# the historian query is running.
function Get-EpLogState {
    param([object]$worksheet)
    try {
        $last = $worksheet.Cells($worksheet.Rows.Count, $EPLOG_FIRST_COL).End($xlUp).Row
        $desc = "$($worksheet.Cells($EPLOG_HEADER_ROW + 1, $EPLOG_FIRST_COL).Value2)"
        $ctime = "$($worksheet.Cells($EPLOG_HEADER_ROW + 1, 6).Value2)"   # col F = Create Time
        if ($desc.Length -gt 40) { $desc = $desc.Substring(0, 40) }
        return @{ busy = $false; lastRow = $last; fp = "$last|$desc|$ctime" }
    } catch {
        return @{ busy = $true; lastRow = -1; fp = "BUSY" }
    }
}

# A refresh is a clear-then-repopulate cycle: for ~1.3s the OLD data still shows, then
# the output region is wiped, then refilled. So we wait for a CHANGE from the baseline,
# then for the table to hold stable for N reads. Returns final state.
function Wait-EpLogSettle {
    param([object]$worksheet, [string]$baselineFp)
    $deadline = (Get-Date).AddSeconds($EPLOG_SETTLE_TIMEOUT_SEC)
    $changed = $false
    $stable = 0
    $lastFp = ""
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds $EPLOG_POLL_MS
        $s = Get-EpLogState $worksheet
        if ($s.busy) { $stable = 0; continue }
        if ($s.fp -ne $baselineFp) { $changed = $true }
        if ($s.fp -eq $lastFp) { $stable++ } else { $stable = 0; $lastFp = $s.fp }
        if ($changed -and $stable -ge $EPLOG_STABLE_READS) { return $s }
    }
    Write-Host "[EtaPro] WARN: EPLog settle timed out after ${EPLOG_SETTLE_TIMEOUT_SEC}s (changed=$changed)"
    return (Get-EpLogState $worksheet)
}

# Track last live point list so we only rewrite cells when the subscription changes
$script:lastLivePointIds = ""

# ── LIVE template processor ─────────────────────────────────────
# Layout: column A = point IDs, column B = =@GetEPCurrent(1, A{row}, Source, 192.168.190.85)
# Strategy: write points to column A ONLY when the list changes. Every cycle just recalculates.
function ProcessLiveRequest {
    param(
        [object]$workbook,
        [object]$request
    )

    $wsData = $workbook.Sheets("Data")

    $points = @()
    if ($request.pointIds) { $points = @($request.pointIds -split ",") }
    $count = [Math]::Min($points.Length, $LIVE_MAX_POINTS)
    $currentPointIds = $request.pointIds

    # Only rewrite column A if the point list changed since last cycle
    if ($currentPointIds -ne $script:lastLivePointIds) {
        Write-Host "[EtaPro] Point list changed, updating column A ($count points)"
        [void]$wsData.Range("A1:A$LIVE_MAX_POINTS").ClearContents()
        for ($i = 0; $i -lt $count; $i++) {
            $wsData.Cells($i + 1, 1).Value2 = $points[$i].Trim()
        }
        $script:lastLivePointIds = $currentPointIds
    }

    # Recalculate to refresh GetEPCurrent values
    [void]$workbook.Application.Calculate()
    try {
        [void]$workbook.Application.CalculateUntilAsyncQueriesDone()
    } catch {
        Start-Sleep -Milliseconds 500
    }

    # Stamp current timestamp for all rows (GetEPCurrent gives "now" values)
    $timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")

    # Build flat CSV: PointId,Timestamp,Value,Quality
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("PointId,Timestamp,Value,Quality")

    $exportedRows = 0
    for ($i = 0; $i -lt $count; $i++) {
        $row = $i + 1
        $pointId = [string]$wsData.Cells($row, 1).Value2
        $valueCell = $wsData.Cells($row, 2).Value2
        if ([string]::IsNullOrEmpty($pointId)) { continue }

        $valueStr = if ($null -eq $valueCell) { "" } else { [string]$valueCell }

        # EtaPro may return "#GETTING_DATA" or similar — pass through; Java parser handles invalid as null
        $quality = if ($valueStr -match '^#') { "Bad" } else { "Good" }

        $line = "$(CsvEscape $pointId),$timestamp,$(CsvEscape $valueStr),$quality"
        [void]$sb.AppendLine($line)
        $exportedRows++
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($request.outputPath, $sb.ToString(), $utf8NoBom)
    return $exportedRows
}

# ── HISTORY template processor ──────────────────────────────────
# Layout: row 1 = point ID headers (B1:U1), col A = timestamps, B:U columns = values
# Strategy: write Config!B1/B2 (start/end), write point headers, wait for async, export pivot CSV.
function ProcessHistoryRequest {
    param(
        [object]$workbook,
        [object]$request
    )

    $wsConfig = $workbook.Sheets("Config")
    $wsData   = $workbook.Sheets("Data")

    # 1. Update time range (triggers array formula recalculation)
    $wsConfig.Range("B1").Value2 = $request.startDate
    $wsConfig.Range("B2").Value2 = $request.endDate

    # 2. Write point IDs into row 1 of Data sheet (B1:U1, 20 slots)
    $points = @()
    if ($request.pointIds) { $points = @($request.pointIds -split ",") }

    # Clear the 20 header slots
    [void]$wsData.Range("B1:U1").ClearContents()
    for ($i = 0; $i -lt $points.Length -and $i -lt $HISTORY_MAX_POINTS; $i++) {
        $wsData.Cells(1, $i + 2).Value2 = $points[$i].Trim()
    }

    # Ensure A1 has "Timestamp" so Java parser auto-detects pivot format
    if ([string]::IsNullOrEmpty($wsData.Range("A1").Value2)) {
        $wsData.Range("A1").Value2 = "Timestamp"
    }

    # 3. Wait for async historian queries to finish
    try {
        [void]$workbook.Application.CalculateUntilAsyncQueriesDone()
    } catch {
        [void]$workbook.Application.CalculateFull()
        Start-Sleep -Seconds 2
    }

    # 4. Export the Data sheet as pivot-format CSV
    ExportPivotSheetToCsv $wsData $request.outputPath

    if (-not (Test-Path $request.outputPath)) {
        throw "History output file not created at: $($request.outputPath)"
    }

    $lineCount = (Get-Content $request.outputPath | Measure-Object -Line).Lines
    return $lineCount
}

function ExportPivotSheetToCsv {
    param(
        [object]$worksheet,
        [string]$filePath
    )

    $lastRow = $worksheet.Cells($worksheet.Rows.Count, 1).End($xlUp).Row
    $lastCol = $worksheet.Cells(1, $worksheet.Columns.Count).End($xlToLeft).Column

    if ($lastRow -lt 1) { $lastRow = 1 }
    if ($lastCol -lt 1) { $lastCol = 1 }

    $sb = New-Object System.Text.StringBuilder
    for ($row = 1; $row -le $lastRow; $row++) {
        $fields = @()
        for ($col = 1; $col -le $lastCol; $col++) {
            $val = [string]$worksheet.Cells($row, $col).Value2
            $fields += (CsvEscape $val)
        }
        [void]$sb.AppendLine(($fields -join ","))
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($filePath, $sb.ToString(), $utf8NoBom)
}

# ── EPLOG (Event Log) processor ─────────────────────────────────
# Layout: fixed-anchor EPLog. Header param cells D6/D7 (Event-Time start/end), output
# table from row 20 (B='Description' ... I='Crew'). Refresh is command-driven (NOT recalc)
# so we write the window cells then click "Refresh EPLog" via UI Automation, wait for the
# clear-then-repopulate cycle to settle, and export the table.
function ProcessEpLogRequest {
    param(
        [object]$workbook,
        [object]$request
    )

    $ws = $workbook.Sheets(1)   # single-sheet EPLog template

    # 1. Bring the EPLog window forward + restore (UI Automation needs it not minimized)
    [void]$workbook.Activate()
    try { $workbook.Application.WindowState = $xlNormal } catch {}
    Start-Sleep -Milliseconds 200

    # 2. Write the Event-Time window as Excel serial date-times (avoids locale parsing)
    if ($request.startDate) { $ws.Range($EPLOG_START_CELL).Value2 = ([datetime]$request.startDate).ToOADate() }
    if ($request.endDate)   { $ws.Range($EPLOG_END_CELL).Value2   = ([datetime]$request.endDate).ToOADate() }

    # 3. Select a cell inside the log so "Refresh EPLog" targets this log
    try { [void]$ws.Range($EPLOG_SELECT_CELL).Select() } catch {}

    # 4. Snapshot baseline, then trigger the refresh via UI Automation
    if (-not $script:uiaAvailable) { throw "UI Automation unavailable - cannot refresh EPLog" }
    $baseline = (Get-EpLogState $ws).fp
    $wbName = [System.IO.Path]::GetFileNameWithoutExtension($workbook.Name)
    try {
        Invoke-EtaProRibbonButton -windowTitleHint $wbName -buttonName "Refresh EPLog"
    } catch {
        Write-Host "[EtaPro] 'Refresh EPLog' failed ($($_.Exception.Message)); trying 'Refresh Sheet'"
        Invoke-EtaProRibbonButton -windowTitleHint $wbName -buttonName "Refresh Sheet"
    }

    # 5. Wait for the clear-then-repopulate cycle to settle
    [void](Wait-EpLogSettle $ws $baseline)

    # 6. Export the log table to CSV (embedded newlines flattened)
    ExportEpLogTableToCsv $ws $request.outputPath

    # 7. Re-minimize so the window is out of the way again
    try { $workbook.Application.WindowState = $xlMinimized } catch {}

    if (-not (Test-Path $request.outputPath)) {
        throw "EPLog output file not created at: $($request.outputPath)"
    }
    $lineCount = (Get-Content $request.outputPath | Measure-Object -Line).Lines
    return $lineCount
}

function ExportEpLogTableToCsv {
    param(
        [object]$worksheet,
        [string]$filePath
    )

    $lastRow = $worksheet.Cells($worksheet.Rows.Count, $EPLOG_FIRST_COL).End($xlUp).Row
    $lastCol = $worksheet.Cells($EPLOG_HEADER_ROW, $worksheet.Columns.Count).End($xlToLeft).Column
    if ($lastRow -lt $EPLOG_HEADER_ROW) { $lastRow = $EPLOG_HEADER_ROW }   # header only = no data
    if ($lastCol -lt $EPLOG_FIRST_COL)  { $lastCol = $EPLOG_FIRST_COL }

    $sb = New-Object System.Text.StringBuilder
    for ($row = $EPLOG_HEADER_ROW; $row -le $lastRow; $row++) {
        $fields = @()
        for ($col = $EPLOG_FIRST_COL; $col -le $lastCol; $col++) {
            $val = [string]$worksheet.Cells($row, $col).Value2
            # Flatten embedded newlines so each record is a single CSV physical line
            $val = $val -replace "`r`n", " | " -replace "`n", " | " -replace "`r", " | "
            $fields += (CsvEscape $val)
        }
        [void]$sb.AppendLine(($fields -join ","))
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($filePath, $sb.ToString(), $utf8NoBom)
}

# ── Resolve paths (tolerant: a desktop may set up only some templates) ──
# Resolve a template path only if the file exists; otherwise blank it and warn.
# This lets the scraper run with any subset of templates (e.g. EPLog only) instead
# of crashing at startup when live/history templates aren't present.
function ResolveTemplatePath($p) {
    if ($p -and (Test-Path $p)) { return (Resolve-Path $p).Path }
    if ($p) { Write-Host "[EtaPro] WARN: template not found, disabling: $p" }
    return ""
}
$liveTemplatePath    = ResolveTemplatePath $liveTemplatePath
$historyTemplatePath = ResolveTemplatePath $historyTemplatePath
$eplogTemplatePath   = ResolveTemplatePath $eplogTemplatePath
if (-not (Test-Path $signalDir)) {
    New-Item -ItemType Directory -Force -Path $signalDir | Out-Null
}
$signalDir = (Resolve-Path $signalDir).Path

$requestFile  = "$signalDir\request.json"
$shutdownFile = "$signalDir\shutdown"
$pidFile      = "$signalDir\scraper.pid"

Write-Host "[EtaPro] Persistent scraper starting..."
Write-Host "[EtaPro] Live template:    $(if ($liveTemplatePath) { $liveTemplatePath } else { '(none)' })"
Write-Host "[EtaPro] History template: $(if ($historyTemplatePath) { $historyTemplatePath } else { '(none)' })"
Write-Host "[EtaPro] EPLog template:   $(if ($eplogTemplatePath) { $eplogTemplatePath } else { '(none)' })"
Write-Host "[EtaPro] Signal dir:       $signalDir"

$PID | Out-File -FilePath $pidFile -Encoding ASCII -Force

Remove-Item -Path $requestFile -ErrorAction SilentlyContinue
Remove-Item -Path "$signalDir\response.json" -ErrorAction SilentlyContinue
Remove-Item -Path $shutdownFile -ErrorAction SilentlyContinue

$excel = $null
$liveWb = $null
$historyWb = $null
$eplogWb = $null

try {
    # Launch Excel the INTERACTIVE way — open the first available template as if the
    # user double-clicked it. This ensures all add-ins (including the EtaPRO add-in)
    # load in their normal interactive context. COM-created Excel.Application does NOT
    # load them the same way, causing #NAME? errors on EtaPro functions.
    # Any subset of templates is supported (e.g. EPLog only).
    $launchTemplate = ""
    foreach ($t in @($liveTemplatePath, $historyTemplatePath, $eplogTemplatePath)) {
        if ($t) { $launchTemplate = $t; break }
    }
    if (-not $launchTemplate) {
        throw "No EtaPro templates configured/found (live, history, eplog all missing)"
    }
    Write-Host "[EtaPro] Launching Excel interactively with: $launchTemplate"
    Start-Process -FilePath $launchTemplate

    # Wait for Excel to fully start and the EtaPro add-in to connect to the historian.
    # This is the slow path — only happens once per scraper session.
    Write-Host "[EtaPro] Waiting for Excel + EtaPro add-in to initialize..."
    $waitMax = 30
    $waited = 0
    $excel = $null
    while ($waited -lt $waitMax) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
            if ($excel -and $excel.Workbooks.Count -gt 0) {
                $wbCount = $excel.Workbooks.Count
                Write-Host "[EtaPro] Attached to Excel (waited ${waited}s, $wbCount workbook(s))"
                break
            }
        } catch {
            # Excel not ready yet
            Write-Host "[EtaPro] Waiting... (${waited}s)"
        }
    }

    if ($null -eq $excel) {
        throw "Failed to attach to Excel after ${waitMax}s. Is Excel installed?"
    }

    # Suppress UI prompts now that we have a handle
    $excel.DisplayAlerts = $false

    # Open any configured templates that aren't already open (the launch one is open).
    foreach ($t in @($liveTemplatePath, $historyTemplatePath, $eplogTemplatePath)) {
        if (-not $t) { continue }
        $name = [System.IO.Path]::GetFileName($t)
        $isOpen = $false
        foreach ($wb in $excel.Workbooks) { if ($wb.Name -eq $name) { $isOpen = $true; break } }
        if (-not $isOpen) {
            Write-Host "[EtaPro] Opening template: $name"
            [void]$excel.Workbooks.Open($t)
            Start-Sleep -Seconds 2
        }
    }

    # Bind workbook handles by file name (only for templates that exist).
    foreach ($wb in $excel.Workbooks) {
        $n = $wb.Name
        if ($liveTemplatePath -and $n -eq [System.IO.Path]::GetFileName($liveTemplatePath)) { $liveWb = $wb }
        elseif ($historyTemplatePath -and $n -eq [System.IO.Path]::GetFileName($historyTemplatePath)) { $historyWb = $wb }
        elseif ($eplogTemplatePath -and $n -eq [System.IO.Path]::GetFileName($eplogTemplatePath)) { $eplogWb = $wb }
    }
    Write-Host "[EtaPro] Workbooks ready: live=$([bool]$liveWb) history=$([bool]$historyWb) eplog=$([bool]$eplogWb)"

    # Give the add-in a moment to recognize all open workbooks
    Start-Sleep -Seconds 2

    # Minimize — we don't need the window taking up space
    try { $excel.WindowState = -4140 } catch {} # xlMinimized = -4140

    Write-Host "[EtaPro] Ready. Waiting for requests..."

    while ($true) {
        if (Test-Path $shutdownFile) {
            Write-Host "[EtaPro] Shutdown signal received."
            Remove-Item $shutdownFile -ErrorAction SilentlyContinue
            break
        }

        if (-not (Test-Path $requestFile)) {
            Start-Sleep -Milliseconds 200
            continue
        }

        $request = $null
        try {
            $raw = [System.IO.File]::ReadAllText($requestFile)
            $request = $raw | ConvertFrom-Json
        } catch {
            WriteResponse $signalDir "error" "Invalid request JSON: $($_.Exception.Message)"
            Remove-Item $requestFile -ErrorAction SilentlyContinue
            continue
        }

        Remove-Item $requestFile -ErrorAction SilentlyContinue

        $templateName = $request.template
        if ([string]::IsNullOrEmpty($templateName)) { $templateName = "live" }

        $pointCount = if ($request.pointIds) { (@($request.pointIds -split ",")).Length } else { 0 }
        Write-Host "[EtaPro] Request: template=$templateName, points=$pointCount"

        try {
            $result = $null
            if ($templateName -eq "live") {
                if ($null -eq $liveWb) { throw "Live template not loaded (template-live.xlsx missing)" }
                $result = ProcessLiveRequest $liveWb $request
            } elseif ($templateName -eq "history") {
                if ($null -eq $historyWb) { throw "History template not loaded (template-history.xlsx missing)" }
                $result = ProcessHistoryRequest $historyWb $request
            } elseif ($templateName -eq "eplog") {
                if ($null -eq $eplogWb) { throw "EPLog template not loaded (template-eplog.xlsx missing or eplogTemplatePath not set)" }
                $result = ProcessEpLogRequest $eplogWb $request
            } else {
                throw "Unknown template: $templateName (expected 'live', 'history', or 'eplog')"
            }
            Write-Host "[EtaPro] Done: $result"
            WriteResponse $signalDir "complete" "Exported rows" $result
        } catch {
            Write-Host "[EtaPro] ERROR: $($_.Exception.Message)"
            WriteResponse $signalDir "error" $_.Exception.Message
        }
    }

} catch {
    Write-Host "[EtaPro] FATAL: $($_.Exception.Message)"
    WriteResponse $signalDir "error" "Fatal: $($_.Exception.Message)"
    exit 1
} finally {
    Write-Host "[EtaPro] Shutting down..."
    if ($liveWb) {
        try { $liveWb.Close($false) } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($liveWb) | Out-Null
    }
    if ($historyWb) {
        try { $historyWb.Close($false) } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($historyWb) | Out-Null
    }
    if ($eplogWb) {
        try { $eplogWb.Close($false) } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($eplogWb) | Out-Null
    }
    if ($excel) {
        try { $excel.Quit() } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Write-Host "[EtaPro] Exited cleanly."
}
