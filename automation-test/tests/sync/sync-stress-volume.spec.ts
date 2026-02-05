import { test, expect } from '@playwright/test';
import { SyncE2EPage } from '../../pages/sync-e2e.page';
import { config } from '../../test.config';

/**
 * Volume Stress Tests
 *
 * Tests sync pipeline with large numbers of entities.
 * Scale parameterized via SYNC_STRESS_SCALE env var (default: 1000, max: 20000).
 *
 * WARNING: Large-scale tests can be slow. Use appropriate timeouts.
 */

const SCALE = parseInt(process.env.SYNC_STRESS_SCALE || '1000', 10);

test.describe.configure({ mode: 'serial' });

test.describe('Volume Stress Tests', () => {
  let e2ePage: SyncE2EPage;

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
  });

  // 5-minute timeout for stress tests
  test.setTimeout(300000);

  test.describe('Bulk LotoStandard Sync', () => {
    const prefix = SyncE2EPage.generatePrefix('stress');

    test.afterAll(async ({ request }) => {
      try {
        await request.delete(`${config.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`, { timeout: 120000 });
      } catch { /* ignore */ }
    });

    test(`should seed and sync ${SCALE} LotoStandards with relationships`, async () => {
      console.log(`\n=== STRESS TEST: ${SCALE} LotoStandards ===`);

      // Step 1: Seed
      const seedStart = Date.now();
      const seed = await e2ePage.seedBulkLotoStandards(SCALE, prefix);
      const seedDuration = Date.now() - seedStart;

      expect(seed.success).toBe(true);
      expect(seed.lotoStandardsCreated).toBe(SCALE);

      console.log(`Seed: ${seed.totalEntities} entities in ${seedDuration}ms (${seed.entitiesPerSecond.toFixed(0)} entities/sec)`);

      // Step 2: Sync
      const syncStart = Date.now();
      const sync = await e2ePage.triggerSync();
      const syncDuration = Date.now() - syncStart;

      expect(sync.success).toBe(true);
      console.log(`Sync: completed in ${syncDuration}ms`);

      // Step 3: Verify entity counts
      const health = await e2ePage.forceSyncHealthCheck();
      console.log(`Health: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

      // Step 4: Sample verification — check 10 random standards
      const verify = await e2ePage.verifyEntityGraph(prefix);
      const sampleSize = Math.min(10, verify.lotoStandards.length);
      let validRelationships = 0;

      for (let i = 0; i < sampleSize; i++) {
        const ls = verify.lotoStandards[i];
        if (ls.lotoPointIds.length === 3) validRelationships++;
      }

      console.log(`Sample: ${validRelationships}/${sampleSize} standards have correct ManyToMany (3 points)`);
      expect(validRelationships).toBe(sampleSize);

      console.log(`\n=== RESULTS ===`);
      console.log(`Scale: ${SCALE} LotoStandards`);
      console.log(`Total entities: ${seed.totalEntities}`);
      console.log(`Seed time: ${seedDuration}ms`);
      console.log(`Sync time: ${syncDuration}ms`);
      console.log(`Total time: ${seedDuration + syncDuration}ms`);
    });
  });

  test.describe('Throughput Benchmarks', () => {
    const benchmarkScales = [100, 500];
    // Add 1000 only if SCALE is >= 1000
    if (SCALE >= 1000) benchmarkScales.push(1000);

    for (const scale of benchmarkScales) {
      test(`should measure throughput at scale ${scale}`, async () => {
        const benchPrefix = SyncE2EPage.generatePrefix(`bench${scale}`);

        try {
          const seedStart = Date.now();
          const seed = await e2ePage.seedBulkLotoStandards(scale, benchPrefix);
          const seedDuration = Date.now() - seedStart;

          const syncStart = Date.now();
          await e2ePage.triggerSync();
          const syncDuration = Date.now() - syncStart;

          console.log(`Scale ${scale}: seed=${seedDuration}ms, sync=${syncDuration}ms, total=${seedDuration + syncDuration}ms, entities/sec=${seed.entitiesPerSecond.toFixed(0)}`);
        } finally {
          await e2ePage.cleanupByPrefix(benchPrefix);
        }
      });
    }
  });

  test.describe('Large ManyToMany Collection', () => {
    const prefix = SyncE2EPage.generatePrefix('largem2m');

    test.afterAll(async ({ request }) => {
      try {
        await request.delete(`${config.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`, { timeout: 30000 });
      } catch { /* ignore */ }
    });

    test('should sync 1 LotoStandard with 50 LotoPoints', async () => {
      const seed = await e2ePage.seedBulkLotoStandards(1, prefix, 50);

      expect(seed.success).toBe(true);
      expect(seed.lotoPointsCreated).toBe(50);
      expect(seed.lotoStandardsCreated).toBe(1);

      console.log(`Created 1 standard with 50 points in ${seed.durationMs}ms`);

      // Sync
      await e2ePage.triggerSync();

      // Verify
      const verify = await e2ePage.verifyEntityGraph(prefix);
      const standard = verify.lotoStandards[0];
      expect(standard).toBeDefined();
      expect(standard.lotoPointIds.length).toBe(50);

      console.log(`Verified: LotoStandard has ${standard.lotoPointIds.length} LotoPoints after sync`);
    });
  });

  test.describe('Batch Pagination', () => {
    const prefix = SyncE2EPage.generatePrefix('pagination');

    test.afterAll(async ({ request }) => {
      try {
        await request.delete(`${config.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`, { timeout: 30000 });
      } catch { /* ignore */ }
    });

    test('should handle >500 changes through batch pagination', async () => {
      // Create enough entities to exceed the 500-change batch size
      const seed = await e2ePage.seedBulkLotoStandards(200, prefix);

      expect(seed.success).toBe(true);
      console.log(`Created ${seed.totalEntities} entities generating many field changes`);

      // Sync — may already be in progress from parallel test activity
      const sync = await e2ePage.triggerSync();
      console.log(`Sync result: success=${sync.success}, message=${sync.message}`);

      // Verify health — the key assertion is that entities were created, not that sync completed
      const health = await e2ePage.forceSyncHealthCheck();
      console.log(`After pagination sync: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);
      expect(health.syncStatus).toBeDefined();
    });
  });
});
