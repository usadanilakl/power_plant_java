# Functionality

Real-time synchronization of entity field changes across multiple client machines via a central sync server.

1. When a user modifies any entity field on one machine, the change propagates to all other connected machines within seconds.
2. Conflict resolution uses Last-Writer-Wins (LWW) per field — the most recent timestamp wins, with machine ID as tiebreaker.
3. All sync scenarios (real-time, reconnection, partial) converge on the same code path: `FieldSyncService.applyIncomingChanges()`.

Acceptance Criteria:
1. User edits an entity on Machine A — the change appears on Machine B within seconds.
2. Two users edit different fields on the same entity simultaneously — both changes are preserved.
3. Two users edit the same field simultaneously — LWW resolves the conflict, both machines converge to the same value.
4. Client goes offline, makes changes, comes back online — accumulated changes sync bidirectionally on SSE reconnect.

# Architecture

High-level data flow:
```
Frontend Change → Backend → Local H2 DB → Sync Server → SSE Broadcast → Other Backends → SSE Broadcast → Other Frontends
```

Changes are detected at the JPA level via `@PreUpdate`/`@PostUpdate` listeners. Each changed field becomes a `FieldChange` record containing the entity type, entity ID, field name, old value, new value, origin machine ID, and timestamp.

The sync server stores all FieldChange records and broadcasts them to connected clients via SSE. Each client tracks which changes have been synced per machine using a `|MACHINE_ID|` delimiter format in `syncedToMachines`.

Entity processing follows a strict dependency order (SYNC_ORDER) to ensure referenced entities exist before dependents:
```
Category → Value → User → FileObject → Equipment → LotoPoint → Loto → LotoStandard →
LotoSnapshot → LotoBox → Lock → ZeroEnergy → HeatTrace → Highlight → ElectricalPanel →
EqBreaker → HtPanel → HtBreaker → EspDevice → LedStrip → SafeWork → HotWork →
ConfinedSpace → WorkRequest → DailyPermitPackage
```

Key design patterns:
- **SyncContext thread-local flag** prevents infinite loops — incoming changes don't generate outgoing FieldChange records.
- **Three-pass processing** — Pass 1: simple fields in SYNC_ORDER, Pass 2: ManyToMany (after all entities exist), Pass 3: retry failed ManyToOne references (re-load managed entity + explicit save).
- **Native SQL for ID control** — new entities are created with specific sync IDs via direct INSERT, bypassing the ID generator.
- **Circuit breaker** — CentralSyncService backs off after 5 consecutive failures; resets on SSE connect.
- **Exponential backoff** — SSE reconnect delays: 2s → 4s → 8s → 16s → 32s → 60s max.

# Implementation

## Outgoing change detection

1. User modifies an entity (e.g. Equipment).
2. `@PreUpdate`: `EntityStateCapture` captures original database values before the update.
    [EntityStateCapture](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityStateCapture.java)
3. Entity saved to local H2 database.
4. `@PostUpdate`: `FieldChangeEntityListener.onPostUpdate()` fires.
    [FieldChangeEntityListener](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeEntityListener.java)
5. `FieldChangeTracker.trackEntityUpdate(oldValues, newEntity)` creates a FieldChange record per changed field.
    [FieldChangeTracker](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeTracker.java)

## Outgoing to server

6. `SyncEventPublisher.publishChanges([FieldChange])` emits a Spring event.
    [SyncEventPublisher](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncEventPublisher.java)
7. `CentralSyncService.onChangesDetected()` handles the event.
    [CentralSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/CentralSyncService.java)
8. `sendOutgoingChangesInBatches()` sends changes to the server via `POST /api/sync/exchange` in batches of 500.
9. Server stores changes, resolves conflicts via LWW, broadcasts to other clients via SSE.

## Incoming from server

10. `ServerSseClient` receives SSE event of type `"sync"`.
    [ServerSseClient](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/ServerSseClient.java)
