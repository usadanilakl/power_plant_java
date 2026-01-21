import { test, expect } from '@playwright/test';
import { LotoBuilderPage } from '../../pages/loto-builder.page';

/**
 * LOTO Builder File Management Tests
 *
 * These tests verify file creation, file type management, vendor management,
 * and file viewing within the LOTO Builder interface.
 */
test.describe('LOTO Builder - File Type Management', () => {
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();
  });

  test('1. should create a new file type', async ({ page }) => {
    const timestamp = Date.now();
    const fileTypeName = `PID-${timestamp}`;
    const fileTypeAlias = `PID-${timestamp}`;

    // Go to loto builder page
    // Click + in left menu
    await lotoBuilder.clickAddNewFile();

    // In the file form, click on file type dropdown
    // Click add new file type
    await lotoBuilder.clickAddNewFileType();

    // In the value form, add name and alias
    await lotoBuilder.fillValueForm({
      name: fileTypeName,
      alias: fileTypeAlias,
    });

    // Click Save button
    await lotoBuilder.saveValueForm();

    // Click close button on the file form
    await lotoBuilder.closeFileForm();

    // Click + in the left menu again
    await lotoBuilder.clickAddNewFile();

    // Verify new file type option is present in the file type dropdown
    const isVisible = await lotoBuilder.isFileTypeOptionVisible(fileTypeName);
    expect(isVisible).toBe(true);

    // Cleanup
    await lotoBuilder.closeFileForm();
  });
});

test.describe('LOTO Builder - Vendor Management', () => {
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();
  });

  test('2. should create a new vendor', async ({ page }) => {
    const timestamp = Date.now();
    const vendorName = `Vendor-${timestamp}`;
    const vendorAlias = `VND-${timestamp}`;

    // Click + in left menu
    await lotoBuilder.clickAddNewFile();

    // Click on vendor dropdown
    // Click add new vendor
    await lotoBuilder.clickAddNewVendor();

    // In the value form, add name and alias
    await lotoBuilder.fillValueForm({
      name: vendorName,
      alias: vendorAlias,
    });

    // Click Save button
    await lotoBuilder.saveValueForm();

    // Click close button on the file form
    await lotoBuilder.closeFileForm();

    // Click + in the left menu again
    await lotoBuilder.clickAddNewFile();

    // Verify new vendor option is present in the vendor dropdown
    const isVisible = await lotoBuilder.isVendorOptionVisible(vendorName);
    expect(isVisible).toBe(true);

    // Cleanup
    await lotoBuilder.closeFileForm();
  });
});

