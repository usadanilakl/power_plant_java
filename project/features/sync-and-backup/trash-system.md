# Trash System (Staged File Deletion)

## Functionality

Instead of permanent file deletion, files are moved to a `.trash` folder with a configurable retention period (default: 14 days). This provides a safety net for accidental deletions and allows users to restore files if needed.

Acceptance Criteria:
1. When a file is deleted (by user, sync, or cleanup), it is moved to the `.trash` folder instead of being permanently deleted.
2. Each trashed file preserves its original path and metadata.
3. Files can be restored to their original location via the Trash UI.
4. Files are automatically permanently deleted after the retention period (default: 14 days).
5. Users can manually permanently delete files or empty the entire trash.
6. The source of deletion is tracked (user, sync, cleanup).

## Architecture

### Directory Structure

```
uploads/
├── pdf/
│   └── Manuals/...
├── jpg/
│   └── Schematics/...
└── .trash/                       # Trash folder
    ├── manifest.json             # Tracks all trash entries
    └── {uuid}/                   # Each deleted file gets unique folder
        ├── metadata.json         # Original path, deletion time, source
        └── {original-filename}   # The actual file
```

### Manifest Structure

```json
{
  "entries": [
    {
      "id": "uuid-1234",
      "originalPath": "uploads/pdf/Manuals/Acme/DOC-001.pdf",
      "fileName": "DOC-001.pdf",
      "deletedAt": "2024-01-15T10:30:00Z",
      "deletedBy": "user",
      "fileSize": 1048576,
      "canRestore": true
    }
  ]
}
```

### Deletion Sources

| Source | Description |
|--------|-------------|
| `user` | User explicitly deleted the file via UI |
| `sync` | File was removed during sync operations (path changes, etc.) |
| `cleanup` | Automatic cleanup of empty directories or orphaned files |

## Implementation

### Core Service

[TrashService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/file/TrashService.java)

Key methods:
- `moveToTrash(Path, String source)` — Moves a file to trash with source tracking
- `restore(String trashId)` — Restores a file to its original location
- `permanentlyDelete(String trashId)` — Permanently deletes a single trash entry
- `listTrash()` — Returns all current trash entries
- `getStats()` — Returns trash statistics (count, size, expired count)
- `emptyTrash()` — Permanently deletes all trash entries
- `cleanupExpiredTrash()` — Scheduled task to delete expired entries

### Integration Points

Files are now routed through trash instead of direct deletion:

1. **NgFileService.java** — User deletions via `deleteRelatedFiles()` use `trashService.moveToTrash(path, "user")`
2. **FileObjectSyncHandler.java** — Sync operations use `trashService.moveToTrash(path, "sync")`
3. **FileUtil.java** — Cleanup operations use `trashService.moveToTrash(path, "cleanup")`

### REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ng/files/trash` | GET | List all files in trash |
| `/ng/files/trash/stats` | GET | Get trash statistics |
| `/ng/files/trash/{id}/restore` | POST | Restore a file from trash |
| `/ng/files/trash/{id}` | DELETE | Permanently delete a single file |
| `/ng/files/trash` | DELETE | Empty entire trash |

### Scheduled Cleanup

The `cleanupExpiredTrash()` method runs daily at 3 AM (configurable) and permanently deletes files older than the retention period.

## Frontend

### Trash Page

[trash.component.ts](../../../frontend/src/app/features/trash/trash.component.ts)

Route: `/trash`

Features:
- **Stats summary**: Total files, total size, files expiring soon
- **File list**: Shows filename, original path, size, deletion time, source, days remaining
- **Restore button**: Restores file to original location
- **Delete button**: Permanently deletes individual file
- **Empty Trash button**: Permanently deletes all files
- **Refresh button**: Reloads trash contents

### Service Methods

[file.service.ts](../../../frontend/src/app/services/file.service.ts)

```typescript
getTrash(): Observable<SpringApiResponse<TrashEntry[]>>
getTrashStats(): Observable<SpringApiResponse<TrashStats>>
restoreFromTrash(id: string): Observable<{ success: boolean; message: string }>
permanentlyDeleteFromTrash(id: string): Observable<{ success: boolean; message: string }>
emptyTrash(): Observable<{ success: boolean; deletedCount: number; message: string }>
```

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `files.trash.retention.days` | `14` | Days to retain files in trash before auto-deletion |
| `files.trash.cleanup.cron` | `0 0 3 * * ?` | Cron expression for cleanup schedule (default: 3 AM daily) |

## Fallback Behavior

If moving to trash fails (e.g., disk space issues), the system falls back to direct deletion to ensure the operation completes. A warning is logged when this occurs.

## Verification

1. **User deletion goes to trash**
   - Delete a file via UI
   - Navigate to Trash page (`/trash`)
   - Verify file appears with "User deleted" source

2. **Sync deletion goes to trash**
   - Change a file's vendor/fileType on server
   - Wait for sync
   - Check trash for old file with "Sync cleanup" source

3. **Restore file**
   - Click Restore on a trashed file
   - Verify file is back in original location
   - Verify file is removed from trash

4. **Permanent deletion**
   - Click Delete on a trashed file
   - Confirm the deletion
   - Verify file is gone from both trash and disk

5. **Automatic cleanup**
   - Files older than `files.trash.retention.days` are automatically deleted at the scheduled time
