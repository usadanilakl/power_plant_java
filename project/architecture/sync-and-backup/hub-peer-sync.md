# Hub-Peer Sync

## Overview

Hub-peer sync allows one `power_plant_java` instance configured with `sync.role=hub` to act as a sync relay for other desktop client instances, replacing the separate `sync-server` project. The hub uses its own H2 production database as the authoritative data source — no mirror entities needed.

All hub beans are guarded by `@ConditionalOnProperty(name = "sync.role", havingValue = "hub")` so they have zero impact when the instance runs as a normal client.

## Configuration

```properties
# Activate hub mode
sync.role=hub
sync.server.enabled=false

# Hub sync settings
sync.hub.file-storage-path=./hub-file-storage
sync.hub.retention-days=90
sync.hub.batch-size=500
sync.hub.compaction-enabled=true

# Update distribution
electron-update.directory=${user.dir}/electron-updates
update.jar.directory=${user.dir}/updates
resource-packs.base-path=${user.dir}/resource-packs

# Backup & resync
sync.backup.storage-path=./backup-storage
sync.backup.max-backups=5
sync.backup.cache-duration-minutes=5
sync.backup.max-old-backups=3
sync.import.temp-dir=${java.io.tmpdir}/sync-import
sync.import.max-file-size=524288000
```

## Architecture

```
┌──────────────┐       SSE + REST       ┌──────────────┐
│   Client A   │ ◄────────────────────► │     HUB      │
│  (field PC)  │                         │  (office PC) │
└──────────────┘                         │              │
                                         │  H2 DB (real)│
┌──────────────┐       SSE + REST       │  uploads/    │
│   Client B   │ ◄────────────────────► │              │
│  (field PC)  │                         └──────────────┘
└──────────────┘
```

- Clients connect via SSE for real-time push notifications
- Bidirectional field-change sync via `/api/sync/exchange`
- Hub applies changes to its own entities via `FieldSyncService`
- Hub broadcasts changes to connected clients, excluding the origin
- File uploads stored in `hub-file-storage/` with dedup tracking

## Endpoint Inventory

### Core Sync (HubSyncController — `/api/sync`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/exchange` | Bidirectional field-change sync |
| GET | `/changes/batch` | Paginated pending changes |
| GET | `/changes/count` | Pending change count |
| POST | `/register` | Register client |
| GET | `/clients` | List all clients |
| GET | `/clients/active` | Active clients |
| GET/POST | `/device-registry` | Device number management |
| GET | `/status` | Hub status |
| GET | `/health` | Health check |

### SSE (HubSseController — `/api/sync/sse`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/subscribe` | SSE subscription (text/event-stream) |
| GET | `/stats` | Connection stats |
| GET | `/connected/{machineId}` | Connection check |

### File Sync (HubFileController — `/api/files`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file |
| GET | `/download/{fileId}` | Download file |
| GET | `/pending` | Pending files for client |
| GET | `/entity/{type}/{id}` | Files for entity |
| GET | `/entity/{type}/{id}/download-info` | Download metadata |
| DELETE | `/entity/{type}/{id}` | Soft delete files |
| GET | `/stats` | Storage stats |

### Health Stats & Partial Sync (HubPartialSyncController — `/api/sync`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health-stats` | Entity counts for health comparison |
| GET | `/partial-sync/available-dates` | Dates with changes |
| GET | `/partial-sync/count?date=` | Change count since date |
| GET | `/partial-sync/changes?date=&page=&size=` | Paginated changes |

### Update Distribution
| Controller | Path | Description |
|-----------|------|-------------|
| HubElectronUpdateController | `GET /api/electron-update/check` | Check for Electron ZIP |
| | `GET /api/electron-update/download` | Download Electron ZIP |
| HubJarUpdateController | `GET /api/update/check` | Check for JAR update |
| | `GET /api/update/download` | Download JAR |
| HubResourcePackController | `GET /api/resource-packs/list` | List packs |
| | `GET /api/resource-packs/manifest/{name}` | Pack manifest |
| | `GET /api/resource-packs/file/{name}/**` | Download pack file |

### Resync (HubResyncController — `/api/resync`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Resync health (entity counts) |
| GET | `/database/json` | Full DB as JSON |
| GET | `/database/zip` | Full DB as ZIP |
| GET | `/database/h2-backup` | H2 backup (for cold resync) |
| GET | `/files/manifest` | HubSyncedFile-based manifest |
| GET | `/files/path-manifest` | uploads/ directory manifest |
| GET | `/files/{fileId}` | Download by file ID |
| GET | `/files/entity/{type}/{id}` | List files for entity |
| GET | `/files/entity/{type}/{id}/{name}` | Download specific file |
| GET | `/files/permanent/**` | Download from uploads/ by path |
| GET | `/import/safety-check` | Check import safety |
| POST | `/import/database` | Import H2 backup |
| POST | `/import/files` | Import file archive |
| POST | `/import/full` | Combined import |
| POST | `/import/files/init` | Chunked upload init |
| POST | `/import/files/chunk` | Upload chunk |
| POST | `/import/files/complete` | Complete chunked upload |
| GET | `/import/files/status` | Upload status |
| DELETE | `/import/files/cancel` | Cancel upload |

## File Inventory

### Config
- `config/HubSyncConfig.java` — Hub configuration properties

