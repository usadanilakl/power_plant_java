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
│   │   ├── constants.ts                  # Config (single Spring Boot app, no credentials)
│   │   ├── paths.ts                      # Path resolver (dev vs packaged) + config provisioning
│   │   ├── managers/
│   │   │   ├── main-window.manager.ts    # Primary BrowserWindow
│   │   │   ├── spring-boot.manager.ts    # Start/stop/health for PID app
│   │   │   ├── device-config.manager.ts  # Device identity config (JSON + properties)
│   │   │   ├── update.manager.ts         # JAR update check/download/verify
│   │   │   ├── sync-status.manager.ts    # Sync status, staleness, conflict detection
│   │   │   ├── cold-resync.manager.ts   # External DB + file download (before SB starts)
│   │   │   ├── electron-update.manager.ts # Electron self-update (check/download/apply via batch script)
│   │   │   ├── resource-pack.manager.ts # Resource pack sync (engraver_data, qa-data)
│   │   │   ├── gate-log.manager.ts      # Gate Log: OnLocation API + gate scraper + combiner
│   │   │   ├── pjm.manager.ts          # PJM: Data Miner API polling + Voyager window
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
- **Port conflict resolution**: On start, checks if port 8082 is in use (e.g., orphaned process from previous user session). Tries graceful `POST /actuator/shutdown` first (8s timeout), falls back to `taskkill /f` via PID lookup from `netstat`
- **Session cleanup**: `powerMonitor.on('shutdown')` stops Spring Boot on Windows sign-out/shutdown. Lock-screen intentionally does NOT stop SB — port conflict resolver handles the next user's session
- **Device config as env var**: `DEVICE_CONFIG` environment variable passed to Spring Boot process from `device-config.json`

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

**Electron startup flow — assess, don't auto-download (before Spring Boot starts):**
1. Check sync server reachability (HTTP GET with 5s timeout)
   - If unreachable: send `startup:server-status { reachable: false }` to renderer, poll every 15s
   - When reachable: run full assessment
2. Perform local + remote checks: JAR present/update available, DB present/size, files present/size, sync staleness, device conflicts
3. Send `startup:assessment` to renderer with full `StartupAssessment` object
4. Do NOT auto-download — user decides via notification bar or Sync & Updates page
5. All failures are non-fatal (graceful degradation when offline)

**Selective sync (user-triggered):**
- `sync:execute` IPC handler accepts array of `SyncComponent` (`'jar' | 'db' | 'files' | 'resource-packs'`)
- Automatically stops Spring Boot before DB/files sync, restarts after
- Resource packs sync does NOT require Spring Boot restart
- Progress via `sync:execute-progress` IPC with phases: `stopping_sb`, `jar`, `db_download`, `db_extract`, `files`, `resource-packs`, `starting_sb`, `done`, `error`

**Cold Resync (external database + file download):**
- `ColdResyncManager` downloads H2 database and/or files directly from sync server — no Spring Boot needed
- Composable methods: `syncDatabase()` (DB only), `syncFiles()` (files only), `performColdResync()` (both)
- Assessment helpers: `isDbPresent()`, `getDbSizeBytes()`, `areFilesPresent()`, `getFilesTotalSizeBytes()`
- Server endpoints (on sync server): `GET /api/resync/database/h2-backup`, `GET /api/resync/files/path-manifest`, `GET /api/resync/files/permanent/**`
- Headers: `X-Machine-Id`, `X-Device-Number`

**Electron post-startup flow (after Spring Boot is healthy):**
1. Query Spring Boot `/api/field-sync/metrics` for last sync time
2. If >14 days stale (or never synced): send `sync:stale` IPC event to renderer
3. Renderer shows dismissible notification banner

**Managers:**
- `UpdateManager`: `checkForUpdate()`, `downloadUpdate()` with progress callback, SHA-256 verification, `.jar.tmp` -> `.jar` atomic rename
- `SyncStatusManager`: `getSyncStatus()`, `isSyncStale()`, `triggerFullResync()`, `checkDeviceConflict()`, persists `sync-status.json`
- `ColdResyncManager`: `syncDatabase()`, `syncFiles()`, `performColdResync()`, assessment helpers — downloads DB + files from sync server

**UI (Sync & Updates page) — 4 sections:**
- Status & Assessment: table showing JAR/DB/Files/Last Sync/Conflicts/Resource Packs/Electron status with color-coded indicators, server online/offline badge, Refresh button
- Sync Actions: buttons for Sync JAR, Sync Database, Sync Files, Sync Resource Packs, Sync All, Sync Needed + progress bar
- Electron App Update: Download Update button (downloads ZIP to staging), Apply Update (Restart) button (confirmation dialog, launches batch script, exits app), progress/status display
- Device Identity: device name, number, machine ID, sync server URL

