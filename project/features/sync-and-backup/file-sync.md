# Functionality

Synchronization of physical files (PDFs, images) between client machines via the sync server.

1. When a user uploads a file on one machine, it is transferred to the sync server and then downloaded by all other connected machines.
2. When file metadata changes (vendor, fileType, fileNumber), files are moved to new paths and old directories are cleaned up.
3. Files are deduplicated by SHA-256 hash — identical files are stored only once on the server.
4. Revision files (e.g. `P123-001-rev1.pdf`) are handled automatically alongside the base file.

Acceptance Criteria:
1. User uploads a file on Machine A — it appears on Machine B in the correct directory path.
2. User changes a path-affecting field (vendor, fileType, fileNumber) — file is moved on all machines.
3. Server storage is cleaned up automatically after all active clients have synced.

# Architecture

File sync has two components:
1. **Metadata sync** — entity fields (fileNumber, fileType, vendor, etc.) synced via FieldChange records (see [field-based-sync.md](field-based-sync.md))
2. **File sync** — physical files transferred via the sync server's file storage API

File path structure:
```
{project.root}/uploads/{extension}/{fileType}/{vendor}/{fileNumber}.{extension}
```

Example:
```
uploads/pdf/P&ID/ABB/P123-001.pdf
uploads/jpg/P&ID/ABB/P123-001.jpg
uploads/jpg/P&ID/ABB/P123-001-rev1.jpg  (revision)
```

Server storage uses SHA-256 hash as filename:
```
./file-storage/FileObject/{entityId}/{sha256-hash}.{extension}
```

# Implementation

## Upload flow (local file change)

1. User uploads file via NgFileService.
2. FileObject entity saved to database.
3. `FieldChangeEntityListener` detects change, `FieldChangeTracker` creates FieldChange records.
    [FieldChangeTracker](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeTracker.java)
4. `FieldChangeTracker` notifies `FileObjectSyncHandler`.
5. `FileObjectSyncHandler.onLocalFileObjectChanged()` queues file for upload via `PendingFileSync` task.
    [FileObjectSyncHandler](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FileObjectSyncHandler.java)
6. Background scheduler runs `processUploadQueue()` every 5 seconds.
7. `uploadFilesToServer()` sends file via `POST /api/files/upload` with entityType, entityId, and binary data.
8. Server stores file, broadcasts `file_upload` SSE event to other clients.
9. FieldChange synced to other machines via normal field-based sync.

## Download flow (incoming file change)

10. `ServerSseClient` receives `file_upload` SSE event.
    [ServerSseClient](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/ServerSseClient.java)
11. `FileObjectSyncHandler.handleFileUploadEvent()` queues file for download.
12. Background scheduler runs `processDownloadQueue()` every 5 seconds.
13. `downloadFilesFromServer()` fetches file list via `GET /api/files/entity/FileObject/{id}/download-info`.
14. Downloads each file via `GET /api/files/download/{fileId}` with SHA-256 verification.
15. Files saved to local path based on `FileObject.buildFileLink()`.
16. `deleteOldFoldersAfterDownload()` cleans up old directories if path changed.

## Path-affecting field changes

When `vendor`, `fileType`, or `fileNumber` change:

**Local changes:**
- `NgFileService.updateFileObject()` handles the physical file move.
    [NgFileService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/file/NgFileService.java)
- New file location is uploaded to sync server.

**Incoming changes from sync:**
- Entity already has new values when `FileObjectSyncHandler` processes it.
- Handler reconstructs the OLD path using `FieldChange.oldValue`.
- Deletes files at the old path (including all revisions per extension).
- Downloads file from sync server and saves at the NEW path.
- Empty directories are cleaned up.

## Revision files

Revision files (e.g. `P123-001-rev1.pdf`) are handled automatically:
- `FileUtil.getRevisionsByFileNumber()` finds all versions matching pattern `{fileNumber}(-rev\d+)?\.{extension}`.
- Upload: `getAllPhysicalFiles()` iterates all extensions in `FileObject.extensions`, finds base + all revisions.
- Download: server returns all files for the entity, each downloaded with its original filename preserved.

## Core services

| Service | Purpose |
|---------|---------|
| [FileObjectSyncHandler](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FileObjectSyncHandler.java) | File upload/download queue management |
| [NgFileService](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/file/NgFileService.java) | File CRUD operations, physical file moves |
| [FieldChangeTracker](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeTracker.java) | Tracks entity changes, notifies file handler |
| [FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) | Applies incoming sync, publishes file events |
| FileObject entity | [FileObject](../../../src/main/java/com/dk_power/power_plant_java/entities/files/FileObject.java) |

## Server REST endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files/upload` | POST | Upload single file |
| `/api/files/upload-multiple` | POST | Upload multiple files |
| `/api/files/download/{fileId}` | GET | Download file by ID (marks as synced) |
| `/api/files/pending` | GET | Get files pending sync for client |
| `/api/files/entity/{type}/{id}` | GET | List files for entity |
| `/api/files/entity/{type}/{id}/download-info` | GET | Get download URLs |
| `/api/files/entity/{type}/{id}` | DELETE | Soft delete files |
| `/api/files/stats` | GET | Storage statistics |

## Storage cleanup

The sync server does not hold a full file system copy. Files are temporary and cleaned up automatically.

Cleanup rules (file is deleted when ANY condition is met):
1. **Soft-deleted files** — marked as deleted AND older than `retention-days` (90 days default).
2. **Fully-synced files** — ALL active clients have downloaded AND older than `min-retention-days` (7 days default). Active = connected in last 7 days. Origin machine doesn't count.
3. **Expired files** — older than `retention-days` regardless of sync status (hard limit).

Cleanup schedule:
```
Entity sync cleanup:  3 AM daily  (deletes FieldChange records)
File sync cleanup:    4 AM daily  (deletes physical files)
```

Each file tracks which machines have downloaded it via `syncedToMachines` field (format: `|MACHINE1|MACHINE2|`), updated on download.

## Configuration

### Client (application.properties)
```properties
sync.server.enabled=true
sync.server.url=http://192.168.x.x:8090
files.root.path=${user.dir}/uploads
files.relative.path=uploads
project.root=${user.dir}
```

### Sync Server (application.properties)
```properties
sync.files.storage-path=./file-storage
sync.files.max-file-size=104857600           # 100MB max
sync.files.retention-days=90                 # Max retention (hard limit)
sync.files.min-retention-days=7              # Min retention (grace period)
sync.files.cleanup.cron=0 0 4 * * ?         # Cleanup at 4 AM daily
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=200MB
```

## Monitoring

Check file sync status:
```
GET /api/field-sync/file-sync/status
```
Returns queue counts: pendingUploads, pendingDownloads, inProgressUploads, inProgressDownloads.
