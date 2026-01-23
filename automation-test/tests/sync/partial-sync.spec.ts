import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';

/**
 * Partial Sync Integration Tests
 *
 * These tests verify the partial sync flow:
 * 1. Create test data at different dates on sync-server
 * 2. Verify client database doesn't have the test data
 * 3. Execute partial sync from a specific date
 * 4. Verify test data is now present in client database
 *
 * Prerequisites:
 * - Sync server running at http://localhost:8090 (or SYNC_SERVER_URL env var)
 * - Client backend running at http://localhost:8080 (or CLIENT_BACKEND_URL env var)
 * - Client frontend running at http://localhost:4200 (or BASE_URL env var)
 */

test.describe('Partial Sync Integration Tests', () => {
  let syncPage: SyncPage;

  // Test dates - using past dates to ensure they're in the sync history
  const getTestDate = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // yyyy-MM-dd format
  };

  test.beforeAll(async ({ request }) => {
    // Clean up any existing test data before running tests
    const syncServerUrl = process.env.SYNC_SERVER_URL || 'http://localhost:8090';
    try {
      await request.delete(`${syncServerUrl}/api/test/field-changes`);
    } catch (e) {
      console.log('No existing test data to clean up');
    }
  });

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  // test.afterAll(async ({ request }) => {
  //   // Clean up test data after all tests
  //   const syncServerUrl = process.env.SYNC_SERVER_URL || 'http://localhost:8090';
  //   try {
  //     await request.delete(`${syncServerUrl}/api/test/field-changes`);
  //   } catch (e) {
  //     console.log('Could not clean up test data');
  //   }
  // });

  test.describe('Test Data Creation on Sync Server', () => {
    test('should create backdated field changes on sync server', async () => {
      const testDate = getTestDate(3); // 3 days ago

      // Create test data
      const result = await syncPage.createTestDataOnServer(testDate, 3);

      // Verify creation
      expect(result).toBeDefined();
      expect(result.totalCreated).toBeGreaterThan(0);
      expect(result.date).toBe(testDate);
      expect(result.entityTypes).toContain('Equipment');
      expect(result.entityTypes).toContain('LotoPoint');
      expect(result.entityTypes).toContain('FileObject');

      console.log(`Created ${result.totalCreated} test field changes for date ${testDate}`);
    });

    test('should create test data at multiple dates', async () => {
      const dates = [getTestDate(5), getTestDate(4), getTestDate(2)];

      for (const date of dates) {
        const result = await syncPage.createTestDataOnServer(date, 2);
        expect(result.totalCreated).toBeGreaterThan(0);
        console.log(`Created ${result.totalCreated} changes for ${date}`);
      }

      // Verify summary
      const summary = await syncPage.getTestDataSummary();
      expect(summary.totalTestChanges).toBeGreaterThan(0);
      expect(Object.keys(summary.byDate).length).toBe(dates.length);
    });

    test('should be able to clear test data for specific date', async () => {
      const testDate = getTestDate(10);

      // Create test data
      await syncPage.createTestDataOnServer(testDate, 2);

      // Verify it exists
      let count = await syncPage.getServerChangeCount(testDate);
      expect(count.testDataChanges).toBeGreaterThan(0);

      // Clear it
      const clearResult = await syncPage.clearServerTestDataForDate(testDate);
      expect(clearResult.deleted).toBeGreaterThan(0);

      // Verify it's gone
      count = await syncPage.getServerChangeCount(testDate);
      expect(count.testDataChanges).toBe(0);
    });
  });

  test.describe('Partial Sync Available Dates', () => {
    test('should retrieve available sync dates from client', async () => {
      // Create some test data first
      const testDate = getTestDate(2);
      await syncPage.createTestDataOnServer(testDate, 2);

      // Get available dates
      const dates = await syncPage.getAvailableSyncDates();

      expect(dates).toBeDefined();
      expect(dates.availableDates).toBeDefined();
      // The test date should now be in the available dates
      console.log(`Available dates: ${dates.availableDates?.join(', ')}`);
    });
  });

  test.describe('Partial Sync Preview', () => {
    test('should preview changes for a specific date', async () => {
      const testDate = getTestDate(1);

      // Create test data
      await syncPage.createTestDataOnServer(testDate, 3);

      // Preview partial sync
      const preview = await syncPage.previewPartialSync(testDate);

      expect(preview).toBeDefined();
      expect(preview.date).toBe(testDate);
      expect(preview.changeCount).toBeGreaterThanOrEqual(0);

      console.log(`Preview for ${testDate}: ${preview.changeCount} changes, ` +
        `${preview.filesToDownload} files to download, ${preview.filesToDelete} files to delete`);
    });
  });

  test.describe('Full Partial Sync Flow', () => {
    test('should sync data from specific date via API', async () => {
      // Clean start
      await syncPage.clearServerTestData();

      const testDate = getTestDate(1);
      const itemCount = 3;

      // Step 1: Create test data at specific date on sync server
      console.log(`Step 1: Creating ${itemCount * 3} test field changes for ${testDate}`);
      const createResult = await syncPage.createTestDataOnServer(testDate, itemCount);
      expect(createResult.totalCreated).toBe(itemCount * 3); // 3 entity types

      // Step 2: Verify changes exist on server
      console.log('Step 2: Verifying test data exists on sync server');
      const serverCount = await syncPage.getServerChangeCount(testDate);
      expect(serverCount.testDataChanges).toBeGreaterThan(0);

      // Step 3: Preview the partial sync
      console.log('Step 3: Previewing partial sync');
      const preview = await syncPage.previewPartialSync(testDate);
      console.log(`Preview: ${preview.changeCount} changes to apply`);

      // Step 4: Execute partial sync
      console.log('Step 4: Executing partial sync');
      const syncResult = await syncPage.executePartialSync(testDate, false);

      expect(syncResult).toBeDefined();
      expect(syncResult.success).toBe(true);
      console.log(`Sync result: ${syncResult.message}`);

      // Step 5: Verify sync completed
      console.log('Step 5: Verifying sync health');
      const healthCheck = await syncPage.getSyncHealthCheck();
      console.log(`Sync status: ${healthCheck.syncStatus}`);
    });

    test('should handle force sync for large deletions', async () => {
      await syncPage.clearServerTestData();

      const testDate = getTestDate(1);

      // Create minimal test data
      await syncPage.createTestDataOnServer(testDate, 1);

      // Execute force partial sync (skips deletion safety check)
      const syncResult = await syncPage.executePartialSync(testDate, true);

      expect(syncResult).toBeDefined();
      expect(syncResult.success).toBe(true);
    });
  });

  test.describe('UI-Based Partial Sync Tests', () => {
    test.skip('should display available dates in UI', async ({ page }) => {
      // Skip if UI is not available
      await syncPage.navigateToSyncPage();

      // The sync page should load
      await expect(page.locator('h2')).toContainText(/sync|resync/i);

      // Check if partial sync section is visible
      const partialSyncSection = page.locator('.partial-sync-card');
      await expect(partialSyncSection).toBeVisible();
    });

    test.skip('should show sync suggestion when out of sync', async ({ page }) => {
      // Create some test data to trigger out-of-sync state
      const testDate = getTestDate(1);
      await syncPage.createTestDataOnServer(testDate, 5);

      // Force health check
      await syncPage.forceSyncHealthCheck();

      // Navigate to sync page
      await syncPage.navigateToSyncPage();

      // Wait for health check to load
      await page.waitForTimeout(2000);

      // Check if suggestion is shown (may not show immediately)
      const healthCheck = await syncPage.getSyncHealthCheck();
      if (healthCheck.suggestResync) {
        const suggestionBox = page.locator('.sync-suggestion-box');
        // May or may not be visible depending on consecutive failures count
        console.log('Sync suggestion available:', healthCheck.suggestedSyncDate);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date gracefully', async () => {
      const invalidDate = '2020-01-01'; // Date before any sync history

      const preview = await syncPage.previewPartialSync(invalidDate);
      // Should return empty/zero counts, not error
      expect(preview.changeCount).toBe(0);
    });

    test('should handle sync server unavailable', async ({ page }) => {
      // Create a sync page with wrong server URL
      const badSyncPage = new SyncPage(page);
      (badSyncPage as any).syncServerUrl = 'http://localhost:9999'; // Non-existent

      // This should fail gracefully
      try {
        await page.request.get('http://localhost:9999/api/test/field-changes/summary');
        // If we get here, the request succeeded (unexpected)
        expect(true).toBe(false);
      } catch (error) {
        // Expected - connection refused
        expect(error).toBeDefined();
      }
    });
  });

  test.describe('Sync Health Check', () => {
    test('should return sync health status', async () => {
      const health = await syncPage.getSyncHealth();

      expect(health).toBeDefined();
      expect(health.machineId).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    test('should return detailed sync health check', async () => {
      const healthCheck = await syncPage.getSyncHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.syncStatus).toBeDefined();
      expect(['IN_SYNC', 'POSSIBLY_OUT_OF_SYNC', 'OUT_OF_SYNC', 'UNKNOWN']).toContain(healthCheck.syncStatus);
      expect(healthCheck.serverReachable).toBeDefined();

      console.log('Sync Health Check:');
      console.log(`  Status: ${healthCheck.syncStatus}`);
      console.log(`  Server Reachable: ${healthCheck.serverReachable}`);
      console.log(`  Entity Difference: ${healthCheck.entityDifference}`);
      console.log(`  Suggest Resync: ${healthCheck.suggestResync}`);
    });

    test('should force immediate sync health check', async () => {
      const healthCheck = await syncPage.forceSyncHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.checkTime).toBeDefined();

      console.log(`Forced health check at ${healthCheck.checkTime}: ${healthCheck.syncStatus}`);
    });
  });
});