**Notification bars in AppComponent (unified startup status):**
- Server unreachable: red bar with Settings button
- Assessment with issues: info bar with summary + Sync Now + Details buttons (dismissible)
- Sync in progress: blue bar with status + progress percent
- Sync stale / device conflict: post-startup warning bars (unchanged)
- Sidebar nav item: "Sync & Updates" at `/sync-updates`

### Electron Self-Update - DONE

Electron checks the sync server for a newer version of itself, downloads a ZIP to staging, and applies it via an external batch script (Windows locks running .exe/.dll files, so replacement must happen after Electron exits).

**Sync server** (`ElectronUpdateService` + `ElectronUpdateController`):
- Admin drops a ZIP into `electron-updates/` directory on the sync server
- Config: `electron-update.directory=${user.dir}/electron-updates`
- `GET /api/electron-update/check` → returns `{ fileName, fileSize, checksum (SHA-256), lastModified }` or 404
- `GET /api/electron-update/download` → streams ZIP with Content-Length, ETag, Accept-Ranges
- SHA-256 cached by file mtime (same pattern as JAR updates)

**Electron (`ElectronUpdateManager`):**
- Version tracking: `electron-version.json` in working dir stores `{ checksum, fileName, appliedAt }`
- `checkForUpdate()`: compares server checksum with local `electron-version.json`
- `downloadUpdate()`: downloads ZIP to `electron-update-staging/` dir, verifies SHA-256. Phases: `checking` → `downloading` → `verifying` → `staged` | `error`
- `applyUpdate()`: writes `update.cmd` batch script to staging, spawns it detached, returns success (caller stops Spring Boot + exits)
- `cleanupStaging()`: called on startup to remove leftover staging dir from previous update
- Included in startup assessment: `assessment.electron.updateAvailable`, `assessment.electron.updateStaged`

**Batch script (`update.cmd`) generated by `applyUpdate()`:**
1. Wait for Electron process to exit (polls via `tasklist`)
2. Extract ZIP over install directory using PowerShell `Expand-Archive -Force`
3. Copy `electron-version.json` from staging to working dir
4. Clean up staging directory
5. Relaunch the app

**ZIP structure requirement:** Files must be at root level in the ZIP (`DK Power Manager.exe`, `resources/`, `locales/`, etc.) — NOT nested inside a subfolder. The `create-update-zip.js` script ensures this.

**IPC channels** (3 invoke/handle + 1 send/on):
- `electron-update:check`, `electron-update:download`, `electron-update:apply`
- `electron-update:progress` (broadcast: download progress phases)

**Packaging:**
- `npm run package:zip` = `package:dir` + `node scripts/create-update-zip.js`
- Uses PowerShell `Compress-Archive -Path 'release\win-unpacked\*'` to create ZIP with files at root level
- Output: `release/DK-Power-Manager-{version}.zip`

**Key difference from JAR updates:** Electron update requires full app close + restart (via batch script). JAR/DB/files updates only restart Spring Boot within the running Electron process. This is why Electron is NOT part of `SyncComponent` — it's a separate action.

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

### PJM Monitoring - DONE (Data Miner API + Voyager Window)

**Electron main process** (no Spring Boot dependency):
- `PjmManager` in `pjm.manager.ts`: polls PJM Data Miner 2 REST API for real-time LMP prices
- API: `https://api.pjm.com/api/v1/rt_unverified_fivemin_lmps` with `Ocp-Apim-Subscription-Key` header
- Default pnode: 33092371 (ComEd zone aggregate)
- Configurable poll interval (1/2/5/10/15/30 min), persisted to `pjm-config.json`
- Voyager visual reference: opens `https://voyager.tnsk.com` in a BrowserWindow with auto-login via `insertText`
- Voyager credentials loaded from `pjm-config.json` (`voyagerUsername`/`voyagerPassword`) — not hardcoded
- Config persistence: `managed_apps/pid/pjm-config.json` (API key, pnode, poll interval, Voyager credentials)

**Home page integration:**
- LMP price card on dashboard shows live price snippet when available

Previous code: `C:\Users\usada\JS Projects\dk-power-full-stack\apps\pwa\src\app\features\pjm`

### Permit Monitoring - NOT STARTED
- Depends on Main SpringBoot API (not yet available)

## Build & TypeScript Configuration

- **Solution-style tsconfig**: Root `tsconfig.json` has `"files": []` with references to `tsconfig.main.json` (main process) and `src/renderer/tsconfig.json` (Angular)
- **Main process**: `tsconfig.main.json` — `rootDir: ./src`, `outDir: ./dist/main`, includes `src/main/**/*.ts` and `src/shared/**/*.ts`
- **Shared types**: `src/shared/types.ts` is the single source of truth for types used by both main and renderer
- **Output structure**: Because `rootDir` is `./src`, compiled output lands in `dist/main/main/` and `dist/main/shared/` — `package.json` main entry is `dist/main/main/main.js`
- **Path resolution**: All `__dirname`-relative paths in managers account for the extra directory level (e.g., renderer HTML is `path.join(__dirname, '..', '..', '..', ...)`)

