# EtaPro Data Scraper

## Overview
Automated data collection from EtaPro historian via its Excel COM add-in extension. Since direct database access is not available, the system uses COM (Component Object Model) automation to drive Excel, trigger EtaPro data refresh, and scrape the results into the application database.

The architecture is **job-based**: every scrape is initiated from the app, not from EtaPro. Users select points and either start a continuous **Live** subscription or submit a **History** job for a specific date range. A single worker thread interleaves live cycles and history batches against one shared Excel process.

## Feature Flag & Profile Separation

EtaPro is **desktop-only**. The hub runs headless on a Linux-style server with no Excel, no PowerShell, and no Windows COM — EtaPro cannot work there.

Separation is enforced at the **configuration level**:
- All EtaPro beans use `@ConditionalOnProperty(name = "etapro.enabled")` — nothing loads unless the flag is on
- `application-hub.properties` hardcodes `etapro.enabled=false` — even if another config layer tries to enable it, the hub profile override wins
- `application.properties` defaults `etapro.enabled=false` — the feature is off unless an operator explicitly turns it on per device

To enable on a specific desktop:
1. Ensure the device is NOT using the `hub` profile
2. Set `etapro.enabled=true` in either a `device-configs/<device>.properties` file or the main `application.properties`
3. Restart the Java app

**Operational safety note**: never set `etapro.enabled=true` in a device config that runs with `hub` or `server` profiles active. The hub property override will defeat it, but the safest practice is to keep EtaPro-related config out of hub devices entirely.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Angular Frontend (frontend/src/app/features/etapro)                 │
│                                                                      │
│  Live tab ─┐    History tab ─┐    Points tab ─┐                      │
│            ▼                  ▼                ▼                     │
│        ┌──────────────────────────────────────┐                      │
│        │  EtaProStateService + EtaProApi      │                      │
│        │  (signals, polling, trend adapter)    │                     │
│        └──────────────┬───────────────────────┘                      │
│                       │ HTTP                                         │
└───────────────────────┼──────────────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────────────┐
│  Backend (Spring Boot)│                                              │
│                       ▼                                              │
│  ┌───────────────────────┐                                           │
│  │ NgEtaProController    │  Points · Jobs · Live · Readings          │
│  └────────┬──────────────┘                                           │
│           │                                                          │
│  ┌────────▼─────────────┐    ┌──────────────────┐                    │
│  │ EtaProHistoryJob     │    │ EtaProLiveService│                    │
│  │ Service              │    │ (in-memory       │                    │
│  │ (DB-backed jobs,     │    │  subscription)   │                    │
│  │  batch planning)     │    └────────┬─────────┘                    │
│  └────────┬─────────────┘             │                              │
│           │                           │                              │
│           └───────────┬───────────────┘                              │
│                       │ reads pending work                           │
│                       ▼                                              │
│           ┌───────────────────────────┐                              │
│           │ EtaProScrapeWorker        │  single thread; interleave   │
│           │ (loop)                    │  live priority + history     │
│           └───────────┬───────────────┘                              │
│                       │ executeBatch(template, points, start, end)   │
│                       ▼                                              │
│           ┌───────────────────────────┐                              │
│           │ EtaProScraperEngine       │  signal files → CSV → DB     │
│           │ (low-level primitive)     │                              │
│           └───────────┬───────────────┘                              │
│                       │                                              │
└───────────────────────┼──────────────────────────────────────────────┘
                        │ etapro/signal/request.json + response.json
                        ▼
            ┌───────────────────────────┐
            │ PowerShell (persistent)   │
            │ Excel.Application         │
            │ ├── template-live.xlsx    │  20 slots × 1 row × 3-sec
            │ └── template-history.xlsx │  20 slots × 28,800 rows × 3-sec
            └───────────────────────────┘
```

## Key constants

- `MAX_POINTS_PER_LIVE_BATCH = 100` — live template has 100 column-layout slots
- `MAX_POINTS_PER_HISTORY_BATCH = 20` — history template has 20 pivot-column slots
- `etapro.live.interval.ms = 3000` — minimum delay between live cycles
- `etapro.scrape.timeout.seconds = 120` — per-batch timeout (Excel refresh + CSV export)
- `etapro.job.retention.days = 90` — completed jobs deleted after this

## Worker loop

```
loop:
  if liveService.isActive() AND (now - lastLiveTickStart) >= liveIntervalMs:
    runLiveCycle()             // all subscribed points, batched 20 at a time
    lastLiveTickStart = now
    continue

  if pending or running history job AND has remaining batches:
    runHistoryBatch()           // one (day-slice × point-group) batch
    continue

  sleep(idleSleepMs)
