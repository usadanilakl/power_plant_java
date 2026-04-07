# PostgreSQL Migration — Hub Database

## Purpose

Migrate the hub (central sync server) from H2 file-based database to PostgreSQL while keeping H2 for Electron desktop clients. Same JAR, behavior controlled by Spring profiles.

## Why

H2 on the hub causes:
- **Table-level locking** — SharePoint sync and client sync block each other
- **Slow queries** — 270k+ field_change rows with no concurrent read support
- **Connection pool exhaustion** — single-file mode can't handle concurrent client connections
- **No hot backup** — Electron cold resync requires stopping the JVM to replace the DB file

PostgreSQL solves all of these with row-level locking, proper connection pooling, and concurrent read/write support.

## Profile-Based Switching

| Profiles | Database | Use Case |
|---|---|---|
| `prod` | H2 | Desktop clients (Electron) |
| `prod,hub,server` | H2 | Hub on H2 (original, unchanged) |
| `prod,hub,server,postgres` | PostgreSQL | Hub on PostgreSQL (new) |

The `postgres` profile is purely opt-in. Adding or removing it is the only change needed to switch.

## Configuration

### PostgreSQL profile (`application-postgres.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/power_plant
spring.datasource.driverClassName=org.postgresql.Driver
spring.datasource.username=${PG_USERNAME:power_plant}
spring.datasource.password=${PG_PASSWORD:}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.h2.console.enabled=false
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.sql.init.schema-locations=classpath:schema-postgresql.sql
```

### Credentials
PG credentials are stored in `application-secrets.properties` (gitignored) as `PG_USERNAME` and `PG_PASSWORD`. The setup script (`scripts/setup-postgres.ps1`) creates the database, user, and writes credentials automatically.

## Implementation Details

See:
- [dialect-changes.md](dialect-changes.md) — all SQL dialect differences between H2 and PostgreSQL
- [migration-tool.md](migration-tool.md) — H2-to-PostgreSQL data migration UI and service
- [cold-resync.md](cold-resync.md) — how cold resync works when hub runs PostgreSQL
- [setup-guide.md](setup-guide.md) — step-by-step setup instructions
