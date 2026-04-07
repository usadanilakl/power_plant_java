# H2 to PostgreSQL Migration Tool

Admin UI for migrating data from the local H2 database file into PostgreSQL.

## Location

- **Backend service**: `sevice/hub/H2ToPostgresMigrationService.java`
- **Controller endpoints**: `controller/angular/admin/NgAdminFunctionalitiesController.java` (`/ng/admin/migration/*`)
- **Frontend UI**: `frontend/src/app/pages/admin/tabs/admin-migration.component.ts` (Admin > Migration tab)

## How It Works

### Migration Flow

1. App must be running with the `postgres` profile (connected to PG)
2. H2 database file (`./db/proddb.mv.db`) must exist on disk
3. Service opens H2 file **read-only** via direct JDBC (`ACCESS_MODE_DATA=r`)
4. Discovers ALL tables from H2 using JDBC metadata (`DatabaseMetaData.getTables()`)
5. For each H2 table that also exists in PG:
   - Reads all rows from H2
   - Maps H2 columns to PG columns (case-insensitive matching)
   - Batch-inserts into PG with `ON CONFLICT DO NOTHING` (handles duplicates)
6. Logs per-table results: rows inserted, rows failed, column mismatches

### Pre-Migration Steps (automatic)

Before inserting:
1. **Clear PG tables** — `TRUNCATE TABLE ... CASCADE` on all public tables
2. **Drop FK constraints** — queries `information_schema.table_constraints` to find all FKs, drops them
3. After migration: **re-creates all FK constraints** from saved definitions

### Why FK Constraints Are Dropped

PostgreSQL enforces FK constraints at insert time (unlike H2's deferred checking). Since migration order can't guarantee all referenced rows exist before referencing rows, FKs are dropped before migration and restored after.

### Column Matching

H2 returns UPPERCASE column names, PG uses lowercase. The migration uses case-insensitive matching:
- H2 columns are lowercased
- PG columns are discovered via `SELECT * FROM table LIMIT 0` (more reliable than JDBC metadata across dialects)
- Only columns that exist in both H2 and PG are migrated
- Unmatched columns are logged as warnings

### Duplicate Handling

`INSERT ... ON CONFLICT DO NOTHING` — if a row already exists (from a concurrent process like SharePoint polling), the insert is silently skipped rather than failing.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/ng/admin/migration/status` | Check H2 file existence, current DB type, PG record count |
| POST | `/ng/admin/migration/run` | Run the migration |
| GET | `/ng/admin/migration/compare` | Compare H2 vs PG record counts per table |

## Verification Report

The compare endpoint opens both H2 (read-only JDBC) and PG (current datasource), counts rows in every table, and flags deviations. The UI shows a table with H2 count, PG count, and OK/deviation status with color coding.

## Known Deviations

Some small deviations are expected:
- **Work requests / JHAs**: SharePoint migration poller (`OldWorkRequestMigrationService`) may create records during migration. `ON CONFLICT DO NOTHING` prevents failures but the extra rows show as PG > H2 in the comparison.
- **H2 columns not in PG**: Columns like `version` (from `@Version` annotation) exist in H2 but may not in PG if the entity class changed. These are harmless — logged as warnings.

## Logging

Migration service logs go to:
- `logs/power-plant-logger.log` (main log)
- `logs/power-plant-alerts.log` (warnings/errors)
- IntelliJ console

Configured in `logback-spring.xml` with a dedicated logger:
```xml
<logger name="com.dk_power.power_plant_java.sevice.hub.H2ToPostgresMigrationService" level="info" additivity="false">
    <appender-ref ref="RollingFile" />
    <appender-ref ref="WarnErrorFile" />
    <appender-ref ref="Console" />
</logger>
```
