# Functionality

Automatic partial resync triggered by the background health checker when a client is detected to be out of sync. Uses an escalation strategy — each failed attempt goes further back in time. Runs fully in the background without user interaction.

Acceptance Criteria:
1. When `SyncHealthChecker` detects OUT_OF_SYNC or POSSIBLY_OUT_OF_SYNC for 2+ consecutive checks, an automatic partial resync is triggered.
2. If the first attempt doesn't resolve the mismatch, the system escalates by going further back in time.
3. After 5 escalation levels (up to 14 days back), the system stops and recommends a full resync to the user.
4. Small entity differences with no file differences (likely deduplication drift) stop escalation early.
5. The frontend sync indicator shows auto-resync progress, exhaustion state, and action buttons.
6. Auto-resync state persists across application restarts.

# Architecture

Auto-resync sits between the health checker and the existing partial resync mechanism:

```
SyncHealthChecker (every 5 min)
    │
    ├── Detects OUT_OF_SYNC / POSSIBLY_OUT_OF_SYNC
    │
    ▼
AutoResyncService.evaluateAndTrigger()
    │
    ├── Guards: enabled? server reachable? not already running? consecutive count >= 2? not exhausted?
    │
    ▼
FullResyncService.performPartialSync(date)   ← same code path as manual partial resync
    │
    ▼
Re-check health → IN_SYNC? reset : escalate
```

## Escalation schedule

| Level | Date to sync from | Description |
|-------|------------------|-------------|
| 0 | `suggestedSyncDate` (last known good sync), fallback: 1 day ago | Most recent recovery point |
| 1 | 1 day ago | Yesterday |
| 2 | 3 days ago | Short-term recovery |
| 3 | 7 days ago | Week-long recovery |
| 4 | 14 days ago | Two-week recovery |
| Exhausted | — | Stop, recommend full resync |

## Dedup drift detection

If entity difference <= 5 and file difference == 0 at escalation level >= 2, the system stops escalating. This pattern indicates Category/Value deduplication drift (soft-deletes producing slightly different change histories) rather than genuinely missing data. The system marks itself as exhausted with a descriptive message.

# Implementation

## Core service

[AutoResyncService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/AutoResyncService.java)

Key methods:
- `evaluateAndTrigger(SyncHealthResult)` — called after each health check. Applies guard conditions, determines sync date, triggers async resync.
- `executeAutoResync(String date, int level)` — `@Async`. Runs partial resync, waits 5s, re-checks health. Escalates or resets.
- `resetState()` — clears escalation state (called by user via frontend).

State is persisted to `auto-resync-state.json` in the project root directory.

## Integration with SyncHealthChecker

[SyncHealthChecker.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/SyncHealthChecker.java)

After each health check result is computed, `autoResyncService.evaluateAndTrigger(result)` is called. The auto-resync state is also attached to `SyncHealthResult` so the frontend can display it.

## REST endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/auto-resync/state` | GET | Get current auto-resync state (escalation level, last attempt, etc.) |
| `/api/resync/auto-resync/reset` | POST | Reset auto-resync state (retry after exhaustion) |

## Frontend

The sync indicator popover ([sync-indicator.component.ts](../../../frontend/src/app/shared/sync-indicator/sync-indicator.component.ts)) shows three auto-resync states:
- **In progress**: spinning sync icon with "Auto-resync in progress (attempt N of 5)..."
- **Exhausted**: warning with "Full Resync" and "Retry Auto" action buttons
- **Pending**: "Auto-resync will attempt from {date}" (before first trigger)

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `sync.auto-resync.enabled` | `true` | Enable/disable automatic resync |

## Related fix: Category/Value deduplication sync

The deduplication service ([CategoryValueMergeService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/CategoryValueMergeService.java)) soft-deletes duplicate entities via JPA merge (not native SQL) so that the `FieldChangeEntityListener` fires and creates `FieldChange` records. This ensures soft-deletes are synced to other machines, preventing permanent count mismatches.
