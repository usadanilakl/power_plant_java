## Sync, Update & Device Conflict Management

### Overview

The Electron wrapper performs startup assessment to keep field devices current:
1. **Server Reachability**: Check if sync server is available; poll until available if not
2. **Startup Assessment**: Assess what's needed (JAR, DB, files, resource packs, Electron update, staleness, conflicts) and present findings to user
3. **Selective Sync**: User-triggered sync of individual components (JAR, DB, files, resource packs) or all at once
4. **Auto-restart**: Spring Boot is automatically stopped and restarted when syncing DB or files
5. **Electron Self-Update**: Separate from sync — downloads ZIP, stages locally, applies via batch script after app exit

### Startup Flow

```
Electron onReady
  -> create window, register IPC, load renderer
  -> startupAssessment()                    (before Spring Boot)
    1. Read device config
    2. Check server reachability (HTTP GET /api/update/check with 5s timeout)
       - If UNREACHABLE:
         * Send startup:server-status { reachable: false } to renderer
         * Start polling every 15s (10 min safety timeout)
         * When reachable: send startup:server-status { reachable: true }
           then run full assessment and send startup:assessment
       - If REACHABLE: continue to step 3
    3. Perform local + remote checks:
       - JAR: fs.existsSync -> present; if reachable, updateMgr.checkForUpdate -> updateAvailable
       - DB: fs.existsSync + stat.size -> present + sizeBytes
       - Files: existsSync(uploadsDir) + recursive dir size -> present + totalSizeBytes
       - Sync staleness: syncStatusManager.isSyncStale()
       - Device conflict: syncStatusManager.checkDeviceConflict()
       - Resource packs: resourcePackManager.checkForUpdates() (manifest-based, compares local files with server)
       - Electron update: electronUpdateManager.checkForUpdate() (checksum comparison with local electron-version.json)
    4. Send startup:assessment to renderer with full StartupAssessment
    5. Do NOT auto-download anything — user decides via UI
  -> If JAR exists: autoStart Spring Boot (unchanged)
  -> postStartupChecks()                   (after Spring Boot is healthy)
    -> check sync staleness -> warn if >14 days
  -> checkDeviceSetup (first-run detection)
```

**Renderer behavior:**
- Server unreachable: notification bar with "Sync server unreachable" + Settings button
- Assessment ready with issues: notification bar with summary + "Sync Now" + "Details" buttons
- Sync in progress: progress bar with status message
- All good: no notification bar

### Two Server Contexts

**Sync Server** (separate codebase at `C:\Users\usada\my_projects\sync-server`, runs at `10.10.190.122:8090`):
- JAR update check and download
- Device registry (registration, fetch, conflict detection)
- H2 database backup download (cold resync)
- File manifest and file downloads (cold resync)
- Resource pack manifests and file downloads (engraver_data, qa-data)
- Sync data exchange (incremental sync with conflict detection via headers)

**Local Spring Boot** (power_plant_java on `localhost:8082`):
- Sync metrics and status (last sync time, pending changes, SSE connection)
- Internal full resync (Spring Boot downloads and restores its own database -- requires restart)

### JAR Update Protocol

1. `GET ${syncServerUrl}/api/update/check` -> returns `{ fileName, fileSize, checksum (SHA-256), lastModified }`
2. Electron compares server checksum with local JAR checksum (cached by mtime)
3. If different: `GET ${syncServerUrl}/api/update/download` -> streamed with `Content-Length`, `ETag`, `Accept-Ranges`
4. Download saved as `.jar.tmp` in `managed_apps/pid/`
5. SHA-256 verified against server's reported checksum
6. On success: delete old JAR -> rename `.tmp` -> `.jar`
7. On failure: delete `.tmp`, keep old JAR

Server supports HTTP Range header for resumable downloads (important for 432MB+ JARs over unreliable networks).

Admin places new JARs in the server's configured `update.jar.directory` (default: `${user.dir}/updates`).

### Cold Resync (External Database + File Download)

Downloads the full H2 database and/or files from the sync server **before** Spring Boot starts. No Java needed -- H2's BACKUP format is a standard ZIP, extracted with `adm-zip` (pure JS).

DB and files can be synced independently via `ColdResyncManager.syncDatabase()` / `syncFiles()`, or together via `performColdResync()`.

**When it triggers:**
- **User-initiated**: From Sync & Updates UI buttons (Sync Database, Sync Files, Sync All, Sync Needed)
- **Assessment-driven**: Startup assessment identifies missing/stale components, user clicks "Sync Now"
- Spring Boot is automatically stopped before DB/files sync and restarted after

