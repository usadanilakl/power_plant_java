import { test, expect } from '@playwright/test';
import { SyncE2EPage } from '../../pages/sync-e2e.page';
import { config } from '../../test.config';

/**
 * Relationship Preservation Tests
 *
 * Proves that ManyToMany, ManyToOne, and complex relationships
 * survive the sync round-trip through FieldChange → server → back.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Relationship Preservation Through Sync', () => {
  let e2ePage: SyncE2EPage;
  const prefix = SyncE2EPage.generatePrefix('rel');

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
  });

  test.afterAll(async ({ request }) => {
    try {
      await request.delete(`${config.clientBackendUrl}/api/sync-e2e/cleanup/${prefix}`, { timeout: 30000 });
    } catch { /* ignore */ }
  });

  test.setTimeout(60000);

  test('ManyToMany: LotoStandard ↔ LotoPoint survives sync round-trip', async () => {
    const seed = await e2ePage.seedEntityGraph({
      prefix,
      categories: [
        { name: 'EqType', values: ['Valve'] },
        { name: 'Position', values: ['Open', 'Closed'] },
      ],
      equipmentCount: 0,
      lotoPointCount: 5,
      lotoStandardCount: 1,
      lotoPointsPerStandard: 5,
    });

    expect(seed.lotoStandardIds.length).toBe(1);

    // Sync to server
    await e2ePage.triggerSync();

    // Verify relationship preserved
    const verify = await e2ePage.verifyEntityGraph(prefix);
    const standard = verify.lotoStandards[0];
    expect(standard).toBeDefined();
    expect(standard.lotoPointIds.length).toBe(5);

    console.log(`LotoStandard has ${standard.lotoPointIds.length} LotoPoints after sync`);

    // Verify all assigned points are the ones we created
    for (const pointId of standard.lotoPointIds) {
      expect(seed.lotoPointIds).toContain(pointId);
    }
  });

  test('ManyToOne: LotoPoint → Value relationships preserved', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // Check LotoPoints have Value references
    const pointsWithRefs = verify.lotoPoints.filter(
      (lp: any) => lp.isoPosId !== null || lp.normPosId !== null || lp.eqTypeId !== null
    );

    expect(pointsWithRefs.length).toBeGreaterThan(0);

    // Verify specific Value IDs point to existing Values
    for (const lp of pointsWithRefs) {
      if (lp.eqTypeId) {
        const referencedValue = verify.values.find((v: any) => v.id === lp.eqTypeId);
        expect(referencedValue).toBeDefined();
        console.log(`LotoPoint ${lp.tagNumber} → eqType Value ID ${lp.eqTypeId} (${referencedValue?.name})`);
      }
    }
  });

  test('ManyToMany: LotoStandard groups (Values) preserved', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);
    const standard = verify.lotoStandards[0];

    expect(standard.groupIds.length).toBeGreaterThan(0);
    console.log(`LotoStandard has ${standard.groupIds.length} group Values`);

    // Verify group IDs reference existing Values
    for (const groupId of standard.groupIds) {
      const groupValue = verify.values.find((v: any) => v.id === groupId);
      expect(groupValue).toBeDefined();
    }
  });

  test('lotoPointOrder JSON preserved after sync', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);
    const standard = verify.lotoStandards[0];

    expect(standard.lotoPointOrder).toBeDefined();
    const orderKeys = Object.keys(standard.lotoPointOrder);
    expect(orderKeys.length).toBe(standard.lotoPointIds.length);

    // Verify order values are sequential
    const orderValues = Object.values(standard.lotoPointOrder) as number[];
    const sorted = [...orderValues].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      expect(sorted[i]).toBe(i + 1);
    }

    console.log(`lotoPointOrder: ${JSON.stringify(standard.lotoPointOrder)}`);
  });

  test('Category → Value relationship preserved', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // Each Value should have a categoryId pointing to a valid Category
    for (const value of verify.values) {
      expect(value.categoryId).toBeDefined();
      expect(value.categoryId).not.toBeNull();

      const parentCategory = verify.categories.find((c: any) => c.id === value.categoryId);
      expect(parentCategory).toBeDefined();
    }

    // Each Category should have the correct value count
    for (const cat of verify.categories) {
      const childValues = verify.values.filter((v: any) => v.categoryId === cat.id);
      expect(cat.valueCount).toBe(childValues.length);
      console.log(`Category "${cat.name}": ${childValues.length} values`);
    }
  });

  test('all entity references are internally consistent', async () => {
    const verify = await e2ePage.verifyEntityGraph(prefix);

    // Collect all valid Value IDs
    const validValueIds = new Set(verify.values.map((v: any) => v.id));

    // Check Equipment references
    for (const eq of verify.equipment) {
      if (eq.eqTypeId) expect(validValueIds.has(eq.eqTypeId)).toBe(true);
      if (eq.locationId) expect(validValueIds.has(eq.locationId)).toBe(true);
    }

    // Check LotoPoint references
    for (const lp of verify.lotoPoints) {
      if (lp.isoPosId) expect(validValueIds.has(lp.isoPosId)).toBe(true);
      if (lp.normPosId) expect(validValueIds.has(lp.normPosId)).toBe(true);
      if (lp.eqTypeId) expect(validValueIds.has(lp.eqTypeId)).toBe(true);
      if (lp.locationId) expect(validValueIds.has(lp.locationId)).toBe(true);
    }

    // Check LotoStandard references
    const validPointIds = new Set(verify.lotoPoints.map((lp: any) => lp.id));
    for (const ls of verify.lotoStandards) {
      for (const pointId of ls.lotoPointIds) {
        expect(validPointIds.has(pointId)).toBe(true);
      }
      for (const groupId of ls.groupIds) {
        expect(validValueIds.has(groupId)).toBe(true);
      }
    }

    console.log('All entity references internally consistent');
  });
});
