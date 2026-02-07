# Functionality

One-time bulk upload of all existing client data to the sync server. Used to bootstrap a new sync server or re-populate it after data loss.

**Two sync methods are available:**

| Method | Speed | Use Case |
|--------|-------|----------|
| **Bulk Export** (recommended) | 2-5 minutes | Fast transfer of complete database + files as ZIP archives |
| **FieldChange** (fallback) | 30-60 minutes | Incremental transfer via synthetic FieldChanges |

Acceptance Criteria:
1. User triggers full sync to server — all local entities and files are sent to the sync server.
2. Entity types are processed in dependency order — referenced entities exist on server before dependents.
3. Progress is tracked and the operation can be resumed if interrupted.

# Architecture

This is the reverse of full resync (see [full-resync.md](full-resync.md)). Instead of pulling data from the server, it pushes all local data to the server.

The service converts each local entity into synthetic FieldChange records (one for entity creation + one per field value) and sends them via the same `POST /api/sync/exchange` endpoint used by normal incremental sync (see [field-based-sync.md](field-based-sync.md)). The server processes them through its standard pipeline.

Use full sync to server when:
- Setting up a new sync server.
- Re-populating the server after data loss.
- Server database was reset or corrupted.

# Implementation

## Method 1: Bulk Export (Recommended)

The fast bulk export method creates a temporary H2 database backup and files archive, then uploads both to the server in a single operation.

### Bulk export flow

1. User triggers via `FullSyncToServerService.startFullSyncViaBulkExport(force)`.
2. **Phase 1 — Safety check**: calls server `/api/resync/import/safety-check` to verify server is empty or force is enabled.
3. **Phase 2 — Database export**: `ClientDataExportService.createExportBackup()` creates a temporary H2 database, copies all entity data table-by-table, and produces a ZIP archive.
4. **Phase 3 — Files archive**: `BulkFileExportService.createFilesArchive()` creates a ZIP of all files from the uploads directory.
5. **Phase 4 — Upload**: streams files archive in chunks to server, posts database archive to server.

### Large File System Support

For file systems larger than 500MB, the bulk export uses streaming upload to avoid OutOfMemoryError:

1. **File-based archive creation**: Instead of holding the entire ZIP in memory, `BulkFileExportService.createFilesArchiveToFile()` writes directly to a temp file on disk.

2. **Streaming chunked upload**: `uploadFilesFromPath()` reads chunks from the temp file and uploads them individually:
   - 50MB chunks by default
   - Reads directly from disk using `RandomAccessFile`
   - Never holds more than one chunk in memory at a time
   - Progress updates shown per chunk

3. **Automatic cleanup**: Temp file is deleted after upload completes (or fails).

**Memory usage comparison**:
| Archive Size | Memory-based | Streaming |
|--------------|--------------|-----------|
| 500MB | 500MB+ heap | ~50MB |
| 2GB | OOM crash | ~50MB |
| 10GB | OOM crash | ~50MB |

### Core services (Bulk Export)

| Service | Purpose |
|---------|---------|
| [ClientDataExportService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/ClientDataExportService.java) | Creates temporary H2 database with entity data |
| [BulkFileExportService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/BulkFileExportService.java) | Creates ZIP archive of all files |
| [BulkImportService](sync-server.md) (server) | Imports H2 backup + files archive on server side |

### API endpoints (Client)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/field-sync/full-sync/bulk/stats` | GET | Get export statistics before starting |
| `/api/field-sync/full-sync/bulk/start?force=false` | POST | Start bulk export sync |

### API endpoints (Server)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resync/import/safety-check?force=false` | GET | Check if server is safe for import |
| `/api/resync/import/database` | POST | Import database backup only |
| `/api/resync/import/files` | POST | Import files archive only |
| `/api/resync/import/full` | POST | Import both database + files |

---

## Method 2: FieldChange Sync (Fallback)

## Full sync flow

1. User triggers via `FullSyncToServerService.startFullSync()`.
    [FullSyncToServerService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java)