test.describe('LOTO Builder - File Creation', () => {
  let lotoBuilder: LotoBuilderPage;
  const timestamp = Date.now();

  // Use unique names for this test suite
  // IMPORTANT: pidAlias must be 'pid' to match the hardcoded file type button in the UI
  const pidFileType = `PID-${timestamp}`;
  const pidAlias = `pid`;
  const vendor1Name = `Vendor 1-${timestamp}`;
  const vendor1Alias = `VND1-${timestamp}`;
  const vendor2Name = `Vendor 2-${timestamp}`;
  const vendor2Alias = `VND2-${timestamp}`;

  test.beforeEach(async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();
  });

  test('3. should create file with new file type and new vendor', async ({ page }) => {
    const testTimestamp = Date.now();

    // Go to loto builder page
    // Click + in left menu
    await lotoBuilder.clickAddNewFile();

    // In the file form:
    // Click on file type dropdown -> add new file type
    await lotoBuilder.clickAddNewFileType();
    await lotoBuilder.fillValueForm({ name: pidFileType, alias: pidAlias });
    await lotoBuilder.saveValueForm();

    // Click on vendor dropdown -> add new vendor
    await lotoBuilder.clickAddNewVendor();
    await lotoBuilder.fillValueForm({ name: vendor1Name, alias: vendor1Alias });
    await lotoBuilder.saveValueForm();

    // Add file to file field with unique name
    const fileName1 = await lotoBuilder.uploadFileWithUniqueName('1.pdf', `${testTimestamp}`);

    // Submit form
    await lotoBuilder.submitFileForm();

    // Verify:
    // - Select PID category to see files (left menu uses predefined categories)
    await lotoBuilder.selectFileTypeCategory('pid');

    // - Vendor 1 dropdown present in the menu
    const vendorPresent = await lotoBuilder.verifyVendorPresentInMenu(vendor1Name);
    expect(vendorPresent).toBe(true);

    // - Click on file in the left menu and make sure it is displayed in the right side
    const fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1Name, fileName1);
    expect(fileOpens).toBe(true);
  });

  test('4. should create file with existing file type and new vendor', async ({ page }) => {
    const testTimestamp = Date.now();

    // First create a file type if needed
    await lotoBuilder.clickAddNewFile();

    // Try to select existing file type, or create one
    const fileTypeExists = await lotoBuilder.isFileTypeOptionVisible(pidFileType);
    if (!fileTypeExists) {
      await lotoBuilder.clickAddNewFileType();
      await lotoBuilder.fillValueForm({ name: pidFileType, alias: pidAlias });
      await lotoBuilder.saveValueForm();
    } else {
      await page.keyboard.press('Escape');
    }

    // Create new vendor
    await lotoBuilder.clickAddNewVendor();
    await lotoBuilder.fillValueForm({ name: vendor2Name, alias: vendor2Alias });
    await lotoBuilder.saveValueForm();

    // Upload file with unique name
    const fileName2 = await lotoBuilder.uploadFileWithUniqueName('2.pdf', `${testTimestamp}`);

    // Submit form
    await lotoBuilder.submitFileForm();

    // Verify vendor present and file opens
    const vendorPresent = await lotoBuilder.verifyVendorPresentInMenu(vendor2Name);
    expect(vendorPresent).toBe(true);

    const fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, fileName2);
    expect(fileOpens).toBe(true);
  });

  test('5. should create file with existing file type and existing vendor', async ({ page }) => {
    const testTimestamp = Date.now();

    // This test assumes PID and Vendor 1 already exist from previous tests
    // In a real scenario, you would set up preconditions

    await lotoBuilder.clickAddNewFile();

    // Select existing file type
    const fileTypeExists = await lotoBuilder.isFileTypeOptionVisible(pidFileType);
    if (fileTypeExists) {
      await lotoBuilder.selectFileType(pidFileType);
    } else {
      await lotoBuilder.clickAddNewFileType();
      await lotoBuilder.fillValueForm({ name: pidFileType, alias: pidAlias });
      await lotoBuilder.saveValueForm();
    }

    // Select existing vendor
    const vendorExists = await lotoBuilder.isVendorOptionVisible(vendor1Name);
    if (vendorExists) {
      await lotoBuilder.selectVendor(vendor1Name);
    } else {
      await lotoBuilder.clickAddNewVendor();
      await lotoBuilder.fillValueForm({ name: vendor1Name, alias: vendor1Alias });
      await lotoBuilder.saveValueForm();
    }

    // Upload file with unique name
    const fileName3 = await lotoBuilder.uploadFileWithUniqueName('3.pdf', `${testTimestamp}`);

    // Submit form
    await lotoBuilder.submitFileForm();

    // Verify file opens
    const fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1Name, fileName3);
    expect(fileOpens).toBe(true);
  });
});

