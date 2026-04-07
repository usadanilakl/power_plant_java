# Cold Resync — PostgreSQL Hub to H2 Clients

## Problem

Cold resync downloads the hub's database as an H2 backup ZIP. Electron extracts the `.mv.db` file and starts Spring Boot with it. When the hub runs PostgreSQL, it can't use H2's `BACKUP TO` command.

## Solution

The hub generates an H2 file from PostgreSQL data on-demand, then serves it as a standard H2 backup ZIP. Clients don't know or care that the hub runs PostgreSQL — they always receive an H2 file.

## Flow

```
Client requests cold resync
        │
        ▼
GET /api/resync/database/h2-backup
        │
        ▼
Hub detects datasource type
        │
        ├── H2 hub: BACKUP TO (direct, same as before)
        │
        └── PG hub: createH2FromPostgres()
                │
                ├── 1. Create temp H2 database in backup-storage/temp_h2/
                ├── 2. Open PG connection via DriverManager
                ├── 3. Discover all PG tables (JDBC metadata)
                ├── 4. For each table:
                │      ├── Read PG column metadata
                │      ├── CREATE TABLE in H2 (pgTypeToH2 mapping)
                │      ├── SELECT * FROM pg_table
                │      └── Batch INSERT into H2 (1000 rows per batch)
                ├── 5. Create id_seq sequence in H2
                ├── 6. H2 BACKUP TO → hub_backup_*.zip
                └── 7. Clean up temp H2 files
        │
        ▼
Stream ZIP to client (154 MB, ~47 seconds)
        │
        ▼
Electron extracts .mv.db (unchanged flow)
```

## Implementation

**`sevice/hub/HubResyncService.java`**

Key methods:
- `getClientResyncBackup()` — returns `Path` to backup ZIP. Calls `createH2Backup()` on H2 hub, `createH2FromPostgres()` on PG hub.
- `createH2FromPostgres()` — thread-safe with `ReentrantLock`, 5-minute cache TTL (same as H2 backup)
- `copyTablePgToH2(pgConn, h2Conn, tableName)` — reads from PG, creates table in H2, batch inserts
- `pgTypeToH2(pgType, size)` — maps PostgreSQL types to H2 equivalents

### Type Mapping

| PostgreSQL | H2 |
|---|---|
| bigint, bigserial | BIGINT |
| integer, serial | INTEGER |
| boolean | BOOLEAN |
| text, json, jsonb | TEXT |
| varchar(n) | VARCHAR(n) |
| timestamp, timestamptz | TIMESTAMP |
| bytea | BLOB |
| uuid | VARCHAR(36) |
| numeric | DECIMAL |

### Caching

The generated H2 backup is cached for `sync.backup.cache-duration-minutes` (default 5 min). Multiple client cold resyncs within the window reuse the same file.

### Performance

Measured on dev machine with 185k records across 98 tables:
- PG → temp H2 copy: ~12 seconds
- H2 BACKUP TO (ZIP compression): ~35 seconds
- Total: ~47 seconds
- ZIP size: ~154 MB

## Electron Client — Zero Changes

The Electron `cold-resync.manager.ts` was reverted to its original form. It:
1. Downloads from `/api/resync/database/h2-backup`
2. Extracts `.mv.db` from ZIP using `adm-zip`
3. Starts Spring Boot

No format detection, no JSON import — the hub always serves an H2 backup ZIP regardless of its own database engine.

## Controller

**`controller/hub/HubResyncController.java`** — `GET /api/resync/database/h2-backup`

Streams the backup file using `InputStreamResource` — never loads the entire ZIP into memory. Pauses SharePoint sync during backup generation to ensure data consistency.
