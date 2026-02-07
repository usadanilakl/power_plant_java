# Data Integrity Check & Fix

On-demand data integrity checking and fixing for database consistency issues. Detects and resolves problems like duplicate entries in join tables, orphaned foreign key references, missing primary key constraints, and manages soft-deleted entity purging.

## Functionality

1. **Duplicate Detection** — finds duplicate entries in ManyToMany join tables that can cause PK constraint violations during sync.
2. **Orphan Detection** — finds join table entries referencing deleted or non-existent entities.
3. **Constraint Check** — identifies join tables missing primary key constraints.
4. **Soft-Delete Management** — tracks and purges soft-deleted entities older than retention period.

Use cases:
- Before running bulk sync to server (prevents PK violation errors)
- After sync errors to diagnose data inconsistencies
- Periodic cleanup of orphaned references
- Permanent deletion of old soft-deleted data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Integrity Check                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Duplicates  │   Orphans    │ Constraints  │  Soft-Deleted  │
│  Detection   │  Detection   │   Check      │    Purge       │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                   DataIntegrityService                        │
│  - Scans 10 join tables                                       │
│  - Checks 17 soft-delete entities                             │
│  - Dry-run support for all operations                         │
└──────────────────────────────────────────────────────────────┘
```

## Implementation

### Join Tables Checked

| Table | Left FK | Right FK |
|-------|---------|----------|
| eq_loto_point | eq_id | loto_point_id |
| file_point | point_id | file_id |
| loto_standard_loto_point | loto_standard_id | loto_point_id |
| loto_standard_groups | loto_standard_id | value_id |
| ht_equipment | ht_id | eq_id |
| ht_pid | ht_id | pid_id |
| breaker_eq | br_id | eq_id |
| daily_permit_package_lotos | daily_permit_package_id | loto_id |
| permit_equipment | permit_id | equipment_id |
| task_dependencies | dependent_task_id | prerequisite_task_id |

### Soft-Delete Entities Tracked

Equipment, FileObject, LotoPoint, Loto, LotoStandard, HeatTrace, Highlight, ElectricalPanel, EqBreaker, Category, Value, Comment, ZeroEnergy, LockBox, Task, WorkRequest, DailyPermitPackage

### Detection Methods

**Duplicate Detection:**
```sql
SELECT COUNT(*) as total,
       COUNT(DISTINCT CONCAT(col1, '-', col2)) as distinct_count
FROM join_table
```
Duplicates = total - distinct_count

**Orphan Detection:**
```sql
SELECT COUNT(*) FROM join_table j
WHERE NOT EXISTS (SELECT 1 FROM parent_table p
                  WHERE p.id = j.parent_id AND p.deleted = false)
   OR NOT EXISTS (SELECT 1 FROM child_table c
                  WHERE c.id = j.child_id AND c.deleted = false)
```

**Soft-Delete Detection:**
```sql
SELECT COUNT(*) FROM entity_table
WHERE deleted = true
  AND updated_at < :cutoffDate
```
Default retention: 90 days

### Fix Methods

**Remove Duplicates:**
```sql
DELETE FROM join_table
WHERE ROWID() NOT IN (
    SELECT MIN(ROWID()) FROM join_table
    GROUP BY col1, col2
)
```

**Remove Orphans:**
```sql
DELETE FROM join_table j
WHERE NOT EXISTS (SELECT 1 FROM parent_table WHERE id = j.parent_id AND deleted = false)
   OR NOT EXISTS (SELECT 1 FROM child_table WHERE id = j.child_id AND deleted = false)
```

**Add Primary Key Constraints:**
```sql
ALTER TABLE join_table ADD PRIMARY KEY (col1, col2)
```
Note: Duplicates must be removed first. Existing constraints are detected and skipped.

**Purge Soft-Deleted:**
```sql
DELETE FROM entity_table
WHERE deleted = true
  AND updated_at < :cutoffDate
