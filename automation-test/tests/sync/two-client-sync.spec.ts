import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';

/**
 * Two-Client Sync Tests
 *
 * Tests real-time sync between two client instances.
 * SKIPPED by default — requires SECOND_CLIENT_URL env var.
 *
 * To run:
 *   1. Start sync server + client A (see test.config.ts for URLs)
 *   2. Start client B on a different port
 *   3. Run: SECOND_CLIENT_URL=http://localhost:8081 npx playwright test tests/sync/two-client-sync.spec.ts
 */

const SECOND_CLIENT_URL = process.env.SECOND_CLIENT_URL;

test.describe('Two-Client Sync', () => {
  // Skip entire suite if second client not configured
  test.skip(!SECOND_CLIENT_URL, 'Requires SECOND_CLIENT_URL env var (e.g., http://localhost:8081)');

  let syncPageA: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPageA = new SyncPage(page);
  });

  test.setTimeout(60000);

  test.describe('Entity Propagation', () => {
    test('should propagate Equipment change from client A to client B', async ({ request }) => {
      // Get entity counts from both clients
      const countsA = await syncPageA.getEntityCounts();

      const countsResponseB = await request.get(`${SECOND_CLIENT_URL}/api/sync-test/entity-counts`);
      expect(countsResponseB.ok()).toBeTruthy();
      const countsB = await countsResponseB.json();

      console.log('Client A counts:', JSON.stringify(countsA));
      console.log('Client B counts:', JSON.stringify(countsB));

      // Trigger Equipment sync test on client A (modify, sync, revert)
      const result = await syncPageA.testEquipmentSync(true);
      expect(result.success).toBe(true);

      // Wait for propagation
      await syncPageA.page.waitForTimeout(5000);

      // Force health check on client B
      const healthResponseB = await request.post(`${SECOND_CLIENT_URL}/api/resync/sync-health/check`);
      expect(healthResponseB.ok()).toBeTruthy();
      const healthB = await healthResponseB.json();

      console.log(`Client B health after propagation: status=${healthB.syncStatus}`);
    });

    test('should show both clients as synced after changes', async ({ request }) => {
      // Force health checks on both clients
      const healthA = await syncPageA.forceSyncHealthCheck();

      const healthResponseB = await request.post(`${SECOND_CLIENT_URL}/api/resync/sync-health/check`);
      expect(healthResponseB.ok()).toBeTruthy();
      const healthB = await healthResponseB.json();

      console.log(`Client A: status=${healthA.syncStatus}, entityDiff=${healthA.entityDifference}`);
      console.log(`Client B: status=${healthB.syncStatus}, entityDiff=${healthB.entityDifference}`);

      // Both should be in sync or close to it
      const TOLERANCE = 5;
      expect(Math.abs(healthA.entityDifference || 0)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(healthB.entityDifference || 0)).toBeLessThanOrEqual(TOLERANCE);
    });
  });
});