test.describe('LOTO Builder - Vendor Modification', () => {
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();
  });

  test.skip('6. should modify vendor name and verify menu and file viewer work', async ({ page }) => {
    // Note: This test is marked as skip because it requires specific setup
    // and may need UI-specific adjustments based on actual implementation

    const timestamp = Date.now();
    const oldVendorName = `ModifyVendor-${timestamp}`;
    const oldVendorAlias = `MV-${timestamp}`;
    const newVendorName = `ModifiedVendor-${timestamp}`;

    // Setup: Create a file with a vendor
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.clickAddNewVendor();
    await lotoBuilder.fillValueForm({ name: oldVendorName, alias: oldVendorAlias });
    await lotoBuilder.saveValueForm();
    const fileName = await lotoBuilder.uploadFileWithUniqueName('4.pdf', `${timestamp}`);
    await lotoBuilder.submitFileForm();

    // Modify vendor name
    await lotoBuilder.modifyVendorName(oldVendorName, newVendorName);

    // Verify:
    // - Old vendor name is gone from menu
    const oldVendorPresent = await lotoBuilder.isVendorInLeftMenu(oldVendorName);
    expect(oldVendorPresent).toBe(false);

    // - New vendor name is in menu
    const newVendorPresent = await lotoBuilder.isVendorInLeftMenu(newVendorName);
    expect(newVendorPresent).toBe(true);

    // - File opens successfully in file viewer
    const fileOpens = await lotoBuilder.verifyFileOpensInViewer(newVendorName, fileName);
    expect(fileOpens).toBe(true);
  });
});

test.describe('LOTO Builder - Full Flow Test', () => {
  let lotoBuilder: LotoBuilderPage;

  // This test creates 6 files and verifies each one, so it needs a longer timeout
  test('7. full flow test - create multiple files, modify vendor, verify all works', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this comprehensive test
    const timestamp = Date.now();
    // IMPORTANT: pidAlias must be 'pid' to match the hardcoded file type button in the UI
    const pidFileType = `PID-${timestamp}`;
    const pidAlias = `pid`;
    const vendor1Name = `Vendor 1-${timestamp}`;
    const vendor1Alias = `VND1-${timestamp}`;
    const vendor2Name = `Vendor 2-${timestamp}`;
    const vendor2Alias = `VND2-${timestamp}`;

    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Step 1: Create file with new file type "PID" and new Vendor "Vendor 1" (1.pdf)
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.clickAddNewFileType();
    await lotoBuilder.fillValueForm({ name: pidFileType, alias: pidAlias });
    await lotoBuilder.saveValueForm();
    await lotoBuilder.clickAddNewVendor();
    await lotoBuilder.fillValueForm({ name: vendor1Name, alias: vendor1Alias });
    await lotoBuilder.saveValueForm();
    const file1 = await lotoBuilder.uploadFileWithUniqueName('1.pdf', `${timestamp}-1`);
    await lotoBuilder.submitFileForm();

    // Verify file opens
    let fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1Name, file1);
    expect(fileOpens).toBe(true);

    // Step 2: Create file with type "PID" and new Vendor "Vendor 2" (2.pdf)
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.selectFileType(pidFileType);
    await lotoBuilder.clickAddNewVendor();
    await lotoBuilder.fillValueForm({ name: vendor2Name, alias: vendor2Alias });
    await lotoBuilder.saveValueForm();
    const file2 = await lotoBuilder.uploadFileWithUniqueName('2.pdf', `${timestamp}-2`);
    await lotoBuilder.submitFileForm();

    // Verify file opens
    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file2);
    expect(fileOpens).toBe(true);

    // Step 3: Create file - "PID"/"Vendor 1"/3.pdf
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.selectFileType(pidFileType);
    await lotoBuilder.selectVendor(vendor1Name);
    const file3 = await lotoBuilder.uploadFileWithUniqueName('3.pdf', `${timestamp}-3`);
    await lotoBuilder.submitFileForm();

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1Name, file3);
    expect(fileOpens).toBe(true);

    // Step 4: Create file - "PID"/"Vendor 1"/4.pdf
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.selectFileType(pidFileType);
    await lotoBuilder.selectVendor(vendor1Name);
    const file4 = await lotoBuilder.uploadFileWithUniqueName('4.pdf', `${timestamp}-4`);
    await lotoBuilder.submitFileForm();

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1Name, file4);
    expect(fileOpens).toBe(true);

    // Step 5: Create file - "PID"/"Vendor 2"/5.pdf
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.selectFileType(pidFileType);
    await lotoBuilder.selectVendor(vendor2Name);
    const file5 = await lotoBuilder.uploadFileWithUniqueName('5.pdf', `${timestamp}-5`);
    await lotoBuilder.submitFileForm();

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file5);
    expect(fileOpens).toBe(true);

    // Step 6: Create file - "PID"/"Vendor 2"/6.pdf
    await lotoBuilder.clickAddNewFile();
    await lotoBuilder.selectFileType(pidFileType);
    await lotoBuilder.selectVendor(vendor2Name);
    const file6 = await lotoBuilder.uploadFileWithUniqueName('6.pdf', `${timestamp}-6`);
    await lotoBuilder.submitFileForm();

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file6);
    expect(fileOpens).toBe(true);

    // Step 7: Rename Vendor 1 to "Vendor 11" and verify menu and viewer still work
    const vendor1NewName = `Vendor 11-${timestamp}`;
    await lotoBuilder.modifyVendorName(vendor1Name, vendor1NewName);

    // Verify old vendor name is gone from menu
    const oldVendorPresent = await lotoBuilder.isVendorInLeftMenu(vendor1Name);
    expect(oldVendorPresent).toBe(false);

    // Verify new vendor name is in menu
    const newVendorPresent = await lotoBuilder.isVendorInLeftMenu(vendor1NewName);
    expect(newVendorPresent).toBe(true);

    // Verify all renamed Vendor 1 (now Vendor 11) files are still accessible
    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1NewName, file1);
    expect(fileOpens).toBe(true);

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1NewName, file3);
    expect(fileOpens).toBe(true);

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor1NewName, file4);
    expect(fileOpens).toBe(true);

    // Verify all Vendor 2 files are still accessible
    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file2);
    expect(fileOpens).toBe(true);

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file5);
    expect(fileOpens).toBe(true);

    fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendor2Name, file6);
    expect(fileOpens).toBe(true);
  });
});

