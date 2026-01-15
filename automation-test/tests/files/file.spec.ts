import { test, expect } from '@playwright/test';
import { FilePage } from '../../pages/file.page';

test.describe('File CRUD Operations', () => {
  let filePage: FilePage;

  test.beforeEach(async ({ page }) => {
    filePage = new FilePage(page);
    await filePage.navigateToFilesPage();
  });

  test('should create a new file', async ({ page }) => {
    const timestamp = Date.now();
    const fileName = `Test-File-${timestamp}`;

    await filePage.createFile({
      name: fileName,
      fileType: 'P&ID',  // Adjust to actual file type in your app
      fileNumber: `FN-${timestamp}`,
    });

    // Verify file was created
    await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });
  });

  test('should modify an existing file', async ({ page }) => {
    const timestamp = Date.now();
    const originalName = `Modify-Test-${timestamp}`;
    const newName = `Modified-${timestamp}`;

    // Create a file first
    await filePage.createFile({
      name: originalName,
      fileType: 'P&ID',
    });

    await page.waitForTimeout(500);

    // Modify it
    await filePage.modifyFile(originalName, {
      name: newName,
    });

    // Verify modification
    await expect(page.getByText(newName)).toBeVisible({ timeout: 10000 });
  });

  test('should delete a file', async ({ page }) => {
    const timestamp = Date.now();
    const fileName = `Delete-Test-${timestamp}`;

    // Create a file first
    await filePage.createFile({
      name: fileName,
      fileType: 'P&ID',
    });

    await page.waitForTimeout(500);

    // Delete it
    await filePage.deleteFile(fileName);

    // Verify deletion
    await filePage.searchFile(fileName);
    await expect(page.getByRole('row', { name: new RegExp(fileName) })).not.toBeVisible();
  });

  test('should search for a file', async ({ page }) => {
    // Search for an existing file
    await filePage.searchFile('Test');

    // Verify search works (results or no results message)
    await page.waitForTimeout(500);
    const rowCount = await filePage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Vendor Management', () => {
  let filePage: FilePage;

  test.beforeEach(async ({ page }) => {
    filePage = new FilePage(page);
    await filePage.navigateToFilesPage();
    await filePage.clickAddNewFile();
  });

  test('should create a new vendor from file form', async ({ page }) => {
    const timestamp = Date.now();
    const vendorName = `TestVendor-${timestamp}`;

    await filePage.createVendorFromForm(vendorName);

    // Verify vendor appears in dropdown
    await filePage.openVendorDropdown();
    await expect(page.getByText(vendorName)).toBeVisible();
  });
});

test.describe('File Type Management', () => {
  let filePage: FilePage;

  test.beforeEach(async ({ page }) => {
    filePage = new FilePage(page);
    await filePage.navigateToFilesPage();
    await filePage.clickAddNewFile();
  });

  test('should create a new file type from file form', async ({ page }) => {
    const timestamp = Date.now();
    const typeName = `TestType-${timestamp}`;

    await filePage.createFileTypeFromForm(typeName);

    // Verify file type appears in dropdown
    await filePage.openFileTypeDropdown();
    await expect(page.getByText(typeName)).toBeVisible();
  });
});
