# EtaPro Scraper — Setup Guide

This guide covers the manual steps required to set up the EtaPro Excel scraper on a workstation that has the EtaPro Excel add-in installed.

The scraper uses **two Excel templates** (Live and History) — both with the same structure but different time windows. Templates have 20 generic point slots that the app fills in dynamically per request.

---

## Prerequisites

- Windows 10 or 11 (COM runtime is built in — nothing to install)
- **Microsoft Excel desktop** (2016, 2019, 2021, or 365 — NOT Excel Online / web version)
- **EtaPro Excel add-in** installed and licensed on the same machine
- **PowerShell 5.1+** (included with Windows 10/11)
- Java app (power_plant_java) running on the same machine
- **No admin rights required** — everything runs as the normal user account that runs the app

### Verify COM + Excel are ready

```powershell
$excel = New-Object -ComObject Excel.Application; $excel.Version; $excel.Quit()
```

If it prints a version number (e.g., `16.0`), you're good. If it errors, run an Office Repair from Add/Remove Programs.

---

## Who This Guide Is For

This guide is written from two perspectives:

1. **Build operator** preparing a desktop installer for the plant — creates the templates once, drops them into `electron-manager/etapro-defaults/`, and ships them via `npm run package`. End users then get a turnkey install.
2. **Developer or solo user** running the backend directly with `mvn spring-boot:run` — creates templates in their project's local `etapro/` directory.

If you're using the packaged desktop Electron installer, **you do NOT need to follow most of this guide** — the templates and script are provisioned automatically into `%PROGRAMDATA%/DK Power Manager/managed_apps/pid/etapro/` on first launch. You only need Step 2 and Step 3 if you're preparing a fresh build or if the templates got lost.

---

## Step 1: Create the Working Directory

**For developers running backend directly:**

```powershell
# From the power_plant_java root
New-Item -ItemType Directory -Force -Path "etapro\output"
New-Item -ItemType Directory -Force -Path "etapro\signal"
```

Final layout:
```
power_plant_java/
└── etapro/
    ├── template-live.xlsx       (you create — Step 2)
    ├── template-history.xlsx    (you create — Step 3)
    ├── output/                   (auto-managed)
    └── signal/                   (auto-managed)
```

**For build operators preparing an Electron installer**: skip to Step 2 — the Electron startup code will create these directories automatically in `%PROGRAMDATA%/DK Power Manager/managed_apps/pid/`.

---

## Step 2: Create the Live Template

The live template is optimized for fetching **current values** of up to **100 points** as fast as possible. It uses EtaPro's `GetEPCurrent` function — one cell per value, no time range, no array formulas.

### 2a. Create the workbook

1. Open Excel
2. Save as **Excel Workbook** (`.xlsx`) to `etapro/template-live.xlsx`

> The templates do not contain any macros — the scraper uses Excel's built-in recalculation via COM automation, not VBA. A plain `.xlsx` avoids the "enable macros" security prompt and works in environments that restrict `.xlsm` files.

### 2b. Set up the "Data" sheet

Rename the default sheet to **Data**. Layout:

| | A | B |
|---|---|---|
| **1** | *(empty — script writes point ID here)* | `=@GetEPCurrent(1, A1, Source, 192.168.190.85)` |
| **2** | *(empty)* | `=@GetEPCurrent(1, A2, Source, 192.168.190.85)` |
| **3** | *(empty)* | `=@GetEPCurrent(1, A3, Source, 192.168.190.85)` |
| **...** | *(empty)* | *(formula referencing its row's column A)* |
| **100** | *(empty)* | `=@GetEPCurrent(1, A100, Source, 192.168.190.85)` |

- **Column A** holds point IDs — the script writes these per request
- **Column B** holds the `GetEPCurrent` formula for each row, referencing its own row's column A
- All 100 rows in column B should have the formula pre-inserted; column A starts empty
- No Config sheet, no array formulas, no time range

### 2c. Insert the formulas

You have 100 cells to fill in column B with similar formulas. Fastest way:

1. Type the formula into **B1** exactly:
   ```
   =@GetEPCurrent(1,A1,Source,192.168.190.85)
   ```
   (Replace the IP and `Source` parameter with whatever your plant uses — these are EtaPro-specific arguments.)
2. Press Enter — the cell will show `#N/A` or similar because A1 is empty (no point ID yet)
3. Click B1, then drag the fill handle (small square in the bottom-right corner) down to **B100**
4. Excel auto-adjusts each formula to reference its own row's column A: B2 will reference A2, B3 will reference A3, etc.
5. Verify by clicking B50 — the formula should read `=@GetEPCurrent(1,A50,Source,192.168.190.85)`

### 2d. Test manually

1. Type a real point ID into **A1** (e.g., `1GT1.MW`)
2. Press F9 (or Formulas → Calculate Now) to force a refresh
3. B1 should show the current value of that point
4. Type more point IDs into A2, A3, etc. and recalculate — column B should update accordingly
5. Clear A1 — B1 should go back to `#N/A` or empty

> **Note**: `GetEPCurrent` does NOT auto-refresh as new data arrives — it only updates when Excel recalculates. The script forces this with `Application.Calculate()` on every live cycle.

If everything works, save and close.

### 2e. Why 100 points instead of array formulas?

`GetEPCurrent` returns a single instantaneous value rather than a time series. This makes it:
- **Fast** — no historian time-range query, just "what's the current value of X?"
- **Simple** — no array formulas, no Config sheet, no time-range cells
- **Bulk-friendly** — can fit 100 cells in one recalc with no perceptible slowdown

The trade-off: live mode only stores **the value at refresh time** (with the script stamping `now()` as the timestamp). The rolling trend chart on the Live tab is built client-side by accumulating these snapshots over time.

---

## Step 3: Create the History Template

The history template has the **same structure** but a much larger time window: **20 slots × 28,800 rows × 3-second interval = 1 day per batch**.

### 3a. Copy and resize

1. Copy `template-live.xlsx` → `template-history.xlsx`
2. Open the new file
3. **Resize the array formulas** to span 28,800 rows:
   - Delete the existing array formulas
   - Re-insert them with **Output cell** ranges of `A2:A28801` for column A and `B2:B28801`, `C2:C28801`, etc. for value columns
   - Same time-range parameters (`Config!B1`/`Config!B2`)
   - Same interval (3 seconds)
4. The array formula in column A is for timestamps with **Include timestamp = TRUE**
5. Each value column has **Include timestamp = FALSE**

### 3b. Test with a 1-day window

1. Type a point ID into B1
2. Set Config!B1 = 24 hours ago, Config!B2 = now
3. EtaPro should fill A2:A28801 with timestamps and B2:B28801 with values
4. **This may take 30-60 seconds** on first load — expected. Subsequent refreshes are faster.

If the load is too slow or Excel struggles, consider dropping to 10 point slots (1 day × 10 points × 28,800 = 288K cells) or reducing the row count.

> **⚠ Note on size**: 20 columns × 28,800 rows = **576,000 cells of array formulas**. This is at the upper end of what Excel handles smoothly. Test with your actual EtaPro server first; if responsiveness suffers, halve the slot count.

---

## Step 3½: Build the Electron Installer

**Only applies if you're building a desktop installer for the plant. Skip this step if you're running the backend directly.**

Once both templates are finished and tested manually, just save them in the project root's `etapro/` folder:

```
power_plant_java/
├── etapro/
│   ├── template-live.xlsx       ← you created this in Step 2
│   └── template-history.xlsx    ← you created this in Step 3
├── scripts/
│   └── etapro-scrape.ps1       ← shipped with the repo
└── electron-manager/
    └── etapro-defaults/         ← auto-populated by the build
```

Then build the installer as usual:

```powershell
cd electron-manager
npm run package
```

The `prepackage` hook automatically runs `scripts/sync-etapro-defaults.js`, which copies the PS script and any templates from the project root into `electron-manager/etapro-defaults/`. If templates are missing, it logs a warning but continues — the build still works, just without templates.

On first launch, the installed desktop app will:
1. Create `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\scripts\etapro-scrape.ps1` (always refreshed from bundle)
2. Create `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\etapro\template-live.xlsx` (only if missing)
3. Create `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\etapro\template-history.xlsx` (only if missing)
4. Create empty `output/` and `signal/` directories

End users don't need to do anything with templates manually unless they want to customize them — any edits they make in the working directory are preserved across updates.

---

## Step 4: Verify the PowerShell Script

The script `scripts/etapro-scrape.ps1` is shipped with the repo. It accepts both templates as parameters and switches between them based on each request.

### Test manually:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/etapro-scrape.ps1 `
    -liveTemplatePath "etapro/template-live.xlsx" `
    -historyTemplatePath "etapro/template-history.xlsx" `
    -signalDir "etapro/signal"
```

The script should:
1. Open both templates
2. Print "Ready. Waiting for requests..."
3. Poll `etapro/signal/request.json`

### Test a request manually:

In another terminal:
```powershell
@'
{
  "template": "live",
  "startDate": "2026-04-09T10:00:00",
  "endDate": "2026-04-09T10:00:15",
  "pointIds": "1GT1.MW",
  "outputPath": "C:/full/path/to/etapro/output/etapro_data.csv"
}
'@ | Out-File -FilePath "etapro/signal/request.json" -Encoding UTF8
```

Check:
- `etapro/output/etapro_data.csv` appears
- `etapro/signal/response.json` contains `"status": "complete"`

### Stop the script:
```powershell
"shutdown" | Out-File -FilePath "etapro/signal/shutdown"
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| COM error "Cannot create object" | Office Repair from Add/Remove Programs |
| EtaPro add-in not loading | Open Excel manually, ensure add-in is enabled in File → Options → Add-Ins → COM Add-ins |
| Data cells stay empty | Verify EtaPro server is reachable; check that the array formulas were inserted (not regular formulas) |
| Orphan Excel process | `Stop-Process -Name EXCEL -Force` |
| Script exits immediately | Check that both template paths exist |
| `CalculateUntilAsyncQueriesDone` not supported | Older Excel — script falls back to `CalculateFull` + 2-sec sleep |

---

## Step 5: Configure Application Properties

Add to `application.properties` (or your device-specific config):

```properties
# EtaPro Scraper — persistent Excel COM automation
etapro.enabled=true
etapro.live.template.path=${user.dir}/etapro/template-live.xlsx
etapro.history.template.path=${user.dir}/etapro/template-history.xlsx
etapro.output.path=${user.dir}/etapro/output
etapro.signal.path=${user.dir}/etapro/signal
etapro.script.path=${user.dir}/scripts/etapro-scrape.ps1

# Per-batch timeout for Excel refresh
etapro.scrape.timeout.seconds=120

# Live mode minimum interval between cycles
etapro.live.interval.ms=3000

# Job retention
etapro.job.retention.days=90
```

Restart the Java app after enabling the flag.

---

## Step 6: Open the EtaPro UI

After restart:
- Header menu → **Log → EtaPro Trends**
- Or home page → Log card → **EtaPro Trends**
- Or directly: `http://localhost:8082/etapro`

You'll see three tabs: **Live / History / Points**.

---

## Step 7: Add Points (Master List)

Go to the **Points** tab and add each EtaPro point you want available for selection:

- **Point ID** — exact EtaPro identifier (e.g., `1GT1.MW`)
- **Description** — human-readable
- **Unit** — `MW`, `degF`, `PSI`, etc.
- **Category** — for grouping (`Turbine`, `HRSG`, etc.)
- **Active** — visible in pickers when checked

This list is the master pool. The scraper doesn't touch it directly — it's just what the Live and History tabs let you choose from.

---

## Step 8: Try Live Mode

1. Go to the **Live** tab
2. Multi-select up to 20 points from the picker
3. Click **Start Live**
4. Within ~3 seconds you should see:
   - Status dot turns green and pulses
   - Latest-values table populates with one row per point
   - Trend chart starts accumulating points
5. Each row gets a fresh value every ~3 seconds. If a row goes stale (>10s old), it dims.
6. Click **Stop Live** when done

If you select more than 20 points, the cycle takes longer (each 20-point batch sequentially). Example: 25 points → ~6 sec per cycle.

---

## Step 9: Submit a History Job

1. Go to the **History** tab
2. Multi-select points
3. Pick a date range (defaults to last 24h)
4. The hint shows expected batch count (e.g., "25 points × 3 day(s) = 6 batches")
5. Click **Submit Job**
6. The job appears in the list with `PENDING` status
7. The worker picks it up between live cycles (or immediately if no live subscription)
8. Watch the progress bar fill up
9. When status goes to `COMPLETE`, click **Load** to view data in the viewer:
   - Left: data table (first 200 rows)
   - Right: trend chart for all loaded readings
10. Click **Close** to dismiss the viewer

### Cancelling

While a job is `PENDING` or `RUNNING`, click **Cancel**. The current batch finishes, then the worker checks the cancel flag and stops. The job moves to `CANCELLED` state.

### Live + History interleaving

Per architecture decision, **live runs first** when its tick is due. History batches fill the gaps. So if live is active, history jobs progress slower but live stays responsive. If you have no live subscription, history runs continuously.

---

## Step 10: Job retention

Completed/failed/cancelled jobs are automatically deleted after 90 days (configurable via `etapro.job.retention.days`). Cleanup runs daily at 03:00 (`etapro.job.cleanup.cron`).

Readings (`eta_pro_reading`) are kept indefinitely. Add manual cleanup if you need it.

---

## Restart behavior

If the Java app crashes or restarts mid-job:
- Any `RUNNING` history jobs are marked `FAILED` on startup with message "Job orphaned by application restart — please retry"
- Live subscriptions are cleared (in-memory only, not persisted)
- The worker thread restarts cleanly and picks up any remaining `PENDING` jobs

You'll need to manually re-submit any failed jobs and restart live mode from the UI.