test.describe('LOTO Builder - Vendor Deletion', () => {
  let lotoBuilder: LotoBuilderPage;

  test('8. should delete all vendors but one and transfer their items', async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Open file form to access vendor dropdown
    await lotoBuilder.clickAddNewFile();

    // Get all existing vendors from dropdown
    let vendors = await lotoBuilder.getVendorOptions();

    // Need at least 2 vendors to run this test
    if (vendors.length < 2) {
      console.log('Not enough vendors to test deletion. Skipping test.');
      await lotoBuilder.closeFileForm();
      return;
    }

    // First vendor will be the one to keep
    const vendorToKeep = vendors[0];
    const initialVendorCount = vendors.length;

    console.log(`Keeping vendor: ${vendorToKeep}`);
    console.log(`Initial vendor count: ${initialVendorCount}`);

    // Delete vendors one by one until only vendorToKeep remains
    // Each iteration: get fresh list from dropdown, delete the second vendor (index 1)
    while (true) {
      // Get current vendor list from dropdown
      vendors = await lotoBuilder.getVendorOptions();

      // If only one vendor left, we're done
      if (vendors.length <= 1) {
        break;
      }

      // Find a vendor to delete (any vendor that's not the one to keep)
      const vendorToDelete = vendors.find(v => v !== vendorToKeep);
      if (!vendorToDelete) {
        break;
      }

      console.log(`Deleting vendor: ${vendorToDelete}, transferring to: ${vendorToKeep}`);

      // Delete the vendor and transfer items to vendorToKeep
      await lotoBuilder.deleteVendorWithTransfer(vendorToDelete, vendorToKeep);
    }

    // Get final vendor list
    vendors = await lotoBuilder.getVendorOptions();

    // Verify only vendorToKeep remains
    expect(vendors.length).toBe(1);
    expect(vendors).toContain(vendorToKeep);

    // Close file form
    await lotoBuilder.closeFileForm();
  });
});

