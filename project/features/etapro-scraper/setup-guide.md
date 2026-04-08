# EtaPro Scraper — Setup Guide

This guide covers the manual steps required to set up the EtaPro Excel scraper on a workstation that has the EtaPro Excel add-in installed.

---

## Prerequisites

- Windows 10 or 11 (COM runtime is built in — nothing to install)
- **Microsoft Excel desktop** (2016, 2019, 2021, or 365 — NOT Excel Online / web version)
- **EtaPro Excel add-in** installed and licensed on the same machine
- **PowerShell 5.1+** (included with Windows 10/11)
- Java app (power_plant_java) running on the same machine
- **No admin rights required** — everything runs as the normal user account that runs the app

### Verify COM + Excel are ready

Before creating the template, run this in PowerShell to confirm COM automation works:

```powershell
$excel = New-Object -ComObject Excel.Application; $excel.Version; $excel.Quit()
```

If it prints a version number (e.g., `16.0`), you're good to go. If it errors with "Cannot create object" or "Class not registered," Excel isn't installed or its COM registration is broken — run an Office Repair from Add/Remove Programs.

---

## Step 1: Create the Working Directory

Create the `etapro/` folder in the project root (next to `db/`, `uploads/`, etc.):

```
power_plant_java/
└── etapro/
    ├── template.xlsm    (you will create this)
    └── output/           (auto-created by the script)
```

```powershell
# Run from the power_plant_java root directory
New-Item -ItemType Directory -Force -Path "etapro\output"
```

---

## Step 2: Create the Excel Template

This is the most important manual step. The template is a macro-enabled workbook (`.xlsm`) that uses the EtaPro Excel add-in to pull data.

### 2a. Create a New Workbook

1. Open Excel
2. Save as **Macro-Enabled Workbook** (`.xlsm`) to `etapro/template.xlsm`

### 2b. Set Up the "Config" Sheet

Create a sheet named **Config** with this layout:

| Cell | Content | Purpose |
|------|---------|---------|
| A1 | `StartTime` (label) | |
| B1 | *(empty — script will write start time here)* | Start of query range |
| A2 | `EndTime` (label) | |
| B2 | *(empty — script will write end time here)* | End of query range |
| A3 | `Status` (label) | |
| B3 | `Ready` | Script checks this cell for completion |

### 2c. Set Up the "Points" Sheet

Create a sheet named **Points** with this layout:

| Column A | Column B |
|----------|----------|
| Point ID | *(header)* |
| 1GT1.MW | *(empty — EtaPro data will populate here)* |
| 1GT1.EXHAUST_TEMP | |
| 1HRSG.MAIN_STEAM_PRESS | |
| ... | |

- Column A: EtaPro point IDs (one per row, starting from A2)
- The script will write point IDs here from the database before each scrape
- EtaPro add-in formulas in columns B onward will reference these point IDs

### 2d. Set Up the "Data" Sheet

Create a sheet named **Data** where EtaPro populates the actual time-series data:

| A | B | C | D | E |
|---|---|---|---|---|
| Timestamp | Point1 | Point2 | Point3 | ... |
| *(EtaPro fills this)* | | | | |

The exact layout depends on your EtaPro add-in version. Common patterns:

**Pattern A — Time in rows, points in columns:**
- Row 1: Headers (point IDs)
- Column A: Timestamps
- Cells: Values

**Pattern B — Flat table:**
- Column A: Point ID
- Column B: Timestamp
- Column C: Value
- Column D: Quality

### 2e. Add EtaPro Formulas

This step depends on your specific EtaPro Excel add-in version. Common approaches:

**If using EtaPro `GETHISTDATA` function:**
```excel
=GETHISTDATA(Points!A2, Config!B1, Config!B2, "AVG", "1h")
```
- Parameters: PointID, StartTime, EndTime, Aggregation, Interval
- Place this formula in the Data sheet, referencing the Config and Points sheets

**If using EtaPro ribbon commands:**
- Configure the add-in to read from the Config sheet for time ranges
- Set up a data retrieval template that pulls all points listed in the Points sheet

