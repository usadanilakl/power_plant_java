# JVM Memory Optimization

## Problem
The JAR uses **8GB RAM on startup** because `pom.xml` sets `-Xms8g` (initial heap = 8GB). This pre-allocates memory regardless of actual need. A typical Spring Boot + H2 app needs 300-600MB.

Additionally, Electron and restart scripts launch the JAR with **no JVM args**, falling back to JVM defaults (typically 1/4 of system RAM on Windows).

## Root Cause — Three Launch Points

### 1. Maven (`mvn spring-boot:run`) — `pom.xml` line 250
```xml
<jvmArguments>
    -Xms8g      <!-- allocates 8GB immediately -->
    -Xmx16g     <!-- allows up to 16GB -->
    -Djava.awt.headless=false
</jvmArguments>
```
**Fix:** Change to `-Xms512m -Xmx2g`

### 2. Electron spawn — `electron-manager/src/main/managers/spring-boot.manager.ts` line 110
```typescript
const javaArgs = ['-jar', config.jar, `--spring.profiles.active=${activeProfile}`];
// No -Xms/-Xmx at all — uses JVM defaults (often 1/4 of system RAM)
```
**Fix:** Add JVM args before `-jar`:
```typescript
const javaArgs = ['-Xms512m', '-Xmx2g', '-Djava.awt.headless=false', '-jar', config.jar, ...];
```

### 3. Restart scripts — `restart-app.bat` line 40, `restart-app.sh`
```bat
start javaw -jar power_plant_java-1.jar
:: No JVM args — uses defaults
```
**Fix:** `start javaw -Xms512m -Xmx2g -jar power_plant_java-1.jar`

## Recommended Values

| Setting | Current | Recommended | Explanation |
|---------|---------|-------------|-------------|
| `-Xms` (initial heap) | 8g | 512m | Start small, grow as needed |
| `-Xmx` (max heap) | 16g | 2g | Cap growth to prevent runaway usage |

## Why 2GB Is Enough

- **H2 file-based DB** keeps data on disk, not in heap — only active queries use heap
- **Spring Boot + Hibernate** framework overhead is ~200-300MB
- **Angular static files** are served from disk, not held in memory
- **Sync batches** are paginated (500 records per page) — never loads full dataset
- **SSE emitters** are lightweight (~1-2KB each)
- **Hikari connection pool** is 20 connections (H2) or 50 (PostgreSQL) — minimal memory
- **Hibernate batch inserts** are capped at 50 records

## JVM Flag Reference

| Flag | Purpose |
|------|---------|
| `-Xms512m` | Initial heap size — JVM allocates this on startup |
| `-Xmx2g` | Maximum heap size — JVM won't exceed this |
| `-Djava.awt.headless=false` | Needed for AWT/Swing (used in app) |

**Key insight:** `-Xms` is what determines startup memory. Setting it to 8g means the JVM immediately reserves 8GB even if the app only needs 400MB. The JVM will grow from `-Xms` toward `-Xmx` only as needed.

## Hub Profile Considerations

If the hub server (profile: `prod,hub,server`) needs more memory due to:
- More SSE connections from multiple desktops
- SharePoint sync processing
- Larger PostgreSQL connection pool (50)

Then use `-Xmx4g` for the hub only. Desktop instances should be fine at 2GB.

## Additional Memory Savings (Optional)

These are lower-priority but worth noting:

1. **`BulkFileExportService.createFilesArchive()`** — builds entire ZIP in `ByteArrayOutputStream` before returning. For large file collections, this could spike memory. Consider streaming the ZIP directly to the response.

2. **`HubResyncService.getFileManifest()`** — calls `findAll().stream().toList()` loading all file records at once. Could paginate instead.

3. **FieldChange accumulation** — 30-day retention (`sync.retention.days=30`) can mean millions of records. Ensure the cleanup job runs reliably.

4. **Static reflection caches** in sync services (`SyncResolutionService`, `SyncComparisonService`, `FieldChangeTracker`) use `ConcurrentHashMap` that grow with entity types — bounded by entity count so not a real concern.

## Verification Steps

1. Apply changes to all three launch points
2. Start the app via `mvn spring-boot:run`
3. Check memory in Task Manager — should show ~400-800MB instead of 8GB
4. Test normal operations: page navigation, sync, file upload, PDF processing
5. If OOM errors occur, increase `-Xmx` to 3g or 4g
