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

### Environment Variables
- `SYNC_SERVER_URL` - Sync server URL (default: http://localhost:8090)
- `CLIENT_BACKEND_URL` - Client backend URL (default: http://localhost:8080)
- `BASE_URL` - Frontend URL (default: http://localhost:4200)

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