**Consult your EtaPro documentation** for the exact function syntax and ribbon commands available in your version.

### 2f. Add the VBA Refresh Macro

Press `Alt+F11` to open the VBA editor, insert a new module, and paste:

```vba
' Module: EtaProScraper
Option Explicit

Public Sub RefreshAndExport()
    Dim wsConfig As Worksheet
    Dim wsData As Worksheet
    Dim outputPath As String
    Dim maxWaitSeconds As Long
    Dim waited As Long

    Set wsConfig = ThisWorkbook.Sheets("Config")
    Set wsData = ThisWorkbook.Sheets("Data")

    ' Mark as processing
    wsConfig.Range("B3").Value = "Processing"

    ' Trigger EtaPro refresh
    ' Option 1: If EtaPro uses CalculateFull
    Application.CalculateFull

    ' Option 2: If EtaPro has a named macro/ribbon command, use:
    ' Application.Run "EtaPro.Refresh"
    ' or
    ' Application.CommandBars("EtaPro").Controls("Refresh").Execute

    ' Wait for data to populate (check a known data cell)
    maxWaitSeconds = 120
    waited = 0
    Do While IsEmpty(wsData.Range("A2")) And waited < maxWaitSeconds
        Application.Wait Now + TimeValue("00:00:02")
        waited = waited + 2
        DoEvents
    Loop

    ' Check if data loaded
    If IsEmpty(wsData.Range("A2")) Then
        wsConfig.Range("B3").Value = "Error: Timeout waiting for data"
        Exit Sub
    End If

    ' Build output path from command-line argument or default
    outputPath = Environ("ETAPRO_OUTPUT_PATH")
    If outputPath = "" Then
        outputPath = ThisWorkbook.Path & "\output\etapro_data.csv"
    End If

    ' Export Data sheet to CSV
    ExportSheetToCSV wsData, outputPath

    ' Mark as complete
    wsConfig.Range("B3").Value = "Complete"
End Sub

Private Sub ExportSheetToCSV(ws As Worksheet, filePath As String)
    Dim lastRow As Long
    Dim lastCol As Long
    Dim row As Long
    Dim col As Long
    Dim line As String
    Dim fileNum As Integer

    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    fileNum = FreeFile
    Open filePath For Output As #fileNum

    For row = 1 To lastRow
        line = ""
        For col = 1 To lastCol
            If col > 1 Then line = line & ","
            Dim cellVal As String
            cellVal = CStr(ws.Cells(row, col).Value)
            ' Escape commas and quotes
            If InStr(cellVal, ",") > 0 Or InStr(cellVal, """") > 0 Then
                cellVal = """" & Replace(cellVal, """", """""") & """"
            End If
            line = line & cellVal
        Next col
        Print #fileNum, line
    Next row

    Close #fileNum
End Sub
```

### 2g. Test the Template Manually

1. Open `template.xlsm`
2. In the Config sheet, set B1 = yesterday's date, B2 = today's date
3. In the Points sheet, enter a few known point IDs
4. Run the `RefreshAndExport` macro (`Alt+F8` → `RefreshAndExport` → Run)
5. Verify CSV output appears in `etapro/output/etapro_data.csv`
6. Verify the data looks correct

---

## Step 3: Configure the PowerShell Script

The script is at `scripts/etapro-scrape.ps1` (already provided by the app). It runs as a **persistent process** — Excel stays open between scrapes for fast refresh cycles.

### Test manually first:

```powershell
# Start the persistent scraper
powershell -ExecutionPolicy Bypass -File scripts/etapro-scrape.ps1 `
    -templatePath "etapro/template.xlsm" `
    -signalDir "etapro/signal"
```

The script will:
1. Open Excel and the template (once)
2. Print "Ready. Waiting for requests..."
3. Poll `etapro/signal/request.json` every 500ms

### Test a scrape request:

In a separate terminal, create a request file:

