# Sync Flow: Bulk Create (Count 10)

## Complete Flow Trace

### Phase 1: Frontend - User Action

  [1] sync-testing.component.html:91-104
      User selects "BULK_CREATE", count=10, clicks "Generate Test Data"

  [2] sync-testing.component.ts:126-134
      generateTestData() → calls service

  [3] sync-test.service.ts:59-64
      generateTestData() → HTTP POST /api/sync-test/generate?count=10&testType=BULK_CREATE


### Phase 2: Backend - Generate Changes

  [4] SyncTestController.java:35-42
      generateTestData() endpoint receives request

  [5] SyncTestService.java:76-121
      generateBulkTestData() → creates 10 FieldChange records, saves to DB


### Phase 3: Event Publishing & Sync to Server

  [6] SyncEventPublisher.java:28-37
      publishChanges() → publishes ChangesDetectedEvent

  [7] CentralSyncService.java:107-142
      onChangesDetected() listener (async) → schedules sync

  [8] CentralSyncService.java:238-268
      sendOutgoingChangesInBatches() → POST to /api/sync/exchange


### Phase 4: Sync Server Processes

  [9] SyncController.java:31-52
      /api/sync/exchange receives 10 changes

  [10] SyncService.java:131-198
       processIncomingChangesBatched() → dedup, LWW conflict resolution, save

  [11] SyncService.java:303-312
       broadcastChangesInBatches() → trigger SSE broadcast


### Phase 5: SSE Broadcast to Other Clients

  [12] SseEmitterService.java:85-120
       broadcastChanges() → sends SSE "sync" event to all connected clients EXCEPT origin


### Phase 6: Other Clients Receive

  [13] ServerSseClient.java:255-296
       handleSyncEvent() → parses SSE, skips if from self

  [14] ServerSseClient.java:284-291
       Sets syncContext.startSync() → applies changes → syncContext.endSync()


================================================================================

## Key Loop Prevention Mechanisms

  1. Origin exclusion in SSE broadcast (SseEmitterService.java:95-96)
     Skip the machine that sent the changes

  2. SyncContext flag (ServerSseClient.java:284)
     When receiving changes, syncContext.isSyncing() is true,
     so SyncEventPublisher won't re-publish them


================================================================================

## Visual Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT A (Origin)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [1] User clicks "Generate Test Data" (count=10, BULK_CREATE)                │
│       ↓                                                                       │
│  [2] sync-testing.component.ts → generateTestData()                          │
│       ↓                                                                       │
│  [3] sync-test.service.ts → HTTP POST /api/sync-test/generate                │
│       ↓                                                                       │
│  [4] SyncTestController → generateTestData()                                 │
│       ↓                                                                       │
│  [5] SyncTestService → generateBulkTestData() → saves 10 FieldChange         │
│       ↓                                                                       │
│  [6] SyncEventPublisher → publishChanges() → ChangesDetectedEvent            │
│       ↓                                                                       │
│  [7] CentralSyncService → onChangesDetected() [async listener]               │
│       ↓                                                                       │
│  [8] CentralSyncService → sendOutgoingChangesInBatches()                     │
│       ↓                                                                       │
│  POST /api/sync/exchange (with X-Machine-Id header)                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SYNC SERVER                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  [9] SyncController → syncExchange() receives 10 changes                     │
│       ↓                                                                       │
│ [10] SyncService → processIncomingChangesBatched()                           │
│       • Deduplication (checks change keys)                                   │
│       • Last-Write-Wins conflict resolution                                  │
│       • Save to database                                                     │
│       ↓                                                                       │
│ [11] SyncService → broadcastChangesInBatches()                               │
│       ↓                                                                       │
│ [12] SseEmitterService → broadcastChanges()                                  │
│       • Skip origin machine (Client A)                                       │
│       • Send SSE "sync" event to all other connected clients                 │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT B, C, D... (Receivers)                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [13] ServerSseClient → handleSyncEvent()                                         │
│       • Parse SSE data                                                           │
│       • Check originMachineId != myMachineId (additional safety)                 │
│       ↓                                                                           │
│ [14] syncContext.startSync() ← prevents re-broadcast                             │
│       ↓                                                                           │
│ [15] fieldSyncService.applyIncomingChanges() → apply 10 changes to local DB      │
│       ↓                                                                           │
│ [16] syncContext.endSync()                                                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

================================================================================

## File Locations

### Frontend (power_plant_java)
  - frontend/src/app/features/sync-testing/sync-testing.component.ts
  - frontend/src/app/features/sync-testing/sync-testing.component.html
  - frontend/src/app/services/sync-test.service.ts
  - frontend/src/app/services/sync/sync-update.service.ts

### Backend (power_plant_java)
  - src/main/java/com/dk_power/power_plant_java/controller/sync/SyncTestController.java
  - src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncTestService.java
  - src/main/java/com/dk_power/power_plant_java/sevice/sync/CentralSyncService.java
  - src/main/java/com/dk_power/power_plant_java/sevice/sync/ServerSseClient.java
  - src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncEventPublisher.java

### Sync Server (sync-server)
  - src/main/java/com/dk_power/sync_server/controller/SyncController.java
  - src/main/java/com/dk_power/sync_server/service/SyncService.java
  - src/main/java/com/dk_power/sync_server/service/SseEmitterService.java