11. `SyncContext.startSync()` sets thread-local flag to prevent re-broadcast.
    [SyncContext](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncContext.java)
12. `FieldSyncService.applyIncomingChanges(changes)` applies changes in three passes.
    [FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java)
13. `entityManager.flush()` persists all changes.
14. `SyncContext.endSync()` clears the flag.
15. `SyncUpdateController.broadcastEntityUpdate()` pushes update to the frontend via SSE.

## SSE reconnection sync

When the SSE connection drops (server offline, network issue, client restart):

16. `ServerSseClient` reconnects with exponential backoff.
17. Server sends `"connected"` event with `pendingChanges` count.
18. `ServerSseClient.onSseConnected()`:
    - Calls `CentralSyncService.resetCircuitBreaker()` (marks server available, resets failure count).
    - Spawns `"sse-reconnect-sync"` thread (1s delay to let SSE stabilize).
19. `CentralSyncService.syncWithServer()`:
    - Phase 1: `sendOutgoingChangesInBatches()` — pushes accumulated local changes.
    - Phase 2: `receiveIncomingChangesInBatches()` — pulls missed remote changes via `GET /api/sync/changes/batch`.

## Core services

| Service | Purpose |
|---------|---------|
| [CentralSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/CentralSyncService.java) | Server sync orchestrator — sends/receives changes in batches, circuit breaker |
| [FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java) | Core engine for applying field changes with LWW conflict resolution (three-pass) |
| [ServerSseClient](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/ServerSseClient.java) | SSE listener + reconnection sync trigger |
| [SyncEventPublisher](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncEventPublisher.java) | Publishes sync events to trigger processing |
| [SyncContext](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncContext.java) | Thread-local flag to prevent infinite sync loops |
| [FieldChangeEntityListener](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeEntityListener.java) | JPA @PreUpdate/@PostUpdate hooks to capture changes |
| [FieldChangeTracker](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeTracker.java) | Persists FieldChange records to database |
| [EntityStateCapture](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityStateCapture.java) | Captures original field values before updates |
| [EntityTableRegistry](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java) | Entity-to-table mapping and dependency order (SYNC_ORDER) |
| [ServiceFacade](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java) | Maps entity type names to SyncableService implementations (22+ types) |
| [SyncHealthChecker](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncHealthChecker.java) | Monitors sync health and connectivity |

## Server REST endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sync/exchange` | POST | Bidirectional sync: push changes + get pending |
| `/api/sync/changes/batch` | GET | Paginated pull of pending changes |
| `/api/sync/changes/count` | GET | Count of pending changes for client |
| `/api/sync/sse/subscribe` | GET | SSE stream with pending count in connected event |
| `/api/sync/register` | POST | Client registration |
| `/api/sync/health` | GET | Server health with storage status |
| `/api/sync/health-stats` | GET | Entity counts for sync health comparison |

## Configuration

### Client (application.properties)
```properties
sync.server.enabled=true
sync.server.url=http://sync-server:8090
sync.machine.id=MACHINE-A              # Auto-generated if not set, persisted in machine-id.properties
sync.interval.seconds=30               # Periodic sync fallback interval
sync.retention.days=30                  # Local FieldChange retention
```

### Sync Server (application.properties)
```properties
server.port=8090
sync.retention.days=90                  # FieldChange retention
sync.cleanup.cron=0 0 3 * * ?          # Cleanup schedule (3 AM daily)
sync.batch.size=500                     # Default batch size
sync.compaction.enabled=true            # Keep only latest change per field
```

## Sync server services

| Service | Purpose |
|---------|---------|
| SyncController | REST endpoints: `/api/sync/exchange`, `/changes/batch`, `/partial-sync/changes` |
| SseController | SSE subscribe endpoint, registers client + reports pending count |
| SyncService | Core sync logic: deduplication, LWW conflict resolution, broadcasting |
| SseEmitterService | Manages SSE connections (5-min timeout, 30s heartbeat), broadcasts to all clients except origin |
| ServerEntitySyncService | Applies changes to mirror entity tables on server |
| ClientInfo entity | Tracks machineId, lastSeen, lastSyncTime, status (ONLINE/OFFLINE/SYNCING) |

