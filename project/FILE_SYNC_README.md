# FileObject Sync System

This document explains how FileObject entities and their associated physical files are synchronized between machines.

## Overview

FileObject sync has two components:
1. **Metadata sync** - Entity fields (fileNumber, fileType, vendor, etc.) synced via FieldChange records
2. **File sync** - Physical files (PDF, JPG) transferred via the sync server's file storage API

## File Path Structure

Files are stored at paths derived from FileObject properties:

```
{project.root}/uploads/{extension}/{fileType}/{vendor}/{fileNumber}.{extension}
```

**Example:**
```
uploads/pdf/P&ID/ABB/P123-001.pdf
uploads/jpg/P&ID/ABB/P123-001.jpg
uploads/jpg/P&ID/ABB/P123-001-rev1.jpg  (revision)
```

## Sync Flow

### When You Create/Modify a FileObject Locally

```
1. User uploads file via NgFileService
   │
2. FileObject entity saved to database
   │
3. FieldChangeEntityListener detects change
   │
4. FieldChangeTracker creates FieldChange records
   │
5. FieldChangeTracker notifies FileObjectSyncHandler
   │
6. FileObjectSyncHandler queues file for upload
   │
7. Background scheduler uploads to sync server:
   POST /api/files/upload
   - entityType: "FileObject"
   - entityId: 123
   - file: (binary data)
   │
8. Sync server stores file at:
   ./file-storage/FileObject/123/{sha256-hash}.pdf
   │
9. FieldChange synced to other machines via normal sync
```

### When You Receive a FileObject Change from Sync

```
1. FieldSyncService receives FieldChange for FileObject
   │
2. Entity fields applied to local FileObject
   │
3. FieldSyncService publishes FileObjectSyncEvent
   │
4. FileObjectSyncHandler receives event
   │
5. FileObjectSyncHandler queues file for download
   │
6. Background scheduler fetches file list:
   GET /api/files/entity/FileObject/123/download-info
   │
7. Background scheduler downloads each file:
   GET /api/files/download/{fileId}
   │
8. Files saved to local path based on FileObject.buildFileLink()
```

## Path-Affecting Fields

When these fields change, files must be moved/renamed:

| Field | Effect |
|-------|--------|
| `fileNumber` | File renamed: `OLD.pdf` → `NEW.pdf` |
| `fileType` | Folder changes: `uploads/pdf/OLD_TYPE/...` → `uploads/pdf/NEW_TYPE/...` |
| `vendor` | Folder changes: `uploads/pdf/P&ID/OLD_VENDOR/...` → `uploads/pdf/P&ID/NEW_VENDOR/...` |

### Local Path Changes

When you change a path-affecting field locally:
- `NgFileService.updateFileObject()` handles the physical file move
- New file location is uploaded to sync server

### Incoming Path Changes

When a path change comes from sync:
1. Entity already has new values when FileObjectSyncHandler processes it
2. Handler reconstructs the OLD path using FieldChange.oldValue
3. Handler deletes files at the old path
4. Handler downloads file from sync server
5. File is saved at the NEW path (derived from updated entity)
6. Empty directories are cleaned up

## Key Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `FileObject` | `entities/files/FileObject.java` | Entity with file metadata |
| `FileObjectSyncHandler` | `sevice/sync/FileObjectSyncHandler.java` | Handles file upload/download queues |
| `NgFileService` | `sevice/angular/file/NgFileService.java` | File CRUD operations, physical file moves |
| `FieldChangeTracker` | `sevice/sync/FieldChangeTracker.java` | Tracks entity changes, notifies file handler |
| `FieldSyncService` | `sevice/sync/FieldSyncService.java` | Applies incoming sync, publishes file events |

## Sync Server Endpoints

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

## Configuration

### Client (application.properties)

```properties
# Must be enabled for file sync
sync.server.enabled=true
sync.server.url=http://192.168.x.x:8090

# File paths
files.root.path=${user.dir}/uploads
files.relative.path=uploads
project.root=${user.dir}
```

### Sync Server (application.properties)