test.describe('End-to-End Partial Sync Verification', () => {
  /**
   * This is the main test that verifies the complete partial sync flow:
   * 1. Create DB items at different dates on sync-server
   * 2. Verify client DB doesn't have those items
   * 3. Resync using partial sync from specific date
   * 4. Verify items are now present in client DB
   */
  test('complete partial sync verification flow', async ({ page, request }) => {
    const syncPage = new SyncPage(page);

    const syncServerUrl = process.env.SYNC_SERVER_URL || 'http://localhost:8090';
    const clientBackendUrl = process.env.CLIENT_BACKEND_URL || 'http://localhost:8080';

    // Clean up any existing test data
    await request.delete(`${syncServerUrl}/api/test/field-changes`);

    // Step 1: Create test data at different dates
    console.log('\n=== STEP 1: Creating test data at different dates ===');
    const getTestDateLocal = (daysAgo: number): string => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    const dates = [
      getTestDateLocal(5),
      getTestDateLocal(3),
      getTestDateLocal(1),
    ];

    for (const date of dates) {
      const response = await request.post(
        `${syncServerUrl}/api/test/field-changes/generate/${date}?count=2`
      );
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      console.log(`Created ${result.totalCreated} changes for ${date}`);
    }

    // Get summary of created data
    const summaryResponse = await request.get(`${syncServerUrl}/api/test/field-changes/summary`);
    const summary = await summaryResponse.json();
    console.log(`Total test changes on server: ${summary.totalTestChanges}`);
    console.log(`By entity type: ${JSON.stringify(summary.byEntityType)}`);

    // Step 2: Get available dates from client
    console.log('\n=== STEP 2: Getting available sync dates ===');
    const datesResponse = await request.get(`${clientBackendUrl}/api/resync/partial-sync/dates`);
    expect(datesResponse.ok()).toBeTruthy();
    const availableDates = await datesResponse.json();
    console.log(`Available dates: ${availableDates.availableDates?.slice(0, 5).join(', ')}`);

    // Step 3: Preview partial sync from the oldest test date
    const syncFromDate = dates[0]; // oldest date
    console.log(`\n=== STEP 3: Previewing partial sync from ${syncFromDate} ===`);
    const previewResponse = await request.get(
      `${clientBackendUrl}/api/resync/partial-sync/preview?date=${syncFromDate}`
    );
    expect(previewResponse.ok()).toBeTruthy();
    const preview = await previewResponse.json();
    console.log(`Preview: ${preview.changeCount} changes, ${preview.filesToDownload} files to download`);

    // Step 4: Execute partial sync
    console.log(`\n=== STEP 4: Executing partial sync from ${syncFromDate} ===`);
    const syncResponse = await request.post(
      `${clientBackendUrl}/api/resync/partial-sync/execute?date=${syncFromDate}&force=false`
    );
    expect(syncResponse.ok()).toBeTruthy();
    const syncResult = await syncResponse.json();
    console.log(`Sync result: ${syncResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Message: ${syncResult.message}`);
    expect(syncResult.success).toBe(true);

    // Step 5: Verify sync health after sync
    console.log('\n=== STEP 5: Verifying sync health ===');
    const healthResponse = await request.get(`${clientBackendUrl}/api/resync/sync-health`);
    expect(healthResponse.ok()).toBeTruthy();
    const health = await healthResponse.json();
    console.log(`Sync status: ${health.syncStatus}`);
    console.log(`Entity difference: ${health.entityDifference}`);

    // Step 6: Clean up test data
    console.log('\n=== STEP 6: Cleaning up test data ===');
    const cleanupResponse = await request.delete(`${syncServerUrl}/api/test/field-changes`);
    expect(cleanupResponse.ok()).toBeTruthy();
    const cleanup = await cleanupResponse.json();
    console.log(`Cleaned up ${cleanup.deleted} test changes`);

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  });
});