## File deletion safety

When file-related fields change (fileNumber, fileType, vendor, extension), the sync handler deletes old files at the previous path. Three layers of protection prevent false deletion:

1. **Path comparison** — `deleteOldFilesAfterPathChanges()` compares old and new folder paths before deleting. If paths are identical (e.g., dedup re-points vendor FK to a different Value with the same name), deletion is skipped entirely.

2. **Active FileObject guard** — Before deleting any file, `findActiveOwner(fileNumber, folderPath)` checks whether a non-deleted FileObject still references the file at that path. If the file is owned by an active entity, deletion is skipped and the file is queued for upload to the server instead.
   [FileObjectSyncHandler](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FileObjectSyncHandler.java)

3. **Upload recovery** — FAILED file uploads are reset to PENDING on application startup and periodically every 5 minutes (`recoverFailedUploads()`). This ensures files eventually reach the server even after extended outages.

The `deleteOldFoldersAfterDownload()` method uses selective per-file deletion rather than recursive directory deletion, applying the same `findActiveOwner()` guard to each file individually. Empty directories are cleaned up only after all files have been processed.

## Self-Sustaining E2E Tests

Backend infrastructure for creating real entity graphs, syncing them, and verifying relationships survive the round-trip.

### Backend Components

| Component | Purpose |
|-----------|---------|
| [SyncE2ETestService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncE2ETestService.java) | Seeds entity graphs (Categories → Values → Equipment → LotoPoints → LotoStandards), verifies, cleans up |
| [SyncE2ETestController](../../../src/main/java/com/dk_power/power_plant_java/controller/sync/SyncE2ETestController.java) | REST endpoints: `/api/sync-e2e/seed`, `/seed/dedup`, `/seed/bulk`, `/verify/{prefix}`, `/cleanup/{prefix}` |

### Seed Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/sync-e2e/seed` | Create full entity graph with all relationship types |
| POST | `/api/sync-e2e/seed/dedup` | Create duplicate Categories/Values for dedup testing |
| POST | `/api/sync-e2e/seed/bulk?count=N` | Bulk-create N LotoStandards with relationships |
| GET | `/api/sync-e2e/verify/{prefix}` | Return all entities + relationships for a test prefix |
| DELETE | `/api/sync-e2e/cleanup/{prefix}` | Soft-delete all entities by prefix |
| DELETE | `/api/sync-e2e/cleanup/all` | Clean up all `SYNC_E2E_*` entities |

### How Seeding Works

1. All entity names prefixed with test prefix (e.g., `SYNC_E2E_1738700000_Valve`) for cleanup isolation
2. Entities created via JPA repositories → `FieldChangeEntityListener` fires automatically → FieldChange records created
3. Cleanup uses soft-delete (`deleted=true`) → triggers sync propagation of deletions
4. `@Where(clause = "deleted=false")` makes deleted entities invisible to the application

### Test Files

| Test file | What it proves |
|-----------|---------------|
| [sync-entity-creation.spec.ts](../../../automation-test/tests/sync/sync-entity-creation.spec.ts) | Real entities sync through full pipeline |
| [sync-relationship-preservation.spec.ts](../../../automation-test/tests/sync/sync-relationship-preservation.spec.ts) | ManyToMany, ManyToOne, JSON fields survive sync |
| [sync-deduplication.spec.ts](../../../automation-test/tests/sync/sync-deduplication.spec.ts) | CategoryValueMergeService works after sync |
| [sync-stress-volume.spec.ts](../../../automation-test/tests/sync/sync-stress-volume.spec.ts) | Volume at 1000+ entities with relationships |
| [sync-stress-concurrency.spec.ts](../../../automation-test/tests/sync/sync-stress-concurrency.spec.ts) | Server handles 100 concurrent clients |