test.describe('LOTO Builder - File Type Deletion', () => {
  let lotoBuilder: LotoBuilderPage;

  test('9. should delete all file types but one and transfer their items', async ({ page }) => {
    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Open file form to access file type dropdown
    await lotoBuilder.clickAddNewFile();

    // Get all existing file types from dropdown
    let fileTypes = await lotoBuilder.getFileTypeOptions();

    // Need at least 2 file types to run this test
    if (fileTypes.length < 2) {
      console.log('Not enough file types to test deletion. Skipping test.');
      await lotoBuilder.closeFileForm();
      return;
    }

    // First file type will be the one to keep
    const fileTypeToKeep = fileTypes[0];
    const initialFileTypeCount = fileTypes.length;

    console.log(`Keeping file type: ${fileTypeToKeep}`);
    console.log(`Initial file type count: ${initialFileTypeCount}`);

    // Delete file types one by one until only fileTypeToKeep remains
    while (true) {
      // Get current file type list from dropdown
      fileTypes = await lotoBuilder.getFileTypeOptions();

      // If only one file type left, we're done
      if (fileTypes.length <= 1) {
        break;
      }

      // Find a file type to delete (any file type that's not the one to keep)
      const fileTypeToDelete = fileTypes.find(ft => ft !== fileTypeToKeep);
      if (!fileTypeToDelete) {
        break;
      }

      console.log(`Deleting file type: ${fileTypeToDelete}, transferring to: ${fileTypeToKeep}`);

      // Delete the file type and transfer items to fileTypeToKeep
      await lotoBuilder.deleteFileTypeWithTransfer(fileTypeToDelete, fileTypeToKeep);
    }

    // Get final file type list
    fileTypes = await lotoBuilder.getFileTypeOptions();

    // Verify only fileTypeToKeep remains
    expect(fileTypes.length).toBe(1);
    expect(fileTypes).toContain(fileTypeToKeep);

    // Close file form
    await lotoBuilder.closeFileForm();
  });
});

test.describe('LOTO Builder - File Type Rename', () => {
  let lotoBuilder: LotoBuilderPage;

  test('10. should rename an existing file type', async ({ page }) => {
    const timestamp = Date.now();
    const newFileTypeName = `PID-Renamed-FT-${timestamp}`;

    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Open file form to get existing file types
    await lotoBuilder.clickAddNewFile();

    // Get existing file types from dropdown
    const fileTypes = await lotoBuilder.getFileTypeOptions();

    // Need at least 1 file type to rename
    if (fileTypes.length < 1) {
      console.log('No file types to rename. Skipping test.');
      await lotoBuilder.closeFileForm();
      return;
    }

    // Get the first file type to rename
    const originalFileTypeName = fileTypes[0];
    console.log(`Renaming file type: ${originalFileTypeName} -> ${newFileTypeName}`);

    // Select the file type to edit (file form is already open)
    await lotoBuilder.selectFileType(originalFileTypeName);

    // Open file type dropdown again and click Edit option
    await lotoBuilder.openFileTypeDropdown();

    // Click "Edit file types" option in the dropdown
    const editOption = page.locator('.dropdown-options .add-new-option').filter({ hasText: /Edit.*file.*type/i });
    await editOption.click();
    await page.waitForTimeout(300);

    // Wait for the edit dialog to appear and fill new name
    const dialogContent = page.locator('.dialog-content');
    await dialogContent.waitFor({ state: 'visible', timeout: 5000 });

    // Find the name input field in the dialog and update it
    const nameInput = dialogContent.locator('input.input-field').first();
    await nameInput.click();
    await nameInput.clear();
    await nameInput.fill(newFileTypeName);

    // Click Save button in dialog
    await dialogContent.locator('button.save-btn').click();
    await lotoBuilder.waitForLoadingToFinish();

    // Wait for dialog to close
    await dialogContent.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Close file form
    await lotoBuilder.closeFileForm();

    // Verify the old file type name is gone and new name exists
    await lotoBuilder.clickAddNewFile();

    const oldFileTypeExists = await lotoBuilder.isFileTypeOptionVisible(originalFileTypeName);
    expect(oldFileTypeExists).toBe(false);

    const newFileTypeExists = await lotoBuilder.isFileTypeOptionVisible(newFileTypeName);
    expect(newFileTypeExists).toBe(true);

    // Cleanup
    await lotoBuilder.closeFileForm();
  });
});

