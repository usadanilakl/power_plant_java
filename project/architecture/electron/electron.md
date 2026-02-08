## Functionality

1. Wrap Main SpringBoot App - to run it as desktop
2. Embed Spring Boot UI directly inside Electron via iframe (no external browser)
3. Perform Main SpringBoot App updates and full re-sync by connecting to Sync Server
4. Provide UI to control Main SpringBoot App:
    - Start
    - Stop
    - Restart
    - Update
    - Resync
    - Status
5. Provide fully independent functionalities:
    - Fire Impairment manager
    - Gate Log
    - Weather monitoring
    - PJM monitoring
    - Permit monitoring (independent from Main SpringBoot App)
    - PID browser (independent from Main SpringBoot App) - simple version

## Project Structure

```
electron-manager/
├── src/
│   ├── shared/
│   │   └── types.ts                      # Shared types (main + renderer)
│   ├── main/                             # Electron main process
│   │   ├── main.ts                       # Entry point
│   │   ├── app.ts                        # App lifecycle, menu, pre/post-startup checks
│   │   ├── constants.ts                  # Config (single Spring Boot app)
│   │   ├── managers/
│   │   │   ├── main-window.manager.ts    # Primary BrowserWindow
│   │   │   ├── spring-boot.manager.ts    # Start/stop/health for PID app
│   │   │   ├── device-config.manager.ts  # Device identity config (JSON + properties)
│   │   │   ├── update.manager.ts         # JAR update check/download/verify
│   │   │   ├── sync-status.manager.ts    # Sync status, staleness, conflict detection
│   │   │   ├── cold-resync.manager.ts   # External DB + file download (before SB starts)
│   │   │   ├── gate-log.manager.ts      # Gate Log: OnLocation API + gate scraper + combiner
│   │   │   └── webview.manager.ts        # WebView windows (FM Global, Gate, OnLocation)
│   │   ├── ipc/
│   │   │   ├── events.ts                 # All IPC channel names
│   │   │   └── handlers.ts              # IPC handler registration
│   │   └── preload/
│   │       └── main.preload.ts           # contextBridge API
│   └── renderer/                         # Angular UI
│       └── src/app/
│           ├── app.component.ts          # Shell: header + sidebar + router + notifications
│           ├── app.routes.ts             # All page routes
│           ├── layout/
│           │   └── sidebar.component.ts  # Nav sidebar with SB status
│           ├── components/
│           │   └── header.component.ts   # Title bar + window controls
│           ├── pages/
│           │   ├── home/                 # Dashboard + SB controls + feature cards + imp count badge
│           │   ├── spring-boot-ui/       # Embedded SB app via iframe
│           │   ├── fire-impairment/      # List/create/close impairments + FM Global
│           │   │   ├── fire-impairment.component.ts       # Main page (active/closed tabs)
│           │   │   ├── create-impairment-dialog.component.ts  # People/location/protection form
│           │   │   └── close-impairment-dialog.component.ts   # 4-step close instructions
│           │   ├── gate-log/             # People on site + table
│           │   ├── weather/              # Lightning distance display
│           │   ├── pjm/                  # LMP price display
│           │   ├── logs/                 # Spring Boot log viewer
│           │   ├── sync-updates/         # Sync status, JAR updates, device conflicts
│           │   └── settings/             # Device identity + app configuration
│           └── services/
│               └── electron.service.ts   # Angular <-> IPC bridge
```

## Implementation Status

### Main SpringBoot Manager - DONE
- Single process management (power_plant_java-1.jar on port 8082)
- Start/Stop/Restart via menu and UI controls
- Health checking via /actuator/health
- Real-time status and log streaming to renderer
- Auto-start on Electron launch
- Graceful shutdown on window close (with confirmation dialog)
- No `shell: true` in spawn (security fix)
- `isQuitting` flag prevents double-cleanup race condition
- `sandbox: false` in BrowserWindow webPreferences (required for preload `require()` in Electron 20+)

### Embedded Spring Boot UI - DONE
- Spring Boot app (localhost:8082) rendered inside Electron via `<iframe>` on the `/pid-app` route
- `SpringBootUiComponent` uses `DomSanitizer.bypassSecurityTrustResourceUrl()` for iframe src
- When Spring Boot is running: full iframe fills the content area
- When not running: placeholder with status message and "Start Spring Boot" button
- Home dashboard "Open PID App" button navigates to `/pid-app` (no external browser)

### Collapsible Sidebar - DONE
- Sidebar auto-collapses to 56px (icon-only) when navigating to `/pid-app`
- Auto-expands to 220px when navigating to any other route
- Manual toggle button (chevron) in sidebar footer for user override
- `AppComponent` subscribes to `Router.events` (NavigationEnd) to drive auto-collapse
- When collapsed: logo text, SB status text, nav labels, and version all hidden (opacity transition)
- `.main-content.no-padding` removes padding when collapsed (maximizes iframe space)
- Sidebar nav items: Home, PID App, Fire Impairment, Gate Log, Weather, PJM, Logs, Settings

