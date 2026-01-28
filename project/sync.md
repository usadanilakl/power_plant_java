# Power Plant Java - Sync Architecture

## Overview

This document describes the synchronization system for the Power Plant Java application, including field-based entity sync, file sync, full resync, partial resync, and reconnection handling.

## Base Paths
- **Frontend:** `C:\Users\usada\my_projects\power_plant_java\frontend` (or `/home/dk-power/IdeaProjects/power_plant_java/frontend`)
- **Backend:** `C:\Users\usada\my_projects\power_plant_java\src` (or `/home/dk-power/IdeaProjects/power_plant_java/src`)
- **Sync Server:** `C:\Users\usada\my_projects\sync-server` (or `/home/dk-power/IdeaProjects/sync-server`)

---

## High-Level Data Flow

```
Frontend Change → Backend → Local H2 DB → Sync Server → SSE Broadcast → Other Backends → SSE Broadcast → Other Frontends
```

---

## Supported Scenarios

| # | Scenario | Mechanism | Status |
|---|----------|-----------|--------|
| 1 | Real-time sync (clients + server online) | SSE push → `FieldSyncService.applyIncomingChanges()` | WORKING |
| 2 | Client comes online after being offline | SSE reconnect → `onSseConnected()` → `CentralSyncService.syncWithServer()` | FIXED |
| 3 | Server was offline, comes back online | Same as #2 — each client reconnects SSE, triggers sync | FIXED |
| 4 | Client requests partial resync from date | `FullResyncService.performPartialSync()` → `FieldSyncService.applyIncomingChanges()` | FIXED |
| 5 | Full disaster recovery | `FullResyncService.performFullResync()` → database replacement | WORKING |

All scenarios (except full resync) converge on the same code path: `FieldSyncService.applyIncomingChanges()`.

---

## Sync Types

### 1. Field-Based Entity Sync (Real-Time) - WORKING
**Code Path:** `FieldChangeEntityListener` → `FieldChangeTracker` → `SyncEventPublisher` → `CentralSyncService` → Server → `ServerSseClient` → `FieldSyncService.applyIncomingChanges()`

Changes to local H2 entities are detected at the JPA level and recorded as `FieldChange` records. These are submitted to the sync server, which broadcasts them to all connected clients via SSE.

### 2. File Sync - WORKING
**Code Path:** `FileObjectSyncHandler.onLocalFileObjectChanged()` → `queueFileUpload()` → Server → `handleFileUploadEvent()` → `queueFileDownload()`

Files saved locally are uploaded to the sync server per `FileObject` item. Changes are broadcast to other clients, which download the files to update their local file system.

**Path-Affecting Fields:** When `vendor`, `fileType`, or `fileNumber` change, files are moved to the new location and old folders are cleaned up.

### 3. SSE Reconnection Sync - FIXED
**Code Path:** `ServerSseClient.onSseConnected()` → `CentralSyncService.resetCircuitBreaker()` → `CentralSyncService.syncWithServer()` → `sendOutgoingChangesInBatches()` + `receiveIncomingChangesInBatches()` → `FieldSyncService.applyIncomingChanges()`

When the SSE connection is (re)established, the client immediately triggers a full bidirectional sync. This handles three scenarios:
- Client was offline and comes back online
- Server was offline and comes back online
- Network interruption recovered

The sync pushes accumulated local changes to the server AND pulls all missed remote changes.

### 4. Partial Sync (Recovery from Date) - FIXED
**Code Path:** `FullResyncService.performPartialSync()` → `fetchAndApplyFieldChanges()` → `FieldSyncService.applyIncomingChanges()`

Fetches `FieldChange` records since a specific date and applies them using the same code path as real-time sync.

### 5. Full Resync (Disaster Recovery) - DIFFERENT CODE PATH
**Code Path:** `FullResyncService.performFullResync()` → Downloads H2 backup → Replaces database

Replaces the entire local database with a backup from the sync server or shared drive. Used for disaster recovery.

---

## Core Services

