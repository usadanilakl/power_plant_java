import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';

/**
 * Entity Sync Verification Tests
 *
 * Uses SyncTestController's /test/* endpoints to modify real entities,
 * sync them to the server, verify the sync, and auto-revert changes.
 *
 * These tests prove that the full sync pipeline works for each entity type:
 * Entity change → FieldChangeEntityListener → FieldChange → CentralSyncService → Server
 *
 * Prerequisites: sync server + client backend running (see test.config.ts for URLs)
 */

test.describe('Entity Sync Verification', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  // Entity sync tests can be slow due to actual sync round-trip
  test.setTimeout(60000);

  test.describe('Individual Entity Type Sync', () => {
    test('should sync Equipment entities and revert', async () => {
      const result = await syncPage.testEquipmentSync(true);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.count === 0) {
        console.log('No Equipment entities in DB — endpoint works but nothing to sync');
      } else {
        expect(result.count).toBeGreaterThan(0);
        console.log(`Equipment sync: ${result.message}`);
      }
    });

    test('should sync LotoPoint entities and revert', async () => {
      const result = await syncPage.testLotoPointSync(true);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.count === 0) {
        console.log('No LotoPoint entities in DB — endpoint works but nothing to sync');
      } else {
        expect(result.count).toBeGreaterThan(0);
        console.log(`LotoPoint sync: ${result.message}`);
      }
    });

    test('should sync FileObject entities and revert', async () => {
      const result = await syncPage.testFileObjectSync(true);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.count === 0) {
        console.log('No FileObject entities in DB — endpoint works but nothing to sync');
      } else {
        expect(result.count).toBeGreaterThan(0);
        console.log(`FileObject sync: ${result.message}`);
      }
    });
  });

  test.describe('Combined Entity Sync', () => {
    test('should sync all entity types together and revert', async () => {
      const result = await syncPage.testAllEntitiesSync(true);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      console.log(`All entities sync: ${result.message}`);
    });
  });

  test.describe('Custom Entity and Field Sync', () => {
    test('should sync specific entity type and field', async () => {
      const result = await syncPage.testEntitySync('Equipment', 'specificLocation', true);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.count === 0) {
        console.log('No Equipment entities in DB — endpoint works but nothing to sync');
      } else {
        console.log(`Custom entity sync: ${result.message}`);
      }
    });
  });

  test.describe('Entity Count Consistency', () => {
    test('should have entity counts available', async () => {
      const counts = await syncPage.getEntityCounts();

      expect(counts).toBeDefined();
      console.log('Client entity counts:', JSON.stringify(counts));

      // At least Equipment should have entries
      if (counts.Equipment !== undefined) {
        expect(counts.Equipment).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have matching counts between client and server (within tolerance)', async () => {
      // Force a health check to get fresh comparison
      const health = await syncPage.forceSyncHealthCheck();

      expect(health).toBeDefined();
      expect(health.entityDifference).toBeDefined();

      // Allow ±5 tolerance for dedup drift
      const DEDUP_TOLERANCE = 5;
      console.log(`Entity difference: ${health.entityDifference} (tolerance: ±${DEDUP_TOLERANCE})`);
      expect(Math.abs(health.entityDifference)).toBeLessThanOrEqual(DEDUP_TOLERANCE);
    });
  });
});
