# Dialect-Specific SQL Changes

All changes are additive — H2 code paths remain intact, PostgreSQL support added alongside. Dialect is detected at runtime via `connection.getMetaData().getDatabaseProductName()`.

## Sequence Queries

H2 and PostgreSQL use different syntax for sequence next-value:

| H2 | PostgreSQL |
|---|---|
| `SELECT NEXT VALUE FOR id_seq` | `SELECT nextval('id_seq')` |

### Files changed

**`config/DevicePrefixedIdGenerator.java`**
- Added `resolveSequenceSql(Connection)` — detects dialect from connection metadata, caches result
- Called inside the `IdGeneratorWork` that runs within Hibernate's `session.doWork()`

**`config/SequenceInitializer.java`**
- Same dialect-aware sequence query for `@PostConstruct` consistency check
- `TABLE_SCHEMA = 'PUBLIC'` changed to `TABLE_SCHEMA = CURRENT_SCHEMA` (works on both — H2 returns `PUBLIC`, PG returns `public`)
- Added `DataSource` injection for `isPostgres()` helper

## ALTER COLUMN Syntax

**`config/SyncSchemaPreparation.java`**

Makes NOT NULL columns nullable at startup for sync entity creation:

| H2 | PostgreSQL |
|---|---|
| `ALTER TABLE t ALTER COLUMN c SET NULL` | `ALTER TABLE t ALTER COLUMN c DROP NOT NULL` |

Also:
- Table name casing: H2 uppercase, PG lowercase — uses `isPostgres()` to determine casing
- `INFORMATION_SCHEMA.COLUMNS` query: added `TABLE_SCHEMA = CURRENT_SCHEMA` filter
- `SKIP_COLUMNS` set includes both cases (`"ID"` and `"id"`)
- Index creation uses appropriate casing for table/column names
- `backfillVersionColumns()` uses lowercase table names on PG

## Schema Initialization

H2 and PG have different DDL syntax for column type changes:

| H2 (`schema.sql`) | PostgreSQL (`schema-postgresql.sql`) |
|---|---|
| `ALTER TABLE t ALTER COLUMN c TEXT` | `ALTER TABLE t ALTER COLUMN c TYPE TEXT` |

The `postgres` profile overrides `spring.sql.init.schema-locations` to load `schema-postgresql.sql` instead of the default `schema.sql`.

Both files contain identical:
- Sequence creation (`CREATE SEQUENCE IF NOT EXISTS id_seq`)
- Index creation (`CREATE INDEX IF NOT EXISTS`)
- Column additions (`ADD COLUMN IF NOT EXISTS`)

## Native Queries in Repositories

All native queries use standard SQL that works on both dialects — **no changes needed**:
- `FieldChangeRepository.java`: CONCAT, REPLACE, COALESCE, LIKE — PG-compatible
- `WorkRequestRepo.java`: COALESCE, NOT EXISTS, LIMIT — PG-compatible
- `UserRepo.java`: simple UPDATE — PG-compatible
- `HubStoredBackupRepository.java`: OFFSET — PG-compatible
- `ValueRepo.java`: simple SELECT — PG-compatible

## JdbcTemplate Queries

**`controller/permits/JhaRestController.java`**
- Changed hardcoded UPPERCASE table/column names to lowercase (works on both — H2 is case-insensitive)
- Wrapped `CALL DATABASE_PATH()` (H2-only) in try/catch

**`sevice/sync/DataIntegrityService.java`**
- Duplicate removal: `_ROWID_` (H2) vs `ctid` (PostgreSQL) — uses `isPostgres()` to choose
- `hasPrimaryKey()`: tries both uppercase and lowercase table names for JDBC metadata lookup

## Reserved Words

PostgreSQL has stricter reserved word handling than H2. The entity `ReferenceObject` has a column named `references` which is a PG reserved word — Hibernate's DDL fails on table creation. This is a pre-existing issue unrelated to migration (the table is currently unused).
