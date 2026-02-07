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
| `/api/resync/auto-resync/config` | GET | Get full auto-resync configuration (config enabled, runtime enabled, effective state) |
| `/api/resync/auto-resync/toggle` | POST | Toggle auto-resync at runtime (param: `enabled=true/false`) |

## Frontend

### Sync Indicator Popover

The sync indicator popover ([sync-indicator.component.ts](../../../frontend/src/app/shared/sync-indicator/sync-indicator.component.ts)) shows three auto-resync states:
- **In progress**: spinning sync icon with "Auto-resync in progress (attempt N of 5)..."
- **Exhausted**: warning with "Full Resync" and "Retry Auto" action buttons
- **Pending**: "Auto-resync will attempt from {date}" (before first trigger)

### Sync & Recovery Page

The Sync & Recovery page ([sync-resync.component.ts](../../../frontend/src/app/features/sync-resync/sync-resync.component.ts)) includes an **Auto-Resync Configuration** card with:
- **Enable/Disable toggle**: Button to enable or disable auto-resync at runtime
- **Current state display**: Shows escalation level, last attempt time, success/failure, and messages
- **Config disabled warning**: Shows when `sync.auto-resync.enabled=false` in config
- **Reset button**: Resets auto-resync state to retry after exhaustion

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `sync.auto-resync.enabled` | `true` | Enable/disable automatic resync (config-level, requires restart) |

### Runtime Toggle

Auto-resync can be enabled/disabled at runtime without restarting the application:

1. **From the UI**: Navigate to Sync & Recovery page → Auto-Resync card → click Enable/Disable button
2. **Via API**: `POST /api/resync/auto-resync/toggle?enabled=false`

The effective state is determined by both the config setting AND the runtime toggle:
- `effectivelyEnabled = autoResyncConfigEnabled && autoResyncRuntimeEnabled`

If the config property is set to `false`, the runtime toggle has no effect (auto-resync is disabled).

The runtime state does **not** persist across application restarts — it resets to match the config value.

## Related fix: Category/Value deduplication sync

The deduplication service ([CategoryValueMergeService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/CategoryValueMergeService.java)) soft-deletes duplicate entities via JPA merge (not native SQL) so that the `FieldChangeEntityListener` fires and creates `FieldChange` records. This ensures soft-deletes are synced to other machines, preventing permanent count mismatches.

## E2E Tests

Test file: [auto-resync.spec.ts](../../../automation-test/tests/sync/auto-resync.spec.ts) | Run: `cd automation-test && npm run test:auto-resync`

| Scenario | Test |
|----------|------|
| State retrieval | should return auto-resync state |
| State reset | should reset auto-resync state |
| OUT_OF_SYNC tracking | should track consecutive out-of-sync checks |
| IN_SYNC recovery | should recover when sync state is restored |