```

- Live has time-based priority: every 3 seconds (configurable) it runs ahead of any history batch
- Between live ticks, history batches fill the gaps
- A long history batch (e.g., 28K-row recalc) may delay the next live tick — acceptable trade-off
- Single worker thread, no parallelism (Excel COM is serial)

## Job model

`EtaProScrapeJob` is the persistent record of a scrape request:

| Field | Description |
|-------|-------------|
| `mode` | `HISTORY` or `LIVE` |
| `status` | `PENDING` → `RUNNING` → `COMPLETE` / `FAILED` / `CANCELLED` |
| `rangeStart`, `rangeEnd` | Time window (HISTORY only; null for LIVE) |
| `pointIds` | Requested points (any number; auto-batched) |
| `batchesTotal` | `ceil(points/20) × ceil(days)` |
| `batchesCompleted` | Updated as worker advances |
| `readingsImported` | Cumulative deduped count |
| `errorMessage` | Set on FAILED |

### Batch planning

For a job with 25 points × 3 days:
- Point groups: `[P1..P20]` and `[P21..P25]`
- Day slices: `[day1, day2, day3]`
- Plan order: `(day1, group1) → (day1, group2) → (day2, group1) → (day2, group2) → (day3, group1) → (day3, group2)` = **6 batches**

### Restart behavior

On startup, any job left in `RUNNING` state (Java crashed mid-job) is reaped to `FAILED` with message "Job orphaned by application restart — please retry". User decides whether to resubmit. No auto-resume.

## Live mode

`EtaProLiveService` holds an in-memory singleton subscription. Only one live subscription exists at a time; starting a new one replaces the old. State is **not persisted** — restarts clear it and require explicit restart from the UI.

Each live cycle:
1. Read subscribed point IDs
2. Split into 20-point chunks
3. For each chunk, call `engine.executeBatch(LIVE, chunk, now-15s, now)`
4. Update last-cycle-at timestamp
5. Frontend polls `/live/status` and `/readings/latest` every 3 sec

If the user subscribes to >20 points, each cycle runs N/20 batches sequentially. Example: 25 points → 2 batches → ~6 sec per cycle.

## Templates

Two manually-created Excel files with **different structures**:

### `template-live.xlsx` — column layout, 100 slots, GetEPCurrent
- **Data sheet only** — no Config sheet
- **Column A** rows 1-100: empty cells for point IDs (script writes per request)
- **Column B** rows 1-100: pre-inserted formulas:
  ```
  =@GetEPCurrent(1, A{row}, Source, 192.168.190.85)
  ```
- Each formula returns **one current value** for the point in its row
- No time range, no historian query — just "value right now"
- Script writes point IDs to A1:A100, calls `Application.Calculate()` to force refresh, reads A+B columns, exports flat CSV with `now()` stamped as timestamp

### `template-history.xlsx` — pivot layout, 20 slots, array formulas
- **Config sheet**: A1=`StartTime`, B1=*(empty)*, A2=`EndTime`, B2=*(empty)*
- **Data sheet**: A1=`Timestamp`, B1:U1 = empty (20 point slots)
- **Array formulas** sized for 24-hour windows at 3-sec interval = **28,800 rows**
  - Inserted via EtaPro `Insert Function → Array Functions → Calculated Values`
  - Each value column references its row 1 cell as the Point parameter
  - Column A is the timestamp array (Include timestamp = TRUE)
  - All formulas reference `Config!B1`/`Config!B2` for time range
- One day-window per batch — script updates Config!B1/B2 to slide the window
- Auto-recalculates when Config cells change; script waits via `CalculateUntilAsyncQueriesDone()`

The script writes point IDs dynamically per request — points are NOT pre-assigned in either template.

## Signal protocol

```
Java                              PowerShell (persistent loop)
 │                                     │
 ├─ write request.json ──────────────▶ │ detects file, removes it
 │  { template, startDate, endDate,    ├─ dispatch by template field:
 │    pointIds, outputPath }           │
 │                                     │   ── live ────────────────────
 │                                     │   ├─ write A1:A100 (point IDs)
 │                                     │   ├─ Application.Calculate()
 │                                     │   ├─ stamp timestamp = now()
 │                                     │   ├─ export flat CSV (PointId,Time,Value,Quality)
 │                                     │
 │                                     │   ── history ─────────────────
 │                                     │   ├─ write Config!B1/B2 (time range)
 │                                     │   ├─ write B1:U1 (point headers)
 │                                     │   ├─ CalculateUntilAsyncQueriesDone()
 │                                     │   ├─ export pivot CSV (Timestamp,P1,P2,...)
 │                                     │
 │  ◀── write response.json ──────────┤   { status: "complete", lineCount }
 ├─ read response, parse CSV           │
 ├─ dedup, save to eta_pro_reading     │
 │                                     │ (loop: poll request.json again)
 ...                                  ...
