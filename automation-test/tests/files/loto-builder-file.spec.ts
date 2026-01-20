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
