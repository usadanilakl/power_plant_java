## Sync, Update & Device Conflict Management

### Overview

The Electron wrapper performs startup checks to keep field devices current:
1. **JAR Update**: Sync server serves new JARs; Electron downloads if checksum differs
2. **Cold Resync**: Downloads H2 database + files from sync server before Spring Boot starts (first run or manual)
3. **Sync Staleness**: If last sync is >14 days old, warns user to trigger full resync
4. **Device Conflict**: Detects duplicate device numbers across the fleet

### Startup Flow

```
Electron onReady
  → create window, register IPC, load renderer
  → preStartupChecks()                    (before Spring Boot)
    1. Check JAR update → download if newer or missing (with progress to renderer)
    2. Cold resync if needed (no database file + device configured)
       → download H2 backup ZIP from sync server
       → extract .mv.db with adm-zip
       → download file manifest → download all files
       → write sync-status.json
    3. Check device number conflicts
    All failures are non-fatal (graceful degradation when offline)
  → autoStart Spring Boot
  → postStartupChecks()                   (after Spring Boot is healthy)
    → check sync staleness → warn if >14 days
  → checkDeviceSetup (first-run detection)
```

### Two Server Contexts

**Sync Server** (separate codebase at `C:\Users\usada\my_projects\sync-server`, runs at `10.10.190.122:8090`):
- JAR update check and download
- Device registry (registration, fetch, conflict detection)
- H2 database backup download (cold resync)
- File manifest and file downloads (cold resync)
- Sync data exchange (incremental sync with conflict detection via headers)

**Local Spring Boot** (power_plant_java on `localhost:8082`):
- Sync metrics and status (last sync time, pending changes, SSE connection)
- Internal full resync (Spring Boot downloads and restores its own database — requires restart)

### JAR Update Protocol

1. `GET ${syncServerUrl}/api/update/check` → returns `{ fileName, fileSize, checksum (SHA-256), lastModified }`
2. Electron compares server checksum with local JAR checksum (cached by mtime)
3. If different: `GET ${syncServerUrl}/api/update/download` → streamed with `Content-Length`, `ETag`, `Accept-Ranges`
4. Download saved as `.jar.tmp` in `managed_apps/pid/`
5. SHA-256 verified against server's reported checksum
6. On success: delete old JAR → rename `.tmp` → `.jar`
7. On failure: delete `.tmp`, keep old JAR

Server supports HTTP Range header for resumable downloads (important for 432MB+ JARs over unreliable networks).

Admin places new JARs in the server's configured `update.jar.directory` (default: `${user.dir}/updates`).

### Cold Resync (External Database + File Download)

Downloads the full H2 database and all files from the sync server **before** Spring Boot starts. No Java needed — H2's BACKUP format is a standard ZIP, extracted with `adm-zip` (pure JS).

**When it triggers:**
- **Automatic**: On first run when `managed_apps/pid/db/proddb.mv.db` doesn't exist and device is configured
- **Manual**: From Sync & Updates UI "Download from Server" button (Spring Boot must be stopped first)

**Protocol:**
1. `GET ${syncServerUrl}/api/resync/database/h2-backup` (with `X-Machine-Id` + `X-Device-Number` headers)
   → saves to `db/backup_cold.zip`, streams with progress reporting (0–30%)
2. Extract `.mv.db` from ZIP using `adm-zip` → writes to `db/proddb.mv.db` (30–40%)
3. `GET ${syncServerUrl}/api/resync/files/path-manifest` → JSON array of `{ relativePath, fileHash, fileSize, lastModified }` (40–45%)
4. For each manifest entry: `GET ${syncServerUrl}/api/resync/files/permanent/{encodedPath}` → saves to `uploads-prod/{relativePath}` (45–95%)
5. Write `sync-status.json` with `lastSyncTime: now`, `lastSyncType: "full"` (95–100%)