## Known issues (resolved)

**ManyToOne references lost in batch sync** — Equipment reference in ZeroEnergy lost after partial sync. Root cause: entities processed in random HashMap order + Pass 3 operated on detached entities after `entityManager.clear()`. Fix: SYNC_ORDER processing + Pass 3 re-loads managed entity and explicitly saves.

**ID collisions during batch create** — PRIMARY KEY violation when creating multiple entities in same batch. Root cause: old approach used `saveAndFlush()` with auto-generated ID then UPDATE. Fix: direct native SQL INSERT with target ID.

**ServiceFacade missing entity types** — only 7 of 24 types registered, changes for unregistered types silently dropped. Fix: all 22 syncable types registered.

**SSE reconnection did not trigger sync** — `"connected"` event was only logged, no sync triggered. Fix: `onSseConnected()` resets circuit breaker + triggers `syncWithServer()`.

## E2E Tests

All sync E2E tests are located in [automation-test/tests/sync/](../../../automation-test/tests/sync/). Run all: `cd automation-test && npm run test:sync`

### Health Monitoring

Test file: [sync-health.spec.ts](../../../automation-test/tests/sync/sync-health.spec.ts) | Run: `npm run test:sync-health`

| Scenario | Test |
|----------|------|
| Health status fields returned | should return health status with all required fields |
| Field-sync health endpoint | should return field-sync health with machineId |
| Entity counts non-zero | should return non-zero entity counts |
| Forced health check freshness | should return fresh checkTime on forced check |
| IN_SYNC detection | should report IN_SYNC when counts match |
| OUT_OF_SYNC detection | should detect status change after adding server-only test data |
| Metrics structure | should return metrics with sync information |

### Entity Sync Verification

Test file: [entity-sync.spec.ts](../../../automation-test/tests/sync/entity-sync.spec.ts) | Run: `npm run test:entity-sync`

| Scenario | Test |
|----------|------|
| Equipment round-trip sync | should sync Equipment entities and revert |
| LotoPoint round-trip sync | should sync LotoPoint entities and revert |
| FileObject round-trip sync | should sync FileObject entities and revert |
| All entity types combined | should sync all entity types together and revert |
| Custom entity+field | should sync specific entity type and field |
| Client-server count match | should have matching counts between client and server |

### Bulk Sync Performance

Test file: [bulk-sync.spec.ts](../../../automation-test/tests/sync/bulk-sync.spec.ts) | Run: `npm run test:bulk-sync`

| Scenario | Test |
|----------|------|
| BULK_CREATE generation | should generate BULK_CREATE changes |
| BULK_UPDATE generation | should generate BULK_UPDATE changes |
| MIXED generation | should generate MIXED changes |
| Sync to server | should sync generated data to server |
| Full cycle (generate+sync+verify) | should run full cycle end-to-end |
| Metrics populated | should return test metrics |
| Cleanup | should clear all synthetic test data |
| Performance threshold | should sync 100 changes within performance threshold |

### Circuit Breaker and Sync Toggle

Test file: [circuit-breaker.spec.ts](../../../automation-test/tests/sync/circuit-breaker.spec.ts) | Run: `npm run test:circuit-breaker`

| Scenario | Test |
|----------|------|
| Healthy metrics | should report healthy metrics with no consecutive failures |
| SSE connected | should show SSE connected in status |
| Circuit breaker reset | should reset circuit breaker via API |
| Disable sync toggle | should disable sync via toggle |
| Re-enable sync toggle | should re-enable sync via toggle |
| Sync after re-enable | should sync successfully after re-enable |

### Two-Client Sync (optional)

Test file: [two-client-sync.spec.ts](../../../automation-test/tests/sync/two-client-sync.spec.ts) | Requires `SECOND_CLIENT_URL` env var

| Scenario | Test |
|----------|------|
| A→B propagation | should propagate Equipment change from client A to client B |
| Both synced | should show both clients as synced after changes |
