import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';
import { config } from '../../test.config';

/**
 * Bulk Sync Operations Tests
 *
 * Tests synthetic data generation, sync pipeline throughput, and performance.
 * Uses SyncTestController's generate/sync/verify pipeline.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Bulk Sync Operations', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  test.afterAll(async ({ request }) => {
    try {
      await request.delete(`${config.clientBackendUrl}/api/sync-test/clear`);
    } catch { /* ignore */ }
  });

  test.describe('Test Data Generation', () => {
    test.afterEach(async () => {
      await syncPage.clearSyncTestData();
    });

    test('should generate BULK_CREATE changes', async () => {
      const result = await syncPage.generateTestData(50, 'BULK_CREATE');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(50);

      console.log(`Generated ${result.count} BULK_CREATE changes`);
    });

    test('should generate BULK_UPDATE changes', async () => {
      const result = await syncPage.generateTestData(50, 'BULK_UPDATE');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(50);

      console.log(`Generated ${result.count} BULK_UPDATE changes`);
    });

    test('should generate MIXED changes', async () => {
      const result = await syncPage.generateMixedTestData(30, 20, 10);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(60);

      console.log(`Generated ${result.count} MIXED changes (30 creates, 20 updates, 10 deletes)`);
    });
  });

  test.describe('Sync and Verify', () => {
    test.setTimeout(60000);

    test('should sync generated data to server', async () => {
      // Generate some data first
      await syncPage.generateTestData(20, 'BULK_CREATE');

      // Trigger sync
      const syncResult = await syncPage.triggerTestSync();

      expect(syncResult).toBeDefined();
      expect(syncResult.success).toBe(true);

      console.log(`Sync result: ${syncResult.message}`);

      // Clean up
      await syncPage.clearSyncTestData();
    });

    test('should run full cycle end-to-end', async () => {
      const result = await syncPage.runFullTestCycle(50, 'BULK_CREATE');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      console.log(`Full cycle: ${result.message}`);
      if (result.durationMs) {
        console.log(`Duration: ${result.durationMs}ms`);
      }

      // Clean up
      await syncPage.clearSyncTestData();
    });
  });

  test.describe('Metrics and History', () => {
    test('should return test metrics', async () => {
      // Generate some data to ensure metrics are populated
      await syncPage.generateTestData(10, 'BULK_CREATE');

      const metrics = await syncPage.getSyncTestMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalGenerated).toBeGreaterThan(0);

      console.log('Test metrics:', JSON.stringify(metrics));

      // Clean up
      await syncPage.clearSyncTestData();
    });

    test('should return test status', async () => {
      const status = await syncPage.getSyncTestStatus();

      expect(status).toBeDefined();

      console.log('Test status:', JSON.stringify(status));
    });

    test('should return test history', async () => {
      const history = await syncPage.getSyncTestHistory();

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);

      console.log(`Test history: ${history.length} entries`);
    });
  });

  test.describe('Cleanup', () => {
    test('should clear all synthetic test data', async () => {
      // Generate data
      await syncPage.generateTestData(10, 'BULK_CREATE');

      // Verify data exists
      let status = await syncPage.getSyncTestStatus();
      expect(status.testDataCount).toBeGreaterThan(0);

      // Clear
      const clearResult = await syncPage.clearSyncTestData();
      expect(clearResult.success).toBe(true);

      // Verify cleared
      status = await syncPage.getSyncTestStatus();
      expect(status.testDataCount).toBe(0);

      console.log('Test data cleared successfully');
    });
  });

  test.describe('Performance', () => {
    test.setTimeout(30000);

    test('should sync 100 changes within performance threshold', async () => {
      const start = Date.now();

      const result = await syncPage.runFullTestCycle(100, 'BULK_CREATE');

      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Under 10 seconds

      console.log(`100 changes synced in ${duration}ms`);

      // Clean up
      await syncPage.clearSyncTestData();
    });
  });
});