```properties
# File storage location
sync.files.storage-path=./file-storage

# Max file size (100MB)
sync.files.max-file-size=104857600

# Max retention - files older than this are ALWAYS deleted (aligned with entity sync)
sync.files.retention-days=90

# Min retention - files kept at least this long even if all clients synced (grace period)
sync.files.min-retention-days=7

# Cleanup schedule - runs 1 hour after entity sync cleanup (3 AM)
sync.files.cleanup.cron=0 0 4 * * ?

# Spring multipart limits
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=200MB
```

## Monitoring

Check file sync status:
```
GET /api/field-sync/file-sync/status
```

Response:
```json
{
  "enabled": true,
  "syncServerUrl": "http://192.168.x.x:8090",
  "queues": {
    "pendingUploads": 0,
    "pendingDownloads": 0,
    "inProgressUploads": 0,
    "inProgressDownloads": 0
  }
}
```

## Storage Cleanup

The sync server does **not** hold a full file system copy. Files are temporary and cleaned up automatically to save storage. This mirrors the entity sync cleanup behavior.

### Cleanup Rules

Files are deleted from the sync server when ANY of these conditions are met:

1. **Soft-deleted files** - Files marked as deleted AND older than `retention-days` (90 days default)

2. **Fully-synced files** - Files that ALL active clients have downloaded AND older than `min-retention-days` (7 days default)
   - Active clients = machines that connected in the last 7 days
   - Origin machine doesn't count (it uploaded the file)

3. **Expired files** - Files older than `retention-days` regardless of sync status (hard limit)

### Cleanup Schedule

```
Entity sync cleanup:  3 AM daily  (deletes FieldChange records)
File sync cleanup:    4 AM daily  (deletes physical files)
```

### Sync Tracking

Each file tracks which machines have downloaded it via `syncedToMachines` field:
- Format: `|MACHINE1|MACHINE2|MACHINE3|`
- Updated when client calls `GET /api/files/download/{fileId}`
- Used to determine if file can be cleaned up early

### Example Timeline

```
Day 0:  Machine A uploads file
Day 1:  Machine B downloads file (marked as synced to B)
Day 2:  Machine C downloads file (marked as synced to B, C)
Day 7:  Cleanup runs - file deleted (all active clients synced, past min-retention)
```

If Machine D was offline for 10 days and comes back:
```
Day 10: Machine D connects
Day 10: Machine D requests file - file not found (already cleaned up)
Day 10: Machine D must request re-upload from another machine
```

To prevent this, increase `min-retention-days` or `retention-days`.

## Deduplication

Files are deduplicated by SHA-256 hash:
- If you upload the same file twice, only one copy is stored
- Hash is used as filename on sync server: `{hash}.{extension}`
- Saves storage when multiple machines upload identical files

## Revision Files

Revision files (e.g., `P123-001-rev1.pdf`) are handled automatically:
- `FileUtil.getRevisionsByFileNumber()` finds all versions
- Pattern: `{fileNumber}(-rev\d+)?\.{extension}`
- All revisions are uploaded/downloaded together

### Upload Handling
- `getAllPhysicalFiles()` iterates through all extensions in `FileObject.extensions`
- For each extension, uses `FileUtil.getRevisionsByFileNumber()` to find base file + all revisions
- Each file is uploaded with its original filename preserved (including revision suffix)

### Download Handling
- Server returns list of all files for the entity (base + revisions, all extensions)
- `downloadSingleFile()` uses the exact `fileName` from server response
- Target path: `{folder from FileObject}/{fileName from server}`
- This preserves revision suffixes like `-rev1`, `-rev2` in the filename

### Path Change Handling
When path-affecting fields change via sync:
1. `deleteOldFilesAfterPathChanges()` reconstructs OLD paths using FieldChange.oldValue
2. For each OLD extension, finds all revisions at old path
3. Deletes all old files (base + revisions)
4. Downloads new files from server with correct names

## Troubleshooting

### Files not uploading
1. Check `sync.server.enabled=true` in application.properties
2. Check sync server is running and reachable
3. Check `/api/field-sync/file-sync/status` for queue status
4. Check logs for upload errors

### Files not downloading
1. Verify files exist on sync server: `GET /api/files/entity/FileObject/{id}`
2. Check download queue in status endpoint
3. Verify local path is writable

### Path mismatch after sync
1. Ensure all path-affecting fields (fileNumber, fileType, vendor) are synced
2. Check that entity has correct values before file download
3. Verify `buildFileLink()` returns expected path
