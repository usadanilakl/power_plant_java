# Functionality

Full database replacement for disaster recovery. Replaces the entire local H2 database with a backup from the sync server (primary) or shared network drive (fallback), then synchronizes all physical files.

1. Server-based resync downloads a live H2 backup from the sync server (which maintains a mirror of all entity data).
2. Shared drive resync restores from periodic H2 backups stored on a network share.
3. Safety mechanisms prevent accidental mass file deletion during resync.

Acceptance Criteria:
1. User triggers full resync — local database is replaced with server backup, all files are synchronized, application restarts.
2. If sync server is unavailable — resync falls back to shared drive backup automatically.
3. If resync would delete more than safety thresholds allow — operation stops unless `force=true` is used.

# Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Client A      │         │   Sync Server   │
│   (H2 DB)       │ ◄─────► │   (H2 DB)       │
└─────────────────┘         └─────────────────┘
        │                          │
        │   FieldChange sync       │
        │   (incremental)          │
        ▼                          ▼
┌─────────────────┐         ┌─────────────────┐
│   Client B      │         │  Shared Drive   │
│   (H2 DB)       │ ◄──────►│  (Backup)       │
└─────────────────┘         └─────────────────┘
```

The sync server maintains a **live mirror** of the client database:
- All entity classes are duplicated on the sync server.
- FieldChange records are applied in real-time to keep the mirror up-to-date.
- On resync request, server creates an H2 BACKUP and sends it to the client.

This is intentionally a **different code path** from field-based sync (see [field-based-sync.md](field-based-sync.md)). Full resync replaces the entire database rather than applying individual field changes.

Use full resync when:
- Local database is corrupted.
- Need to "start fresh" from a known good state.
- Generating FieldChange records for the entire DB would be too slow.

# Implementation

## Server-based resync (primary)

1. Client initiates full resync via `POST /api/resync/start`.
    [FullResyncController](../../../src/main/java/com/dk_power/power_plant_java/controllers/sync/FullResyncController.java)
2. `FullResyncService.performFullResync()` checks sync server health.
    [FullResyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullResyncService.java)
3. Downloads H2 backup from server: `GET /api/resync/database/h2-backup`.
4. `H2BackupService` shuts down HikariCP connection pool and restores the backup (replaces all database files).
    [H2BackupService](../../../src/main/java/com/dk_power/power_plant_java/sevice/app_services/H2BackupService.java)
5. Compares local files with server manifest: `GET /api/resync/files/manifest`.
6. Safety check — if deletions exceed thresholds, stops unless `force=true`.
7. Downloads missing/changed files from server: `GET /api/resync/files/{id}`.
8. Deletes extra local files.
9. `scheduleExternalRestart()` — application restart required to reconnect to restored database.

## Shared drive resync (fallback)

If the sync server is unavailable, the same flow runs against the shared network drive:
- Loads backup metadata from shared drive.
- Restores H2 backup from shared drive.
- Compares local files with backup manifest.
- Copies missing/changed files from backup.

## Safety mechanisms

| Threshold | Default | Description |
|-----------|---------|-------------|
| `MAX_DELETE_COUNT` | 100 | Maximum files that can be deleted without force |
| `MAX_DELETE_PERCENTAGE` | 25% | Maximum percentage of files that can be deleted |
| `MIN_FILES_FOR_PERCENTAGE_CHECK` | 20 | Minimum files before percentage check applies |

Use the preview endpoint (`GET /api/resync/preview`) to review what will change before committing.

## File comparison

During resync, files are compared using the **path-based manifest** from permanent storage:

1. Client requests manifest: `GET /api/resync/files/path-manifest`
2. Server walks permanent storage directory and returns files by their client-relative path
3. Client compares local files by path (case-insensitive) and SHA-256 checksum

Files are categorized as:
- **To Download** — missing locally or checksum mismatch.
- **To Delete** — exists locally but not on server (with safety check).
- **Unchanged** — exists on both with matching checksum.

**Safety guard for deletions:**
- Before deleting a local file, client checks if an active (non-deleted) FileObject owns it
- If yes, the file is skipped from deletion even if not on server
- This prevents data loss from timing issues during sync

Downloads use the permanent storage endpoint:
```
GET /api/resync/files/permanent/{relative-path}
```
Example: `GET /api/resync/files/permanent/uploads/pdf/P%26ID/ABB/P123.pdf`

## Post-resync behavior

After H2 restore:
1. HikariCP releases all connections.
2. H2 Restore overwrites database files.
3. Application restart required.
4. Hibernate `ddl-auto=update` recreates client-only tables on restart (e.g. `pending_file_sync`, `sync_peer`).

## Core services

| Service | Location | Purpose |
|---------|----------|---------|
| FullResyncService | [Client](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullResyncService.java) | Orchestrates resync operations |
| H2BackupService | [Client](../../../src/main/java/com/dk_power/power_plant_java/sevice/app_services/H2BackupService.java) | Creates/restores H2 backups |
| FullResyncController | [Client](../../../src/main/java/com/dk_power/power_plant_java/controllers/sync/FullResyncController.java) | REST endpoints for UI |
| FullResyncService | Server: `service/FullResyncService.java` | Creates H2 backup, exports entities |
| FullResyncController | Server: `controller/FullResyncController.java` | REST endpoints for clients |

## Files-Only Sync

Sometimes only files are out of sync while the database is correct. The **files-only sync** feature syncs files from the server without touching the database.

Use cases:
- File mismatch detected but database is correct
- Need to fix file sync without database reset
- Partial resync applied but file sync failed

### Features

1. **Retry logic** — failed downloads are retried up to 3 times (configurable)
2. **Detailed reporting** — shows exactly which files succeeded, failed, or were deleted
3. **Same safety checks** — deletion thresholds apply (can be bypassed with `force=true`)

### API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/files-sync/preview` | GET | Preview file changes (same as full resync preview) |
| `/api/resync/files-sync/execute` | POST | Execute files-only sync |
| `/api/resync/files-sync/execute?force=true&maxRetries=3` | POST | Execute with options |

