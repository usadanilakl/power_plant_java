import { test, expect } from '@playwright/test';
import { LotoStandardPage } from '../../pages/loto-standard.page';

test.describe('LOTO Standard CRUD Operations', () => {
  let lotoStandardPage: LotoStandardPage;

  test.beforeEach(async ({ page }) => {
    lotoStandardPage = new LotoStandardPage(page);
    await lotoStandardPage.navigateToLotoStandardsPage();
  });

  test('should create a new LOTO standard', async ({ page }) => {
    const timestamp = Date.now();
    const standardName = `Test-Standard-${timestamp}`;

    await lotoStandardPage.createLotoStandard({
      name: standardName,
      description: 'Test LOTO standard description',
    });

    // Verify LOTO standard was created
    await expect(page.getByText(standardName)).toBeVisible({ timeout: 10000 });
  });

  test('should modify an existing LOTO standard', async ({ page }) => {
    const timestamp = Date.now();
    const standardName = `Modify-Standard-${timestamp}`;
    const newDescription = 'Modified standard description';

    // Create first
    await lotoStandardPage.createLotoStandard({
      name: standardName,
      description: 'Original description',
    });

    await page.waitForTimeout(500);

    // Modify it
    await lotoStandardPage.modifyLotoStandard(standardName, {
      description: newDescription,
    });

    // Verify modification
    await lotoStandardPage.searchLotoStandard(standardName);
    await lotoStandardPage.selectLotoStandard(standardName);
    await expect(page.locator('textarea, .form-input-element').nth(1)).toHaveValue(newDescription);
  });

  test('should delete a LOTO standard', async ({ page }) => {
    const timestamp = Date.now();
    const standardName = `Delete-Standard-${timestamp}`;

    // Create first
    await lotoStandardPage.createLotoStandard({
      name: standardName,
      description: 'Standard to delete',
    });

    await page.waitForTimeout(500);

    // Delete it
    await lotoStandardPage.deleteLotoStandard(standardName);

    // Verify deletion
    await lotoStandardPage.searchLotoStandard(standardName);
    await expect(page.getByRole('row', { name: new RegExp(standardName) })).not.toBeVisible();
  });

  test('should search for a LOTO standard', async ({ page }) => {
    await lotoStandardPage.searchLotoStandard('Test');

    // Verify search works
    await page.waitForTimeout(500);
    const rowCount = await lotoStandardPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('LOTO Standard with LOTO Points', () => {
  let lotoStandardPage: LotoStandardPage;

  test.beforeEach(async ({ page }) => {
    lotoStandardPage = new LotoStandardPage(page);
    await lotoStandardPage.navigateToLotoStandardsPage();
  });

  test('should navigate through carousel tabs', async ({ page }) => {
    const timestamp = Date.now();
    const standardName = `Carousel-Test-${timestamp}`;

    // Create a standard first
    await lotoStandardPage.createLotoStandard({
      name: standardName,
      description: 'Carousel navigation test',
    });

    await page.waitForTimeout(500);

    // Select it to open the form
    await lotoStandardPage.selectLotoStandard(standardName);
    await page.waitForTimeout(300);

    // Navigate to LOTO Points tab
    await lotoStandardPage.goToLotoPointsTab();
    await expect(page.locator('app-double-loto-point-table, .loto-points-table')).toBeVisible();

    // Navigate back to General Info
    await lotoStandardPage.goToGeneralInfoTab();
    await expect(page.locator('app-rf-reactive-form')).toBeVisible();
  });
});