### Fire Impairment - DONE (UI + Backend + WebView + Create/Close Workflows)

**Spring Boot backend** (in power_plant_java):
- Entity: `entities/fire_impairment/FireImpairment.java` (extends BaseIdEntity, sync-enabled)
- Enums: `FireImpairmentLocation`, `ProtectionIdentifier`, `Emails` (18 employees)
- DTO: `dto/fire_impairment/FireImpairmentDto.java`
- Repository: `repository/fire_impairment/FireImpairmentRepo.java`
- Service: `sevice/fire_impairment/FireImpairmentService.java`
- Controller: `controller/fire_impairment/FireImpairmentController.java`
  - REST API at `/api/fire-impairment` (CRUD + active/closed/latest)
  - Enum endpoints: `/locations`, `/protection-types`, `/emails`

**Electron IPC channels** (8 invoke/handle + 1 broadcast):
- `fire-imp:list`, `fire-imp:list-closed`, `fire-imp:count`, `fire-imp:get-enums`
- `fire-imp:create`, `fire-imp:update`, `fire-imp:close`, `fire-imp:open-form`
- `fire-imp:form-submitted` (broadcast: FM Global button intercepted with gathered form data)
- Helpers: `springBootApiGet`, `springBootApiPost`, `springBootApiPut` in `handlers.ts`

**Electron WebView automation:**
- `webview.manager.ts` opens BrowserWindow to https://redetag.fmglobal.com
- `fillFmGlobalForm()` injects JavaScript to populate form fields (mirrors JavaFX WebViewApp)
- `gatherFmGlobalData()` extracts form data including precautions checkboxes
- `interceptFmGlobalButtons()` overrides `btnBack`/`btnSubmit` onclick; gathers form data via console-message bridge, broadcasts to renderer, then lets original handler run (FM Global behavior unchanged)

**Angular UI:**
- Active/Closed tabs with separate API calls for each list
- **Create workflow**: "New Impairment" button opens dialog with people checkboxes (18 employees, 10 pre-selected), location dropdown, protection identifier dropdown. On submit: saves to DB then opens FM Global WebView with auto-filled form data. Back/Submit buttons intercepted — gathers form data and updates DB record.
- **Close workflow**: "Close" button on each active card opens instruction dialog (4-step guide: copy FM Global email, open Outlook, Reply All, send message). Copy-to-clipboard buttons. On confirm: marks impairment inactive via PUT /close
- **Home page badge**: Dashboard Fire Impairment card shows active impairment count
- Auto-loads when Spring Boot becomes available
- Shows "Spring Boot Required" notice when SB is not running
- Components: `fire-impairment.component.ts`, `create-impairment-dialog.component.ts`, `close-impairment-dialog.component.ts`

**Deferred**: "New" tag on synced impairments, search/filter

Previous apps consolidated:
- `C:\Users\usada\my_projects\fire-imparement` -> Spring Boot backend
- `C:\Users\usada\my_projects\Fire-Imparement-JavaFX` -> WebView automation

### Device Identity - DONE
- Explicit device number assignment (1-9) replaces hash-based approach
- `DeviceConfigManager` reads/writes `device-config.json` (Electron) and `machine-id.properties` (Spring Boot)
- Online registration via sync server `POST /api/field-sync/device-registry`
- Offline manual configuration with conflict detection on server reconnect
- Settings UI: device name, number selection (shows taken/available), sync server URL
- First-run detection: `app.ts` checks `isConfigured()`, sends `device:needs-setup` IPC to navigate to Settings
- Files: `device-config.manager.ts`, Settings component device identity form

### Sync & Updates - DONE

**Server-side (same Spring Boot codebase deployed on sync server):**
- `UpdateController` at `/api/update/check` (JAR metadata + SHA-256 checksum) and `/api/update/download` (streamed with HTTP Range header support for resumable downloads)
- `SyncConfig` properties: `update.jar.directory`, `update.jar.filename`
- Device conflict detection in `FieldSyncController.exchange()` via `X-Device-Number` + `X-Machine-Id` headers
- `Peer.deviceNumberConflict` field tracks conflicting machineId

**Electron pre-startup flow (before Spring Boot starts):**
1. Check sync server availability
2. Check for JAR update (compare SHA-256 checksum) → download if newer with progress reporting
3. Cold resync if needed (first run — no database file): download H2 backup + files from sync server
4. Check device number conflicts against server registry
5. All failures are non-fatal (graceful degradation when offline)

**Cold Resync (external database + file download):**
- `ColdResyncManager` downloads H2 database and files directly from sync server — no Spring Boot needed
- Auto-triggers on first run when `db/proddb.mv.db` doesn't exist (and device is configured)
- Can be triggered manually from Sync & Updates UI (Spring Boot must be stopped first)
- Flow: download H2 backup ZIP → extract `.mv.db` with `adm-zip` → download file manifest → download all files → write `sync-status.json`
- Server endpoints (on sync server): `GET /api/resync/database/h2-backup`, `GET /api/resync/files/path-manifest`, `GET /api/resync/files/permanent/**`
- Headers: `X-Machine-Id`, `X-Device-Number`
- Progress reporting via IPC: `cold-resync:progress` with phase/percent/file counts

