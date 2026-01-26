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
 * @param container - Optional container locator to scope the search (for dual forms)
 */
async function selectOrCreateDropdownValue(
  page: Page,
  labelText: string | RegExp,
  valueName: string,
  valueAlias?: string,
  container?: any
): Promise<void> {
  // Find and click the dropdown - scope to container if provided, otherwise use first match
  const baseLocator = container
    ? container.locator('app-rf-value-select, app-searchable-select-input')
    : page.locator('.form-popup app-rf-value-select, .form-popup app-searchable-select-input');
  const dropdown = baseLocator
    .filter({ has: page.locator('label', { hasText: labelText }) })
    .locator('.dropdown-input')
    .first();
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

    // ==================== ZERO ENERGY SECTION ====================
    // Step: Create a new zero energy phrase
    const phraseBuilder = page.locator('app-zero-energy-phrase-builder').first();
    await phraseBuilder.locator('.dropdown-input').click();
    await page.waitForTimeout(300);

    // Click "Add New" option to create a new phrase
    const addNewPhraseOption = page.locator('.dropdown-options .dropdown-option, .dropdown-options .add-new-option')
      .filter({ hasText: /add.*new|create.*new/i });
    if (await addNewPhraseOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addNewPhraseOption.click();
      await page.waitForTimeout(500);

      // Fill phrase name
      const phraseNameInput = page.locator('.dialog-content input[type="text"]').first();
      await phraseNameInput.fill(`Test Phrase ${timestamp}`);

      // Add tag placeholders
      const addPlaceholderBtn = page.getByRole('button', { name: /add tag placeholder/i });
      await addPlaceholderBtn.click();
      await page.waitForTimeout(200);
      await addPlaceholderBtn.click();
      await page.waitForTimeout(200);

      // Fill verification phrase
      const phraseTextarea = page.locator('.dialog-content textarea.phrase-input');
      await phraseTextarea.fill('Open [tag1] drain and verify [tag2] level gauge is empty');

      // Create the phrase
      await page.getByRole('button', { name: /create phrase/i }).click();
      await page.waitForTimeout(500);
      console.log('Created zero energy phrase');
    } else {
      // No add new option, try selecting existing phrase
      const firstPhraseOption = page.locator('.dropdown-options .dropdown-option').first();
      if (await firstPhraseOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstPhraseOption.click();
        console.log('Selected existing zero energy phrase');
      } else {
        await page.keyboard.press('Escape');
        console.log('No zero energy phrase options available');
      }
    }
    await page.waitForTimeout(300);

    // Step: Add equipment to Zero Energy section
    const zeroEnergyEquipmentManager = page.locator('app-form-group-input app-equipment-list-manager');
    const addZeroEnergyEquipmentBtn = zeroEnergyEquipmentManager.getByRole('button', { name: 'Add Equipment' });

    if (await addZeroEnergyEquipmentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addZeroEnergyEquipmentBtn.click();
      await page.waitForTimeout(500);

      // Select vendor and file - scope to the equipment dialog to avoid matching elements in main view
      const equipmentDialog = page.locator('app-equipment-unified-dialog');
      await equipmentDialog.getByText(vendorName).click();
      await page.waitForTimeout(300);
      await equipmentDialog.getByText(fileName).click();
      await page.waitForTimeout(500);

      // Wait for canvas and draw shape - scope to equipment dialog
      const canvas = equipmentDialog.locator('app-interactive-image canvas.shape-canvas');
      await canvas.waitFor({ state: 'visible', timeout: 10000 });

      const box = await canvas.boundingBox();
      if (box) {
        // Draw shape using right-click drag (different area than main equipment)
        const startX = box.x + box.width * 0.5;
        const startY = box.y + box.height * 0.5;
        const endX = box.x + box.width * 0.7;
        const endY = box.y + box.height * 0.7;

        await page.mouse.move(startX, startY);
        await page.mouse.down({ button: 'right' });
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up({ button: 'right' });
        await page.waitForTimeout(300);
      }

      // Click Save & Select
      await page.getByRole('button', { name: /save.*select|select.*equipment/i }).click();
      await page.waitForTimeout(500);

      // Check if nested LOTO point form appears (for new equipment)
      const nestedLotoForm = page.locator('.loto-form-section');
      if (await nestedLotoForm.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Fill out the nested LOTO point form for zero energy equipment
        const zeTimestamp = Date.now();
        await nestedLotoForm.locator('input[formcontrolname="tagNumber"]').fill(`ZE-${zeTimestamp}`);
        await nestedLotoForm.locator('input[formcontrolname="description"]').fill('Zero Energy Equipment');
        await nestedLotoForm.locator('select[formcontrolname="eqType"]').selectOption({ index: 1 });
        await nestedLotoForm.locator('select[formcontrolname="location"]').selectOption({ index: 1 });
        await nestedLotoForm.locator('select[formcontrolname="isoPos"]').selectOption({ index: 1 });
        await nestedLotoForm.locator('select[formcontrolname="normPos"]').selectOption({ index: 1 });
        await nestedLotoForm.getByRole('button', { name: /create loto point/i }).click();
        await page.waitForTimeout(1000);
        console.log('Created LOTO point for zero energy equipment');

        // After creating the LOTO point, the equipment is now selectable
        // Click the Select Equipment button in the dialog to confirm selection
        const selectEquipmentBtn = equipmentDialog.getByRole('button', { name: /select.*equipment/i });
        if (await selectEquipmentBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
          await selectEquipmentBtn.click();
          await page.waitForTimeout(500);
          console.log('Clicked Select Equipment to confirm');
        }
      }

      // Wait for equipment dialog/popup to close
      await equipmentDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      // Also wait for any popup overlay to disappear
      await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      console.log('Added equipment to zero energy section');
    }
    await page.waitForTimeout(300);

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

  test('3. should create dual LOTO points with counterparts and zero energy references', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for this comprehensive test

    const timestamp = Date.now();
    const suffix = timestamp.toString().slice(-4);

    // Tag numbers for first pair (without zero energy)
    const firstPrimaryTag = `01-dualA${suffix}`;
    const firstCounterpartTag = `02-dualA${suffix}`;
    // Tag numbers for second pair (with zero energy referencing first pair)
    const secondPrimaryTag = `01-dualB${suffix}`;
    const secondCounterpartTag = `02-dualB${suffix}`;

    // Helper function to fill out nested LOTO point form for zero energy equipment
    async function fillNestedLotoPointForm(nestedForm: any, tagNumber: string, description: string) {
      await nestedForm.locator('input[formcontrolname="tagNumber"]').fill(tagNumber);
      await nestedForm.locator('input[formcontrolname="description"]').fill(description);

      // Select each dropdown option if available (skip if only placeholder exists)
      for (const field of ['eqType', 'location', 'isoPos', 'normPos']) {
        const select = nestedForm.locator(`select[formcontrolname="${field}"]`);
        const options = select.locator('option');
        const optionCount = await options.count();
        if (optionCount > 1) {
          await select.selectOption({ index: 1 });
        }
      }

      // Click create button
      const createBtn = nestedForm.getByRole('button', { name: /create loto point/i });
      if (await createBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        return true;
      }
      return false;
    }

    // Helper function to fill dual form basic fields (no zero energy)
    async function fillDualFormBasicFields(
      primaryPanel: any,
      primaryTag: string,
      description: string
    ) {
      // Fill Tag Number (starting with 01 to trigger counterpart)
      const tagNumberInput = page.locator('.form-popup app-rf-form-input')
        .filter({ has: page.locator('label.field-label', { hasText: 'Tag Number' }) })
        .locator('input.form-input-element')
        .first();
      await tagNumberInput.click();
      await tagNumberInput.fill(primaryTag);
      console.log(`Filled Tag Number: ${primaryTag}`);

      // Wait for counterpart detection
      await page.waitForTimeout(1000);

      // Verify dual form appears
      const dualFormView = page.locator('.dual-form-view').first();
      const isDualForm = await dualFormView.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isDualForm) {
        const openCounterpartBtn = page.locator('button').filter({ hasText: /open counterpart/i });
        if (await openCounterpartBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await openCounterpartBtn.click();
          await page.waitForTimeout(500);
        }
      }
      await expect(page.locator('.dual-form-view').first()).toBeVisible({ timeout: 5000 });

      // Fill Description
      const primaryDescInput = primaryPanel.locator('app-rf-form-input')
        .filter({ has: page.locator('label.field-label', { hasText: 'Description' }) })
        .locator('input.form-input-element');
      await primaryDescInput.click();
      await primaryDescInput.fill(description);

      // Fill Specific Location
      const primarySpecLocInput = primaryPanel.locator('app-rf-form-input')
        .filter({ has: page.locator('label.field-label', { hasText: 'Specific Location' }) })
        .locator('input.form-input-element');
      await primarySpecLocInput.click();
      await primarySpecLocInput.fill('Building A, Test Location');

      // Use the selectOrCreateDropdownValue helper for required dropdowns (creates options if none exist)
      // Pass primaryPanel as container to scope to the correct form panel in dual form view
      await selectOrCreateDropdownValue(page, 'Equipment Type', 'Test-EqType', 'TEQ', primaryPanel);
      await selectOrCreateDropdownValue(page, 'Isolated Position', 'Test-IsoPos', 'TIP', primaryPanel);
      await selectOrCreateDropdownValue(page, 'Normal Position', 'Test-NormPos', 'TNP', primaryPanel);
      await selectOrCreateDropdownValue(page, /^Location$/, 'Test-Location', 'TLC', primaryPanel);

      // Sync to counterpart
      const syncAllRightBtn = page.locator('.sync-all-btn.sync-right, button').filter({ hasText: /sync all.*→|→.*sync/i });
      if (await syncAllRightBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await syncAllRightBtn.click();
        await page.waitForTimeout(500);
        console.log('Synced data to counterpart');
      }
    }

    // Helper function to add equipment to counterpart panel
    async function addEquipmentToCounterpartPanel(
      counterpartPanel: any,
      vendorName: string,
      fileName: string,
      coordsX: number,
      coordsY: number
    ) {
      const counterpartEquipmentList = counterpartPanel.locator('app-equipment-list-manager').filter({ has: page.locator('label', { hasText: 'Equipment List' }) });
      const addEquipmentBtn = counterpartEquipmentList.getByRole('button', { name: 'Add Equipment' });

      if (await addEquipmentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addEquipmentBtn.click();
        await page.waitForTimeout(500);

        const equipmentDialog = page.locator('app-equipment-unified-dialog');
        await equipmentDialog.getByText(vendorName, { exact: true }).click();
        await page.waitForTimeout(300);
        await equipmentDialog.getByText(fileName, { exact: true }).click();
        await page.waitForTimeout(500);

        // Draw shape on canvas
        const canvas = equipmentDialog.locator('app-interactive-image canvas.shape-canvas');
        await canvas.waitFor({ state: 'visible', timeout: 10000 });

        const box = await canvas.boundingBox();
        if (box) {
          const startX = box.x + box.width * coordsX;
          const startY = box.y + box.height * coordsY;
          const endX = startX + box.width * 0.1;
          const endY = startY + box.height * 0.1;

          await page.mouse.move(startX, startY);
          await page.mouse.down({ button: 'right' });
          await page.mouse.move(endX, endY, { steps: 10 });
          await page.mouse.up({ button: 'right' });
          await page.waitForTimeout(300);
        }

        await page.getByRole('button', { name: /save.*select|select.*equipment/i }).click();
        await page.waitForTimeout(500);

        await equipmentDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        console.log(`Added equipment to counterpart on file ${fileName}`);
      }
    }

    // Helper function to submit dual form - throws if submission fails
    async function submitDualForm(primaryPanel: any, counterpartPanel: any) {
      // Check for any error messages before submitting
      const errorBefore = page.locator('.error-message, .alert-danger, .form-error');
      if (await errorBefore.isVisible({ timeout: 500 }).catch(() => false)) {
        const errorText = await errorBefore.textContent();
        throw new Error(`Form has validation errors before submit: ${errorText}`);
      }

      const saveBothBtn = page.locator('.save-both-btn, button').filter({ hasText: /save both/i });
      if (await saveBothBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBothBtn.click();
        console.log('Clicked Save Both Units');
      } else {
        const primarySaveBtn = primaryPanel.locator('button').filter({ hasText: /save.*unit.*01|submit/i });
        if (await primarySaveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await primarySaveBtn.click();
        }
        await page.waitForTimeout(500);
        const counterpartSaveBtn = counterpartPanel.locator('button').filter({ hasText: /create.*unit.*02|save.*unit.*02|submit/i });
        if (await counterpartSaveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await counterpartSaveBtn.click();
        }
      }

      // Wait for loading to finish
      await page.locator('.loading, .processing-overlay, mat-spinner').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

      // Wait for form to close - give it time to process the save
      try {
        await page.locator('.form-popup').waitFor({ state: 'hidden', timeout: 30000 });
        console.log('Form closed successfully');
      } catch {
        // Form didn't close - check for errors
        const errorAfter = page.locator('.error-message, .alert-danger, .form-error, .snackbar-error, .toast-error, .mat-snack-bar-container');
        if (await errorAfter.isVisible({ timeout: 1000 }).catch(() => false)) {
          const errorText = await errorAfter.textContent();
          throw new Error(`Submission failed with error: ${errorText}`);
        }

        // Check for inline errors in the form
        const inlineError = page.locator('.form-popup .error, .form-popup .alert, .dual-form-view .error, .field-error');
        if (await inlineError.isVisible({ timeout: 500 }).catch(() => false)) {
          const errorText = await inlineError.textContent();
          throw new Error(`Form submission failed - form still open with error: ${errorText}`);
        }

        // Take screenshot for debugging
        await page.screenshot({ path: `test-results/form-submit-failed-${Date.now()}.png` });
        throw new Error('Form submission failed - form is still visible after 30s wait');
      }

      await page.waitForTimeout(500);
    }

    // ========== STEP 1: Navigate and ensure files exist ==========
    console.log('=== STEP 1: Setup - Navigate and ensure both files exist ===');
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();
    await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Ensure U1 file exists
    const { fileName: u1FileName, vendorName } = await equipmentPage.ensureTestFileExists();
    console.log(`U1 file ready: ${u1FileName}`);

    // Wait for any file form popup to close before proceeding
    await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Ensure U2 file exists
    const { fileName: u2FileName } = await equipmentPage.ensureSecondTestFileExists();
    console.log(`U2 file ready: ${u2FileName}`);

    // Wait for any file form popup to close before proceeding
    await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // ========== STEP 2: Create first pair of LOTO points (skip zero energy) ==========
    console.log('=== STEP 2: Create first pair of LOTO points (01/02) WITHOUT zero energy ===');

    // Open U1 file
    await equipmentPage.openFileInViewer(vendorName, u1FileName, 'pid');
    expect(await lotoBuilder.isFileDisplayedInViewer()).toBe(true);

    // Draw shape on U1 for first primary LOTO point
    const randomOffset1 = (Date.now() % 20) / 100;
    await equipmentPage.drawShapeRelative(0.05 + randomOffset1, 0.05 + randomOffset1, 0.12 + randomOffset1, 0.12 + randomOffset1);
    console.log('Drew shape on U1 for first primary LOTO point');

    // Wait for form popup
    const formPopup1 = page.locator('.form-popup').first();
    await formPopup1.waitFor({ state: 'visible', timeout: 15000 });
    const newTabBtn1 = page.locator('.form-popup .view-toggle button.toggle-btn').filter({ hasText: 'New' });
    await newTabBtn1.click();
    await page.waitForTimeout(300);

    // Fill form
    const primaryPanel1 = page.locator('.form-panel.primary-panel, .form-panel').first();
    const counterpartPanel1 = page.locator('.form-panel.counterpart-panel, .form-panel').last();
    await fillDualFormBasicFields(primaryPanel1, firstPrimaryTag, `First Dual Test ${suffix}`);

    // Add equipment to counterpart on U2 file
    await addEquipmentToCounterpartPanel(counterpartPanel1, vendorName, u2FileName, 0.1, 0.1);

    // Submit (skip zero energy for first pair)
    await submitDualForm(primaryPanel1, counterpartPanel1);
    console.log(`First pair created: ${firstPrimaryTag} / ${firstCounterpartTag}`);

    // ========== STEP 3: Create second pair of LOTO points (use first pair for zero energy) ==========
    console.log('=== STEP 3: Create second pair of LOTO points (01/02) WITH zero energy using first pair ===');

    // Navigate back to loto-builder and open U1 file
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();
    await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await equipmentPage.openFileInViewer(vendorName, u1FileName, 'pid');
    expect(await lotoBuilder.isFileDisplayedInViewer()).toBe(true);

    // Draw shape on U1 for second primary LOTO point (different area)
    const randomOffset2 = (Date.now() % 20) / 100;
    await equipmentPage.drawShapeRelative(0.25 + randomOffset2, 0.25 + randomOffset2, 0.32 + randomOffset2, 0.32 + randomOffset2);
    console.log('Drew shape on U1 for second primary LOTO point');

    // Wait for form popup
    const formPopup2 = page.locator('.form-popup').first();
    await formPopup2.waitFor({ state: 'visible', timeout: 15000 });
    const newTabBtn2 = page.locator('.form-popup .view-toggle button.toggle-btn').filter({ hasText: 'New' });
    await newTabBtn2.click();
    await page.waitForTimeout(300);

    // Fill form
    const primaryPanel2 = page.locator('.form-panel.primary-panel, .form-panel').first();
    const counterpartPanel2 = page.locator('.form-panel.counterpart-panel, .form-panel').last();
    await fillDualFormBasicFields(primaryPanel2, secondPrimaryTag, `Second Dual Test ${suffix}`);

    // Add Zero Energy to primary form - select phrase and use existing LOTO point
    const primaryZeroEnergySection = primaryPanel2.locator('app-form-group-input').filter({ has: page.locator('label', { hasText: 'Zero Energy' }) });
    const phraseDropdown = primaryZeroEnergySection.locator('app-zero-energy-phrase-builder .dropdown-input');
    await phraseDropdown.click();
    await page.waitForTimeout(300);

    // Select existing phrase
    const phraseOption = page.locator('.dropdown-options .dropdown-option').first();
    if (await phraseOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phraseOption.click();
      console.log('Selected existing zero energy phrase');
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);

    // Add equipment to Zero Energy section - select existing LOTO point (first primary)
    const zeEquipmentManager = primaryZeroEnergySection.locator('app-equipment-list-manager');
    const addZeEquipmentBtn = zeEquipmentManager.getByRole('button', { name: 'Add Equipment' });

    if (await addZeEquipmentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addZeEquipmentBtn.click();
      await page.waitForTimeout(500);

      const equipmentDialog = page.locator('app-equipment-unified-dialog');

      // Try to find existing LOTO point tab or search for existing equipment
      const existingTab = equipmentDialog.locator('button, .tab').filter({ hasText: /existing|loto.*point|search/i });
      if (await existingTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await existingTab.click();
        await page.waitForTimeout(500);

        // Search for first primary tag
        const searchInput = equipmentDialog.locator('input[type="text"], input[placeholder*="search" i]');
        if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await searchInput.fill(firstPrimaryTag);
          await page.waitForTimeout(500);
        }

        // Select the existing LOTO point
        const existingLotoOption = equipmentDialog.locator('.equipment-item, .option, .result').filter({ hasText: firstPrimaryTag });
        if (await existingLotoOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await existingLotoOption.click();
          console.log(`Selected existing LOTO point ${firstPrimaryTag} for zero energy`);
        }
      } else {
        // Fallback: select vendor/file and draw new shape
        await equipmentDialog.getByText(vendorName, { exact: true }).click();
        await page.waitForTimeout(300);
        await equipmentDialog.getByText(u1FileName, { exact: true }).click();
        await page.waitForTimeout(500);

        // Try to select existing shape (from first primary)
        const existingShape = equipmentDialog.locator('.shape-item, .equipment-shape').filter({ hasText: firstPrimaryTag });
        if (await existingShape.isVisible({ timeout: 2000 }).catch(() => false)) {
          await existingShape.click();
          console.log(`Selected existing shape for ${firstPrimaryTag}`);
        } else {
          // Draw new shape if can't select existing
          const canvas = equipmentDialog.locator('app-interactive-image canvas.shape-canvas');
          await canvas.waitFor({ state: 'visible', timeout: 10000 });
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
            await page.mouse.down({ button: 'right' });
            await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 10 });
            await page.mouse.up({ button: 'right' });
            await page.waitForTimeout(300);
          }
        }
      }

      await page.getByRole('button', { name: /save.*select|select.*equipment/i }).click();
      await page.waitForTimeout(500);

      // Handle nested LOTO form if it appears
      const nestedLotoForm = page.locator('.loto-form-section');
      if (await nestedLotoForm.isVisible({ timeout: 2000 }).catch(() => false)) {
        const created = await fillNestedLotoPointForm(
          nestedLotoForm,
          `ZE-${Date.now()}`,
          'Zero Energy Equipment'
        );
        if (created) {
          console.log('Created nested LOTO point for zero energy');
        }
        const selectBtn = page.locator('app-equipment-unified-dialog').getByRole('button', { name: /select.*equipment/i });
        if (await selectBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
          await selectBtn.click();
          await page.waitForTimeout(500);
        }
      }

      await equipmentDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(300);

    // Sync to counterpart
    const syncBtn = page.locator('.sync-all-btn.sync-right, button').filter({ hasText: /sync all.*→|→.*sync/i });
    if (await syncBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await syncBtn.click();
      await page.waitForTimeout(500);
    }

    // Add equipment to counterpart on U2 file
    await addEquipmentToCounterpartPanel(counterpartPanel2, vendorName, u2FileName, 0.3, 0.3);

    // Handle zero energy for counterpart - use existing counterpart from first pair
    const counterpartZeSection = counterpartPanel2.locator('app-form-group-input').filter({ has: page.locator('label', { hasText: 'Zero Energy' }) });
    const counterpartZeManager = counterpartZeSection.locator('app-equipment-list-manager');
    const counterpartZeItems = counterpartZeManager.locator('.equipment-item');
    const counterpartZeCount = await counterpartZeItems.count();

    if (counterpartZeCount === 0) {
      console.log('Adding zero energy equipment for counterpart...');
      const addCounterpartZeBtn = counterpartZeManager.getByRole('button', { name: 'Add Equipment' });

      if (await addCounterpartZeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addCounterpartZeBtn.click();
        await page.waitForTimeout(500);

        const equipmentDialog2 = page.locator('app-equipment-unified-dialog');

        // Try to find existing LOTO point (first counterpart)
        const existingTab2 = equipmentDialog2.locator('button, .tab').filter({ hasText: /existing|loto.*point|search/i });
        if (await existingTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await existingTab2.click();
          await page.waitForTimeout(500);

          const searchInput2 = equipmentDialog2.locator('input[type="text"], input[placeholder*="search" i]');
          if (await searchInput2.isVisible({ timeout: 1000 }).catch(() => false)) {
            await searchInput2.fill(firstCounterpartTag);
            await page.waitForTimeout(500);
          }

          const existingLotoOption2 = equipmentDialog2.locator('.equipment-item, .option, .result').filter({ hasText: firstCounterpartTag });
          if (await existingLotoOption2.isVisible({ timeout: 2000 }).catch(() => false)) {
            await existingLotoOption2.click();
            console.log(`Selected existing LOTO point ${firstCounterpartTag} for counterpart zero energy`);
          }
        } else {
          // Fallback: select U2 file
          await equipmentDialog2.getByText(vendorName, { exact: true }).click();
          await page.waitForTimeout(300);
          await equipmentDialog2.getByText(u2FileName, { exact: true }).click();
          await page.waitForTimeout(500);

          // Try to select existing shape
          const existingShape2 = equipmentDialog2.locator('.shape-item, .equipment-shape').filter({ hasText: firstCounterpartTag });
          if (await existingShape2.isVisible({ timeout: 2000 }).catch(() => false)) {
            await existingShape2.click();
          } else {
            // Draw new shape
            const canvas2 = equipmentDialog2.locator('app-interactive-image canvas.shape-canvas');
            await canvas2.waitFor({ state: 'visible', timeout: 10000 });
            const box2 = await canvas2.boundingBox();
            if (box2) {
              await page.mouse.move(box2.x + box2.width * 0.6, box2.y + box2.height * 0.6);
              await page.mouse.down({ button: 'right' });
              await page.mouse.move(box2.x + box2.width * 0.7, box2.y + box2.height * 0.7, { steps: 10 });
              await page.mouse.up({ button: 'right' });
              await page.waitForTimeout(300);
            }
          }
        }

        await page.getByRole('button', { name: /save.*select|select.*equipment/i }).click();
        await page.waitForTimeout(500);

        // Handle nested LOTO form if it appears
        const nestedLotoForm2 = page.locator('.loto-form-section');
        if (await nestedLotoForm2.isVisible({ timeout: 2000 }).catch(() => false)) {
          const created = await fillNestedLotoPointForm(
            nestedLotoForm2,
            `ZE-U2-${Date.now()}`,
            'Zero Energy Equipment U2'
          );
          if (created) {
            console.log('Created nested LOTO point for counterpart zero energy');
          }
          const selectBtn2 = equipmentDialog2.getByRole('button', { name: /select.*equipment/i });
          if (await selectBtn2.isEnabled({ timeout: 2000 }).catch(() => false)) {
            await selectBtn2.click();
            await page.waitForTimeout(500);
          }
        }

        await equipmentDialog2.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
    }

    // Submit second pair
    await submitDualForm(primaryPanel2, counterpartPanel2);
    console.log(`Second pair created: ${secondPrimaryTag} / ${secondCounterpartTag}`);

    // ========== STEP 4: Verify all LOTO points were created ==========
    console.log('=== STEP 4: Verify all 4 LOTO points were created ===');
    const lotoPointPage = new LotoPointPage(page);
    await lotoPointPage.navigateToLotoPointsPage();

    // Verify first primary (01-dualA)
    await lotoPointPage.searchLotoPoint(firstPrimaryTag);
    expect(await lotoPointPage.isLotoPointVisible(firstPrimaryTag)).toBe(true);
    console.log(`Verified: ${firstPrimaryTag}`);

    // Verify first counterpart (02-dualA)
    await lotoPointPage.searchLotoPoint(firstCounterpartTag);
    expect(await lotoPointPage.isLotoPointVisible(firstCounterpartTag)).toBe(true);
    console.log(`Verified: ${firstCounterpartTag}`);

    // Verify second primary (01-dualB)
    await lotoPointPage.searchLotoPoint(secondPrimaryTag);
    expect(await lotoPointPage.isLotoPointVisible(secondPrimaryTag)).toBe(true);
    console.log(`Verified: ${secondPrimaryTag}`);

    // Verify second counterpart (02-dualB)
    await lotoPointPage.searchLotoPoint(secondCounterpartTag);
    expect(await lotoPointPage.isLotoPointVisible(secondCounterpartTag)).toBe(true);
    console.log(`Verified: ${secondCounterpartTag}`);

    console.log('=== Test completed successfully: 4 LOTO points created (2 pairs with counterparts) ===');
  });
});