**Protocol:**
1. `GET ${syncServerUrl}/api/resync/database/h2-backup` (with `X-Machine-Id` + `X-Device-Number` headers)
   -> saves to `db/backup_cold.zip`, streams with progress reporting
2. Extract `.mv.db` from ZIP using `adm-zip` -> writes to `db/proddb.mv.db`
3. `GET ${syncServerUrl}/api/resync/files/path-manifest` -> JSON array of `{ relativePath, fileHash, fileSize, lastModified }`
4. For each manifest entry: `GET ${syncServerUrl}/api/resync/files/permanent/{encodedPath}` -> saves to `uploads-prod/{relativePath}`
5. Write `sync-status.json` with `lastSyncTime: now`, `lastSyncType: "full"`

**Key paths:**
- Database: `managed_apps/pid/db/proddb.mv.db` (prod profile: `jdbc:h2:file:./db/proddb`)
- Uploads: `managed_apps/pid/uploads-prod/` (prod profile: `files.root.path=${user.dir}/uploads-prod`)

**Comparison with internal resync:**
- Cold resync: Electron downloads directly, works without Spring Boot, auto-restart managed
- Internal resync: Spring Boot downloads and restores itself via `POST /api/resync/execute`, requires restart after

**Sequence safety:** After restoring the sync server's H2 backup, the `id_seq` sequence may be stale. `SequenceInitializer` (power_plant_java `config/` package) runs on every Spring Boot startup -- checks if the sequence value is below the max ID suffix for this device and adjusts it if needed. This prevents `DevicePrefixedIdGenerator` from generating duplicate IDs.

### Selective Sync Execution

The `sync:execute` IPC handler accepts an array of `SyncComponent` values (`'jar' | 'db' | 'files' | 'resource-packs'`) and orchestrates the sync:

1. **Stop Spring Boot** (if DB or files requested and SB was running)
2. **Sync JAR** (if requested) -- download via UpdateManager
3. **Sync Database** (if requested) -- download + extract via ColdResyncManager.syncDatabase()
4. **Sync Files** (if requested) -- download via ColdResyncManager.syncFiles()
5. **Sync Resource Packs** (if requested) -- manifest-based download via ResourcePackManager.syncAllPacks()
6. **Restart Spring Boot** (if it was running before, or JAR was updated)

Progress reported via `sync:execute-progress` IPC event with phases: `stopping_sb`, `jar`, `db_download`, `db_extract`, `files`, `resource-packs`, `starting_sb`, `done`, `error`.

Resource packs do NOT require Spring Boot restart — they are data files read at runtime.

### Resource Packs (engraver_data, qa-data)

Spring Boot requires additional data directories that are frequently updated by admin:
- **`engraver_data`** (~0.2MB) — LightBurn templates for tag engraving (`@Value("${engraver.data.path:engraver_data}")`)
- **`qa-data`** (~3MB) — Video documentation (`@Value("${qa.directory}")`)

These are distributed via the sync server using the same manifest-based approach as cold resync files.

**Server side** (`ResourcePackService` + `ResourcePackController`):
- Admin places directories at `resource-packs/engraver_data/` and `resource-packs/qa-data/` on the sync server
- Config: `resource-packs.base-path=${user.dir}/resource-packs`
- Endpoints scan directories on request, generate manifests with SHA-256 hashes (cached by mtime), stream individual files
- No ZIPs, no server restart needed

**Client side** (`ResourcePackManager`):
- `checkForUpdates()`: fetches manifest for each pack, compares with local files (existence + size match)
- `syncPack()`: downloads only missing/changed files
- `syncAllPacks()`: iterates all available packs
- `getLocalStatus()`: quick local-only check (no server contact) for known pack names

**Key paths:**
- Resource packs: `managed_apps/pid/engraver_data/`, `managed_apps/pid/qa-data/`
- Spring Boot reads these as relative paths from CWD