```powershell
@'
{
  "startDate": "2026-04-06T00:00:00",
  "endDate": "2026-04-07T00:00:00",
  "pointIds": "1GT1.MW,1GT1.EXHAUST_TEMP",
  "outputPath": "C:/path/to/power_plant_java/etapro/output/etapro_data.csv"
}
'@ | Out-File -FilePath "etapro/signal/request.json" -Encoding UTF8
```

Check:
- Script detects the request and processes it
- CSV file appears in `etapro/output/`
- `etapro/signal/response.json` shows `"status": "complete"`

### Stop the script:

```powershell
# Graceful shutdown
"shutdown" | Out-File -FilePath "etapro/signal/shutdown"
```

Or just Ctrl+C in the terminal.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| COM error "Cannot create object" | Excel not installed or not registered. Run `regsvr32 "C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE" /RegServer` |
| EtaPro add-in not loading | Open Excel manually first, ensure add-in is enabled under File → Options → Add-Ins → COM Add-ins |
| Data cells stay empty | EtaPro add-in may need authentication or network access to the historian server |
| Orphan Excel process | Script crashed before cleanup. Kill via `Stop-Process -Name EXCEL -Force` |
| Execution policy error | Run PowerShell as admin: `Set-ExecutionPolicy RemoteSigned` or use `-ExecutionPolicy Bypass` flag |
| Script exits immediately | Check the template path is correct and the file exists |

---

## Step 4: Configure Application Properties

Add to `application.properties` (or `application-prod.properties`):

```properties
# EtaPro Scraper — persistent Excel COM automation
etapro.enabled=true
etapro.excel.template.path=${user.dir}/etapro/template.xlsm
etapro.output.path=${user.dir}/etapro/output
etapro.script.path=${user.dir}/scripts/etapro-scrape.ps1
etapro.signal.path=${user.dir}/etapro/signal
etapro.scrape.timeout.seconds=120

# Scheduled scraping (fixed-delay: next run starts N ms after previous finishes)
etapro.schedule.interval.ms=60000
etapro.schedule.initial-delay.ms=30000
etapro.schedule.window.minutes=5
```

---

## Step 5: Open the EtaPro UI

After restarting the Java app with `etapro.enabled=true`, navigate to the EtaPro page:

- **Header menu** → **Log** → **EtaPro Trends**
- **Home page** → **Log** card group → **EtaPro Trends** tile
- Or type the URL directly: `http://localhost:8082/etapro`

You'll see a three-tab layout: **Dashboard** / **Points** / **Readings**.

---

## Step 6: Add Points via the UI

1. Click the **Points** tab
2. Click **+ Add Point** in the toolbar
3. Fill in the form:
   - **Point ID** — EtaPro point identifier (e.g., `1GT1.MW`) — required
   - **Description** — human-readable description (e.g., `Gas Turbine 1 MW Output`)
   - **Unit** — engineering unit (`MW`, `degF`, `PSI`, etc.)
   - **Category** — grouping for dashboard layout (`Turbine`, `HRSG`, `BOP`, etc.)
   - **Active** — check to include in scrapes (default on)
4. Click **Create**

Repeat for each point you want to track. The scraper will push all active points to the Excel template before each scrape.

### Bulk add via API (optional)
If you have many points to add at once:

```bash
curl -X POST http://localhost:8082/ng/etapro/points \
  -H "Content-Type: application/json" \
  -d '{"pointId": "1GT1.MW", "description": "Gas Turbine 1 - Megawatts", "unit": "MW", "category": "Turbine", "active": true}'
```

---

## Step 7: Start the Scraper and Run Your First Scrape

1. Go to the **Dashboard** tab
2. The status bar at the top shows the scraper state (gray dot = idle, green = running, orange pulsing = busy)
3. Click **Start Scraper** — this launches PowerShell which opens Excel in the background and loads the template
4. Wait ~5-10 seconds for Excel + EtaPro add-in to fully load
5. Click **Scrape Now** to trigger a scrape of the last 5 minutes
6. Reading cards should appear, grouped by category, each showing the latest value

