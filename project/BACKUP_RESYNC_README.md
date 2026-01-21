# Database Backup and Full Resync System

This document explains how database backups and full resync operations work for disaster recovery scenarios.

## Overview

The system provides two recovery mechanisms:
1. **Sync Server Resync** - Primary method: Downloads H2 database backup directly from sync server
2. **Shared Drive Backup** - Fallback method: Restores from H2 backup on shared network drive

Both methods restore the complete H2 database and synchronize physical files.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Client A      │         │   Sync Server   │
│   (H2 DB)       │ ◄─────► │   (H2 DB)       │
└─────────────────┘         └─────────────────┘
        │                          │
        │   FieldChange sync       │
        │   (incremental)          │
        ▼                          ▼
┌─────────────────┐         ┌─────────────────┐
│   Client B      │         │  Shared Drive   │
│   (H2 DB)       │ ◄──────►│  (Backup)       │
└─────────────────┘         └─────────────────┘
```

### Sync Server Database

The sync server maintains a **live mirror** of the client database:
- All entity classes are duplicated on the sync server
- FieldChange records are applied in real-time to keep the mirror up-to-date
- On resync request, server creates H2 BACKUP and sends to client

### Shared Drive Backup (Fallback)

If the sync server is unavailable:
- Periodic H2 backups are stored on a shared network drive
- File manifest tracks all files in the uploads directory
- Client can restore from the most recent backup

## Resync Flow

### Server-Based Resync (Primary)

```
1. Client initiates full resync
   │
2. Check sync server health
   │
3. Download H2 backup from server:
   GET /api/resync/database/h2-backup
   │
4. Shutdown local H2 connection pool
   │
5. Restore H2 backup (replaces local database)
   │
6. Compare local files with server manifest:
   GET /api/resync/files/manifest
   │
7. Safety check for deletions
   │
8. Download missing/changed files from server:
   GET /api/resync/files/{id}
   │
9. Delete extra local files
   │
10. Resync complete - application restart required
```

### Shared Drive Resync (Fallback)

```
1. Client initiates full resync
   │
2. Sync server unavailable - fall back to shared drive
   │
3. Load backup metadata from shared drive
   │
4. Restore H2 backup from shared drive
   │
5. Compare local files with backup manifest
   │
6. Safety check for deletions
   │
7. Copy missing/changed files from backup
   │
8. Delete extra local files
   │
9. Resync complete - application restart required
```

## Key Components

### Client Side

| Class | Location | Purpose |
|-------|----------|---------|
| `FullResyncService` | `sevice/sync/FullResyncService.java` | Orchestrates resync operations |
| `H2BackupService` | `sevice/app_services/H2BackupService.java` | Creates/restores H2 backups |
| `FullResyncController` | `controllers/sync/FullResyncController.java` | REST endpoints for UI |

### Sync Server Side

| Class | Location | Purpose |
|-------|----------|---------|
| `FullResyncService` | `service/FullResyncService.java` | Creates H2 backup, exports entities |
| `FullResyncController` | `controller/FullResyncController.java` | REST endpoints for clients |

## Safety Mechanisms

### Deletion Protection

Resync includes safety checks to prevent accidental mass deletion:

| Threshold | Default | Description |
|-----------|---------|-------------|
| `MAX_DELETE_COUNT` | 100 | Maximum files that can be deleted without force |
| `MAX_DELETE_PERCENTAGE` | 25% | Maximum percentage of files that can be deleted |
| `MIN_FILES_FOR_PERCENTAGE_CHECK` | 20 | Minimum files before percentage check applies |

If safety thresholds are exceeded, resync stops and returns an error. Use `force=true` to override (use with caution).

### Pre-Resync Health Check

Before resync, the system checks:
1. Sync server connectivity and health
2. Database integrity on server
3. File count comparison (warns if >10% difference)

## API Endpoints

### Client Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/health` | GET | Get sync health status |
| `/api/resync/preview` | GET | Preview resync without changes |
| `/api/resync/start` | POST | Start full resync |
| `/api/resync/start?force=true` | POST | Start resync, skip safety checks |
| `/api/resync/status` | GET | Get current resync progress |
| `/api/backup/start` | POST | Create full backup |
| `/api/backup/status` | GET | Get current backup progress |

### Sync Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resync/health` | GET | Server health status |
| `/api/resync/database/h2-backup` | GET | Download H2 backup ZIP |
| `/api/resync/database/export` | GET | Export all entities as JSON |
| `/api/resync/files/manifest` | GET | Get file manifest |
| `/api/resync/files/{id}` | GET | Download specific file |

## Configuration

### Client (application.properties)