**Sync server endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resource-packs/list` | GET | Available pack names (subdirectory names) |
| `/api/resource-packs/manifest/{name}` | GET | File manifest with SHA-256 hashes for a pack |
| `/api/resource-packs/file/{name}/**` | GET | Individual file download by relative path |

### Electron Self-Update Protocol

Separate from the JAR/DB/files sync flow because Electron update requires full app exit + restart (Windows locks running .exe/.dll files).

**Check:**
1. `GET ${syncServerUrl}/api/electron-update/check` → returns `{ fileName, fileSize, checksum (SHA-256), lastModified }` or 404
2. Compare server checksum with local `electron-version.json` (in working dir)
3. If different (or no local version file): `isNewer = true`

**Download & Stage:**
1. `GET ${syncServerUrl}/api/electron-update/download` → stream ZIP to `electron-update-staging/{fileName}.tmp`
2. Verify SHA-256 checksum
3. Rename `.tmp` → `.zip`, write `electron-version.json` to staging dir
4. Progress phases: `checking` → `downloading` → `verifying` → `staged` | `error`

**Apply (via batch script):**
1. Write `update.cmd` to staging dir
2. Spawn `cmd.exe /c update.cmd` detached
3. Stop Spring Boot → `app.exit(0)`
4. Batch script: polls `tasklist` until Electron exits → `Expand-Archive` over install dir → copies `electron-version.json` to working dir → cleanup → relaunch

**Staging cleanup:** `electronUpdateManager.cleanupStaging()` runs on every Electron startup to remove leftover staging dirs.

**Admin workflow:** Build ZIP via `npm run package:zip` → copy `release/DK-Power-Manager-{version}.zip` to sync server's `electron-updates/` directory.

### Sync Staleness Detection

- `SyncStatusManager` writes `sync-status.json` to `managed_apps/pid/` after each successful sync
- On startup, Electron reads `sync-status.json` before Spring Boot starts (part of assessment)
- After Spring Boot is healthy, queries `localhost:8082/api/field-sync/metrics` for live sync time
- If >14 days since last sync (configurable via `SYNC_STALE_THRESHOLD_DAYS`): sends `sync:stale` IPC event
- Renderer shows dismissible notification banner with "View" action

### Device Conflict Detection

**Sync server-side:** `FieldSyncController.exchange()` reads `X-Device-Number` + `X-Machine-Id` headers. If a peer connects with a deviceNumber already used by a different machineId, the `Peer.deviceNumberConflict` field is set.

**Electron-side:** Startup assessment queries `GET ${syncServerUrl}/api/sync/device-registry` and checks for same deviceNumber with different machineId. Conflict included in StartupAssessment and shown in Status & Assessment table.

### Error Handling & Fallbacks

- **Server unreachable**: Renderer shows "Sync server unreachable" banner with Settings button. Server polling runs every 15s until reachable (10 min timeout). Independent features remain available.
- **JAR missing**: If JAR doesn't exist after assessment, Spring Boot is NOT started. Assessment shows JAR as "Missing".
- **JAR download fails**: Old JAR is preserved. User can retry from Sync & Updates UI.
- **Checksum mismatch**: `.tmp` file deleted. Download can be retried.
- **DB/files sync fails**: Error reported via progress. User can retry.
- **File download fails during sync**: Individual file failures are non-fatal -- continues with remaining files.
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
| `/api/resource-packs/list` | GET | Available resource pack names |
| `/api/resource-packs/manifest/{name}` | GET | File manifest for a resource pack |
| `/api/resource-packs/file/{name}/**` | GET | Individual file from a resource pack |
| `/api/electron-update/check` | GET | Electron ZIP metadata + SHA-256 checksum (or 404) |
| `/api/electron-update/download` | GET | Stream Electron ZIP (supports Content-Length, ETag, Accept-Ranges) |

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
| `startup:assessment` | send/on | Full startup assessment result |
| `startup:server-status` | send/on | Server reachability change (polling) |
| `startup:get-assessment` | invoke/handle | Get cached assessment on demand |
| `sync:execute` | invoke/handle | Execute selective sync (components: jar/db/files/resource-packs) |
| `sync:execute-progress` | send/on | Selective sync progress events |
| `update:check` | invoke/handle | Check for JAR update |
| `update:download` | invoke/handle | Download JAR update |
| `update:progress` | send/on | Download progress events |
| `cold-resync:start` | invoke/handle | Trigger cold resync (DB + files from sync server) |
| `cold-resync:progress` | send/on | Cold resync progress events |
| `sync:get-status` | invoke/handle | Get sync status from local Spring Boot |
| `sync:trigger-resync` | invoke/handle | Trigger internal full resync |
| `sync:get-resync-status` | invoke/handle | Get internal resync progress |
| `sync:stale` | send/on | Sync staleness warning |
| `device:conflict` | send/on | Device number conflict warning |
| `electron-update:check` | invoke/handle | Check for Electron app update |
| `electron-update:download` | invoke/handle | Download Electron ZIP to staging |
| `electron-update:apply` | invoke/handle | Apply staged update (launches batch script, exits app) |
| `electron-update:progress` | send/on | Electron update download progress phases |
