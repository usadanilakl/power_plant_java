# SharePoint Sync Orchestrator

## Purpose

Centralized, scalable system for syncing entity data between SharePoint lists and the local H2 database. Replaces per-entity `@Scheduled` methods with a single orchestrator that auto-discovers all SP-backed entity types via Spring bean injection.

## Architecture

```
SharePointSyncOrchestrator (single @Scheduled, 30s poll)
  ├── discovers all SharePointSyncable<?> beans via List<> injection
  ├── per-entity-type interval tracking (ConcurrentHashMap)
  ├── hub-mode / hub-offline gate (centralized)
  └── iterates and syncs each entity type when due

SharePointSyncable<D> interface (one impl per entity type)
  ├── WorkRequestSharePointSyncable  ─→ WR adapter + field merge + dedup
  ├── JhaSharePointSyncable          ─→ JHA adapter + field merge + dedup
  └── (future) HotWorkSyncable, ConfinedSpaceSyncable, etc.

SharePointMergeTemplate<E> (generic dedup via template method)
  ├── WorkRequestMergeService  ─→ with FK transfer overrides
  ├── JhaMergeService          ─→ leaf entity, no FK transfers
  └── (future) HotWorkMergeService, etc.
```

## Data Flow

### Normal Flow (Hub Online)

```
SharePoint List ──► Hub polls via Orchestrator ──► Local H2 DB ──► FieldChange sync to clients
```

- Only the hub (`sync.role=hub`) polls SharePoint
- Clients receive SP data via hub-peer field sync (SSE + REST)
- Gate: `if (!syncConfig.isHubMode() && centralSyncService.isServerAvailable()) return;`

### Hub Offline Flow

```
SharePoint List ──► Client manual sync via REST API ──► Local H2 DB
```

- Frontend shows "Hub offline — data might be outdated" banner
- User manually triggers sync per entity type via `POST /api/sharepoint-sync/sync/{entityType}`
- Only the requested entity type is synced (not all SP tables)

## Key Files

| File | Purpose |
|------|---------|
| `sevice/sharepoint/SharePointSyncable.java` | Generic interface for SP-backed entity sync |
| `sevice/sharepoint/SharePointSyncOrchestrator.java` | Single `@Scheduled` entry, auto-discovers syncables |
| `sevice/sharepoint/syncables/WorkRequestSharePointSyncable.java` | WR implementation with auto-close |
| `sevice/sharepoint/syncables/JhaSharePointSyncable.java` | JHA implementation with WR linking |
| `sevice/sync/SharePointMergeTemplate.java` | Abstract dedup template |
| `sevice/sync/WorkRequestMergeService.java` | WR dedup with FK transfers |
| `sevice/sync/JhaMergeService.java` | JHA dedup (leaf entity) |

## SharePointSyncable<D> Interface

Each implementation provides:

| Method | Purpose |
|--------|---------|
| `getEntityTypeName()` | Unique key: `"WorkRequest"`, `"Jha"` |
| `getSharePointListTitle()` | SP list title: `"Work Requests"`, `"JHA"` |
| `fetchAllFromSharePoint()` | Delegates to entity-specific adapter |
| `processRemoteItem(dto, result)` | Create/update with field-level merge |
| `getSharepointId(dto)` | Extract SP ID from DTO |
| `supportsAutoClose()` | WR=true (close absent Active records), JHA=false |
| `autoCloseAbsentRecords(remoteIds, result)` | Close local Active records missing from SP |
| `mergeIfDuplicatesExist()` | Delegates to entity merge service |
| `afterSync(result)` | Post-sync hook (JHA: late-link to WR) |
| `getFieldMapping()` | Entity field name → SP column name |
| `extractSpFieldValues(dto)` | SP column values from DTO for snapshot |
| `getSpModifiedTime(dto)` | SP `Modified` datetime from DTO |
| `applySelectiveFields(entity, dto, fields)` | Apply only winning fields |
| `findLocalEntityId(sharepointId)` | Entity ID lookup for FieldChange queries |

## Orchestrator Scheduling

The orchestrator replaces the old per-entity `@Scheduled` methods:

| Before | After |
|--------|-------|
| `WorkRequestSyncService.scheduledSync()` @Scheduled(30s, init 30s) | Removed |
| `JhaSyncService.scheduledSync()` @Scheduled(30s, init 45s) | Removed |
| Per-entity: `syncSettings.isWrSyncDue()`, `markWrSynced()` | Removed |
| Per-entity: `syncSettings.isJhaSyncDue()`, `markJhaSynced()` | Removed |
| — | `SharePointSyncOrchestrator.scheduledSync()` @Scheduled(30s, init 30s) |
| — | Per-type tracking via `ConcurrentHashMap<String, Long>` |

## REST API

Base path: `/api/sharepoint-sync`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/config` | GET | Get sync config (enabled, intervalMs, peer settings) |
| `/config` | PUT | Update sync config |
| `/status` | GET | All entity sync statuses (hubOnline, dataStale, lastSyncTime) |
| `/status/{entityType}` | GET | Single entity status |
| `/sync/{entityType}` | POST | Manual sync one type (bypasses interval) |
| `/sync-all` | POST | Manual sync all registered types |
| `/entity-types` | GET | List registered entity type names |

### SharePointSyncStatus DTO

```json
{
  "entityType": "WorkRequest",
  "lastSyncTimeMs": 1708000000000,
  "lastSyncTimeFormatted": "2m ago",
  "syncEnabled": true,
  "hubOnline": true,
  "dataStale": false,
  "lastResult": { "created": 0, "updated": 2, "autoClosed": 0, "skipped": 15, "failed": 0 }
}
```

`dataStale` is true when hub is offline AND last sync time exceeds 3x the configured interval.

## Legacy Sync Services

`WorkRequestSyncService.syncFromSharePoint()` and `JhaSyncService.syncFromSharePoint()` are kept for backward compatibility but are no longer scheduled. Their `@Scheduled` methods and per-entity sync settings have been removed. New code should use `SharePointSyncOrchestrator.syncEntityType()`.

## Dedup Merge Template

`SharePointMergeTemplate<E>` provides the generic dedup pattern:

1. Native SQL: find natural key groups with count > 1
2. JPQL: load entities for each group, ordered by ID ASC
3. Keep first (lowest ID = canonical, deterministic across all clients)
4. Call `transferRelationships()` hook (override for entities with FKs)
5. Soft-delete duplicate via JPA (fires `FieldChangeEntityListener` for sync)

### WorkRequest FK Transfers

| FK | Transfer method |
|----|----------------|
| `daily_permit_package_id` | Native SQL update (unmapped field on WR side) |
| `jha.work_request_id` | Native SQL update |
| `email_correspondence.entity_id` | Native SQL update + linkedSharepointId backfill |
| `permit_attachment.entity_id` | Native SQL update |

### JHA Merge

No FK transfers needed (leaf entity). Just soft-deletes duplicates.