### Configuration
- [SyncConfig.java](src/main/java/com/dk_power/power_plant_java/config/SyncConfig.java) - Main sync configuration (server URL, machine ID, etc.)
- [FileSyncConfig.java](src/main/java/com/dk_power/power_plant_java/config/FileSyncConfig.java) - File sync configuration

### Client Sync Services
All sync services are in: [/src/main/java/com/dk_power/power_plant_java/sevice/sync/](src/main/java/com/dk_power/power_plant_java/sevice/sync/)

| Service | Responsibility |
|---------|----------------|
| **CentralSyncService** | Server sync orchestrator - sends/receives changes in batches, circuit breaker |
| **FieldSyncService** | Core engine for applying field changes with LWW conflict resolution (three-pass) |
| **FullResyncService** | Full and partial resync for disaster recovery |
| **FileObjectSyncHandler** | Physical file upload/download queue management |
| **ServerSseClient** | SSE listener + reconnection sync trigger |
| **SyncEventPublisher** | Publishes sync events to trigger processing |
| **SyncContext** | Thread-local flag to prevent infinite sync loops |
| **FieldChangeEntityListener** | JPA @PreUpdate/@PostUpdate hooks to capture changes |
| **FieldChangeTracker** | Persists FieldChange records to database |
| **EntityStateCapture** | Captures original field values before updates |
| **EntityTableRegistry** | Entity-to-table mapping and dependency order (SYNC_ORDER) |
| **SyncHealthChecker** | Monitors sync health and connectivity |
| **ServiceFacade** | Maps entity type names to SyncableService implementations (22 types) |

### Server Sync Services
All server services are in: `/home/dk-power/IdeaProjects/sync-server/src/main/java/com/dk_power/sync_server/`

| Service/Controller | Responsibility |
|--------------------|----------------|
| **SyncController** | REST endpoints: `/api/sync/exchange`, `/changes/batch`, `/partial-sync/changes` |
| **SseController** | SSE subscribe endpoint, registers client + reports pending count |
| **SyncService** | Core sync logic: deduplication, LWW conflict resolution, broadcasting |
| **SseEmitterService** | Manages SSE connections, broadcasts changes to connected clients |
| **ServerEntitySyncService** | Applies changes to mirror entity tables on server |
| **FullResyncController** | Database backup/export endpoints for full resync |
| **FileController** | File upload/download endpoints |

---

## Detailed Sync Flows

### Real-Time Sync Flow (Scenario 1)

```
1. LOCAL CHANGE DETECTION
   User modifies Equipment entity
   ↓
   @PreUpdate: EntityStateCapture captures original database values
   ↓
   Entity saved to H2 database
   ↓
   @PostUpdate: FieldChangeEntityListener.onPostUpdate()
   ↓
   FieldChangeTracker.trackEntityUpdate(oldValues, newEntity)
   ↓
   FieldChange record created:
     - entityType="Equipment", entityId=123
     - fieldName="name", oldValue="Old", newValue="New"
     - originMachineId="MACHINE-A"
     - timestamp=NOW

2. OUTGOING TO SERVER
   SyncEventPublisher.publishChanges([FieldChange])
   ↓
   CentralSyncService.onChangesDetected() [event listener]
   ↓
   sendOutgoingChangesInBatches() → POST /api/sync/exchange
   ↓
   Server stores changes and broadcasts via SSE

3. INCOMING TO OTHER CLIENTS
   ServerSseClient receives SSE event: "sync"
   ↓
   handleSyncEvent(data)
   ↓
   SyncContext.startSync() ← CRITICAL: prevents re-broadcast
   ↓
   FieldSyncService.applyIncomingChanges(changes)
   ↓
   Three-pass application:
     Pass 1: Non-ManyToMany changes in SYNC_ORDER (dependency order)
     Pass 2: ManyToMany changes (after all entities exist)
     Pass 3: Retry failed ManyToOne references (re-load managed entity + save)
   ↓
   entityManager.flush()
   ↓
   SyncContext.endSync()
   ↓
   TransactionSynchronization.afterCommit()
   ↓
   SyncUpdateController.broadcastEntityUpdate() → Frontend SSE
```

