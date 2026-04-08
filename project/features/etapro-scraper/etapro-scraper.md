# EtaPro Data Scraper

## Overview
Automated data collection from EtaPro historian via its Excel COM add-in extension. Since direct database access is not available, the system uses COM (Component Object Model) automation to drive Excel, trigger EtaPro data refresh, and scrape the results into the application database. A full Angular UI — live dashboard, points management, historical table, and multi-series trend charts — is built on top of the scraped data.

**Key design: persistent Excel process.** Excel and the EtaPro add-in stay open between scrapes, eliminating the ~30s startup overhead per cycle. Java communicates with the PowerShell script via signal files. This enables semi-real-time monitoring with ~15-30s refresh cycles.

## Feature Flag
Entirely gated by `etapro.enabled` (default `false`). Both the Spring service and REST controller use `@ConditionalOnProperty` so nothing is loaded until the flag is flipped on. The UI route remains present but shows empty state until the backend is active.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Angular Frontend (frontend/src/app/features/etapro)                 │
│                                                                      │
│  Dashboard ─┐   Points ─┐   Readings ─┐   Trend Chart ─┐             │
│  (live cards)│  (CRUD)  │  (history) │  (ECharts popup)│            │
│             ▼           ▼            ▼                 ▼             │
│        ┌──────────────────────────────────────────┐                  │
│        │  EtaProStateService + EtaProApiService   │                  │
│        │  (polling, signals, trend adapter)        │                  │
│        └──────────────────┬───────────────────────┘                  │
│                           │ HTTP / 5s polling                        │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│  Power Plant Java Backend │                                          │
│                           ▼                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐      │
│  │ NgEtaPro     │───▶│ EtaPro       │───▶│ EtaPro            │      │
│  │ Controller   │    │ Point/Reading│    │ ScraperService    │      │
│  │ /ng/etapro/* │    │ Services     │    │                   │      │
│  └──────────────┘    └──────────────┘    └──────┬────────────┘      │
│                                                  │                   │
│                                         Signal files (JSON)          │
│                                        etapro/signal/                │
│                                      request.json ──▶                │
│                                      ◀── response.json               │
│                                                  │                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────┴────────────┐      │
│  │ EtaProPoint  │    │ EtaProReading│    │ PowerShell        │      │
│  │ (config)     │    │ (time-series)│    │ (persistent loop) │      │
│  │ DB table     │    │ DB table     │    │                   │      │
│  └──────────────┘    └──────────────┘    └──────┬────────────┘      │
│                                                  │                   │
└──────────────────────────────────────────────────┼───────────────────┘
                                                   │
                                            Excel stays open
                                            (COM, not visible)
                                                   │
                                          ┌────────┴────────┐
                                          │  Excel + EtaPro │
                                          │  Add-in         │
                                          │  (template.xlsm)│
                                          └─────────────────┘
```

## Data Flow

1. **Start** — User clicks "Start Process" (or app auto-starts). PowerShell launches, opens Excel + template once
2. **Trigger** — User clicks "Scrape" or scheduled job fires
3. **Signal** — Java writes `request.json` (pointIds, timeRange, outputPath) to signal directory
4. **Refresh** — PowerShell detects request, updates Excel cells, triggers EtaPro recalculation
5. **Export** — Script exports Data sheet to CSV, writes `response.json`
6. **Ingest** — Java reads response, parses CSV, deduplicates, saves to DB
7. **Serve** — Angular frontend polls `/readings/latest` for live dashboard

### Signal Protocol

```
Java                              PowerShell (persistent loop)
 │                                     │
 ├─ write request.json ──────────────▶ │ detects file, removes it
 │                                     ├─ update Config cells
 │                                     ├─ CalculateFull / Run macro
 │                                     ├─ export CSV
 │  ◀── write response.json ──────────┤
 ├─ read response, delete it           │
 ├─ parse CSV, dedup, save to DB       │
 │                                     │ (loop: sleep 500ms, check again)
 ...                                  ...
 │                                     │
 ├─ write shutdown ───────────────────▶│ exits loop, closes Excel
```

## Entities

### EtaProPoint (configuration)
Stores the list of EtaPro point IDs the user wants to track.

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Auto-generated |
| pointId | String | EtaPro point identifier (e.g., "1GT1.MW") |
| description | String | Human-readable description |
| unit | String | Engineering unit (MW, degF, PSI, etc.) |
| category | String | Grouping category (Turbine, HRSG, BOP, etc.) |
| active | Boolean | Whether to include in scrapes |

### EtaProReading (time-series data)
Stores scraped data points. Indexed on (pointId, timestamp) for fast queries and dedup.

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Auto-generated |
| pointId | String | EtaPro point identifier |
| timestamp | LocalDateTime | Reading timestamp from EtaPro |
| value | Double | Numeric reading value |
| quality | String | Data quality flag (Good, Bad, etc.) |
| scrapeSessionId | String | Groups readings from same scrape run |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **Process** | | |
| POST | /ng/etapro/process/start | Start persistent Excel/scraper process |
| POST | /ng/etapro/process/stop | Stop the scraper process gracefully |
| **Points** | | |
| GET | /ng/etapro/points | List all configured points |
| GET | /ng/etapro/points/active | List active points only |
| GET | /ng/etapro/points/category/{cat} | List points by category |
| POST | /ng/etapro/points | Add a new point to track |
| PUT | /ng/etapro/points | Update a point |
| DELETE | /ng/etapro/points/{id} | Soft-delete a point |
| **Scraping** | | |
| POST | /ng/etapro/scrape | Trigger a scrape (params: startTime, endTime) |
| GET | /ng/etapro/scrape/status | Process running, scrape in progress, last status |
| **Readings** | | |
| GET | /ng/etapro/readings | Get readings (params: pointId, startTime, endTime) |
| GET | /ng/etapro/readings/latest | Latest reading per point (for live dashboard) |
| GET | /ng/etapro/readings/paginated | Paginated readings |
| GET | /ng/etapro/readings/session/{id} | Readings from a specific scrape session |

## Configuration Properties

```properties
# EtaPro Scraper — persistent Excel COM automation
etapro.enabled=false
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

## Semi-Real-Time Monitoring

With the persistent process model:
- **Scrape cycle: ~15-30s** (no Excel startup, just cell update + recalc + export)
- **Schedule interval: 60s** (configurable, can go lower)
- **Overlap window: 5 min** with dedup (prevents missed readings at boundaries)
- **Total lag: ~30-90s** from plant data to screen
- **Frontend polls** `/readings/latest` every 5-10s for live dashboard

## Deduplication

Overlapping scrape windows (e.g., every 60s scraping last 5 min) produce duplicate readings. The scraper checks `existsByPointIdAndTimestamp()` before inserting, so only new readings are saved. The DB index on `(pointId, timestamp)` makes this check fast.

## Frontend UI

Route: **`/etapro`** — reachable from the header menu (**Log → EtaPro Trends**) and the home page (**Log card group → EtaPro Trends** tile).

The page is a single component (`EtaProPageComponent`) with three tabs backed by a shared `EtaProStateService` (signals + BehaviorSubjects):

### Dashboard tab (`EtaProDashboardComponent`)
- Grid of reading cards grouped by point category
- Auto-polls `/ng/etapro/readings/latest` every 5 seconds
- Each card shows: point ID, latest value + unit, timestamp, quality badge, description
- Color-coded freshness: green (<2 min), yellow (<5 min), red (>5 min)
- Scraper status bar at top with Start / Stop / Scrape Now buttons
- **Click any card → opens a trend popup** for that single point

### Points tab (`EtaProPointsComponent`)
- Reuses shared `TableComponent` with columns from `EtaProMapperService.toPointTableColumns()`
- Reuses shared `RfReactiveFormComponent` in a popup for add/edit with fields from `toPointFormFields()`
- Double-click row to edit; multi-select to trend
- **"Trend Selected" button** opens the trend popup with all selected points on one chart

### Readings tab (`EtaProReadingsComponent`)
- Reuses shared `TableComponent` with columns from `toReadingTableColumns()`
- Filters: point dropdown, from/to date-time inputs, Search button
- When a point is selected: uses `GET /readings` (non-paginated, all rows)
- When no point selected: uses `GET /readings/paginated` with a 500-row cap

### Trend Chart (shared, not EtaPro-specific)

Lives in `shared/trend-chart/` and is intentionally decoupled from EtaPro so other features can reuse it.

- **`TrendChartComponent`** — pure ECharts wrapper. Inputs: `series: TrendSeries[]`, `title`, `showLegend`, `showZoom`. Knows nothing about where the data came from.
  - Multi Y-axis support: auto-groups series by `unit` (e.g., MW / °F / PSI each get their own axis, max 4)
  - LTTB downsampling for performance with large datasets
  - Zoom (inside + slider), pan, crosshair tooltip with all-series values
- **`TrendWindowComponent`** — wraps the chart with controls. Inputs: `adapter: TrendDataAdapter`, `seriesIds: string[]`, `title`, `initialPreset`.
  - Time range presets: 1h / 4h / 24h / 7d / custom
  - Refresh button, loading state, error state
- **`TrendDataAdapter`** interface — each feature provides its own adapter to feed data into the trend window:
  ```typescript
  interface TrendDataAdapter {
    readonly sourceName: string;
    fetchSeries(request: TrendSeriesRequest): Observable<TrendSeries[]>;
    fetchAvailableSeries(): Observable<{ id, label, unit?, category? }[]>;
  }
  ```
- **`EtaProTrendAdapterService`** — EtaPro's implementation. Fetches point metadata once, then calls `GET /readings` for each requested point in parallel (`forkJoin`), maps results into `TrendSeries[]` with correct labels and units.

### Dependencies
Frontend adds **`echarts`** (only `LineChart`, `Grid`, `Legend`, `Tooltip`, `DataZoom`, `Toolbox`, `Title` modules registered) and **`ngx-echarts`** (peer dep). Bundle impact is minimal since we register only the modules we use.

### Reusability for other features
To trend instrument logs, field-list data, or PJM prices later, create a new adapter implementing `TrendDataAdapter`. No changes needed to `TrendChartComponent` / `TrendWindowComponent`. Example: `InstrumentLogTrendAdapterService implements TrendDataAdapter`.

## File Structure

### Runtime / deployment files
```
power_plant_java/
├── etapro/
│   ├── template.xlsm          # Excel template with EtaPro add-in config (manual setup)
│   ├── output/                # CSV output directory (auto-created)
│   └── signal/                # Signal file directory (auto-created)
│       ├── request.json       # Java → PowerShell (transient)
│       ├── response.json      # PowerShell → Java (transient)
│       ├── scraper.pid        # PID file while process is running
│       └── shutdown           # Graceful shutdown signal
└── scripts/
    └── etapro-scrape.ps1      # PowerShell persistent COM automation script
```

### Backend (Spring Boot)
```
src/main/java/com/dk_power/power_plant_java/
├── entities/etapro/
│   ├── EtaProPoint.java               # @Entity extends BaseAuditEntity
│   └── EtaProReading.java             # @Entity extends BaseIdEntity, indexed (pointId, timestamp)
├── repository/etapro/
│   ├── EtaProPointRepo.java
│   └── EtaProReadingRepo.java         # includes existsByPointIdAndTimestamp for dedup
├── dto/etapro/
│   ├── EtaProPointDto.java
│   └── EtaProReadingDto.java
├── mappers/etapro/
│   └── EtaProMapper.java              # thin BaseMapper wrapper around ModelMapper
├── sevice/etapro/
│   ├── EtaProPointService.java + impl/EtaProPointServiceImpl.java
│   ├── EtaProReadingService.java + impl/EtaProReadingServiceImpl.java
│   └── EtaProScraperService.java      # orchestrates PowerShell process + signal files
└── controller/angular/etapro/
    └── NgEtaProController.java        # /ng/etapro/* REST endpoints
```

### Frontend (Angular)
```
frontend/src/app/
├── models/
│   ├── etapro/
│   │   ├── etapro-point.model.ts      # EtaProPointDto extends BaseDto
│   │   └── etapro-reading.model.ts    # EtaProReadingDto extends BaseDto
│   └── trend/
│       └── trend-series.model.ts      # TrendSeries, TrendPoint, TrendDataAdapter (SHARED)
├── shared/trend-chart/                # Reusable for any time-series feature
│   ├── trend-chart.component.ts       # Pure ECharts renderer (multi-axis, zoom, tooltip)
│   └── trend-window.component.ts      # Adapter-driven wrapper with range presets
├── features/etapro/
│   ├── etapro-page/etapro-page.component.ts        # Tab container + trend popup
│   ├── etapro-dashboard/etapro-dashboard.component.ts  # Live cards grid
│   ├── etapro-points/etapro-points.component.ts    # Points CRUD (reuses TableComponent)
│   ├── etapro-readings/etapro-readings.component.ts  # History table with filters
│   └── services/
│       ├── etapro-api.service.ts              # HTTP client for /ng/etapro/*
│       ├── etapro-state.service.ts            # BehaviorSubjects + signals + polling
│       ├── etapro-mapper.service.ts           # toPointTableColumns, toPointFormFields, toReadingTableColumns
│       └── etapro-trend-adapter.service.ts    # implements TrendDataAdapter
└── routes/
    └── etapro.routes.ts               # /etapro route (registered in app.routes.ts)
```

### Navigation entry points
- [router-menu.model.ts](frontend/src/app/models/ui/router-menu.model.ts) — added to Log group (`/etapro`, `trending_up` icon)
- [navigation-card.model.ts](frontend/src/app/models/ui/navigation-card.model.ts) — home page card in Log group