### Entities
- `entities/hub/HubClientInfo.java` — Connected client tracking
- `entities/hub/HubSyncedFile.java` — File distribution tracking
- `entities/hub/HubStoredBackup.java` — Client-uploaded backups

### Repositories
- `repository/hub/HubClientInfoRepository.java`
- `repository/hub/HubSyncedFileRepository.java`
- `repository/hub/HubStoredBackupRepository.java`

### Services
- `sevice/hub/HubSyncService.java` — Core sync orchestration (exchange, dedup, LWW)
- `sevice/hub/HubSseService.java` — SSE emitter management
- `sevice/hub/HubFileService.java` — File storage with dedup
- `sevice/hub/HubLocalChangeBroadcaster.java` — Broadcasts hub's own edits
- `sevice/hub/HubElectronUpdateService.java` — Electron ZIP distribution
- `sevice/hub/HubJarUpdateService.java` — JAR update distribution
- `sevice/hub/HubResourcePackService.java` — Resource pack distribution
- `sevice/hub/HubFieldChangeQueryService.java` — Field change queries via EntityManager
- `sevice/hub/HubHealthStatsService.java` — Entity counts and health stats
- `sevice/hub/HubResyncService.java` — H2 backup, DB export, file manifests
- `sevice/hub/HubBulkImportService.java` — Bulk data import with safety checks
- `sevice/hub/HubBackupStorageService.java` — Client backup storage

### Controllers
- `controller/hub/HubSyncController.java` — `/api/sync`
- `controller/hub/HubSseController.java` — `/api/sync/sse`
- `controller/hub/HubFileController.java` — `/api/files`
- `controller/hub/HubPartialSyncController.java` — `/api/sync` (health-stats, partial-sync)
- `controller/hub/HubElectronUpdateController.java` — `/api/electron-update`
- `controller/hub/HubJarUpdateController.java` — `/api/update`
- `controller/hub/HubResourcePackController.java` — `/api/resource-packs`
- `controller/hub/HubResyncController.java` — `/api/resync`

## Key Design Decisions

1. **Hub IS the real database** — No mirror entities. The hub's H2 database is authoritative. `H2 BACKUP TO` exports the hub's own database for client cold resync.

2. **EntityTableRegistry reuse** — Health stats and resync use `EntityTableRegistry.getSyncOrder()` for entity type iteration and `getTableName()` for native SQL queries, avoiding per-entity repository injection.

3. **Conditional controller isolation** — Hub controllers are guarded by `@ConditionalOnProperty(name = "sync.role", havingValue = "hub")`. Three existing client-side controllers that share URL paths are disabled in hub mode via `@ConditionalOnExpression("'${sync.role:}' != 'hub'")`:
   - `FullResyncController` (`/api/resync`) — replaced by `HubResyncController`
   - `UpdateController` (`/api/update`) — replaced by `HubJarUpdateController`
   - `SyncController` (legacy, `/api/sync`) — replaced by `HubSyncController`

   This prevents "Ambiguous handler methods" startup failures. When `sync.role` is not set (normal client), the existing controllers load as usual.

4. **SyncContext listener suppression** — When the hub applies incoming changes via `FieldSyncService.applyIncomingChanges()`, `SyncContext.startSync()` prevents `FieldChangeEntityListener` from creating echo changes.

5. **SSE anti-loop** — `broadcastChanges(changes, originMachineId)` excludes the origin machine from receiving its own changes back.

6. **Bulk import safety** — Since the hub has real production data, `importDatabaseBackup()` requires `force=true` and warns about overwriting production data.

## Coexistence with Sync-Server

Hub-peer and the separate sync-server can run **side-by-side** but NOT as a unified network:

- Each client has one `sync.server.url` — pointing to either the old server or the hub
- Changes do NOT flow between the two servers
- Migration is per-client: switch `sync.server.url` one machine at a time
- The hub machine itself should have `sync.server.enabled=false` (it IS the server)

**Migration steps:**
1. Start hub with `sync.role=hub` and `sync.server.enabled=false`
2. Bootstrap hub data (import from sync-server or full-sync from one client)
3. Switch clients one by one to hub URL
4. Decommission old sync-server once all clients migrated

## Electron Integration

The Electron manager connects to the hub using the same URL pattern as the sync-server. All these calls work unchanged:

- `SyncStatusManager` → `/api/field-sync/metrics`, `/api/sync/device-registry`
- `ElectronUpdateManager` → `/api/electron-update/check`, `/download`
- `UpdateManager` → `/api/update/check`, `/download`
- `ResourcePackManager` → `/api/resource-packs/list`, `/manifest/{name}`, `/file/{name}/**`
- `ColdResyncManager` → `/api/resync/database/h2-backup`, `/files/path-manifest`, `/files/permanent/**`
- `DeviceConfigManager` → `/api/sync/device-registry` GET/POST

## Operational Notes

- Place Electron ZIP files in `electron-updates/` directory for auto-distribution
- Place JAR updates in `updates/` directory
- Place resource pack directories under `resource-packs/`
- Hub creates H2 backups on demand with 5-minute caching to handle concurrent requests
- Old backups auto-cleaned (keeps 3 by default)
- Client backups stored in `backup-storage/` with SHA-256 dedup (keeps 5 by default)