test.describe('LOTO Builder - File Number Modification', () => {
  let lotoBuilder: LotoBuilderPage;

  test('11. should modify all files in a section by adding file numbers', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this comprehensive test

    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Navigate to left file menu and find first toggle item (vendor section)
    await lotoBuilder.switchToTreeView();

    // Select a file type category to see files
    await lotoBuilder.selectFileTypeCategory('pid');

    // Get all vendor toggle items in the left menu
    const vendorItems = page.locator('.item-content').filter({ has: page.locator('.toggle-icon') });
    const vendorCount = await vendorItems.count();

    if (vendorCount === 0) {
      console.log('No vendors found in the menu. Skipping test.');
      return;
    }

    // Get the first vendor
    const firstVendor = vendorItems.first();
    const vendorNameElement = firstVendor.locator('.item-name');
    const vendorName = await vendorNameElement.textContent();

    if (!vendorName) {
      console.log('Could not get vendor name. Skipping test.');
      return;
    }

    console.log(`Processing vendor: ${vendorName}`);

    // Expand the vendor to see files
    const toggleIcon = firstVendor.locator('.toggle-icon');
    const toggleText = await toggleIcon.textContent().catch(() => '');
    const isExpanded = toggleText?.includes('▼');

    if (!isExpanded) {
      await firstVendor.click();
      await page.waitForTimeout(500);
    }

    // Get all files under this vendor
    // Files have .has-subtitle class and no .toggle-icon (leaf nodes in the virtual scroll list)
    const fileItems = page.locator('.item-content.has-subtitle .item-name');
    const fileCount = await fileItems.count();

    if (fileCount === 0) {
      console.log('No files found under the vendor. Skipping test.');
      return;
    }

    // Collect file names
    const fileNames: string[] = [];
    for (let i = 0; i < fileCount; i++) {
      const fileName = await fileItems.nth(i).textContent();
      if (fileName) {
        fileNames.push(fileName.trim());
      }
    }

    console.log(`Found ${fileNames.length} files to modify: ${fileNames.join(', ')}`);

    // Generate random file numbers for each file
    const timestamp = Date.now();
    const fileNumbers: string[] = fileNames.map((_, index) => `FN-${timestamp}-${index}`);

    // For each file in the section: open form, add file number, submit
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const fileNumber = fileNumbers[i];

      console.log(`Modifying file ${i + 1}/${fileNames.length}: ${fileName} with file number: ${fileNumber}`);

      // Click on the file to select it first
      const fileItem = page.locator('.item-content.has-subtitle .item-name').filter({ hasText: new RegExp(`^${fileName}$`) }).first();
      await fileItem.click();
      await page.waitForTimeout(300);

      // Right-click to get context menu
      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);

      // Click "View Details" option in context menu to open the form
      await page.locator('.context-menu, app-context-menu, .cdk-overlay-container').getByText('View Details', { exact: true }).click();
      await page.waitForTimeout(500);

      // Wait for file form to appear
      await page.waitForSelector('app-rf-file-form', { timeout: 5000 });

      // Add file number using the +Add button
      await lotoBuilder.addFileNumber(fileNumber);

      // Submit the form
      await lotoBuilder.submitFileForm();
    }

    // Refresh page
    await page.reload();
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();
    await lotoBuilder.switchToTreeView();
    await lotoBuilder.selectFileTypeCategory('pid');

    // Navigate to the same vendor section
    const refreshedVendorItem = page.locator('.item-content').filter({ has: page.locator('.item-name', { hasText: vendorName.trim() }) }).first();
    const refreshedToggleIcon = refreshedVendorItem.locator('.toggle-icon');
    const refreshedToggleText = await refreshedToggleIcon.textContent().catch(() => '');
    const refreshedIsExpanded = refreshedToggleText?.includes('▼');

    if (!refreshedIsExpanded) {
      await refreshedVendorItem.click();
      await page.waitForTimeout(500);
    }

    // Verify that each file in the section:
    // 1. Has the new file number
    // 2. Still opens
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const expectedFileNumber = fileNumbers[i];

      console.log(`Verifying file ${i + 1}/${fileNames.length}: ${fileName}`);

      // Click on file to open it in viewer (verify it still opens)
      const fileOpens = await lotoBuilder.verifyFileOpensInViewer(vendorName.trim(), fileName);
      expect(fileOpens).toBe(true);

      // Right-click to open form and verify file number
      const fileItem = page.locator('.item-content.has-subtitle .item-name').filter({ hasText: new RegExp(`^${fileName}$`) }).first();
      await fileItem.click();
      await page.waitForTimeout(300);

      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);

      await page.locator('.context-menu, app-context-menu, .cdk-overlay-container').getByText('View Details', { exact: true }).click();
      await page.waitForTimeout(500);

      await page.waitForSelector('app-rf-file-form', { timeout: 5000 });

      // Verify file number is present
      const hasFileNumber = await lotoBuilder.verifyFileNumberExists(expectedFileNumber);
      expect(hasFileNumber).toBe(true);

      // Close the form
      await lotoBuilder.closeFileForm();
    }

    console.log('All files successfully modified and verified!');
  });
});

