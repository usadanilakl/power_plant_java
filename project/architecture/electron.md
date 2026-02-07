## Functionality

1. Wrap Main SpringBoot App - to run it as desktop
2. Perform Main SpringBoot App updates and full re-sync by connecting to Sync Server
3. Provide UI to control Main SpringBoot App:
    - Start
    - Stop
    - Restart
    - Update
    - Resync
    - Status
4. Provide fully independent functionalities:
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
│   │   ├── app.ts                        # App lifecycle, menu, cleanup
│   │   ├── constants.ts                  # Config (single Spring Boot app)
│   │   ├── managers/
│   │   │   ├── main-window.manager.ts    # Primary BrowserWindow
│   │   │   ├── spring-boot.manager.ts    # Start/stop/health for PID app
│   │   │   └── webview.manager.ts        # WebView windows (FM Global, etc.)
│   │   ├── ipc/
│   │   │   ├── events.ts                 # All IPC channel names
│   │   │   └── handlers.ts              # IPC handler registration
│   │   └── preload/
│   │       └── main.preload.ts           # contextBridge API
│   └── renderer/                         # Angular UI
│       └── src/app/
│           ├── app.component.ts          # Shell: header + sidebar + router
│           ├── app.routes.ts             # All page routes
│           ├── layout/
│           │   └── sidebar.component.ts  # Nav sidebar with SB status
│           ├── components/
│           │   └── header.component.ts   # Title bar + window controls
│           ├── pages/
│           │   ├── home/                 # Dashboard + SB controls + feature cards
│           │   ├── fire-impairment/      # List/create impairments + FM Global
│           │   ├── gate-log/             # People on site + table
│           │   ├── weather/              # Lightning distance display
│           │   ├── pjm/                  # LMP price display
│           │   ├── logs/                 # Spring Boot log viewer
│           │   └── settings/             # App configuration
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

### Fire Impairment - DONE (UI + Backend + WebView)

**Spring Boot backend** (in power_plant_java):
- Entity: `entities/fire_impairment/FireImpairment.java` (extends BaseIdEntity, sync-enabled)
- Enums: `FireImpairmentLocation`, `ProtectionIdentifier`
- DTO: `dto/fire_impairment/FireImpairmentDto.java`
- Repository: `repository/fire_impairment/FireImpairmentRepo.java`
- Service: `sevice/fire_impairment/FireImpairmentService.java`
- Controller: `controller/fire_impairment/FireImpairmentController.java`
  - REST API at `/api/fire-impairment` (CRUD + active/closed/latest)
  - Enum endpoints: `/locations`, `/protection-types`

**Electron WebView automation:**
- `webview.manager.ts` opens BrowserWindow to https://redetag.fmglobal.com
- `fillFmGlobalForm()` injects JavaScript to populate form fields (mirrors JavaFX WebViewApp)
- `gatherFmGlobalData()` extracts form data including precautions checkboxes
- IPC handlers proxy requests between renderer and Spring Boot API

**Angular UI:**
- Active/Closed tabs with impairment list
- "New Impairment" button opens FM Global WebView with default form data
- Auto-loads when Spring Boot becomes available
- Shows "Spring Boot Required" notice when SB is not running

Previous apps consolidated:
- `C:\Users\usada\my_projects\fire-imparement` -> Spring Boot backend
- `C:\Users\usada\my_projects\Fire-Imparement-JavaFX` -> WebView automation

### Gate Log - UI SCAFFOLD
- Angular page with summary cards (People on Site, Companies, Last Updated)
- Data table for personnel list (Name, Company, Check In/Out, Location)
- Placeholder for OnLocation API integration
- Previous app: `C:\Users\usada\my_projects\Entrance_Log`

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

## Deferred (Future Work)
- Update + Resync System (JAR auto-update from Sync Server)
- Electron packaging and installer
- Gate Log OnLocation API integration
- Weather WeatherBug BrowserView integration
- PJM Data Miner API integration
- Permit monitoring (needs Main SpringBoot API)
- Settings persistence (save/load configuration)
