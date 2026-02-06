# Functionality

Multi-machine synchronization system that keeps entity data and physical files consistent across all client instances via a central sync server. Supports real-time sync, offline recovery, disaster recovery, and server bootstrapping.

## Sync Scenarios

| # | Scenario | Mechanism | Detail |
|---|----------|-----------|--------|
| 1 | Real-time sync (clients + server online) | SSE push → `FieldSyncService.applyIncomingChanges()` | [field-based-sync.md](field-based-sync.md) |
| 2 | Client comes online after being offline | SSE reconnect → bidirectional batch sync | [field-based-sync.md](field-based-sync.md) |
| 3 | Server was offline, comes back online | Same as #2 — each client reconnects SSE, triggers sync | [field-based-sync.md](field-based-sync.md) |
| 4 | Client requests recovery from a date | Fetches FieldChange records since date, applies via same pipeline | [partial-resync.md](partial-resync.md) |
| 5 | Full disaster recovery | Downloads H2 backup, replaces entire database | [full-resync.md](full-resync.md) |
| 6 | Bootstrap / repopulate sync server | Converts all local entities to FieldChange records, pushes to server | [full-sync-to-server.md](full-sync-to-server.md) |
| 7 | Physical file sync | Upload/download queue via sync server file storage | [file-sync.md](file-sync.md) |
| 8 | Automatic resync on health check failure | Escalating partial resyncs triggered by background health checker | [auto-resync.md](auto-resync.md) |

Scenarios 1–4 and 8 all converge on the same code path: `FieldSyncService.applyIncomingChanges()`.

# Architecture

## Data flow

```
Frontend Change → Backend → Local H2 DB → Sync Server → SSE Broadcast → Other Backends → SSE → Other Frontends
```

```
┌─────────────────┐         ┌─────────────────┐
│   Client A      │         │   Sync Server   │
│   (H2 DB)       │ ◄─────► │   (H2 DB)       │
└─────────────────┘         └─────────────────┘
        │                          │
        │   FieldChange sync       │
        │   + File sync            │
        ▼                          ▼
┌─────────────────┐         ┌─────────────────┐
│   Client B      │         │  Shared Drive   │
│   (H2 DB)       │ ◄──────►│  (Backup)       │
└─────────────────┘         └─────────────────┘
```

## Key design patterns

