# EtaPro Excel Scraper — Persistent COM Automation Script
#
# Runs as a long-lived process. Excel + EtaPro add-in stay open.
# Java app communicates via signal files in the working directory:
#
#   Java writes:  request.json  → { startDate, endDate, pointIds, outputPath }
#   Script writes: response.json → { status: "complete"|"error", message, lineCount }
#   Script deletes request.json after processing
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File etapro-scrape.ps1 `
#     -templatePath "etapro/template.xlsm" `
#     -signalDir "etapro/signal"
#
# To stop gracefully: create a file named "shutdown" in the signal directory.

param(
    [Parameter(Mandatory=$true)]
    [string]$templatePath,

    [Parameter(Mandatory=$true)]
    [string]$signalDir
)

$ErrorActionPreference = "Stop"

# ── Helper: Export worksheet to CSV ─────────────────────────────
function ExportDataSheetToCsv {
    param(
        [object]$worksheet,
        [string]$filePath
    )

    $lastRow = $worksheet.Cells($worksheet.Rows.Count, 1).End(-4162).Row  # xlUp
    $lastCol = $worksheet.Cells(1, $worksheet.Columns.Count).End(-4159).Column  # xlToLeft

    $sb = New-Object System.Text.StringBuilder
    for ($row = 1; $row -le $lastRow; $row++) {
        $fields = @()
        for ($col = 1; $col -le $lastCol; $col++) {
            $val = [string]$worksheet.Cells($row, $col).Value2
            if ($val -match '[,"]') {
                $val = '"' + ($val -replace '"', '""') + '"'
            }
            $fields += $val
        }
        [void]$sb.AppendLine(($fields -join ","))
    }

    [System.IO.File]::WriteAllText($filePath, $sb.ToString(), [System.Text.Encoding]::UTF8)
}

function WriteResponse {
    param(
        [string]$signalDir,
        [string]$status,
        [string]$message,
        [int]$lineCount = 0
    )
    $resp = @{
        status = $status
        message = $message
        lineCount = $lineCount
        timestamp = (Get-Date -Format "o")
    } | ConvertTo-Json
    [System.IO.File]::WriteAllText("$signalDir\response.json", $resp, [System.Text.Encoding]::UTF8)
}

# ── Resolve paths ───────────────────────────────────────────────
$templatePath = (Resolve-Path $templatePath).Path
if (-not (Test-Path $signalDir)) {
    New-Item -ItemType Directory -Force -Path $signalDir | Out-Null
}
$signalDir = (Resolve-Path $signalDir).Path

$requestFile = "$signalDir\request.json"
$shutdownFile = "$signalDir\shutdown"
$pidFile = "$signalDir\scraper.pid"

Write-Host "[EtaPro] Persistent scraper starting..."
Write-Host "[EtaPro] Template:   $templatePath"
Write-Host "[EtaPro] Signal dir: $signalDir"

# Write PID file so Java can track/kill the process
$PID | Out-File -FilePath $pidFile -Encoding ASCII -Force

# Clean up stale signals
Remove-Item -Path $requestFile -ErrorAction SilentlyContinue
Remove-Item -Path "$signalDir\response.json" -ErrorAction SilentlyContinue
Remove-Item -Path $shutdownFile -ErrorAction SilentlyContinue

$excel = $null
$workbook = $null

