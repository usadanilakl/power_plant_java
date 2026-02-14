# Functionality

Recovery of missed changes from a specific date forward, without replacing the entire database. Uses the same code path as real-time sync (`FieldSyncService.applyIncomingChanges()`).

1. Fetches all FieldChange records since a given date from the sync server.
2. Applies them using the standard three-pass processing (same as real-time sync).
3. Compares and restores missing files.

Acceptance Criteria:
1. User triggers partial sync from a specific date — all entity changes since that date are applied to the local database.
2. ManyToOne references are preserved (e.g. Equipment reference on ZeroEnergy).
3. Missing files are downloaded from the sync server.

# Architecture

Partial sync is a lighter alternative to full resync (see [full-resync.md](full-resync.md)). Instead of replacing the entire database, it replays FieldChange records since a given date through the same pipeline used by real-time sync (see [field-based-sync.md](field-based-sync.md)).

Use partial sync when:
- Client was offline for a known period and reconnection sync didn't fully recover.
- Specific date range of changes needs to be re-applied.
- Full database replacement is unnecessary.

# Implementation

## Partial sync flow

1. User triggers partial sync with a date (e.g. `"2024-01-15"`).
2. `FullResyncService.performPartialSync(date)` starts the process.
    [FullResyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullResyncService.java)
3. `fetchAndApplyFieldChanges(date)`:
    - Fetches paginated FieldChange records from server: `GET /api/sync/partial-sync/changes?date=2024-01-15&page=0&size=500`.
    - For each page: calls `FieldSyncService.applyIncomingChanges(changes)` — the same code path as real-time sync.
    [FieldSyncService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java)
    - Entities processed in SYNC_ORDER (dependency order).
4. `compareLocalWithServer()` — file comparison via checksums.
5. `downloadFilesFromServer()` — restores missing files.
6. `scheduleExternalRestart()` — application restart.

## Server endpoints used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sync/partial-sync/changes` | GET | Paginated changes since date (params: `date`, `page`, `size`) |
| `/api/sync/partial-sync/available-dates` | GET | Dates with change history available |

## Comparison with other sync types

| Sync Type | Code Path | When to Use |
|-----------|-----------|-------------|
| Real-time | `FieldSyncService.applyIncomingChanges()` | Normal operation, SSE connected |
| SSE reconnection | Same | Client/server comes back online |
| **Partial resync** | **Same** | **Recovery from a specific date** |
| Full resync | Database replacement | Disaster recovery, corruption |

All types except full resync use the same `applyIncomingChanges()` pipeline, ensuring consistent behavior.

## E2E Tests

Test file: [partial-sync.spec.ts](../../../automation-test/tests/sync/partial-sync.spec.ts) | Run: `cd automation-test && npm run test:partial-sync`

| Scenario | Test |
|----------|------|
| Create backdated test data | should create backdated field changes on sync server |
| Multi-date test data | should create test data at multiple dates |
| Clear test data by date | should be able to clear test data for specific date |
| Available dates retrieval | should retrieve available sync dates from client |
| Preview partial sync | should preview changes for a specific date |
| Full sync flow via API | should sync data from specific date via API |
| Force sync (skip safety) | should handle force sync for large deletions |
| Invalid date handling | should handle invalid date gracefully |
| Server unavailable | should handle sync server unavailable |
| Health check endpoints | should return sync health status / detailed check / force check |
| Complete E2E verification | complete partial sync verification flow |