2. Runs asynchronously (`@Async`) to avoid blocking the application.
3. **Phase 1 — Initialization**: counts total entities across all types for progress tracking.
4. **Phase 2 — Entity sync**: iterates through each entity type in dependency order:
    - Reads entities in pages (500 per page).
    - `createFieldChangesForEntity()` converts each entity into synthetic FieldChange records using reflection.
    - ManyToMany field changes are **deferred** to Phase 2b (not sent with their parent entity).
    - Batches records (100 per batch) for memory safety.
    - `sendBatch()` posts each batch to server via `POST /api/sync/exchange` with `fullSync: true` flag.
5. **Phase 2b — ManyToMany relationships**: sends all deferred ManyToMany changes after every entity type has been created on the server. This ensures referenced entities exist before join table entries are attempted (e.g., Equipment.lotoPoints references LotoPoint entities that are created in a later entity type batch).
6. **Phase 3 — File upload**: `queueFilesForUpload()` registers all FileObject entities for upload via `FileObjectSyncHandler` (see [file-sync.md](file-sync.md)).

## ManyToMany failure handling

If a ManyToMany relationship references an entity that doesn't exist on the server (e.g., due to a failed batch or orphaned reference), the server tracks the failure in the `failed_sync_item` table instead of rolling back the entire transaction. See [sync-server.md#failed-sync-item-tracking](sync-server.md#failed-sync-item-tracking) for recovery options.

The server's `ServerEntitySyncService.applyChangesToMirror()` uses `REQUIRES_NEW` transaction propagation, so ManyToMany failures don't affect FieldChange persistence — the sync is considered successful even if some mirror relationships fail.

## Entity processing order (26 types)

```
Category → Value → Comment → User → FileObject → Equipment → LotoPoint → Loto →
LotoStandard → LotoSnapshot → LotoBox → Lock → ZeroEnergy → HeatTrace → Highlight →
ElectricalPanel → EqBreaker → HtPanel → HtBreaker → EspDevice → LedStrip →
SafeWork → HotWork → ConfinedSpace → WorkRequest → DailyPermitPackage
```

## Field handling

- Uses reflection with caching to introspect entity fields.
- Each page of entities is read within a `TransactionTemplate` block to keep entities managed. This is required because `@ManyToMany` defaults to `FetchType.LAZY` — without an active persistence context, accessing lazy collections via reflection throws `LazyInitializationException`.
- Excludes system fields: `id`, `dateCreated`, `dateModified`, `hibernateLazyInitializer`, etc.
- Skips `@Transient` and `@JsonIgnore` fields.
- Skips reverse `@OneToMany` relationships to avoid duplication.
- Serializes entity references as IDs, collections of entities as ID arrays.
- Handles enums and primitive values.

## Status tracking

`FullSyncStatus` DTO provides detailed progress:
- Total entities counted, batches sent, batches failed.
- Current entity type index and page number (for resume on failure).
- Failed batches with error messages and timestamps.

## Core services

| Service | Purpose |
|---------|---------|
| [FullSyncToServerService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java) | Orchestrates full data push to server |
| [FileObjectSyncHandler](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FileObjectSyncHandler.java) | Handles file upload queuing |

## Registering new entity types

When adding a new entity type to the project, register it in FullSyncToServerService:
- Add the entity's repository to the constructor.
- Add the entity type name to the `getRepositoryForType()` switch.
- Ensure the entity is also registered in [EntityTableRegistry](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java) and [ServiceFacade](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java) (see [field-based-sync.md](field-based-sync.md) for full sync registration checklist).

## E2E Tests

Test file: [full-sync-to-server.spec.ts](../../../automation-test/tests/sync/full-sync-to-server.spec.ts) | Run: `cd automation-test && npm run test:full-sync`

| Scenario | Test |
|----------|------|
| Status check | should return status of last full sync operation |
| Start full sync | should start full sync to server |
| File sync status | should return file sync queue information |
