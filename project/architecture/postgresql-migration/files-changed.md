# Files Changed — PostgreSQL Migration

## New Files

| File | Purpose |
|---|---|
| `src/main/resources/application-postgres.properties` | PostgreSQL datasource, pool, dialect, schema config |
| `src/main/resources/schema-postgresql.sql` | PG-compatible schema init (replaces schema.sql when postgres profile active) |
| `scripts/setup-postgres.ps1` | PowerShell script: creates PG database/user, writes credentials |
| `sevice/hub/H2ToPostgresMigrationService.java` | Data migration: reads H2 file, inserts into PG. Admin compare report |
| `sevice/hub/PostgresBackupService.java` | pg_dump-based backup for hub disaster recovery |
| `frontend/src/app/pages/admin/tabs/admin-migration.component.ts` | Admin UI: Migration tab with status, run, and comparison |
| `project/architecture/postgresql-migration/` | This documentation folder |

## Modified Files

| File | Change |
|---|---|
| `pom.xml` | Added `org.postgresql:postgresql` driver (runtime scope) |
| `application-hub.properties` | Removed PG config (moved to separate postgres profile) |
| `application-secrets.example.properties` | Added PG credential template |
| `config/DevicePrefixedIdGenerator.java` | Dialect-aware sequence query (`nextval` vs `NEXT VALUE FOR`) |
| `config/SequenceInitializer.java` | `CURRENT_SCHEMA`, dialect-aware sequence, `DataSource` injection |
| `config/SyncSchemaPreparation.java` | Dialect-aware ALTER COLUMN, case-aware table names |
| `controller/hub/HubResyncController.java` | Streams backup via `getClientResyncBackup()` (works for both H2 and PG hub) |
| `controller/permits/JhaRestController.java` | Lowercase table/column names, guarded `CALL DATABASE_PATH()` |
| `controller/angular/admin/NgAdminFunctionalitiesController.java` | Added migration endpoints |
| `sevice/hub/HubResyncService.java` | Added `createH2FromPostgres()` for PG→H2 cold resync backup generation |
| `sevice/sync/DataIntegrityService.java` | `ctid` vs `_ROWID_`, both-case PK metadata lookup |
| `logback-spring.xml` | Added dedicated logger for migration service |
| `frontend/src/app/pages/admin/admin-functionalities.component.ts` | Added Migration tab |
| `frontend/src/app/routes/standalone.routes.ts` | Added migration route |

## Reverted / Cleaned Up

| File | What happened |
|---|---|
| `sevice/sync/JsonResyncImporter.java` | Created then deleted — replaced by PG→H2 backup generation approach |
| `electron-manager/src/main/managers/cold-resync.manager.ts` | Format detection code added then reverted — hub always serves H2 backup |
| `backup-format` endpoint in HubResyncController | Created then removed — no longer needed |