```

The Java CSV parser auto-detects the format by inspecting the first header cell:
- `PointId` → flat format (live) — uses script-stamped timestamp
- `Timestamp`/`Time` → pivot format (history) — uses EtaPro-provided timestamps

## REST API

| Method | Path | Purpose |
|--------|------|---------|
| **Points** | | |
| GET | `/ng/etapro/points` | Master list |
| GET | `/ng/etapro/points/active` | Active points only |
| POST | `/ng/etapro/points` | Create |
| PUT | `/ng/etapro/points` | Update |
| DELETE | `/ng/etapro/points/{id}` | Soft-delete |
| **History jobs** | | |
| POST | `/ng/etapro/jobs` | Submit job — body `{ pointIds, rangeStart, rangeEnd }` |
| GET | `/ng/etapro/jobs` | List recent (paginated) |
| GET | `/ng/etapro/jobs/{id}` | Status + progress |
| DELETE | `/ng/etapro/jobs/{id}` | Cancel |
| **Live mode** | | |
| POST | `/ng/etapro/live/start` | Body `{ pointIds }` |
| POST | `/ng/etapro/live/stop` | Clear subscription |
| GET | `/ng/etapro/live/status` | Active flag, points, last cycle time |
| **Readings** | | |
| GET | `/ng/etapro/readings?pointId=&startTime=&endTime=` | Time range |
| GET | `/ng/etapro/readings/latest` | Latest per point |

## Configuration

```properties
# Master flag — off by default; enable per-device
etapro.enabled=false

# Templates (manual creation per setup-guide.md)
etapro.live.template.path=${user.dir}/etapro/template-live.xlsx
etapro.history.template.path=${user.dir}/etapro/template-history.xlsx

# Runtime directories (auto-created)
etapro.output.path=${user.dir}/etapro/output
etapro.signal.path=${user.dir}/etapro/signal

# PowerShell script (shipped with repo)
etapro.script.path=${user.dir}/scripts/etapro-scrape.ps1

# Per-batch timeout
etapro.scrape.timeout.seconds=120

# Live mode minimum interval between cycles
etapro.live.interval.ms=3000

# Worker loop idle sleep
etapro.worker.idle-sleep.ms=200

# Job retention (cleanup deletes terminal jobs older than this)
etapro.job.retention.days=90
etapro.job.cleanup.cron=0 0 3 * * ?
```

## Frontend UI

Route: **`/etapro`** — reachable from header menu (Log → EtaPro Trends) and home page.

### Tab 1: Live
- Multi-select point picker (disabled while active)
- Start Live / Stop Live buttons
- Status bar showing engine state + last cycle time
- Split view (when active):
  - **Left**: Latest-values table — one row per subscribed point, marked stale if reading is >10s old
  - **Right**: Rolling 60-second trend chart, populated by accumulating new readings client-side

### Tab 2: History
- Multi-select point picker + datetime range
- Live hint shows the computed batch count (e.g., "25 points × 3 day(s) = 6 batches")
- Submit button creates a PENDING job
- Active jobs list with progress bars, status badges, cancel buttons
- Click `Load` on a COMPLETE job → viewer panel opens with split view (table + trend) for that job's data

### Tab 3: Points
- Master list CRUD (unchanged from previous version)

## Deduplication

The engine checks `existsByPointIdAndReadingTime` before inserting each row. Live cycles produce overlapping readings; history batches deduplicate against any data already pulled (e.g., from a previous job over the same range). The DB index on `(pointId, readingTime)` makes this fast.

## Electron Packaging

EtaPro's PowerShell script and Excel templates are shipped with the desktop Electron installer and auto-provisioned into the managed working directory on first launch.

### Bundle layout

```
electron-manager/
└── etapro-defaults/                  ← committed (mostly)
    ├── README.md                     ← committed
    ├── .gitignore                    ← committed (ignores *.xlsx and *.xlsm)
    ├── etapro-scrape.ps1             ← committed
    ├── template-live.xlsx            ← GITIGNORED — operators drop in before building
    └── template-history.xlsx         ← GITIGNORED — operators drop in before building