The first scrape proves the end-to-end flow works. After that, the scheduler takes over (if enabled) and keeps the dashboard fresh automatically.

### What's happening under the hood
1. Java ensures the persistent PowerShell process is running (auto-starts if needed)
2. Java writes `etapro/signal/request.json` with point IDs and time range
3. PowerShell detects the file, writes params into Excel cells, triggers the EtaPro refresh
4. EtaPro add-in pulls data from the historian into the Data sheet
5. Script exports the Data sheet to `etapro/output/etapro_data.csv`, writes `response.json`
6. Java parses the CSV, deduplicates against existing readings, saves new rows
7. Dashboard auto-refreshes (polls `/readings/latest` every 5s)

---

## Step 8: Semi-Real-Time Monitoring

The scheduled scraper runs automatically every 60 seconds (configurable) and scrapes the last 5 minutes with overlap. Duplicates are automatically skipped via DB index lookup on `(pointId, timestamp)`.

### Adjust scrape frequency

```properties
# Every 60 seconds after previous scrape finishes (default, safe)
etapro.schedule.interval.ms=60000

# Scrape window: last 5 minutes (overlap ensures no gaps)
etapro.schedule.window.minutes=5
```

Shorter intervals for faster refresh:
- `60000` (60s) — safe default, ~1 min lag
- `30000` (30s) — aggressive, ~30-60s lag
- `15000` (15s) — very fast, may stress EtaPro server

### Dashboard freshness colors
Each reading card has a colored left border:
- **Green** — fresh (< 2 min old)
- **Yellow** — stale (2-5 min old)
- **Red** — old (> 5 min old)

If cards turn yellow or red, the scraper has stopped or is lagging. Check the status bar and PowerShell output.

---

## Step 9: View Trends

The EtaPro page includes multi-series trend charts powered by ECharts.

### Single-point trend
On the **Dashboard**, click any reading card to open a trend popup for that point. Default range is 1h.

### Multi-point trend
1. Go to the **Points** tab
2. Select multiple rows (ctrl-click or shift-click)
3. Click **Trend Selected (N)** in the toolbar
4. All selected points render on one chart. Points with different units get separate Y axes (max 4).

### Trend window controls
- **Time presets**: 1h / 4h / 24h / 7d / custom date-time range
- **Refresh** button reloads data for the current range
- **Zoom**: scroll or drag the slider at the bottom
- **Pan**: click and drag inside the chart
- **Hover**: crosshair tooltip shows all series values at that time
- **Legend**: click any series name to show/hide it

---

## Step 10: Query Historical Readings

The **Readings** tab lets you browse stored data:
1. Select a point from the dropdown (or leave "All Points")
2. Set a date range with the From/To inputs (defaults to last 24h)
3. Click **Search**

If a specific point is chosen, all matching rows are returned. If "All Points" is chosen, results are capped at 500 rows for performance.

---

## Step 11: Stop the Scraper

From the **Dashboard** tab, click **Stop** in the status bar. This gracefully closes Excel and the PowerShell process.

The process also stops automatically when the Java app shuts down (`@PreDestroy`).

### API equivalent

```bash
curl -X POST http://localhost:8082/ng/etapro/process/stop
```

---

## EtaPro Point ID Reference

Common EtaPro point naming conventions (verify with your plant's configuration):

| Pattern | Example | Description |
|---------|---------|-------------|
| `{Unit}{System}.{Param}` | `1GT1.MW` | Gas Turbine 1 output |
| `{Unit}{System}.{Param}` | `1HRSG.MAIN_STEAM_TEMP` | HRSG main steam temperature |
| `{Tag}` | `TI-1234` | Instrument tag number |

To find available point IDs:
1. Open EtaPro desktop client
2. Browse the point tree
3. Note the full point path/ID
4. Add to the app via the Points management UI

---

## Data Retention

By default, all scraped readings are kept indefinitely. To manage storage:

- Use the app's soft-delete on old readings
- Or set up a scheduled cleanup (future enhancement)
- Each scrape session is tagged with a `scrapeSessionId` (UUID) for traceability
