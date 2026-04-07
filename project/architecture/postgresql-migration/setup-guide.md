# PostgreSQL Setup Guide

## Prerequisites

- PostgreSQL 16+ installed
- `psql` on PATH (or know the path to `bin/`)

## Setup Script

```powershell
# Add psql to PATH if needed
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

# Run setup — creates database, user, writes credentials
.\scripts\setup-postgres.ps1

# Or with a specific password
.\scripts\setup-postgres.ps1 -DbPassword "mypassword"

# Or targeting a remote server
.\scripts\setup-postgres.ps1 -PgHost 10.10.190.122 -DbPassword "mypassword"
```

The script:
1. Prompts for the PostgreSQL admin (`postgres`) password
2. Creates user `power_plant` (or updates password if exists)
3. Creates database `power_plant` (or skips if exists)
4. Grants all privileges
5. Writes `PG_USERNAME` and `PG_PASSWORD` to `application-secrets.properties`

## Enable PostgreSQL Profile

In `application.properties`, add `postgres` to profiles:

```properties
# Before:
spring.profiles.active=prod,hub,server

# After:
spring.profiles.active=prod,hub,server,postgres
```

## Migrate Data

1. Start the app with the `postgres` profile — Hibernate creates empty schema
2. Navigate to **Admin > Migration** tab
3. Click **Check Status** — verify "PostgreSQL" and H2 file found
4. Click **Start Migration** — copies all data from H2 file into PostgreSQL
5. Click **Compare H2 vs PostgreSQL** — verify counts match

## Verify

```bash
# Check PG has data
psql -h localhost -U power_plant -d power_plant -c "SELECT COUNT(*) FROM equipment;"

# Check the app works
# Browse to http://localhost:8085/angular/browser/ (or your port)
```

## Switch Back to H2

Remove `postgres` from profiles:
```properties
spring.profiles.active=prod,hub,server
```

No other changes needed. The H2 database file is untouched throughout.

## Hub Server Deployment

For the production hub server (Windows Server with IIS):

1. Install PostgreSQL 16+ on the hub server
2. Run `setup-postgres.ps1` on the hub server
3. Build JAR from the `postgres-hub` branch: `mvn clean package -DskipTests`
4. Deploy JAR to hub server
5. Update `application.properties` on the hub to include `postgres` profile
6. Start the hub
7. Run migration from Admin > Migration tab
8. Verify with the comparison report

## Connection Pool

PostgreSQL profile sets larger pool than H2 default:
- `maximum-pool-size=50` (H2 default: 20)
- `minimum-idle=10`
- `idle-timeout=300000` (5 min)
- `max-lifetime=1800000` (30 min)

## Backup (Hub Disaster Recovery)

`sevice/hub/PostgresBackupService.java` — uses `pg_dump` via `ProcessBuilder` for hub's own DR backups. Hub-only (`@ConditionalOnProperty(name = "sync.role", havingValue = "hub")`).

## Files Reference

| File | Purpose |
|---|---|
| `application-postgres.properties` | PG datasource, pool, dialect config |
| `schema-postgresql.sql` | PG-compatible schema initialization |
| `scripts/setup-postgres.ps1` | Automated DB/user creation |
| `application-secrets.example.properties` | Template showing PG credential format |
| `pom.xml` | PostgreSQL JDBC driver (runtime scope) |
