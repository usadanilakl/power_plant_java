# Functionality

Central sync server that acts as the relay, mirror database, and file storage for multi-machine synchronization. All clients synchronize through this server — there is no direct peer-to-peer sync in server mode.

The sync server:
1. Receives FieldChange records from clients and stores them
2. Broadcasts changes to other connected clients via SSE (real-time)
3. Serves pending changes via paginated batch endpoints (reconnection sync)
4. Maintains a mirror copy of all entity tables (for backup/resync)
5. Stores uploaded files and serves them to other clients
6. Provides health-stats for client sync health checking

**Source:** `C:\Users\usada\my_projects\sync-server` (or `/home/dk-power/IdeaProjects/sync-server`)

# Architecture

## Data flow

```
Client A makes change
    → FieldChangeEntityListener creates FieldChange record
    → CentralSyncService sends to server (POST /api/sync/exchange)
    → Server stores FieldChange
    → Server broadcasts via SSE to Client B (real-time)
    → Server applies change to mirror entity tables (backup)
    → Client B receives SSE event, applies via FieldSyncService
```

## Key services

| Service | Role |
|---------|------|
| `SyncService` | Core sync logic: exchange, LWW conflict resolution, change compaction, cleanup |
| `ServerEntitySyncService` | Applies FieldChanges to mirror entity tables, entity counts for health stats |
| `SseEmitterService` | Manages SSE connections, broadcasts changes to connected clients |
| `FileStorageService` | Stores/retrieves uploaded files, provides file manifests |
| `BackupStorageService` | H2 database backup storage and retrieval |
| `FullResyncService` | Database export (JSON/ZIP), file manifest generation |

## Sync exchange flow

When a client calls `POST /api/sync/exchange`:

1. Server registers/updates the client
2. Incoming changes are deduplicated (by change key) and conflict-resolved (LWW)
3. Accepted changes are stored in `field_change` table
4. Changes are broadcast to all other SSE-connected clients
5. Changes are applied to mirror entity tables (async, best-effort)
6. Response indicates success — client then uses `/changes/batch` to pull pending changes

**Important**: The exchange endpoint does NOT return outgoing changes to the client. The client pulls pending changes separately via the `/changes/batch` endpoint. This prevents changes from being marked as "synced" before the client actually processes them.

## SSE real-time broadcast

- SSE connections have a 10-minute timeout with 30-second heartbeats
- Changes are broadcast to all connected clients EXCEPT the origin machine
- SSE is fire-and-forget — failed sends are logged but don't retry
- The `connected` event includes the number of pending changes waiting for the client
- Clients that miss SSE events will catch up via the batch sync endpoint

## Mirror entity tables

The server maintains a full mirror of all client entity tables. When FieldChanges are received, `ServerEntitySyncService.applyChangesToMirror()` applies them to the server's entity tables using reflection-based field updates. This mirror serves as the authoritative backup source for full resync operations.

Entity counts from mirror tables are used for health-stats (filtered by `deleted = false` to match client-side counting).

# REST Endpoints

## SyncController (`/api/sync`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/exchange` | Main sync exchange — client sends changes, server stores and broadcasts |
| GET | `/changes` | Pull pending changes (non-paginated, use `/changes/batch` for large datasets) |
| GET | `/changes/batch?page=0&size=500` | Paginated pending changes — marks as synced when returned |
| GET | `/changes/count` | Count of pending changes for this client |
| POST | `/register` | Register/ping client presence |
| GET | `/clients` | List all registered clients |
| GET | `/clients/active` | List active clients (seen in last 5 minutes) |
| GET | `/status` | Server status and statistics |
| GET | `/health` | Health check with storage status and disk space |
| GET | `/health-stats` | Entity counts and file counts for sync health checking |
| GET | `/metrics` | Detailed sync metrics (processed, skipped, broadcast counts) |
| GET | `/metrics/{machineId}` | Per-client metrics |
| GET | `/partial-sync/available-dates` | Dates with field change history |
| GET | `/partial-sync/count?date=yyyy-MM-dd` | Count of changes since date |
| GET | `/partial-sync/changes?date=...&page=0&size=500` | Paginated changes since date |

All endpoints that identify clients use `X-Machine-Id` and `X-Machine-Name` headers.

## SseController (`/api/sync/sse`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/subscribe` | Subscribe to SSE stream (text/event-stream) |
| GET | `/stats` | SSE connection statistics |
| GET | `/connected/{machineId}` | Check if specific machine is connected |

SSE event types:
- `connected` — initial confirmation with pending change count
- `sync` — batch of changes from another client
- `file_upload` — notification that a new file is available
- `heartbeat` — keepalive every 30 seconds

## FullResyncController (`/api/resync`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Resync health status |
| GET | `/database/json` | Full database export as JSON |
| GET | `/database/zip` | Full database export as ZIP |
| GET | `/database/h2-backup` | H2 database backup as ZIP (recommended for full resync) |
| GET | `/files/manifest` | File manifest with checksums |
| GET | `/files/{fileId}` | Download file by ID |
| GET | `/files/entity/{entityType}/{entityId}/{fileName}` | Download file by entity path |
| GET | `/files/entity/{entityType}/{entityId}` | List files for an entity |

# Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `sync.retention.days` | 90 | Days to keep FieldChange records before cleanup |
| `sync.batch.size` | 500 | Max changes per batch in exchange/paginated endpoints |
| `sync.compaction.enabled` | true | Compact repeated field updates (keep only latest per field) |
| `sync.cleanup.cron` | `0 0 3 * * ?` | Cron schedule for old change cleanup (3 AM daily) |
| `sync.file.storage.path` | `file-storage` | Directory for uploaded file storage |
| `sync.backup.storage.path` | `backup-storage` | Directory for H2 backup storage |

# Change compaction

When enabled, incoming changes are compacted before processing: if the same entity field was updated multiple times in a batch, only the latest change is kept. This reduces storage and processing overhead for rapid successive edits.

# Cleanup

A scheduled job (`SyncService.cleanupOldChanges()`) runs daily at 3 AM to delete FieldChange records older than the retention period (default 90 days). This prevents unbounded database growth.

# Client lifecycle

| Status | Meaning |
|--------|---------|
| `ONLINE` | Client connected and active |
| `SYNCING` | Client currently exchanging changes |
| `OFFLINE` | Client not seen for 5+ minutes (auto-detected) |
