import { test, expect, Page } from '@playwright/test';
import { LotoPointPage } from '../../pages/loto-point.page';
import { EquipmentPage } from '../../pages/equipment.page';
import { LotoBuilderPage } from '../../pages/loto-builder.page';

/**
 * LOTO Point Creation from Shape Tests
 *
 * These tests verify creating LOTO points by:
 * 1. Uploading a file (if it doesn't exist) - reusing Equipment test file setup
 * 2. Drawing a shape on the file
 * 3. Filling out the LOTO point form that appears
 */

/**
 * Helper function to select or create a value in a dropdown
 * @param page - Playwright page
 * @param labelText - The label text to find the dropdown
 * @param valueName - The value to select or create
 * @param valueAlias - Optional alias for new value creation
 */
async function selectOrCreateDropdownValue(
  page: Page,
  labelText: string | RegExp,
  valueName: string,
  valueAlias?: string
): Promise<void> {
  // Find and click the dropdown
  const dropdown = page.locator('.form-popup app-rf-value-select, .form-popup app-searchable-select-input')
    .filter({ has: page.locator('label', { hasText: labelText }) })
    .locator('.dropdown-input');
  await dropdown.click();
  await page.waitForTimeout(300);

  // Check if the value already exists in dropdown options
  const existingOption = page.locator('.dropdown-options .dropdown-option').filter({ hasText: valueName });
  if (await existingOption.isVisible({ timeout: 1000 }).catch(() => false)) {
    await existingOption.click();
    console.log(`Selected existing option: ${valueName}`);
    await page.waitForTimeout(200);
    return;
  }

  // Check if there are any options at all
  const firstOption = page.locator('.dropdown-options .dropdown-option').first();
  if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
    // There are options, but not the one we want - just select the first one
    await firstOption.click();
    console.log(`Selected first available option for ${labelText}`);
    await page.waitForTimeout(200);
    return;
  }

  // No options exist - need to create one
  // Look for "Add new" option in the dropdown
  const addNewOption = page.locator('.dropdown-options .add-new-option, .dropdown-options .dropdown-option').filter({ hasText: /Add new|Create new/i });
  if (await addNewOption.isVisible({ timeout: 1000 }).catch(() => false)) {
    await addNewOption.click();
    await page.waitForTimeout(300);

    // Wait for the value creation dialog/form
    const dialogContent = page.locator('.dialog-content, .value-form, .popup-content');
    await dialogContent.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Fill name field
    const nameInput = dialogContent.locator('input.input-field, input.form-input-element').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.click();
      await nameInput.fill(valueName);

      // Fill alias field if provided and visible
      if (valueAlias) {
        const aliasInput = dialogContent.locator('input.input-field, input.form-input-element').nth(1);
        if (await aliasInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await aliasInput.click();
          await aliasInput.fill(valueAlias);
        }
      }

      // Click save/confirm button
      const saveButton = dialogContent.locator('button').filter({ hasText: /save|confirm|create|ok/i });
      await saveButton.click();
      await page.waitForTimeout(500);

      // Wait for dialog to close
      await dialogContent.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      console.log(`Created new option: ${valueName}`);
    } else {
      // No dialog appeared, close dropdown
      await page.keyboard.press('Escape');
      console.log(`Could not create option for ${labelText}`);
    }
  } else {
    // No add new option, just close the dropdown
    await page.keyboard.press('Escape');
    console.log(`No options and no "Add new" available for ${labelText}`);
  }
  await page.waitForTimeout(200);
}