### SSE Reconnection Sync Flow (Scenarios 2 & 3)

```
Client SSE connection drops (server offline, network issue, client restart)
↓
ServerSseClient reconnects with exponential backoff (2s → 4s → 8s → ... → 60s max)
↓
Server receives SSE subscribe request:
  - SseController registers client (updates lastSeen)
  - Queries pending change count for this client
  - Creates SSE emitter, sends "connected" event with pendingChanges count
↓
Client receives "connected" event
↓
ServerSseClient.onSseConnected():
  1. CentralSyncService.resetCircuitBreaker()  ← marks server available, resets failure count
  2. Spawns "sse-reconnect-sync" thread (1s delay to let SSE stabilize)
↓
CentralSyncService.syncWithServer():
  Phase 1: sendOutgoingChangesInBatches()
    - Queries local FieldChange records not synced to SERVER
    - Sends in batches of 500 via POST /api/sync/exchange
    - Server stores, broadcasts to other SSE clients
  Phase 2: receiveIncomingChangesInBatches()
    - Gets pending count from server: GET /api/sync/changes/count
    - Fetches in batches: GET /api/sync/changes/batch?page=X&size=500
    - Each batch → SyncContext.startSync() → FieldSyncService.applyIncomingChanges()
↓
All missed changes applied, local changes pushed to server
```

### File Sync Flow

```
1. LOCAL FILE UPLOAD
   User uploads file for FileObject #100
   ↓
   File stored at: uploads/pdf/{FileType}/{Vendor}/{FILE-NUMBER}.pdf
   ↓
   FileObject.storedFileLink updated
   ↓
   FieldChange recorded for FileObject
   ↓
   FileObjectSyncHandler.onLocalFileObjectChanged()
   ↓
   queueFileUpload() creates PendingFileSync task
   ↓
   processUploadQueue() (every 5 seconds)
   ↓
   uploadFilesToServer() → POST /api/files/upload
   ↓
   Server broadcasts file_upload SSE event

2. REMOTE FILE DOWNLOAD
   ServerSseClient receives file_upload event
   ↓
   FileObjectSyncHandler.handleFileUploadEvent()
   ↓
   queueFileDownload() creates PendingFileSync task
   ↓
   processDownloadQueue() (every 5 seconds)
   ↓
   downloadFilesFromServer() with SHA-256 verification
   ↓
   deleteOldFoldersAfterDownload() if path changed
```

### Partial Sync Flow (Scenario 4)

```
FullResyncService.performPartialSync("2024-01-15")
↓
fetchAndApplyFieldChanges("2024-01-15"):
   GET /api/sync/partial-sync/changes?date=2024-01-15&page=0&size=500
   ↓
   For each page of FieldChange records:
     FieldSyncService.applyIncomingChanges(changes)
     ← SAME code path as real-time sync
   ↓
   Entities processed in SYNC_ORDER (dependency order)
↓
compareLocalWithServer() - file comparison
↓
downloadFilesFromServer() - restore missing files
↓
scheduleExternalRestart()
```

### Full Resync Flow (Scenario 5 - Replaces Database)

```
FullResyncService.performFullResync()
↓
GET /api/resync/database/h2-backup
↓
h2BackupService.restoreFromBytes(backupData)
↓
DATABASE REPLACED ENTIRELY
↓
compareLocalWithServer() - file comparison
↓
downloadFilesFromServer()
↓
scheduleExternalRestart()
```

---

## Key Design Patterns

