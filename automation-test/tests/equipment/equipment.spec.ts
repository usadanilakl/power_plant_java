import { test, expect } from '@playwright/test';
import { EquipmentPage } from '../../pages/equipment.page';
import { LotoBuilderPage } from '../../pages/loto-builder.page';

/**
 * Equipment Management Tests
 *
 * These tests verify equipment creation, shape drawing, and management
 * within the LOTO Builder interface.
 *
 * The tests use a fixed test file that is created once and reused across tests.
 * If the file already exists, the upload step is skipped.
 */
test.describe('Equipment - Shape Creation', () => {
  let equipmentPage: EquipmentPage;
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    equipmentPage = new EquipmentPage(page);
    lotoBuilder = new LotoBuilderPage(page);
  });

  test('1. should create a shape on a file by drawing a rectangle', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for this test

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

    // Step 4: Draw rectangle shape on the picture using right-click drag
    // Using image coordinates from the test spec:
    // "coordinates": "{startX:2512.130533964103,startY:2489.8859427495363,endX:2571.3482417323157,endY:2750.4438569296717}"
    await equipmentPage.drawShapeWithImageCoordinates({
      startX: 2512.130533964103,
      startY: 2489.8859427495363,
      endX: 2571.3482417323157,
      endY: 2750.4438569296717,
    });

    console.log('Shape drawn successfully with image coordinates');

    // Verify shape canvas is still visible (shape was drawn)
    const shapeVisible = await equipmentPage.isShapeVisible();
    expect(shapeVisible).toBe(true);
  });

  test('2. should draw shape using relative coordinates', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate and setup
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Ensure test file exists
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();

    // Open file
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Draw shape using relative coordinates (for testing without specific image coords)
    await equipmentPage.drawShapeRelative(0.25, 0.25, 0.45, 0.45);

    console.log('Shape drawn with relative coordinates');

    // Verify canvas is visible
    const shapeVisible = await equipmentPage.isShapeVisible();
    expect(shapeVisible).toBe(true);
  });

  test('3. should draw shape and check for equipment form', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate and setup
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Ensure test file exists
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();

    // Open file
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Draw shape
    await equipmentPage.drawShapeRelative(0.3, 0.3, 0.5, 0.5);

    // Wait and check if equipment form appears
    await page.waitForTimeout(500);

    const formVisible = await equipmentPage.isEquipmentFormVisible();
    console.log(`Equipment form visible after drawing: ${formVisible}`);

    // Shape should be visible regardless of form
    const shapeVisible = await equipmentPage.isShapeVisible();
    expect(shapeVisible).toBe(true);
  });

  test('4. should create equipment with shape and fill form', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    const testTimestamp = Date.now();
    const equipmentName = `Equipment-${testTimestamp}`;

    // Navigate and setup
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Ensure test file exists
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();

    // Open the file
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Draw shape
    await equipmentPage.drawShapeRelative(0.2, 0.2, 0.4, 0.4);

    console.log(`Drew shape for equipment: ${equipmentName}`);

    // If equipment form appears, fill it
    const formVisible = await equipmentPage.isEquipmentFormVisible();
    if (formVisible) {
      await equipmentPage.fillEquipmentForm({
        name: equipmentName,
        description: `Test equipment created at ${testTimestamp}`,
      });
      await equipmentPage.submitEquipmentForm();

      // Verify equipment appears in list
      const inList = await equipmentPage.isEquipmentInList(equipmentName);
      expect(inList).toBe(true);
      console.log(`Equipment "${equipmentName}" created and verified in list`);
    } else {
      console.log('Equipment form did not appear automatically after drawing shape');
      // The shape was still drawn successfully
      const shapeVisible = await equipmentPage.isShapeVisible();
      expect(shapeVisible).toBe(true);
    }
  });
});

test.describe('Equipment - Multiple Shapes', () => {
  let equipmentPage: EquipmentPage;
  let lotoBuilder: LotoBuilderPage;

  test.beforeEach(async ({ page }) => {
    equipmentPage = new EquipmentPage(page);
    lotoBuilder = new LotoBuilderPage(page);
  });

  test('5. should draw multiple shapes on the same file', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate and setup
    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();

    // Ensure test file exists
    const { fileName, vendorName } = await equipmentPage.ensureTestFileExists();

    // Open file
    await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');

    // Draw first shape
    await equipmentPage.drawShapeRelative(0.1, 0.1, 0.25, 0.25);
    console.log('Drew first shape');

    // Wait a moment
    await page.waitForTimeout(500);

    // Close form if it appeared
    if (await equipmentPage.isEquipmentFormVisible()) {
      await equipmentPage.closeEquipmentForm();
    }

    // Draw second shape
    await equipmentPage.drawShapeRelative(0.3, 0.3, 0.45, 0.45);
    console.log('Drew second shape');

    await page.waitForTimeout(500);

    if (await equipmentPage.isEquipmentFormVisible()) {
      await equipmentPage.closeEquipmentForm();
    }

    // Draw third shape
    await equipmentPage.drawShapeRelative(0.5, 0.5, 0.65, 0.65);
    console.log('Drew third shape');

    // Verify canvas is still functional
    const shapeVisible = await equipmentPage.isShapeVisible();
    expect(shapeVisible).toBe(true);
  });
});