## Packaging & Deployment - DONE

### Path Resolution (`src/main/paths.ts`)

Centralized path resolver handles dev vs. packaged mode:

| | Dev mode | Packaged mode |
|---|---|---|
| **Working dir** | `electron-manager/managed_apps/pid/` (relative to `__dirname`) | `%PROGRAMDATA%/DK Power Manager/managed_apps/pid/` (shared across all Windows users) |
| **Java** | `java` (system PATH) | `<install>/resources/jre/bin/java.exe` (bundled Temurin JRE 21) |
| **`app.isPackaged`** | `false` | `true` (both installer and unpacked builds) |

All managers import `getWorkingDir()` and `getJavaPath()` from `paths.ts` — no more scattered `path.resolve(__dirname, ...)`.

### Config Provisioning (`provisionDefaultConfigs()` in `paths.ts`)

On startup, seeds runtime config files (credentials, API keys) into the working directory from bundled defaults:

| | Dev mode | Packaged mode |
|---|---|---|
| **Defaults source** | `electron-manager/config-defaults/` | `<install>/resources/config-defaults/` |
| **Target** | `electron-manager/managed_apps/pid/` | `%PROGRAMDATA%/DK Power Manager/managed_apps/pid/` |

**Behavior:**
- Config file **missing** → copies the bundled default (first-run provisioning)
- Config file **exists but missing new keys** → merges defaults underneath (existing values win, new keys added)
- Config file **up-to-date** → no-op

**Config files managed:**
- `pjm-config.json` — PJM API key, pnode, poll interval, Voyager login credentials
- `gate-log-config.json` — OnLocation API key, gate username/password, auto-refresh settings

**Security:** `config-defaults/` is gitignored (contains real credentials). Ships with the package via `extraResources` in `package.json`. Credentials never appear in git-tracked source code — `constants.ts` has empty-string defaults that get overridden at runtime.

### Build Scripts

| Script | Output | Use case |
|---|---|---|
| `npm run build` | `dist/` (TypeScript + Angular) | Dev build |
| `npm run package` | `release/*.exe` (NSIS installer) | Formal install with Start Menu, desktop shortcut, Add/Remove Programs |
| `npm run package:dir` | `release/win-unpacked/` (portable folder) | Copy-paste deployment, zip for SharePoint |
| `npm run package:zip` | `release/DK-Power-Manager-{ver}.zip` | Builds portable folder + creates ZIP for sync server distribution |
| `npm run download-jre` | `jre/` (Temurin JRE 21 x64) | Auto-runs before packaging via `prepackage` hook |

### Bundled JRE

- Eclipse Temurin JRE 21 (Windows x64), downloaded by `scripts/download-jre.js`
- Packaged as `extraResources` → lands at `<install>/resources/jre/`
- `getJavaPath()` returns `<install>/resources/jre/bin/java.exe` in packaged mode
- `jre/` is in `.gitignore` (downloaded on demand, not committed)

### Installer vs. Portable

Both produce identical behavior (`app.isPackaged = true`, same path resolution):
- **Installer** (NSIS): Start Menu/Desktop shortcuts, Add/Remove Programs entry, in-place upgrade
- **Portable** (`win-unpacked/` folder): No install needed, just run the `.exe`. Zip and put on SharePoint.
- **Data location**: Both use `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\` — shared across Windows users
- **Uninstall**: NSIS removes install dir only. `%PROGRAMDATA%` data persists in both cases. Use File > Clear Application Data menu to wipe.

### Angular Renderer (packaged mode fixes)

- `baseHref: "./"` in `angular.json` production config — fixes asset loading with `file://` protocol
- `withHashLocation()` in `provideRouter()` — hash routing (`#/path`) works with `file://` (pushState does not)

### Multi-User Shared Workstation

- **Data sharing**: `%PROGRAMDATA%` is machine-wide, all users read/write the same JAR, DB, files, and device config
- **Port conflicts**: When user A signs out leaving Spring Boot running and user B opens the app, the port conflict resolver stops user A's orphaned process (actuator shutdown → taskkill fallback) then starts a fresh instance
- **Session events**: `powerMonitor.on('shutdown')` cleans up on sign-out/shutdown. Lock-screen intentionally does NOT stop Spring Boot.

### File Menu Utilities

- **Clear Application Data...**: Confirmation dialog → stops Spring Boot → deletes `%PROGRAMDATA%\DK Power Manager\managed_apps\pid\` → recreates empty dir
- **Open Data Folder**: Opens the working directory in Windows Explorer

## Deferred (Future Work)
- Weather WeatherBug BrowserView integration
- Permit monitoring (needs Main SpringBoot API)
- Settings persistence (save/load beyond device identity)
- Rotate compromised credentials (still in git history) — Azure OAuth, PJM API key, gate/OnLocation passwords
- Optional: scrub git history with `git filter-repo` / BFG Repo Cleaner