### Response

The files-sync endpoint returns a `FileSyncResult` with detailed stats:

```json
{
  "success": true,
  "message": "Files sync complete: 45 downloaded, 0 failed, 3 deleted, 1200 unchanged",
  "comparison": { ... },
  "stats": {
    "filesDownloaded": 45,
    "filesFailed": 0,
    "filesDeleted": 3,
    "failedFiles": []
  }
}
```

If `filesFailed > 0`, the response includes a list of failed file paths for troubleshooting.

### Implementation

The files-only sync flow:

1. Client calls `GET /api/resync/files/path-manifest` to get server file list
2. Client compares local files against manifest by path and SHA-256 checksum
3. For each missing/changed file, downloads from `GET /api/resync/files/permanent/{path}`
4. Failed downloads are retried with exponential backoff (1s, 2s, 3s delays)
5. Extra local files are deleted (subject to safety check)
6. Result returned with detailed statistics

**URL encoding**: File paths with special characters (spaces, parentheses, etc.) are URL-encoded during download. The server handles multi-pass decoding for double-encoded paths and falls back to the original path if decoding fails.

Example: `Gas (Vendor)` → `Gas%20%28Vendor%29`

See: [FullResyncService.syncFilesOnly()](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullResyncService.java)

## Client REST endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/health` | GET | Get sync health status |
| `/api/resync/preview` | GET | Preview resync without changes |
| `/api/resync/start` | POST | Start full resync |
| `/api/resync/start?force=true` | POST | Start resync, skip safety checks |
| `/api/resync/files-sync/preview` | GET | Preview files-only sync |
| `/api/resync/files-sync/execute` | POST | Start files-only sync |
| `/api/resync/files-sync/execute?force=true` | POST | Files-only sync, skip safety |
| `/api/resync/status` | GET | Get current resync progress |
| `/api/backup/start` | POST | Create full backup |
| `/api/backup/status` | GET | Get current backup progress |

## Server REST endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/health` | GET | Server health status |
| `/api/resync/database/h2-backup` | GET | Download H2 backup ZIP |
| `/api/resync/database/export` | GET | Export all entities as JSON |
| `/api/resync/files/manifest` | GET | Get file manifest (hash-based storage) |
| `/api/resync/files/path-manifest` | GET | Get file manifest (permanent storage, path-based) |
| `/api/resync/files/{id}` | GET | Download specific file by ID (hash-based) |
| `/api/resync/files/permanent/**` | GET | Download file by path (permanent storage) |

## Configuration

### Client (application.properties)
```properties
sync.server.enabled=true
sync.server.url=http://192.168.x.x:8090
sync.machine.id=MACHINE_1
sync.machine.name=Workstation 1
h2.backup.directory=./backups
h2.backup.shared.directory=/mnt/shared/backups
sync.backup.file.directory=/mnt/shared/file_backup
sync.backup.cron=0 0 2 * * ?       # Scheduled backup (disabled by default)
sync.backup.enabled=false
files.root.path=uploads
project.root=${user.dir}
```

### Sync Server (application.properties)
```properties
spring.datasource.url=jdbc:h2:file:./data/syncdb
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
sync.files.storage-path=./file-storage            # Hash-based temp storage (auto-cleaned)
sync.files.permanent-storage-path=./permanent-storage  # Path-based mirror (never auto-cleaned)
sync.files.permanent-storage-enabled=true         # Enable permanent storage for resync
sync.backup.storage-path=./backup-storage
```

## Troubleshooting

**Resync fails with "Wrong user name or password"** — H2 credentials differ between client and server. Ensure both use the same `spring.datasource.username` and `password`.

**Table not found after resync** — client-only tables (`pending_file_sync`, `sync_peer`) don't exist on the server. Restart the client to let Hibernate recreate them.

**Resync blocked by safety check** — too many files would be deleted. Review via preview endpoint, then use `force=true` if safe.

**Files not syncing after resync** — physical files are synced separately from the database. Check file manifest exists on server, files exist in server storage, and client has write permissions.

**File mismatch after full/partial resync** — some files may fail to download due to network issues or server errors. Use the **Files-Only Sync** feature to retry file downloads:
1. Go to Sync & Recovery page
2. Click "Preview File Changes" to see what's missing
3. Click "Sync Files Only" to download missing files (includes automatic retry)
4. Check the result for any failed files

**Many files failed to download** — the files-sync feature retries failed downloads automatically (default 3 times). If files still fail:
1. Check server logs for errors on those specific files
2. Verify files exist in server's permanent storage
3. Try running files-sync again with higher retry count: `?maxRetries=5`
