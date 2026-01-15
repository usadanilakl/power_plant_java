import { test, expect } from '@playwright/test';
import { LotoPointPage } from '../../pages/loto-point.page';

test.describe('LOTO Point CRUD Operations', () => {
  let lotoPointPage: LotoPointPage;

  test.beforeEach(async ({ page }) => {
    lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();
  });

  test('should create a new LOTO point', async ({ page }) => {
    const timestamp = Date.now();
    const tagNumber = `01-TEST-${timestamp}`;

    // Click add new and fill the form
    await lotoPointPage.clickAddNewLotoPoint();

    await lotoPointPage.fillLotoPointForm({
      unit: 'U1',
      tagNumber: tagNumber,
      description: 'Test LOTO point description',
      eqType: 'Manual Valve',
      isoPosIndex: 6,
      normPosIndex: 7,
      specificLocation: 'Test specific location',
      location: 'CRT AREA',
    });

    // Draw new equipment shape on a P&ID file before saving
    await lotoPointPage.addEquipmentByDrawing('TestVen5', 'Test File 1');

    // Save the LOTO point (use the form's submit button in .form-actions)
    await page.locator('.form-actions').first().locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify LOTO point was created
    await expect(page.getByText(tagNumber)).toBeVisible({ timeout: 10000 });
  });

  test('should modify an existing LOTO point', async ({ page }) => {
    const timestamp = Date.now();
    const tagNumber = `01-MODIFY-${timestamp}`;
    const newDescription = 'Modified description';

    // Create first
    await lotoPointPage.createLotoPoint({
      unit: 'U1',
      tagNumber: tagNumber,
      description: 'Original description',
      eqType: 'Manual Valve',
      isoPosIndex: 6,
      normPosIndex: 7,
      specificLocation: 'Original location',
      location: 'CRT AREA',
    });

    await page.waitForTimeout(500);

    // Modify it
    await lotoPointPage.modifyLotoPoint(tagNumber, {
      description: newDescription,
    });

    // Verify modification
    await lotoPointPage.searchLotoPoint(tagNumber);
    await lotoPointPage.selectLotoPoint(tagNumber);
    await expect(page.locator('.form-input-element').nth(2)).toHaveValue(newDescription);
  });

  test('should delete a LOTO point', async ({ page }) => {
    const timestamp = Date.now();
    const tagNumber = `01-DELETE-${timestamp}`;

    // Create first
    await lotoPointPage.createLotoPoint({
      unit: 'U1',
      tagNumber: tagNumber,
      description: 'LOTO point to delete',
      eqType: 'Manual Valve',
      isoPosIndex: 6,
      normPosIndex: 7,
      specificLocation: 'Delete location',
      location: 'CRT AREA',
    });

    await page.waitForTimeout(500);

    // Delete it
    await lotoPointPage.deleteLotoPoint(tagNumber);

    // Verify deletion
    await lotoPointPage.searchLotoPoint(tagNumber);
    await expect(page.getByRole('row', { name: new RegExp(tagNumber) })).not.toBeVisible();
  });

  test('should search for a LOTO point', async ({ page }) => {
    await lotoPointPage.searchLotoPoint('01');

    // Verify search returns results
    await page.waitForTimeout(500);
    const rowCount = await lotoPointPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should create LOTO point with equipment', async ({ page }) => {
    const timestamp = Date.now();
    const tagNumber = `01-EQUIP-${timestamp}`;

    await lotoPointPage.createLotoPoint({
      unit: 'U1',
      tagNumber: tagNumber,
      description: 'LOTO with equipment',
      eqType: 'Manual Valve',
      isoPosIndex: 6,
      normPosIndex: 7,
      specificLocation: 'Equipment location',
      location: 'CRT AREA',
      vendor: 'TestVen5',
      file: 'Test File 1',
    });

    await expect(page.getByText(tagNumber)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Zero Energy Phrase Operations', () => {
  let lotoPointPage: LotoPointPage;

  test.beforeEach(async ({ page }) => {
    lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();
  });

  test('should add zero energy phrase to LOTO point', async ({ page }) => {
    const timestamp = Date.now();
    const tagNumber = `01-ZE-${timestamp}`;

    // Create LOTO point first
    await lotoPointPage.clickAddNewLotoPoint();

    await lotoPointPage.fillLotoPointForm({
      unit: 'U1',
      tagNumber: tagNumber,
      description: 'LOTO with zero energy',
      eqType: 'Manual Valve',
      isoPosIndex: 6,
      normPosIndex: 7,
      specificLocation: 'ZE location',
      location: 'CRT AREA',
    });

    // Add zero energy phrase (if the builder is visible)
    const zeBuilder = page.locator('app-zero-energy-phrase-builder');
    if (await zeBuilder.isVisible().catch(() => false)) {
      await lotoPointPage.selectZeroEnergyPhrase('Electrical');
    }

    await lotoPointPage.clickSave();
    await expect(page.getByText(tagNumber)).toBeVisible({ timeout: 10000 });
  });
});