```

Templates are **not checked into git** because they contain plant-specific configuration (historian IP, source name, point IDs in formulas). Each plant's build operator drops their own templates into `etapro-defaults/` before running `npm run package`.

### electron-builder config

In [electron-manager/package.json](../../../electron-manager/package.json):

```json
{
  "from": "etapro-defaults",
  "to": "etapro-defaults",
  "filter": ["etapro-scrape.ps1", "*.xlsx"]
}
```

This ends up in the packaged installer under `resources/etapro-defaults/`.

### Provisioning on startup

In [electron-manager/src/main/paths.ts](../../../electron-manager/src/main/paths.ts), the function `provisionEtaProDefaults()` runs during Electron's `onReady()` handler, right after `provisionDefaultConfigs()`. It:

1. Creates `<workingDir>/scripts/`, `<workingDir>/etapro/`, `<workingDir>/etapro/output/`, `<workingDir>/etapro/signal/`
2. **Always** copies `etapro-scrape.ps1` → `<workingDir>/scripts/etapro-scrape.ps1` — the script is treated as code, so updates apply on every launch
3. **Only if missing**, copies `template-live.xlsx` → `<workingDir>/etapro/template-live.xlsx` — user customizations are preserved
4. Same policy for `template-history.xlsx`

Missing templates in the bundle are logged as warnings but don't block startup — Java's `EtaProScraperEngine.init()` handles the missing-file case with its own validation warnings.

### Working directory paths

| Mode | Working dir (JAR cwd) |
|------|-----------------------|
| Dev | `electron-manager/managed_apps/pid/` |
| Packaged | `%PROGRAMDATA%/DK Power Manager/managed_apps/pid/` |

Since `spring-boot.manager.ts` sets `cwd = workingDir` when spawning the JAR, Java's `${user.dir}` resolves to this path, and the default `etapro.*.path` properties pick up the provisioned files automatically. No env vars or explicit path overrides needed.

### Division of responsibilities

**Electron** is a **delivery vehicle** only — it ships resources, launches the JAR, and gets out of the way:
1. Bundle the `.ps1` + templates in the installer
2. On first launch, copy them into the managed working directory
3. Launch the JAR with `cwd = workingDir`
4. Done — never interacts with EtaPro at runtime

**Java** owns the runtime:
- Spawns the PowerShell process via `ProcessBuilder`
- Communicates with it via signal files
- Parses CSV, deduplicates, saves to DB
- Orchestrates the worker loop (live + history interleave)

This keeps dev mode (`mvn spring-boot:run` without Electron) fully functional — drop templates into `./etapro/` and the script into `./scripts/` manually, and the same Java code runs identically.

## File structure

```
power_plant_java/
├── etapro/
│   ├── template-live.xlsx           # 20 slots × few rows × 3-sec interval
│   ├── template-history.xlsx        # 20 slots × 28,800 rows × 3-sec interval
│   ├── output/                       # CSV staging
│   └── signal/                       # request.json + response.json
├── scripts/
│   └── etapro-scrape.ps1            # persistent dual-template script
└── src/main/java/com/dk_power/power_plant_java/
    ├── entities/etapro/
    │   ├── EtaProPoint.java
    │   ├── EtaProReading.java
    │   └── EtaProScrapeJob.java     # NEW
    ├── repository/etapro/
    │   ├── EtaProPointRepo.java
    │   ├── EtaProReadingRepo.java
    │   └── EtaProScrapeJobRepo.java # NEW
    ├── dto/etapro/
    │   ├── EtaProPointDto.java
    │   ├── EtaProReadingDto.java
    │   └── EtaProScrapeJobDto.java  # NEW
    ├── sevice/etapro/
    │   ├── EtaProPointService.java + impl
    │   ├── EtaProReadingService.java + impl
    │   ├── EtaProScraperEngine.java # was EtaProScraperService — now low-level only
    │   ├── EtaProHistoryJobService.java  # NEW: job lifecycle + batch planning
    │   ├── EtaProLiveService.java   # NEW: in-memory live subscription
    │   ├── EtaProScrapeWorker.java  # NEW: single-thread interleave loop
    │   └── EtaProJobCleanupTask.java # NEW: 90-day retention
    └── controller/angular/etapro/
        └── NgEtaProController.java  # rewritten — points, jobs, live, readings

frontend/src/app/
├── models/etapro/
│   ├── etapro-point.model.ts
│   ├── etapro-reading.model.ts
│   └── etapro-scrape-job.model.ts   # NEW
├── features/etapro/
│   ├── etapro-page/                 # Live / History / Points tabs
│   ├── etapro-live/                 # NEW: live tab
│   ├── etapro-history/              # NEW: history tab
│   ├── etapro-points/               # unchanged
│   └── services/
│       ├── etapro-api.service.ts    # rewritten
│       ├── etapro-state.service.ts  # rewritten
│       ├── etapro-mapper.service.ts # unchanged
│       └── etapro-trend-adapter.service.ts
└── routes/
    └── etapro.routes.ts
```
