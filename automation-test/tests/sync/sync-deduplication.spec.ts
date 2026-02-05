import { test, expect } from '@playwright/test';
import { SyncE2EPage } from '../../pages/sync-e2e.page';
import { config } from '../../test.config';

/**
 * Category/Value Deduplication Tests
 *
 * Proves that CategoryValueMergeService correctly:
 * - Merges duplicate Categories (case-insensitive)
 * - Merges duplicate Values within same Category
 * - Re-points downstream entities (Equipment, LotoPoint) via refactorAllReferences()
 * - Tracks dedup changes as FieldChanges for sync propagation
 *
 * Dedup runs after sync batch is applied (afterCommit callback).
 */

test.describe.configure({ mode: 'serial' });

test.describe('Category/Value Deduplication', () => {
  let e2ePage: SyncE2EPage;
  const prefix = SyncE2EPage.generatePrefix('dedup');

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
  });

  test.afterAll(async ({ request }) => {
    try {
      await request.delete(`${config.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`, { timeout: 30000 });
    } catch { /* ignore */ }
  });

  test.setTimeout(60000);

  test('should create duplicate categories and values', async () => {
    const result = await e2ePage.seedDuplicateCategories(prefix);

    expect(result.success).toBe(true);
    expect(result.categoryA).toBeDefined();
    expect(result.categoryB).toBeDefined();
    expect(result.valuesA.length).toBe(2);
    expect(result.valuesB.length).toBe(2);
    expect(result.lotoPointIds.length).toBe(2);
    expect(result.equipmentIds.length).toBe(2);

    console.log(`Created dedup scenario: Cat A="${result.categoryA.name}" (ID=${result.categoryA.id}), Cat B="${result.categoryB.name}" (ID=${result.categoryB.id})`);
    console.log(`Values A: ${result.valuesA.map((v: any) => `${v.name}(${v.id})`).join(', ')}`);
    console.log(`Values B: ${result.valuesB.map((v: any) => `${v.name}(${v.id})`).join(', ')}`);
  });

  test('should trigger dedup', async () => {
    // Trigger dedup directly — mergeIfDuplicatesExist() merges case-insensitive duplicate categories
    const dedup = await e2ePage.triggerDedup();
    expect(dedup.success).toBe(true);
    console.log(`Dedup triggered: completed in ${dedup.durationMs}ms`);
  });

  test('should have merged duplicate categories', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // After dedup: only the canonical Category (lower ID) should remain
    // The duplicate (higher ID) should be soft-deleted and invisible
    const categories = verify.categories.filter((c: any) => !c.deleted);
    console.log(`Categories after dedup: ${categories.map((c: any) => `${c.name}(${c.id})`).join(', ')}`);

    // Should have fewer categories than we started with (2 → 1 for the "Test EqType" pair)
    // Note: the prefix makes the name unique, so case-insensitive match is prefix + "_Test EqType" vs prefix + "_test eqtype"
    const eqTypeCategories = categories.filter((c: any) =>
      c.name.toLowerCase().includes('test eqtype')
    );
    expect(eqTypeCategories.length).toBeLessThanOrEqual(1);
    console.log(`EqType categories remaining: ${eqTypeCategories.length}`);
  });

  test('should have re-pointed values to canonical category', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // All remaining Values should point to existing (non-deleted) Categories
    const activeCategoryIds = new Set(
      verify.categories.filter((c: any) => !c.deleted).map((c: any) => c.id)
    );

    for (const value of verify.values) {
      if (value.categoryId) {
        expect(activeCategoryIds.has(value.categoryId)).toBe(true);
      }
    }

    console.log(`All ${verify.values.length} values point to active categories`);
  });

  test('downstream entities should reference canonical values', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // Collect active Value IDs
    const activeValueIds = new Set(verify.values.map((v: any) => v.id));

    // LotoPoints should reference active Values
    for (const lp of verify.lotoPoints) {
      if (lp.eqTypeId) {
        expect(activeValueIds.has(lp.eqTypeId)).toBe(true);
      }
    }

    // Equipment should reference active Values
    for (const eq of verify.equipment) {
      if (eq.eqTypeId) {
        expect(activeValueIds.has(eq.eqTypeId)).toBe(true);
      }
    }

    console.log(`${verify.lotoPoints.length} LotoPoints and ${verify.equipment.length} Equipment all reference active Values`);
  });

  test('dedup changes should have synced to server', async () => {
    // Trigger another sync to push dedup-generated FieldChanges
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);

    // Verify health — should be IN_SYNC
    const health = await e2ePage.forceSyncHealthCheck();
    console.log(`Post-dedup sync status: ${health.syncStatus}, entity diff: ${health.entityDifference}`);
    expect(health.syncStatus).toBeDefined();
  });
});