try {
    # ── 1. Start Excel + open template (once) ───────────────────
    Write-Host "[EtaPro] Starting Excel COM..."
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.AskToUpdateLinks = $false

    Write-Host "[EtaPro] Opening template..."
    $workbook = $excel.Workbooks.Open($templatePath)

    $wsConfig = $workbook.Sheets("Config")
    $wsPoints = $workbook.Sheets("Points")

    Write-Host "[EtaPro] Ready. Waiting for requests..."

    # ── 2. Main loop — poll for request.json ────────────────────
    while ($true) {
        # Check for graceful shutdown
        if (Test-Path $shutdownFile) {
            Write-Host "[EtaPro] Shutdown signal received."
            Remove-Item $shutdownFile -ErrorAction SilentlyContinue
            break
        }

        # Check for scrape request
        if (-not (Test-Path $requestFile)) {
            Start-Sleep -Milliseconds 500
            continue
        }

        Write-Host "[EtaPro] Request detected, processing..."
        $request = $null
        try {
            $raw = [System.IO.File]::ReadAllText($requestFile)
            $request = $raw | ConvertFrom-Json
        } catch {
            Write-Host "[EtaPro] ERROR: Bad request JSON: $($_.Exception.Message)"
            WriteResponse $signalDir "error" "Invalid request JSON: $($_.Exception.Message)"
            Remove-Item $requestFile -ErrorAction SilentlyContinue
            continue
        }

        # Remove request immediately to signal "picked up"
        Remove-Item $requestFile -ErrorAction SilentlyContinue

        $startDate = $request.startDate
        $endDate = $request.endDate
        $pointIdsCsv = $request.pointIds
        $outputPath = $request.outputPath

        Write-Host "[EtaPro] Range: $startDate -> $endDate"
        Write-Host "[EtaPro] Points: $pointIdsCsv"
        Write-Host "[EtaPro] Output: $outputPath"

        try {
            # Ensure output directory exists
            $outputDir = Split-Path $outputPath -Parent
            if (-not (Test-Path $outputDir)) {
                New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
            }

            # Set environment variable for VBA macro
            [System.Environment]::SetEnvironmentVariable("ETAPRO_OUTPUT_PATH", $outputPath, "Process")

            # ── 3. Write time range to Config sheet ─────────────
            $wsConfig.Range("B1").Value2 = $startDate
            $wsConfig.Range("B2").Value2 = $endDate
            $wsConfig.Range("B3").Value2 = "Ready"

            # ── 4. Write point IDs to Points sheet ──────────────
            $points = $pointIdsCsv -split ","
            $lastPointRow = $wsPoints.Cells($wsPoints.Rows.Count, 1).End(-4162).Row
            if ($lastPointRow -ge 2) {
                $wsPoints.Range("A2:A$lastPointRow").ClearContents()
            }
            for ($i = 0; $i -lt $points.Length; $i++) {
                $wsPoints.Cells($i + 2, 1).Value2 = $points[$i].Trim()
            }

            # ── 5. Trigger EtaPro refresh ───────────────────────
            Write-Host "[EtaPro] Triggering refresh..."

            $macroWorked = $false
            try {
                $excel.Run("RefreshAndExport")
                $macroWorked = $true
                Write-Host "[EtaPro] VBA macro completed"
            } catch {
                Write-Host "[EtaPro] VBA macro not available: $($_.Exception.Message)"
            }

            if (-not $macroWorked) {
                # Fallback: CalculateFull + manual export
                $excel.CalculateFull()

                $wsData = $workbook.Sheets("Data")
                $maxWait = 120
                $waited = 0
                while ([string]::IsNullOrEmpty($wsData.Range("A2").Text) -and $waited -lt $maxWait) {
                    Start-Sleep -Seconds 2
                    $waited += 2
                    if ($waited % 10 -eq 0) {
                        Write-Host "[EtaPro] Waiting for data... ($waited/$maxWait s)"
                    }
                }

                if ([string]::IsNullOrEmpty($wsData.Range("A2").Text)) {
                    throw "Timeout: Data sheet still empty after ${maxWait}s"
                }

                Write-Host "[EtaPro] Exporting to CSV..."
                ExportDataSheetToCsv $wsData $outputPath
            }

            # ── 6. Verify and respond ───────────────────────────
            if (-not (Test-Path $outputPath)) {
                throw "Output file not created at: $outputPath"
            }

            $lineCount = (Get-Content $outputPath | Measure-Object -Line).Lines
            Write-Host "[EtaPro] Done: $lineCount lines exported"
            WriteResponse $signalDir "complete" "Exported $lineCount lines" $lineCount

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
    # ── Cleanup ─────────────────────────────────────────────────
    Write-Host "[EtaPro] Shutting down..."
    if ($workbook) {
        try { $workbook.Close($false) } catch {}
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
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