```properties
# Sync server connection
sync.server.enabled=true
sync.server.url=http://192.168.x.x:8090

# Machine identification
sync.machine.id=MACHINE_1
sync.machine.name=Workstation 1

# Shared drive backup (fallback)
h2.backup.directory=./backups
h2.backup.shared.directory=/mnt/shared/backups
sync.backup.file.directory=/mnt/shared/file_backup

# Scheduled backup (disabled by default)
sync.backup.cron=0 0 2 * * ?
sync.backup.enabled=false

# File paths
files.root.path=uploads
project.root=${user.dir}
```

### Sync Server (application.properties)

```properties
# H2 Database
spring.datasource.url=jdbc:h2:file:./data/syncdb
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update

# File storage
sync.files.storage-path=./file-storage

# Backup storage
sync.backup.storage-path=./backup-storage
```

## H2 Backup Format

The H2 BACKUP command creates a ZIP file containing:
- Complete database dump (all tables, data, indexes)
- Portable format that can be restored on any machine

```sql
-- Create backup
BACKUP TO '/path/to/backup.zip'

-- Restore uses H2 Restore utility
Restore.execute(backupPath, dbDirectory, dbName)
```

## Post-Resync Behavior

After H2 restore:
1. **Database connection pool is shutdown** - HikariCP releases all connections
2. **H2 Restore overwrites database files** - All local data is replaced
3. **Application restart required** - To reconnect to restored database

Tables not present on sync server will be recreated by Hibernate on restart (due to `ddl-auto=update`):
- `pending_file_sync` - File sync queue
- `sync_peer` - Peer tracking
- Other client-specific tables

## File Comparison

Files are compared using MD5 checksums:

```java
// Generate checksum for comparison
MessageDigest md = MessageDigest.getInstance("MD5");
byte[] digest = md.digest(Files.readAllBytes(file));
```

Files are categorized as:
- **To Download** - Missing locally or checksum mismatch
- **To Delete** - Exists locally but not on server
- **Unchanged** - Exists on both with matching checksum

## Backup Metadata

Each backup includes metadata:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "machineId": "MACHINE_1",
  "machineName": "Workstation 1",
  "databaseBackupFile": "full_backup_20240115_103000.zip",
  "fileCount": 1500,
  "totalFileSize": 2147483648
}
```

## File Manifest

The file manifest tracks all files for incremental sync:

```json
{
  "generatedAt": "2024-01-15T10:30:00Z",
  "machineId": "MACHINE_1",
  "totalSize": 2147483648,
  "files": [
    {
      "relativePath": "pdf/P&ID/ABB/P123-001.pdf",
      "checksum": "abc123...",
      "size": 1048576,
      "lastModified": "2024-01-10T09:00:00Z"
    }
  ]
}
```

## Monitoring

### Health Check Response

```json
{
  "machineId": "MACHINE_1",
  "machineName": "Workstation 1",
  "timestamp": "2024-01-15T10:30:00Z",
  "backupAvailable": true,
  "backupTimestamp": "2024-01-15T02:00:00Z",
  "backupMachineId": "SYNC_SERVER",
  "backupFileCount": 1500,
  "localFileCount": 1498,
  "fileDifference": 2,
  "potentialMismatch": false,
  "serverEntityCount": 5000
}
```

### Resync Status Response

```json
{
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": null,
  "phase": "Downloading files",
  "totalFiles": 100,
  "processedFiles": 45,
  "success": false
}
```

## Troubleshooting

### Resync fails with "Wrong user name or password"

The sync server's H2 database credentials don't match the client's credentials.

**Fix**: Ensure both use the same credentials:
```properties
# Both client and server
spring.datasource.username=sa
spring.datasource.password=password
```

### Table not found after resync

Some tables (like `pending_file_sync`, `sync_peer`) only exist on the client, not the sync server.

**Fix**: Ensure these entities exist on the sync server so tables are included in backup, OR restart the client application to let Hibernate recreate them.

### Resync blocked by safety check

Too many files would be deleted.

**Options**:
1. Review the deletion list via preview endpoint
2. If safe, use `force=true` to override
3. Increase safety thresholds in configuration

### Sync server unavailable

Client falls back to shared drive backup automatically.

**Check**:
1. Sync server is running
2. Network connectivity
3. Firewall rules allow traffic on sync server port (default 8090)

### Files not syncing after resync

Physical files are synced separately from the database.

**Check**:
1. File manifest exists on server
2. Files exist in sync server's file storage
3. Client has write permissions to uploads directory

## Best Practices

1. **Regular Backups** - Enable scheduled backup on one reliable machine
2. **Test Restores** - Periodically test resync to verify backup integrity
3. **Monitor Health** - Check sync health regularly for potential mismatches
4. **Credential Consistency** - Keep H2 credentials identical across all machines
5. **Network Reliability** - Ensure stable connection to sync server
6. **Disk Space** - Monitor disk space on sync server and backup locations
