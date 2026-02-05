Base paths:
1.C:\Users\usada\my_projects
2./home/dk-power/IdeaProjects

1. frontend: C:\Users\usada\my_projects\power_plant_java\frontend
2. backend: C:\Users\usada\my_projects\power_plant_java\src
3. sync-server:C:\Users\usada\my_projects\sync-server

Tests:
1. imitate DB item creation at different dates (possibly a test controller needs to be implemented in sync-server).
2. separate test that creates DB items at different dates, then checks client db - verifies that those items are not present, then resyncs using certain date from partial resync, then verifies items present in client's db.

---

## Implementation Details

### Sync Server - TestDataController
**File:** `sync-server/src/main/java/com/dk_power/sync_server/controller/TestDataController.java`

Endpoints:
- `POST /api/test/field-changes` - Create a single backdated field change
- `POST /api/test/field-changes/batch` - Create multiple backdated field changes
- `POST /api/test/field-changes/generate/{date}?count=3` - Generate test data for a date (creates Equipment, LotoPoint, FileObject changes)
- `GET /api/test/field-changes/count/{date}` - Get change count for a date
- `GET /api/test/field-changes/{entityType}/{entityId}` - Get changes for specific entity
- `GET /api/test/field-changes/summary` - Get summary of all test data
- `DELETE /api/test/field-changes` - Clear all test data
- `DELETE /api/test/field-changes/{date}` - Clear test data for specific date

Test data uses:
- Machine ID: `TEST-MACHINE`
- Entity IDs: 900000+ range (to avoid conflicts)
- Entity types: Equipment, LotoPoint, FileObject

### Automation Tests
**Files:**
- `automation-test/pages/sync.page.ts` - Page object for sync functionality
- `automation-test/tests/sync/partial-sync.spec.ts` - Integration tests

### Running the Tests

1. Start the sync server (default port 8090):
   ```bash
   cd sync-server
   mvn spring-boot:run
   ```

2. Start the client backend (default port 8080):
   ```bash
   cd power_plant_java
   mvn spring-boot:run
   ```

3. Start the Angular frontend (default port 4200):
   ```bash
   cd power_plant_java/frontend
   npm start
   ```

4. Run the tests:
   ```bash
   cd power_plant_java/automation-test
   npx playwright test tests/sync/partial-sync.spec.ts
   ```

### Configuration
All URLs are centralized in `automation-test/test.config.ts` and can be overridden via environment variables:
- `SYNC_SERVER_URL` (default: see test.config.ts)
- `CLIENT_BACKEND_URL` (default: see test.config.ts)
- `BASE_URL` (default: see test.config.ts)

### Test Scenarios

1. **Test Data Creation on Sync Server**
   - Creates backdated field changes
   - Creates data at multiple dates
   - Clears test data for specific dates

2. **Partial Sync Available Dates**
   - Retrieves available sync dates from client

3. **Partial Sync Preview**
   - Previews changes for a specific date

4. **Full Partial Sync Flow**
   - Creates test data
   - Previews partial sync
   - Executes partial sync
   - Verifies sync health

5. **End-to-End Verification**
   - Complete flow with all verification steps

---

## Self-Sustaining E2E Tests

These tests create real entity graphs via backend API (`/api/sync-e2e/seed`), sync them to the server, and verify relationships survive the round-trip. No pre-existing data needed.

### Backend Infrastructure

- **SyncE2ETestService** — Seeds entity graphs (Categories → Values → Equipment → LotoPoints → LotoStandards), verifies, cleans up
- **SyncE2ETestController** — REST endpoints at `/api/sync-e2e/*`

### Entity Creation Tests

Test file: `sync-entity-creation.spec.ts` | Run: `npm run test:sync-e2e`

| # | Test | What happens |
|---|------|-------------|
| 1 | Category + Value graph | Seed 3 categories + values → sync → verify on server |
| 2 | Equipment with relationships | Seed equipment with ManyToOne Value refs → sync → verify |
| 3 | LotoPoints with all relationships | Seed points with isoPos, normPos, eqType, location → sync → verify |
| 4 | LotoStandards with ManyToMany | Seed standards × lotoPoints each → sync → verify join table data |
| 5 | Entity counts match | After full seed + sync → health check shows matching counts |

### Relationship Preservation Tests

Test file: `sync-relationship-preservation.spec.ts` | Run: `npm run test:sync-e2e`

| # | Test | What happens |
|---|------|-------------|
| 1 | ManyToMany: LotoStandard ↔ LotoPoint | Create standard with points → sync → verify all linked |
| 2 | ManyToOne: LotoPoint → Value | Create point with 4 Value refs → sync → verify all correct |
| 3 | ManyToMany: LotoStandard groups | Create standard with group Values → sync → verify groups intact |
| 4 | lotoPointOrder JSON | Create standard with ordered points → sync → verify JSON matches |
| 5 | Category → Value | Create category with values → sync → verify parent relationship |
| 6 | Internal consistency | Verify all cross-references within seeded graph are consistent |

### Deduplication Tests

Test file: `sync-deduplication.spec.ts` | Run: `npm run test:sync-dedup`

| # | Test | What happens |
|---|------|-------------|
| 1 | Seed duplicates | Create "Test EqType" + "test eqtype" with overlapping Values |
| 2 | Trigger dedup | Sync → afterCommit fires `mergeIfDuplicatesExist()` |
| 3 | Verify merge | Canonical Category keeps all unique Values, duplicate soft-deleted |
| 4 | Verify re-pointing | Values re-pointed to canonical Category |
| 5 | Downstream update | LotoPoints/Equipment referencing duplicates now point to canonical |

### Volume Stress Tests

Test file: `sync-stress-volume.spec.ts` | Run: `npm run test:sync-stress`

Scale: `SYNC_STRESS_SCALE` env var (default 1000, max 20000)

| # | Test | What happens |
|---|------|-------------|
| 1 | Bulk sync | Seed N LotoStandards × 3 points → sync → verify counts |
| 2 | Throughput benchmarks | Run at 100/500/1000 → log creation time, sync time, changes/sec |
| 3 | Large ManyToMany | 1 LotoStandard with 50 LotoPoints → sync → verify all present |
| 4 | Batch pagination | Seed >500 changes → verify all reach server |

### Concurrency Stress Tests

Test file: `sync-stress-concurrency.spec.ts` | Run: `npm run test:sync-concurrency`

Simulates concurrent clients via direct HTTP POST to sync server with unique `X-Machine-Id` headers.

| # | Test | What happens |
|---|------|-------------|
| 1 | 10 concurrent clients | 10 × 50 changes → verify all stored |
| 2 | 50 concurrent clients | 50 × 20 changes → verify no data loss |
| 3 | 100 concurrent clients | 100 × 10 changes → verify under 60s |
| 4 | LWW conflict resolution | 10 clients same field → verify latest timestamp wins |
| 5 | Client-side sync guard | 5 concurrent trigger requests → AtomicBoolean guard prevents overlap |

### Running E2E Tests

```bash
cd automation-test

# All entity creation + relationship + dedup tests
npm run test:sync-e2e

# All stress tests (volume + concurrency)
npm run test:sync-stress

# Individual suites
npm run test:sync-dedup
npm run test:sync-concurrency

# Custom scale for volume stress
SYNC_STRESS_SCALE=20000 npm run test:sync-stress
```