test.describe('LOTO Point - Create from Shape', () => {
  let equipmentPage: EquipmentPage;
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    equipmentPage = new EquipmentPage(page);
    lotoBuilder = new LotoBuilderPage(page);
  });

  test('1. should create LOTO point by drawing shape and filling form', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this test

    const timestamp = Date.now();
    const tagNumber = `00-test${timestamp.toString().slice(-3)}`;

    // Step 1: Navigate to loto-builder page
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Step 2: Ensure test file exists (creates if not, skips if already exists)
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();
    console.log(`Using file: ${fileName} with vendor: ${vendorName}`);

    // Step 3: Open file in the viewer
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Verify file is displayed
    const fileDisplayed = await lotoBuilder.isFileDisplayedInViewer();
    expect(fileDisplayed).toBe(true);

    // Step 4: Draw a shape on the image using right-click drag
    await equipmentPage.drawShapeRelative(0.15, 0.15, 0.35, 0.35);
    console.log('Shape drawn on file');

    // Step 5: Wait for LOTO point form popup to appear
    const formPopup = page.locator('.form-popup');
    await formPopup.waitFor({ state: 'visible', timeout: 10000 });
    console.log('LOTO point form popup appeared');

    // Step 6: Click "New" tab to create a new LOTO point
    const newTabButton = page.locator('.form-popup .view-toggle button.toggle-btn').filter({ hasText: 'New' });
    await newTabButton.click();
    await page.waitForTimeout(300);
    console.log('Clicked New tab');

    // Step 7: Fill out the LOTO point form
    // Tag Number field - find by label
    const tagNumberInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Tag Number' }) })
      .locator('input.form-input-element');
    await tagNumberInput.click();
    await tagNumberInput.fill(tagNumber);
    console.log(`Filled Tag Number: ${tagNumber}`);

    // Description field
    const descriptionInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Description' }) })
      .locator('input.form-input-element');
    await descriptionInput.click();
    await descriptionInput.fill(`Test LOTO Point ${timestamp}`);
    console.log('Filled Description');

    // Specific Location field (required)
    const specificLocationInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Specific Location' }) })
      .locator('input.form-input-element');
    await specificLocationInput.click();
    await specificLocationInput.fill('Test Location Area A');
    console.log('Filled Specific Location');

    // Equipment Type dropdown - select or create if no options
    await selectOrCreateDropdownValue(page, 'Equipment Type', 'Test-EqType', 'TEQ');

    // Isolated Position dropdown (required) - select or create if no options
    await selectOrCreateDropdownValue(page, 'Isolated Position', 'Test-IsoPos', 'TIP');

    // Normal Position dropdown (required) - select or create if no options
    await selectOrCreateDropdownValue(page, 'Normal Position', 'Test-NormPos', 'TNP');

    // Location dropdown - select or create if no options
    await selectOrCreateDropdownValue(page, /^Location$/, 'Test-Location', 'TLC');

    // Step 8: Submit the form
    const submitButton = page.locator('.form-popup form button[type="submit"]');
    await submitButton.click();
    console.log('Submitted LOTO point form');

    // Wait for form to close and loading to finish
    await page.locator('.loading, .processing-overlay, mat-spinner').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await formPopup.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Step 9: Verify the LOTO point was created
    // Navigate to LOTO Points page and search for it
    const lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();
    await lotoPointPage.searchLotoPoint(tagNumber);

    const lotoPointVisible = await lotoPointPage.isLotoPointVisible(tagNumber);
    expect(lotoPointVisible).toBe(true);
    console.log(`LOTO point "${tagNumber}" created and verified in list`);
  });

  test('2. should create LOTO point with all form fields filled', async ({ page }) => {
    test.setTimeout(180000);

    const timestamp = Date.now();
    const tagNumber = `00-full${timestamp.toString().slice(-3)}`;

    // Navigate and setup
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Ensure test file exists
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();

    // Open file
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Draw shape
    await equipmentPage.drawShapeRelative(0.4, 0.4, 0.6, 0.6);

    // Wait for form popup
    const formPopup = page.locator('.form-popup');
    await formPopup.waitFor({ state: 'visible', timeout: 10000 });

    // Click New tab
    await page.locator('.form-popup .view-toggle button.toggle-btn').filter({ hasText: 'New' }).click();
    await page.waitForTimeout(300);

    // Fill Unit
    const unitInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Unit' }) })
      .locator('input.form-input-element');
    await unitInput.click();
    await unitInput.fill('U1');

    // Fill Tag Number
    const tagNumberInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Tag Number' }) })
      .locator('input.form-input-element');
    await tagNumberInput.click();
    await tagNumberInput.fill(tagNumber);

    // Fill Description
    const descriptionInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Description' }) })
      .locator('input.form-input-element');
    await descriptionInput.click();
    await descriptionInput.fill(`Full form test LOTO Point ${timestamp}`);

    // Fill Tagged
    const taggedInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Tagged' }) })
      .locator('input.form-input-element');
    await taggedInput.click();
    await taggedInput.fill('Yes');

    // Fill Specific Location
    const specificLocationInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'Specific Location' }) })
      .locator('input.form-input-element');
    await specificLocationInput.click();
    await specificLocationInput.fill('Building A, Floor 2, Room 205');

    // Fill Standard
    const standardInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: /^Standard$/ }) })
      .locator('input.form-input-element');
    await standardInput.click();
    await standardInput.fill('OSHA 1910.147');

    // Fill General Location
    const generalLocationInput = page.locator('.form-popup app-rf-form-input')
      .filter({ has: page.locator('label.field-label', { hasText: 'General Location' }) })
      .locator('input.form-input-element');
    await generalLocationInput.click();
    await generalLocationInput.fill('Main Production Building');

    // Equipment Type dropdown - select or create if no options
    await selectOrCreateDropdownValue(page, 'Equipment Type', 'Manual Valve', 'MV');

    // Isolated Position dropdown (required) - select or create if no options
    await selectOrCreateDropdownValue(page, 'Isolated Position', 'Closed', 'CL');

    // Normal Position dropdown (required) - select or create if no options
    await selectOrCreateDropdownValue(page, 'Normal Position', 'Open', 'OP');

    // Location dropdown - select or create if no options
    await selectOrCreateDropdownValue(page, /^Location$/, 'CRT AREA', 'CRT');

    // Submit
    const submitButton = page.locator('.form-popup form button[type="submit"]');
    await submitButton.click();

    // Wait for completion
    await page.locator('.loading, .processing-overlay, mat-spinner').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await formPopup.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Verify
    const lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();
    await lotoPointPage.searchLotoPoint(tagNumber);

    const lotoPointVisible = await lotoPointPage.isLotoPointVisible(tagNumber);
    expect(lotoPointVisible).toBe(true);
    console.log(`Full form LOTO point "${tagNumber}" created successfully`);
  });
});