```

## Core Services

| Service | Location | Purpose |
|---------|----------|---------|
| DataIntegrityService | [Client](../../../src/main/java/com/dk_power/power_plant_java/sevice/sync/DataIntegrityService.java) | Detection and fix operations |
| DataIntegrityController | [Client](../../../src/main/java/com/dk_power/power_plant_java/controller/sync/DataIntegrityController.java) | REST endpoints for UI |

## REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/data-integrity/check` | GET | Check all integrity issues (read-only) |
| `/api/data-integrity/fix/duplicates` | POST | Fix duplicates (dryRun=true by default) |
| `/api/data-integrity/fix/orphans` | POST | Fix orphaned references (dryRun=true by default) |
| `/api/data-integrity/fix/constraints` | POST | Add missing PK constraints (dryRun=true by default) |
| `/api/data-integrity/fix/all` | POST | Fix duplicates, orphans, and constraints (dryRun=true) |
| `/api/data-integrity/fix/purge-deleted` | POST | Purge soft-deleted entities (dryRun=true) |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| dryRun | boolean | true | If true, only report what would be fixed |
| retentionDays | int | 90 | For purge: minimum age of soft-deleted entities |

## Response DTOs

### IntegrityCheckResult
```json
{
  "checkedAt": "2025-02-06T10:30:00Z",
  "hasIssues": true,
  "totalDuplicates": 15,
  "totalOrphans": 8,
  "constraintsMissing": true,
  "totalSoftDeleted": 120,
  "softDeleteRetentionDays": 90,
  "tableIssues": {
    "eq_loto_point": {
      "tableName": "eq_loto_point",
      "duplicateCount": 10,
      "orphanCount": 3,
      "hasPrimaryKey": false
    }
  },
  "softDeletedByEntity": {
    "Equipment": 50,
    "FileObject": 30,
    "LotoPoint": 40
  }
}
```

### IntegrityFixResult
```json
{
  "success": true,
  "message": "Fixed 23 issues across 4 tables",
  "dryRun": false,
  "duplicatesRemoved": 15,
  "orphansRemoved": 8,
  "constraintsAdded": 4,
  "softDeletedPurged": 0,
  "errors": []
}
```

## UI Usage

The Data Integrity feature is available in the **Sync & Recovery** page:

1. **Check Integrity** — scans all join tables and entities for issues
2. **Preview Fix** — shows what would be fixed without making changes
3. **Fix All Issues** — removes duplicates, orphans, adds constraints
4. **Purge Deleted** — permanently removes old soft-deleted entities

### Workflow

1. Click "Check Integrity" to scan for issues
2. Review the results (duplicates, orphans, soft-deleted counts)
3. Optionally expand "Table Details" to see per-table breakdown
4. Click "Preview Fix" to see what would change
5. If satisfied, click "Fix All Issues" to apply fixes
6. For soft-deleted purge, use "Purge Deleted" separately (with confirmation)

### Safety Features

- **Dry-run by default** — all fix operations preview changes first
- **Confirmation dialogs** — destructive operations require confirmation
- **Separate purge** — soft-delete purge is intentionally separate from "Fix All"
- **Detailed reporting** — shows exactly what was fixed or would be fixed

## Configuration

```properties
# Soft-delete retention period (days before purge is allowed)
data.integrity.soft-delete-retention-days=90
```

## Prevention

After running "Fix All Issues", the service adds **primary key constraints** to join tables. This prevents future duplicates from being inserted:

- Duplicate INSERT attempts will fail with PK constraint violation
- This is the root fix for sync issues caused by duplicate join entries
- Constraints are only added after duplicates are removed

## Troubleshooting

**Bulk sync fails with PK violation:**
Run integrity check and fix before bulk sync. The duplicates in join tables cause INSERT failures when syncing to server.

**Orphaned references after entity deletion:**
Normal during incremental sync. Run periodic integrity checks to clean up orphaned join table entries.

**Too many soft-deleted entities:**
Increase retention period or run purge to permanently delete old soft-deleted items.

**Constraint add fails:**
Duplicates must be removed first. Run "Fix Duplicates" before "Add Constraints".

## Related Documentation

- [Full Resync](full-resync.md) — database recovery operations
- [Field-Based Sync](field-based-sync.md) — incremental sync mechanism
- [Full Sync to Server](full-sync-to-server.md) — bulk upload to sync server