test.describe('LOTO Builder - Vendor Rename', () => {
  let lotoBuilder: LotoBuilderPage;

  test('12. should rename an existing vendor', async ({ page }) => {
    const timestamp = Date.now();
    const newVendorName = `Renamed-${timestamp}`;

    lotoBuilder = new LotoBuilderPage(page);
    await lotoBuilder.navigateToLotoBuilder();
    await lotoBuilder.selectFilesTab();

    // Open file form to get existing vendors
    await lotoBuilder.clickAddNewFile();

    // Get existing vendors from dropdown
    const vendors = await lotoBuilder.getVendorOptions();

    // Need at least 1 vendor to rename
    if (vendors.length < 1) {
      console.log('No vendors to rename. Skipping test.');
      await lotoBuilder.closeFileForm();
      return;
    }

    // Get the first vendor to rename
    const originalVendorName = vendors[0];
    console.log(`Renaming vendor: ${originalVendorName} -> ${newVendorName}`);

    // Select the vendor to edit (file form is already open)
    await lotoBuilder.selectVendor(originalVendorName);

    // Open vendor dropdown again and click Edit option
    await lotoBuilder.openVendorDropdown();

    // Click "Edit vendors" option in the dropdown
    const editOption = page.locator('.dropdown-options .add-new-option').filter({ hasText: /Edit.*vendor/i });
    await editOption.click();
    await page.waitForTimeout(300);

    // Wait for the edit dialog to appear and fill new name
    const dialogContent = page.locator('.dialog-content');
    await dialogContent.waitFor({ state: 'visible', timeout: 5000 });

    // Find the name input field in the dialog and update it
    const nameInput = dialogContent.locator('input.input-field').first();
    await nameInput.click();
    await nameInput.clear();
    await nameInput.fill(newVendorName);

    // Click Save button in dialog
    await dialogContent.locator('button.save-btn').click();
    await lotoBuilder.waitForLoadingToFinish();

    // Wait for dialog to close
    await dialogContent.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Close file form
    await lotoBuilder.closeFileForm();

    // Verify the old vendor name is gone and new name exists
    await lotoBuilder.clickAddNewFile();

    const oldVendorExists = await lotoBuilder.isVendorOptionVisible(originalVendorName);
    expect(oldVendorExists).toBe(false);

    const newVendorExists = await lotoBuilder.isVendorOptionVisible(newVendorName);
    expect(newVendorExists).toBe(true);

    // Cleanup
    await lotoBuilder.closeFileForm();
  });
});
