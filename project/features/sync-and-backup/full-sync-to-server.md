# Functionality

One-time bulk upload of all existing client data to the sync server. Used to bootstrap a new sync server or re-populate it after data loss.

1. Converts all local entities into synthetic FieldChange "CREATE" records and sends them to the server.
2. Processes 26+ entity types in strict dependency order.
3. Queues all physical files for upload via the existing file sync mechanism.
4. Safe to run multiple times — server deduplicates via Last-Writer-Wins logic.

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

## Full sync flow

1. User triggers via `FullSyncToServerService.startFullSync()`.
    [FullSyncToServerService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java)
2. Runs asynchronously (`@Async`) to avoid blocking the application.
3. **Phase 1 — Initialization**: counts total entities across all types for progress tracking.
4. **Phase 2 — Entity sync**: iterates through each entity type in dependency order:
    - Reads entities in pages (500 per page).
    - `createFieldChangesForEntity()` converts each entity into synthetic FieldChange records using reflection.
    - Batches records (100 per batch) for memory safety.
    - `sendBatch()` posts each batch to server via `POST /api/sync/exchange` with `fullSync: true` flag.
5. **Phase 3 — File upload**: `queueFilesForUpload()` registers all FileObject entities for upload via `FileObjectSyncHandler` (see [file-sync.md](file-sync.md)).

## Entity processing order (26 types)

```
Category → Value → Comment → User → FileObject → Equipment → LotoPoint → Loto →
LotoStandard → LotoSnapshot → LotoBox → Lock → ZeroEnergy → HeatTrace → Highlight →
ElectricalPanel → EqBreaker → HtPanel → HtBreaker → EspDevice → LedStrip →
SafeWork → HotWork → ConfinedSpace → WorkRequest → DailyPermitPackage
```

## Field handling

- Uses reflection with caching to introspect entity fields.
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