1. **Last-Writer-Wins (LWW)** - Per-field timestamp determines which value wins; machine ID as tiebreaker
2. **SyncContext Thread-Local** - Prevents infinite sync loops (incoming changes don't generate outgoing FieldChange records)
3. **SYNC_ORDER Dependency Resolution** - Processes entities in order: Category → Value → FileObject → Equipment → LotoPoint → etc.
4. **Three-Pass Processing** - Pass 1: Simple fields in SYNC_ORDER, Pass 2: ManyToMany, Pass 3: Retry failed ManyToOne (re-load managed + save)
5. **Native SQL for ID Control** - Creates entities with specific sync IDs via direct INSERT, bypassing ID generator
6. **Circuit Breaker** - CentralSyncService backs off after 5 consecutive failures; reset on SSE connect
7. **Exponential Backoff** - SSE reconnect delays: 2s → 4s → 8s → 16s → 32s → 60s max
8. **SSE Reconnection Sync** - Every SSE connect triggers full bidirectional sync to catch up on missed changes
9. **Per-Client Change Tracking** - Server tracks `syncedToMachines` per FieldChange using `|MACHINE_ID|` delimiter format
10. **Batched Processing** - All sync operations use pagination (default 500 per batch) to prevent memory issues

---

## Server Architecture

### Change Storage
- **FieldChange** entity stored in H2 (dev) or PostgreSQL (prod)
- Retention: 90 days (configurable), cleanup at 3 AM daily
- Indexed on: entityType+entityId, timestamp, originMachineId, entityType+entityId+fieldName

### Client Tracking
- **ClientInfo** entity tracks: machineId, machineName, lastSeen, lastSyncTime, status (ONLINE/OFFLINE/SYNCING)
- Inactive clients marked OFFLINE after 5 minutes
- Updated on SSE subscribe, sync exchange, and register

### SSE Broadcasting
- 5-minute timeout per connection; 30-second heartbeat
- Changes broadcast to all connected clients EXCEPT the origin machine
- SSE broadcast does NOT mark changes as synced — only exchange/batch endpoints do
- This ensures clients that miss SSE broadcasts still get changes on next sync

### Server REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sync/exchange` | POST | Bidirectional sync: push changes + get pending |
| `/api/sync/changes/batch` | GET | Paginated pull of pending changes |
| `/api/sync/changes/count` | GET | Count of pending changes for client |
| `/api/sync/sse/subscribe` | GET | SSE stream with pending count in connected event |
| `/api/sync/register` | POST | Client registration |
| `/api/sync/partial-sync/changes` | GET | Paginated changes since date |
| `/api/sync/partial-sync/available-dates` | GET | Dates with change history |
| `/api/sync/health` | GET | Server health with storage status |
| `/api/sync/health-stats` | GET | Entity counts for sync health comparison |
| `/api/resync/database/h2-backup` | GET | Full database backup for disaster recovery |
| `/api/files/upload` | POST | File upload |

---

## Known Issues & Fixes

### Issue 1: Inconsistent Code Paths (VERIFIED - Already Unified)
Investigation revealed ALL sync paths already use `FieldSyncService.applyIncomingChanges()`:

| Sync Type | Entry Point | Applies Changes Via | Status |
|-----------|-------------|---------------------|--------|
| Real-time SSE | `ServerSseClient.handleSyncEvent()` | `FieldSyncService.applyIncomingChanges()` | WORKS |
| SSE Reconnect | `ServerSseClient.onSseConnected()` → `CentralSyncService.syncWithServer()` | `FieldSyncService.applyIncomingChanges()` | FIXED |
| Client Reconnect | `CentralSyncService.receiveIncomingChangesInBatches()` | `FieldSyncService.applyIncomingChanges()` | Same path |
| Partial Sync | `FullResyncService.fetchAndApplyFieldChanges()` | `FieldSyncService.applyIncomingChanges()` | Same path |
| Full Resync | `FullResyncService.performFullResync()` | Database replacement | Intentionally different |

**The architecture IS correct.** The bugs were in specific implementation details, not the overall design.

### Issue 2: ManyToOne References Lost in Batch Sync (FIXED)
**Symptom:** Equipment reference in ZeroEnergy entity is lost after partial sync or client reconnect.

**Root Cause (Multi-Layered):**

**2a. Processing order (FIXED):** Entities were processed in HashMap order (random). Equipment might not exist when ZeroEnergy references it.

**Fix:** Changed `applyIncomingChangesInternal()` to process entities in `SYNC_ORDER` from `EntityTableRegistry`.

**2b. Pass 3 detached entities (FIXED):** When ManyToOne references fail in Pass 1, entities are stored for retry in Pass 3. But `createEntityFromSync()` calls `entityManager.clear()` which DETACHES those stored entities. Pass 3 then modified the detached entities via reflection but never called `save()` — the changes were lost silently.

**Fix:** Pass 3 now re-loads entities from the database to get a managed instance, sets the reference, and explicitly saves:
```java
// Re-load to get managed instance (original may be detached by entityManager.clear())
BaseIdEntity managedEntity = (BaseIdEntity) service.getEntityById(failedRef.entity.getId());
failedRef.field.set(managedEntity, referencedEntity);
service.save(managedEntity);
```

**Why real-time sync was immune:** Changes arrive one at a time, referenced entities already exist locally, Pass 3 retry is rarely triggered.

**Why batch sync was broken:** Large batches create multiple entities, `entityManager.clear()` detaches previously processed entities, Pass 3 modifications on detached entities were not persisted.

### Issue 3: ID Collisions During Batch Create (FIXED)
**Symptom:** PRIMARY KEY violation when creating multiple entities in same sync batch.

**Root Cause:** Old approach: `saveAndFlush()` with auto-generated ID, then `UPDATE id = targetId`. ID generator wasn't aware of target IDs.

**Fix:** Direct native SQL INSERT with target ID, bypassing ID generator.

### Issue 4: ServiceFacade Missing Entity Types (FIXED)
**Symptom:** Sync changes for most entity types silently fail with "No service found for entity type".

**Root Cause:** ServiceFacade only had 7 of 24 entity types registered. Changes for unregistered types (Loto, LotoBox, Lock, HeatTrace, Highlight, ElectricalPanel, EqBreaker, HtPanel, HtBreaker, User, SafeWork, HotWork, ConfinedSpace, WorkRequest, DailyPermitPackage) were silently dropped.

**Fix:** Added all 22 entity types with SyncableService implementations to ServiceFacade.

**Still not covered (no SyncableService):** LotoSnapshot (no service), Role (no service), EspDevice (custom service), LedStrip (custom service).

### Issue 5: SSE Reconnection Did Not Trigger Sync (FIXED)
**Symptom:** Client comes online after being offline — SSE reconnects but missed changes are never fetched. Server comes online after being offline — clients reconnect SSE but don't push accumulated changes. Equipment not rendering after reconnection.

**Root Cause:** `ServerSseClient.processEvent()` handled the `"connected"` SSE event by only logging it. No sync was triggered. The periodic sync (every 30s) was the only fallback, but `CentralSyncService` circuit breaker (5 failures max) blocked it after the server was unreachable.

**Fix (Client - ServerSseClient.java):**
- Added `onSseConnected()` method called on `"connected"` event
- Resets `CentralSyncService` circuit breaker (server is clearly reachable)
- Triggers `syncWithServer()` on a background thread (pushes local + pulls remote)

**Fix (Client - CentralSyncService.java):**
- `resetCircuitBreaker()` now also sets `serverAvailable = true`

**Fix (Server - SseController.java):**
- SSE subscribe now registers the client (updates lastSeen, marks active)
- Queries pending change count and passes to emitter

**Fix (Server - SseEmitterService.java):**
- `"connected"` event now includes `pendingChanges` count
- Client knows immediately how many changes are waiting

---

## Architecture Analysis

### Unified Sync Path
All sync scenarios (except full resync) converge on `FieldSyncService.applyIncomingChanges()`:
1. **Pass 3 now persists** retried ManyToOne references (re-loads managed entity + explicit save)
2. **ServiceFacade covers 22 entity types** (was 7)
3. **SYNC_ORDER processing** ensures dependencies are created first
4. **SSE reconnection triggers sync** — no more silent missed changes

### Full Resync Exception
Full resync intentionally replaces the entire database for disaster recovery. This is appropriate when:
- Local database is corrupted
- Need to "start fresh" from known good state
- Generating FieldChange records for entire DB would be too slow

---

## Entity Dependency Order (SYNC_ORDER)

From [EntityTableRegistry.java](src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java):

```
Category          // Base: no dependencies
Value             // Depends on: Category
User              // Base
FileObject        // Base
Equipment         // Depends on: FileObject, Value, Category
LotoPoint         // Depends on: FileObject, Equipment, Value
Loto              // Depends on: LotoPoint
LotoStandard      // Depends on: LotoPoint, Loto
LotoSnapshot      // Depends on: Loto
LotoBox           // Depends on: Lock
Lock              // Depends on: LotoBox
ZeroEnergy        // Depends on: LotoPoint, Equipment
HeatTrace         // Depends on: Equipment
Highlight         // Depends on: FileObject
ElectricalPanel   // Depends on: Equipment
EqBreaker         // Depends on: ElectricalPanel
HtPanel           // Depends on: Equipment
HtBreaker         // Depends on: HtPanel
EspDevice         // Depends on: Equipment
LedStrip          // Depends on: EspDevice
SafeWork          // Depends on: Equipment
HotWork           // Depends on: SafeWork
ConfinedSpace     // Depends on: SafeWork
WorkRequest       // Depends on: Equipment
DailyPermitPackage
```

---

## Testing Sync

### Scenario 1: Real-Time Sync
1. Start sync server
2. Start two client instances (MACHINE-A, MACHINE-B)
3. On MACHINE-A: Create Equipment, draw shapes, create LotoPoints
4. On MACHINE-B: Verify changes appear within seconds

### Scenario 2: Client Comes Online Later
1. Stop MACHINE-B
2. On MACHINE-A: Make changes (Equipment, LotoPoint, ZeroEnergy with Equipment reference)
3. Restart MACHINE-B
4. Verify: SSE reconnects, `onSseConnected()` triggers sync
5. Verify: All changes appear on MACHINE-B including ManyToOne references
6. Verify: Equipment renders correctly (not just file loads)

### Scenario 3: Server Was Offline
1. Stop sync server
2. On MACHINE-A: Make changes (stored locally as FieldChange records)
3. On MACHINE-B: Make different changes (stored locally)
4. Restart sync server
5. Verify: Both clients reconnect SSE, push accumulated changes
6. Verify: MACHINE-A receives MACHINE-B's changes and vice versa

### Scenario 4: Partial Resync
1. Stop MACHINE-B
2. On MACHINE-A: Make changes (Equipment, LotoPoint, ZeroEnergy)
3. Restart MACHINE-B
4. Trigger partial sync from yesterday's date
5. Verify all changes including ManyToOne references (Equipment ref in ZeroEnergy)

### Verify File Sync
1. On MACHINE-A: Upload file to FileObject
2. On MACHINE-B: Verify file appears in correct path
3. On MACHINE-A: Change FileObject's vendor
4. On MACHINE-B: Verify file moved to new path

---

## Configuration Reference

### SyncConfig Properties (Client)
```properties
sync.server.enabled=true
sync.server.url=http://sync-server:8090
sync.machine.id=MACHINE-A              # Auto-generated if not set, persisted in machine-id.properties
sync.interval.seconds=30               # Periodic sync fallback interval
sync.retention.days=30                  # Local FieldChange retention
```

### FileSyncConfig Properties (Client)
```properties
files.root.path=uploads
h2.backup.shared.directory=/shared/backups
```

### Sync Server Properties
```properties
server.port=8090
sync.retention.days=90                  # FieldChange retention
sync.cleanup.cron=0 0 3 * * ?          # Cleanup schedule
sync.batch.size=500                     # Default batch size
sync.compaction.enabled=true            # Keep only latest change per field
sync.files.storage-path=./file-storage
sync.files.max-file-size=104857600      # 100MB max
```

---

## Future Improvements

1. **Conflict Logging:** Log when LWW discards a local change
2. **Sync Metrics Dashboard:** Real-time visibility into sync health
3. **Retry Queue Visibility:** UI to see and retry failed operations
4. **Selective Sync:** Sync only specific entity types
5. **Compression:** Compress FieldChange batches for large syncs
6. **SyncableService for remaining types:** Add to EspDevice, LedStrip, LotoSnapshot, Role
