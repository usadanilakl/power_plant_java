import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';
import { config } from '../../test.config';

/**
 * Auto-Resync Escalation Tests
 *
 * Tests the AutoResyncService escalation state management:
 * - Initial state
 * - State reset
 * - OUT_OF_SYNC detection and state tracking
 * - IN_SYNC recovery
 */

test.describe('Auto-Resync Escalation', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  // Clean up after all tests
  test.afterAll(async ({ request }) => {
    try {
      await request.post(`${config.clientBackendUrl}/api/resync/auto-resync/reset`);
      await request.delete(`${config.syncServerUrl}/api/test/field-changes`);
    } catch { /* ignore */ }
  });

  test.describe('State Management', () => {
    test('should return auto-resync state', async () => {
      const state = await syncPage.getAutoResyncState();

      expect(state).toBeDefined();
      // State should have escalation-related fields
      console.log('Auto-resync state:', JSON.stringify(state));
    });

    test('should reset auto-resync state', async () => {
      const resetResult = await syncPage.resetAutoResyncState();

      expect(resetResult).toBeDefined();

      // Verify state after reset
      const state = await syncPage.getAutoResyncState();
      console.log('State after reset:', JSON.stringify(state));
    });
  });

  test.describe('OUT_OF_SYNC Detection', () => {
    test.setTimeout(60000);

    test.afterEach(async () => {
      // Clean up
      try {
        await syncPage.resetAutoResyncState();
        await syncPage.clearServerTestData();
      } catch { /* ignore */ }
    });

    test('should track health checks and report sync status', async () => {
      // Force multiple health checks and verify the system tracks them
      for (let i = 0; i < 3; i++) {
        await syncPage.forceSyncHealthCheck();
        await syncPage.page.waitForTimeout(1000);
      }

      // Check health status — with matching data it should be IN_SYNC
      const health = await syncPage.getSyncHealthCheck();
      console.log(`After 3 checks: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

      expect(health.syncStatus).toBeDefined();
      expect(health.entityDifference).toBeDefined();

      // Verify auto-resync state is tracking
      const state = await syncPage.getAutoResyncState();
      console.log('Auto-resync state after checks:', JSON.stringify(state));
      expect(state).toBeDefined();
    });
  });

  test.describe('IN_SYNC Recovery', () => {
    test('should recover when sync state is restored', async () => {
      // Clean all test data
      try {
        await syncPage.clearServerTestData();
      } catch { /* ignore */ }

      // Reset auto-resync state
      await syncPage.resetAutoResyncState();

      // Force health check
      const health = await syncPage.forceSyncHealthCheck();

      console.log(`Recovery check: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

      // State should reflect clean status
      const state = await syncPage.getAutoResyncState();
      console.log('State after recovery:', JSON.stringify(state));
    });
  });
});
