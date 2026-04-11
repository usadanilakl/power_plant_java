# EtaPro Excel Scraper — Persistent Dual-Template COM Automation
#
# Runs as a long-lived process. Excel + EtaPro add-in stay open.
# Two workbooks are kept open simultaneously:
#   - template-live.xlsx    : column layout, GetEPCurrent formulas, 100 slots
#   - template-history.xlsx : pivot layout, Calculated Values array formulas, 20 slots
#
# No VBA macros required — Excel's built-in recalc + EtaPro's async query
# functions do all the work. Templates are plain .xlsx workbooks.
#
# Java communicates via signal files in the working directory:
#   Java writes:  request.json  → { template, startDate, endDate, pointIds, outputPath }
#   Script writes: response.json → { status, message, lineCount }
#
# request.json schema:
#   {
#     "template":   "live" | "history",
#     "startDate":  "2026-04-09T10:00:00",  // history only — ignored for live
#     "endDate":    "2026-04-09T10:05:00",  // history only — ignored for live
#     "pointIds":   "P1,P2,P3",              // comma-separated; up to 100 (live) or 20 (history)
#     "outputPath": "C:\\...\\output\\etapro_data.csv"
#   }
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File etapro-scrape.ps1 `
#     -liveTemplatePath "etapro/template-live.xlsx" `
#     -historyTemplatePath "etapro/template-history.xlsx" `
#     -signalDir "etapro/signal"

param(
    [Parameter(Mandatory=$true)]
    [string]$liveTemplatePath,

    [Parameter(Mandatory=$true)]
    [string]$historyTemplatePath,

    [Parameter(Mandatory=$true)]
    [string]$signalDir
)

$ErrorActionPreference = "Stop"

# ── Constants ───────────────────────────────────────────────────
$LIVE_MAX_POINTS = 100
$HISTORY_MAX_POINTS = 20
$xlUp = -4162
$xlToLeft = -4159

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

# ── Resolve paths ───────────────────────────────────────────────
$liveTemplatePath = (Resolve-Path $liveTemplatePath).Path
$historyTemplatePath = (Resolve-Path $historyTemplatePath).Path
if (-not (Test-Path $signalDir)) {
    New-Item -ItemType Directory -Force -Path $signalDir | Out-Null
}
$signalDir = (Resolve-Path $signalDir).Path

$requestFile  = "$signalDir\request.json"
$shutdownFile = "$signalDir\shutdown"
$pidFile      = "$signalDir\scraper.pid"

Write-Host "[EtaPro] Persistent scraper starting..."
Write-Host "[EtaPro] Live template:    $liveTemplatePath"
Write-Host "[EtaPro] History template: $historyTemplatePath"
Write-Host "[EtaPro] Signal dir:       $signalDir"

$PID | Out-File -FilePath $pidFile -Encoding ASCII -Force

Remove-Item -Path $requestFile -ErrorAction SilentlyContinue
Remove-Item -Path "$signalDir\response.json" -ErrorAction SilentlyContinue
Remove-Item -Path $shutdownFile -ErrorAction SilentlyContinue

$excel = $null
$liveWb = $null
$historyWb = $null

try {
    # Launch Excel the INTERACTIVE way — open the live template as if the user
    # double-clicked it. This ensures all add-ins (including EtaPro XLL) load
    # in their normal interactive context. COM-created Excel.Application does NOT
    # load XLL add-ins the same way, causing #NAME? errors on EtaPro functions.
    Write-Host "[EtaPro] Launching Excel interactively with live template..."
    Start-Process -FilePath $liveTemplatePath

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

    # Find the live workbook (the one we just opened)
    $liveWb = $null
    $liveFileName = [System.IO.Path]::GetFileName($liveTemplatePath)
    foreach ($wb in $excel.Workbooks) {
        if ($wb.Name -eq $liveFileName) {
            $liveWb = $wb
            break
        }
    }
    if ($null -eq $liveWb) {
        throw "Could not find live workbook '$liveFileName' in the running Excel instance"
    }
    Write-Host "[EtaPro] Live workbook: $($liveWb.Name)"

    # Now open the history template in the same interactive Excel instance
    Write-Host "[EtaPro] Opening history template in same Excel..."
    $historyWb = $excel.Workbooks.Open($historyTemplatePath)
    Write-Host "[EtaPro] History workbook: $($historyWb.Name)"

    # Give add-in a moment to recognize the new workbook
    Start-Sleep -Seconds 3

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
                $result = ProcessLiveRequest $liveWb $request
            } elseif ($templateName -eq "history") {
                $result = ProcessHistoryRequest $historyWb $request
            } else {
                throw "Unknown template: $templateName (expected 'live' or 'history')"
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
    if ($excel) {
        try { $excel.Quit() } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Write-Host "[EtaPro] Exited cleanly."
}