**Key paths:**
- Database: `managed_apps/pid/db/proddb.mv.db` (prod profile: `jdbc:h2:file:./db/proddb`)
- Uploads: `managed_apps/pid/uploads-prod/` (prod profile: `files.root.path=${user.dir}/uploads-prod`)

**Comparison with internal resync:**
- Cold resync: Electron downloads directly, works without Spring Boot, no restart needed
- Internal resync: Spring Boot downloads and restores itself via `POST /api/resync/execute`, requires restart after

### Sync Staleness Detection

- `SyncStatusManager` writes `sync-status.json` to `managed_apps/pid/` after each successful sync
- On startup, Electron reads `sync-status.json` before Spring Boot starts
- After Spring Boot is healthy, queries `localhost:8082/api/field-sync/metrics` for live sync time
- If >14 days since last sync (configurable via `SYNC_STALE_THRESHOLD_DAYS`): sends `sync:stale` IPC event
- Renderer shows dismissible notification banner with "Resync Now" action
- Full resync triggered via `POST localhost:8082/api/resync/execute?force=true` (internal resync)

### Device Conflict Detection

**Sync server-side:** `FieldSyncController.exchange()` reads `X-Device-Number` + `X-Machine-Id` headers. If a peer connects with a deviceNumber already used by a different machineId, the `Peer.deviceNumberConflict` field is set.

**Electron-side:** Pre-startup check queries `GET ${syncServerUrl}/api/field-sync/device-registry` and checks for same deviceNumber with different machineId. Conflict warning sent to renderer via `device:conflict` IPC event.

### Error Handling & Fallbacks

- **Server unreachable**: All pre-startup checks are non-fatal. Spring Boot starts normally.
- **JAR download fails**: Old JAR is preserved. User can retry from Sync & Updates UI.
- **Checksum mismatch**: `.tmp` file deleted. Download can be retried.
- **Cold resync fails**: Spring Boot starts with empty DB. User can retry from Sync & Updates UI.
- **File download fails during cold resync**: Individual file failures are non-fatal — continues with remaining files.
- **Sync stale but Spring Boot not starting**: Warning shown when SB becomes healthy (up to 5 min timeout).

### Sync Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/update/check` | GET | JAR metadata + SHA-256 checksum |
| `/api/update/download` | GET | Stream JAR (supports Range header) |
| `/api/field-sync/exchange` | POST | Sync exchange (reads X-Device-Number header for conflict detection) |
| `/api/field-sync/device-registry` | GET | All registered devices (includes conflict field) |
| `/api/field-sync/device-registry` | POST | Register device |
| `/api/resync/database/h2-backup` | GET | H2 backup ZIP download (for cold resync) |
| `/api/resync/files/path-manifest` | GET | File manifest with SHA-256 checksums (for cold resync) |
| `/api/resync/files/permanent/**` | GET | Individual file download by path (for cold resync) |

### Local Spring Boot Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/field-sync/metrics` | GET | Sync metrics (last sync time, pending changes) |
| `/api/field-sync/status` | GET | Sync status (SSE connection, deviceNumberConflict) |
| `/api/resync/execute` | POST | Trigger internal full resync |
| `/api/resync/status` | GET | Internal resync progress |

### IPC Channels

| Channel | Type | Description |
|---------|------|-------------|
| `update:check` | invoke/handle | Check for JAR update |
| `update:download` | invoke/handle | Download JAR update |
| `update:progress` | send/on | Download progress events |
| `cold-resync:start` | invoke/handle | Trigger cold resync (DB + files from sync server) |
| `cold-resync:progress` | send/on | Cold resync progress events |
| `cold-resync:needed` | send/on | Cold resync needed notification |
| `sync:get-status` | invoke/handle | Get sync status from local Spring Boot |
| `sync:trigger-resync` | invoke/handle | Trigger internal full resync |
| `sync:get-resync-status` | invoke/handle | Get internal resync progress |
| `sync:stale` | send/on | Sync staleness warning |
| `device:conflict` | send/on | Device number conflict warning |