**Electron post-startup flow (after Spring Boot is healthy):**
1. Query Spring Boot `/api/field-sync/metrics` for last sync time
2. If >14 days stale (or never synced): send `sync:stale` IPC event to renderer
3. Renderer shows dismissible notification banner

**Managers:**
- `UpdateManager`: `checkForUpdate()`, `downloadUpdate()` with progress callback, SHA-256 verification, `.jar.tmp` → `.jar` atomic rename
- `SyncStatusManager`: `getSyncStatus()`, `isSyncStale()`, `triggerFullResync()`, `checkDeviceConflict()`, persists `sync-status.json`
- `ColdResyncManager`: `needsColdResync()`, `performColdResync()` — downloads DB + files from sync server before Spring Boot starts

**UI (Sync & Updates page):**
- Four sections: Database Sync (status, staleness, resync), Download from Server (cold resync — works without Spring Boot), Application Update (check/download/restart), Device Identity (info + conflict warnings)
- Notification banners in AppComponent for startup events (update progress, cold resync progress, sync stale, device conflict)
- Sidebar nav item: "Sync & Updates" at `/sync-updates`

### Gate Log - DONE (OnLocation API + Gate Scraping + WebView Auto-Login)

**Electron main process** (no Spring Boot dependency):
- `GateLogManager` in `gate-log.manager.ts`: fetches OnLocation visitor events via REST API, scrapes gate website via hidden BrowserWindow, combines both sources, calculates durations
- Auto-refresh scheduler: configurable interval (15/30/60/120 min), persisted to config file
- Config persistence: `managed_apps/pid/gate-log-config.json` (credentials, URLs, auto-refresh settings)
- Print: generates formatted HTML, opens print dialog via hidden BrowserWindow

**IPC channels** (8 total):
- `gate-log:get-people`, `gate-log:get-status`, `gate-log:refresh`, `gate-log:set-auto-refresh`
- `gate-log:get-config`, `gate-log:save-config`, `gate-log:print`
- `gate-log:people-updated` (broadcast on data change)

**WebView auto-login** (in `webview.manager.ts`):
- `gate-website` target: opens `https://10.56.80.80/` with SSL cert bypass + auto-login JS injection
- `onlocation` target: opens `https://us3.whosonlocation.com/login` with two-step auto-login (email → password)

**Angular UI:**
- Toolbar: Refresh, auto-refresh toggle + interval, Open Gate Web / Open OnLocation buttons, Print
- Summary cards: People count, Gate/OnLocation breakdown, last update time
- Sortable data table: Name, Source badge, Check In, Duration, Company, Contact
- Collapsible config panel: OnLocation API key + login, Gate URL + credentials
- Live updates via `gate-log:people-updated` subscription

Previous app consolidated: `C:\Users\usada\my_projects\Entrance_Log` (Spring Boot + JavaFX + Selenium)

### Weather Monitoring - UI SCAFFOLD
- Lightning distance display panel with color-coded severity (safe/caution/danger)
- Status cards showing monitoring state
- Thresholds: <=8mi = Alarm (red), <=20mi = Watch (yellow), >20mi = Clear (green)
- Placeholder for WeatherBug BrowserView scraping
- Previous code: `C:\Users\usada\JS Projects\dk-power-full-stack\apps\pwa\src\app\features\weather`

### PJM Monitoring - UI SCAFFOLD
- LMP price display panel
- Info cards (Pricing Node, Zone, Update Interval)
- Placeholder for PJM Data Miner API or WebView automation
- Previous code: `C:\Users\usada\JS Projects\dk-power-full-stack\apps\pwa\src\app\features\pjm`

### Permit Monitoring - NOT STARTED
- Depends on Main SpringBoot API (not yet available)

## Build & TypeScript Configuration

- **Solution-style tsconfig**: Root `tsconfig.json` has `"files": []` with references to `tsconfig.main.json` (main process) and `src/renderer/tsconfig.json` (Angular)
- **Main process**: `tsconfig.main.json` — `rootDir: ./src`, `outDir: ./dist/main`, includes `src/main/**/*.ts` and `src/shared/**/*.ts`
- **Shared types**: `src/shared/types.ts` is the single source of truth for types used by both main and renderer
- **Output structure**: Because `rootDir` is `./src`, compiled output lands in `dist/main/main/` and `dist/main/shared/` — `package.json` main entry is `dist/main/main/main.js`
- **Path resolution**: All `__dirname`-relative paths in managers account for the extra directory level (e.g., renderer HTML is `path.join(__dirname, '..', '..', '..', ...)`)

## Deferred (Future Work)
- Electron packaging and installer
- Weather WeatherBug BrowserView integration
- PJM Data Miner API integration
- Permit monitoring (needs Main SpringBoot API)
- Settings persistence (save/load beyond device identity)
