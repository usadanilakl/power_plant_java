# Duplicate Tolerance Architecture

Multi-machine sync inherently creates temporary duplicate entities. This document covers the three layers of defense that prevent duplicates from crashing the system or corrupting data.

## The Problem

Duplicates exist during the window between sync arrival and merge execution:

1. **SharePoint/email polling** — multiple machines independently poll the same external source, each creating entities with the same `sharepointId`/`graphMessageId` but different DB IDs. After sync, both copies exist on every machine.
2. **AdminUserSeeder** — each machine seeds its own admin users on startup. After sync, multiple copies arrive.
3. **NgValueService.createValue()** — creates Categories/Values on-demand. Two machines creating the same Value independently produce duplicates after sync.

Standard Spring Data `findBy*` methods generate `getSingleResult()` under the hood. Even `Optional<T>` return type is NOT safe — it still throws `NonUniqueResultException` when multiple rows match. This crashes the application.

## Layer 1: Duplicate-Tolerant Queries

**Pattern**: Replace every single-return `findBy*` with `findFirstBy*OrderByIdAsc`.

This adds `LIMIT 1` and always returns the **lowest-ID entity** — which is the same entity that merge services keep (canonical = lowest ID). The system is self-consistent even before merge runs.

### Affected Repositories

| Repository | Method | Before | After |
|-----------|--------|--------|-------|
| `UserRepo` | email lookup | `findByEmail(String)` | `findFirstByEmailOrderByIdAsc(String)` |
| `UserRepo` | username lookup | `findByUsername(String)` | `findFirstByUsernameOrderByIdAsc(String)` |
| `UserRepo` | Windows auth | `findByWindowsUsername(String)` | `findFirstByWindowsUsernameOrderByIdAsc(String)` |
| `WorkRequestRepo` | SharePoint link | `findBySharepointId(String)` | `findFirstBySharepointIdOrderByIdAsc(String)` |
| `WorkRequestRepo` | PWA tracking | `findByLocalUuid(String)` | `findFirstByLocalUuidOrderByIdAsc(String)` |
| `JhaRepo` | SharePoint link | `findBySharepointId(String)` | `findFirstBySharepointIdOrderByIdAsc(String)` |
| `JhaRepo` | PWA tracking | `findByLocalUuid(String)` | `findFirstByLocalUuidOrderByIdAsc(String)` |
| `FileRepo` | by name | `findByName(String)` | `findFirstByNameOrderByIdAsc(String)` |
| `FileRepo` | by file number | `findByFileNumber(String)` | `findFirstByFileNumberOrderByIdAsc(String)` |
| `FileRepo` | by file link | `findByFileLink(String)` | `findFirstByFileLinkOrderByIdAsc(String)` |

### Convention

When adding a new repository method that returns a single entity from a field that is NOT unique-constrained in the database, always use `findFirstBy*OrderByIdAsc`. Methods returning `List<T>`, `boolean`, or `long` (count) are safe and don't need this treatment.

## Layer 2: Conditional External Polling

**Pattern**: Hub polls always. Clients only poll when hub is unreachable.

When the hub is online, only it polls external data sources (SharePoint, Graph email). Clients receive data via entity sync instead. When the hub goes offline, clients resume polling for themselves — full offline capability is preserved.

### Guard Pattern

All polling services use the same guard at the top of their scheduled method:

```java
if (!syncConfig.isHubMode() && centralSyncService.isServerAvailable()) return;
```

- `syncConfig.isHubMode()` — true only for the hub (`sync.role=hub`)
- `centralSyncService.isServerAvailable()` — checks if the hub/server is reachable

Logic:
- **Hub**: `isHubMode()` is true → guard short-circuits → always polls
- **Client, hub online**: `isHubMode()` false, `isServerAvailable()` true → returns (skip polling)
- **Client, hub offline**: `isHubMode()` false, `isServerAvailable()` false → falls through → polls

### Affected Services

| Service | External Source | Schedule |
|---------|----------------|----------|
| `WorkRequestSyncService` | SharePoint work requests | 30s fixed delay, 30s initial |
| `JhaSyncService` | SharePoint JHAs | 30s fixed delay, 45s initial (staggered) |
| `EmailPollingService` | Microsoft Graph email inbox | 10min configurable |

`CentralSyncService` is injected with `@Lazy` to avoid circular dependency (sync services depend on it, but it depends on `FieldSyncService` which depends on merge services).

## Layer 3: Post-Sync Merge Services

After each sync batch commits, merge services run in `FieldSyncService.afterCommit()` to resolve any duplicates:

| Service | Entity | Dedup Key | FK Re-pointing |
|---------|--------|-----------|----------------|
| `CategoryValueMergeService` | Category, Value | `name` (case-insensitive) | All 25 Value FK columns across 11 entity types via reflection |
| `WorkRequestMergeService` | WorkRequest | `sharepointId` | JHA → WorkRequest FK |
| `JhaMergeService` | Jha | `sharepointId` | (leaf entity, no FKs to re-point) |
| `EmailCorrespondenceMergeService` | EmailCorrespondence | `graphMessageId` | (leaf entity, no FKs to re-point) |
| `UserMergeService` | User | `windowsUsername` | Synced entities via reflection + non-synced tables via native SQL |

### Merge Algorithm (all services)

1. **Detect**: native SQL `GROUP BY ... HAVING COUNT(*) > 1` on the dedup key (excluding soft-deleted)
2. **Canonical selection**: lowest ID wins (deterministic — all machines pick the same canonical)
3. **Re-point FKs**: update all foreign key references from duplicate → canonical
4. **Soft-delete**: mark duplicate as `deleted=true` via JPA (so `FieldChangeEntityListener` fires and the deletion syncs)
5. **SyncContext cleared**: merge runs with `SyncContext.isSyncing() = false` so changes are tracked and propagate to all peers

### UserMergeService Special Handling

User has FK references in non-synced tables (`password_reset_token`, `access_grant`) that don't exist on fresh client databases. UserMergeService checks `INFORMATION_SCHEMA.TABLES` before running native SQL on these tables. Without this check, a failed native SQL marks the Hibernate session rollback-only — even if caught, the transaction is doomed, and the merge silently rolls back. Duplicates persist and the merge retries on every afterCommit in an infinite loop.

```java
private boolean tableExists(String tableName) {
    List<Object> result = entityManager.createNativeQuery(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = :name")
        .setParameter("name", tableName)
        .getResultList();
    return !result.isEmpty();
}
```

## Layer 3.5: Concurrent Batch Serialization

Multiple callers can invoke `FieldSyncService.applyIncomingChanges()` concurrently:
- SSE real-time push
- Periodic polling (`CentralSyncService`)
- Reconnection sync (`ServerSseClient`)
- Hub sync (`HubSyncService`)

Without serialization, two threads can race to CREATE the same entity via native SQL INSERT → PK violation → Hibernate marks the session rollback-only → entire batch lost.

`FieldSyncService` uses a `ReentrantLock` to serialize all `applyIncomingChanges()` calls:

```java
private final ReentrantLock applyChangesLock = new ReentrantLock();

public int applyIncomingChanges(List<FieldChange> incomingChanges) {
    applyChangesLock.lock();
    try {
        return applyIncomingChangesLocked(incomingChanges);
    } finally {
        applyChangesLock.unlock();
    }
}
```

## How the Layers Work Together

```
External Source (SharePoint / Email)
    │
    ▼
Layer 2: Conditional Polling
    Hub online? → Only hub polls
    Hub offline? → All clients poll
    │
    ▼
Layer 3.5: ReentrantLock
    Serializes concurrent batch processing
    │
    ▼
FieldSyncService.applyIncomingChanges()
    Creates/updates entities
    │
    ▼
Layer 1: Duplicate-Tolerant Queries
    Any code reading entities uses findFirstBy*OrderByIdAsc
    Duplicates are invisible to application logic
    │
    ▼
Layer 3: Post-Sync Merge (afterCommit)
    Detects remaining duplicates
    Keeps canonical (lowest ID)
    Re-points FKs, soft-deletes duplicates
    Changes sync to all peers
    │
    ▼
All machines converge to same canonical IDs
```

## AdminUserSeeder Hardening

The seeder wraps `seedUsers()` in try-catch so a failure during seeding (e.g., from a transient DB issue or constraint violation during the merge window) is **non-fatal** — logged but doesn't crash the application on startup:

```java
syncContext.executeInSyncContext(() -> {
    try {
        seedUsers();
    } catch (Exception e) {
        log.error("Admin user seeder failed (non-fatal): {}", e.getMessage());
    }
});
```

## Related Documentation

- [category-value-deduplication.md](category-value-deduplication.md) — detailed Category/Value merge logic
- [email-correspondence-deduplication.md](email-correspondence-deduplication.md) — EmailCorrespondence merge logic
- [hub-peer-sync.md](hub-peer-sync.md) — hub-peer architecture and conditional polling
- [field-based-sync.md](field-based-sync.md) — core sync pipeline where merge services are triggered