1. **Last-Writer-Wins (LWW)** — per-field timestamp determines which value wins; machine ID as tiebreaker.
2. **SyncContext thread-local** — prevents infinite sync loops (incoming changes don't generate outgoing FieldChange records).
3. **SYNC_ORDER dependency resolution** — processes entities in order so referenced entities exist before dependents.
4. **Three-pass processing** — Pass 1: simple fields in SYNC_ORDER, Pass 2: ManyToMany, Pass 3: retry failed ManyToOne (re-load managed entity + save).
5. **Native SQL for ID control** — creates entities with specific sync IDs via direct INSERT, bypassing ID generator.
6. **Circuit breaker** — backs off after 5 consecutive failures; resets on SSE connect.
7. **Exponential backoff** — SSE reconnect delays: 2s → 4s → 8s → 16s → 32s → 60s max.
8. **Per-client change tracking** — server tracks `syncedToMachines` per FieldChange using `|MACHINE_ID|` delimiter format.
9. **Batched processing** — all sync operations use pagination (default 500 per batch).
10. **Failed sync item tracking** — ManyToMany failures are tracked in `failed_sync_item` table for visibility and retry, rather than rolling back entire transactions.

## Entity dependency order (SYNC_ORDER)

From [EntityTableRegistry.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java):

```
Category          # Base: no dependencies
Value             # Depends on: Category
User              # Base
FileObject        # Base
Equipment         # Depends on: FileObject, Value, Category
LotoPoint         # Depends on: FileObject, Equipment, Value
Loto              # Depends on: LotoPoint
LotoStandard      # Depends on: LotoPoint, Loto
LotoSnapshot      # Depends on: Loto
LotoBox           # Depends on: Lock
Lock              # Depends on: LotoBox
ZeroEnergy        # Depends on: LotoPoint, Equipment
HeatTrace         # Depends on: Equipment
Highlight         # Depends on: FileObject
ElectricalPanel   # Depends on: Equipment
EqBreaker         # Depends on: ElectricalPanel
HtPanel           # Depends on: Equipment
HtBreaker         # Depends on: HtPanel
EspDevice         # Depends on: Equipment
LedStrip          # Depends on: EspDevice
SafeWork          # Depends on: Equipment
HotWork           # Depends on: SafeWork
ConfinedSpace     # Depends on: SafeWork
WorkRequest       # Depends on: Equipment
DailyPermitPackage
```

## Registering a new entity for sync

When adding a new entity type, register it in all of these:

1. **EntityTableRegistry** — add to `ENTITY_TYPE_TO_TABLE` map and `SYNC_ORDER` list.
    [EntityTableRegistry](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/EntityTableRegistry.java)
2. **ServiceFacade** — add the entity's NgService to constructor and `serviceMap`.
    [ServiceFacade](../../../src/main/java/com/dk_power/power_plant_java/sevice/ServiceFacade.java)
3. **FullSyncToServerService** — add repo to constructor and `getRepositoryForType()` switch.
    [FullSyncToServerService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/FullSyncToServerService.java)
4. **Sync server — ServerEntitySyncService** — add to `SUPPORTED_TYPES`, constructor, `createEntity()`, and `getRepository()`.
    [ServerEntitySyncService](../../../../sync-server/src/main/java/com/dk_power/sync_server/service/ServerEntitySyncService.java)
5. **Sync server — entity + repository** — create mirror entity and repository.
    [Server domain entities](../../../../sync-server/src/main/java/com/dk_power/sync_server/entity/domain/)
    [Server repositories](../../../../sync-server/src/main/java/com/dk_power/sync_server/repository/domain/)

See [comment.md](../base/comment.md) for a complete example of registering a new entity (steps 13–18).

# Configuration reference

## Client (application.properties)

```properties
# Sync server connection
sync.server.enabled=true
sync.server.url=http://192.168.x.x:8090

# Machine identification
sync.machine.id=MACHINE-A              # Auto-generated if not set, persisted in machine-id.properties
sync.machine.name=Workstation A

# Sync timing
sync.interval.seconds=30               # Periodic sync fallback interval
sync.retention.days=30                  # Local FieldChange retention

# File paths
files.root.path=${user.dir}/uploads
files.relative.path=uploads
project.root=${user.dir}

# Shared drive backup (fallback for full resync)
h2.backup.directory=./backups
h2.backup.shared.directory=/mnt/shared/backups
sync.backup.file.directory=/mnt/shared/file_backup
sync.backup.cron=0 0 2 * * ?           # Scheduled backup (disabled by default)
sync.backup.enabled=false
```

## Sync Server (application.properties)

```properties
server.port=8090

# Database
spring.datasource.url=jdbc:h2:file:./data/syncdb
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update

# Entity sync
sync.retention.days=90                  # FieldChange retention
sync.cleanup.cron=0 0 3 * * ?          # Cleanup at 3 AM daily
sync.batch.size=500                     # Default batch size
sync.compaction.enabled=true            # Keep only latest change per field

# File sync
sync.files.storage-path=./file-storage
sync.files.max-file-size=104857600      # 100MB max
sync.files.retention-days=90            # Max file retention
sync.files.min-retention-days=7         # Min file retention (grace period)
sync.files.cleanup.cron=0 0 4 * * ?    # Cleanup at 4 AM daily
sync.backup.storage-path=./backup-storage
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=200MB
```

# Detail documentation

| Document | Covers |
|----------|--------|
| [field-based-sync.md](field-based-sync.md) | Real-time entity sync, SSE reconnection sync, core services, server endpoints |
| [file-sync.md](file-sync.md) | Physical file upload/download, path changes, revisions, storage cleanup |
| [full-resync.md](full-resync.md) | Disaster recovery via database replacement, safety mechanisms |
| [partial-resync.md](partial-resync.md) | Date-based recovery using the same pipeline as real-time sync |
| [full-sync-to-server.md](full-sync-to-server.md) | Server bootstrapping, bulk entity push, field handling |
| [sync-server.md](sync-server.md) | Sync server architecture, endpoints, services, configuration, failed sync item tracking |
| [auto-resync.md](auto-resync.md) | Automatic resync with escalation on health check failure |
| [category-value-deduplication.md](category-value-deduplication.md) | Category/Value deduplication logic, SyncContext clearing |

# E2E Test Coverage

All tests: `cd automation-test && npm run test:sync`

| Test file | Covers | Scenario |
|-----------|--------|----------|
| [sync-health.spec.ts](../../../automation-test/tests/sync/sync-health.spec.ts) | Health monitoring, IN_SYNC/OUT_OF_SYNC detection | 1, 2, 3 |
| [entity-sync.spec.ts](../../../automation-test/tests/sync/entity-sync.spec.ts) | Real entity sync round-trip (Equipment, LotoPoint, FileObject) | 1 |
| [bulk-sync.spec.ts](../../../automation-test/tests/sync/bulk-sync.spec.ts) | Synthetic data pipeline, performance | 1 |
| [circuit-breaker.spec.ts](../../../automation-test/tests/sync/circuit-breaker.spec.ts) | Circuit breaker, SSE toggle, reconnection | 2, 3 |
| [auto-resync.spec.ts](../../../automation-test/tests/sync/auto-resync.spec.ts) | Auto-resync escalation state | 8 |
| [partial-sync.spec.ts](../../../automation-test/tests/sync/partial-sync.spec.ts) | Partial sync from date | 4 |
| [full-sync-to-server.spec.ts](../../../automation-test/tests/sync/full-sync-to-server.spec.ts) | Server bootstrap | 6 |
| [two-client-sync.spec.ts](../../../automation-test/tests/sync/two-client-sync.spec.ts) | Two-client propagation (optional, needs SECOND_CLIENT_URL) | 1, 2 |
| [sync-entity-creation.spec.ts](../../../automation-test/tests/sync/sync-entity-creation.spec.ts) | Real entity graph seeding + sync round-trip (Categories, Values, Equipment, LotoPoints, LotoStandards) | 1 |
| [sync-relationship-preservation.spec.ts](../../../automation-test/tests/sync/sync-relationship-preservation.spec.ts) | ManyToMany, ManyToOne, lotoPointOrder JSON preservation through sync | 1 |
| [sync-deduplication.spec.ts](../../../automation-test/tests/sync/sync-deduplication.spec.ts) | Category/Value dedup after sync — merge, re-point, downstream entity update | 1 |
| [sync-stress-volume.spec.ts](../../../automation-test/tests/sync/sync-stress-volume.spec.ts) | Volume stress: 1000+ LotoStandards with relationships (`SYNC_STRESS_SCALE` env var) | 1 |
| [sync-stress-concurrency.spec.ts](../../../automation-test/tests/sync/sync-stress-concurrency.spec.ts) | Concurrent client simulation: 10/50/100 clients via direct HTTP to sync server | 1 |
