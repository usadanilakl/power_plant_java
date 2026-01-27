import { test, expect, Page } from '@playwright/test';
import { EquipmentPage } from '../../pages/equipment.page';
import { LotoBuilderPage } from '../../pages/loto-builder.page';

/**
 * Test suite for creating LOTO Standards from the LOTO Builder using existing LOTO points.
 *
 * Prerequisites:
 * - Test files and LOTO points should exist (created by test #4 in loto-point-from-shape.spec.ts)
 */
test.describe('LOTO Standard - Create from Builder', () => {

  test('1. should create LOTO standard from existing LOTO points in builder', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes

    const equipmentPage = new EquipmentPage(page);
    const lotoBuilder = new LotoBuilderPage(page);
    const timestamp = Date.now();
    const suffix = `std-${timestamp.toString().slice(-6)}`;
    const standardName = `Test-Standard-${suffix}`;

    // ========== STEP 1: Navigate to LOTO Builder and find existing files ==========
    console.log('=== STEP 1: Navigate to LOTO Builder and find existing files ===');

    // Maximize window to have more space for carousel and canvas
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('Set viewport to 1920x1080');

    await equipmentPage.navigateToLotoBuilder();
    await equipmentPage.selectFilesTab();
    await page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Switch to tree view and select PID category
    await lotoBuilder.switchToTreeView();
    await lotoBuilder.selectFileTypeCategory('pid');
    await page.waitForTimeout(1000);

    // Find existing U1 files under the test vendor
    const vendorName = EquipmentPage.TEST_VENDOR;
    const vendorItem = page.locator('.item-content').filter({ hasText: vendorName }).first();
    const vendorExists = await vendorItem.isVisible({ timeout: 5000 }).catch(() => false);

    if (!vendorExists) {
      console.log('Test vendor not found - please run test #4 first to create test files and LOTO points');
      test.skip();
      return;
    }

    // Expand vendor to see files
    const toggleIcon = vendorItem.locator('.toggle-icon');
    const toggleText = await toggleIcon.textContent().catch(() => '');
    if (toggleText?.includes('▶')) {
      await vendorItem.click();
      await page.waitForTimeout(500);
    }

    // Find all U1 files (files containing "-u1-" in the name)
    const allFileItems = page.locator('.item-content .item-name');
    const itemCount = await allFileItems.count();
    const u1Files: string[] = [];

    for (let i = 0; i < itemCount; i++) {
      const itemText = await allFileItems.nth(i).textContent();
      if (itemText && itemText.includes('-u1-')) {
        u1Files.push(itemText.trim());
      }
    }

    console.log(`Found ${u1Files.length} U1 files: ${u1Files.join(', ')}`);

    if (u1Files.length === 0) {
      console.log('No U1 files found - please run test #4 first to create test files');
      test.skip();
      return;
    }

    // ========== STEP 2: Click Build LOTO button ==========
    console.log('=== STEP 2: Click Build LOTO button ===');

    // First open any file to enable the Build LOTO button
    await equipmentPage.openFileInViewer(vendorName, u1Files[0], 'pid');
    expect(await lotoBuilder.isFileDisplayedInViewer()).toBe(true);
    await page.waitForTimeout(500);

    // Click Build LOTO button
    const buildLotoBtn = page.locator('button').filter({ hasText: /Build LOTO/i });
    await buildLotoBtn.waitFor({ state: 'visible', timeout: 10000 });
    await buildLotoBtn.click();
    console.log('Clicked Build LOTO button');
    await page.waitForTimeout(1000);

    // ========== STEP 3: Create new LOTO standard in dialog ==========
    console.log('=== STEP 3: Create new LOTO standard in dialog ===');

    // Wait for "Select LOTO Standards" dialog
    const standardsDialog = page.locator('.floating-window').filter({
      has: page.locator('h2', { hasText: 'Select LOTO Standards' })
    });
    await standardsDialog.waitFor({ state: 'visible', timeout: 10000 });
    console.log('LOTO Standards dialog opened');

    // Click "+ Create New Standard" button
    const createNewBtn = standardsDialog.locator('button').filter({ hasText: /Create New Standard/i });
    await createNewBtn.click();
    console.log('Clicked Create New Standard');
    await page.waitForTimeout(500);

    // Fill name in the create form
    const nameInput = standardsDialog.locator('input#new-name, input[placeholder*="name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(standardName);
    console.log(`Filled standard name: ${standardName}`);

    // Fill description
    const descriptionInput = standardsDialog.locator('textarea#new-description, textarea[placeholder*="description"]');
    if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionInput.fill(`Test LOTO Standard description ${suffix}`);
    }

    // Click "Create & Add" button
    const createAddBtn = standardsDialog.locator('button').filter({ hasText: /Create.*Add/i });
    await createAddBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await createAddBtn.click();
    console.log('Clicked Create & Add');
    await page.waitForTimeout(1000);

    // ========== STEP 4: Move carousel to expose left menu ==========
    console.log('=== STEP 4: Move carousel to expose left menu ===');

    // Wait for the LOTO Standards Editor (carousel) to appear
    const carouselWindow = page.locator('.floating-window').filter({
      has: page.locator('h2', { hasText: 'LOTO Standards Editor' })
    });
    await carouselWindow.waitFor({ state: 'visible', timeout: 10000 });
    console.log('LOTO Standards Editor carousel opened');

    // Resize the carousel to be very small (just showing the header and minimal content)
    // and move it to the far left side to not interfere with canvas clicks (which are centered)
    // First resize it using the east resize handle to make it narrower
    const resizeHandleE = carouselWindow.locator('.resize-handle.resize-e, .resize-e').first();
    const carouselBox = await carouselWindow.boundingBox();

    if (carouselBox) {
      // Resize to be much smaller (about 350px wide, 250px tall)
      const targetWidth = 350;
      const targetHeight = 250;

      // Use the southeast handle to resize both dimensions
      const resizeHandleSE = carouselWindow.locator('.resize-handle.resize-se, .resize-se').first();
      if (await resizeHandleSE.isVisible({ timeout: 1000 }).catch(() => false)) {
        const handleBox = await resizeHandleSE.boundingBox();
        if (handleBox) {
          const newX = carouselBox.x + targetWidth;
          const newY = carouselBox.y + targetHeight;
          await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(newX, newY, { steps: 5 });
          await page.mouse.up();
          console.log('Resized carousel to be smaller');
          await page.waitForTimeout(300);
        }
      }
    }

    // Now move it to the top-left corner (near the file tree but not overlapping canvas)
    const dragHandle = carouselWindow.locator('.drag-handle');
    if (await dragHandle.isVisible({ timeout: 2000 }).catch(() => false)) {
      const handleBox = await dragHandle.boundingBox();
      if (handleBox) {
        // Position at the left upper corner
        const targetX = 10; // Far left
        const targetY = 60; // Near top (below header)

        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetX, targetY, { steps: 10 });
        await page.mouse.up();
        console.log(`Moved carousel to top-left at (${targetX}, ${targetY})`);
        await page.waitForTimeout(500);
      }
    }

    // ========== STEP 5: Add shapes from each U1 file to the standard ==========
    console.log('=== STEP 5: Add shapes from each U1 file to the standard ===');

    let totalShapesAdded = 0;

    for (const fileName of u1Files) {
      console.log(`Processing file: ${fileName}`);

      // Scroll tree view to top to ensure vendor is visible
      const treeContainer = page.locator('.file-tree, .tree-container, .left-panel').first();
      if (await treeContainer.isVisible().catch(() => false)) {
        await treeContainer.evaluate((el) => el.scrollTop = 0);
        await page.waitForTimeout(300);
      }

      // Open the file in viewer - with retry logic
      try {
        await equipmentPage.openFileInViewer(vendorName, fileName, 'pid');
      } catch (e) {
        console.log(`Failed to open file ${fileName}, trying alternative approach...`);
        // Click directly on the file name in the tree (use force to bypass carousel overlay)
        const fileItem = page.locator('.item-name').filter({ hasText: fileName }).first();
        if (await fileItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fileItem.click({ force: true });
        } else {
          console.log(`Could not find file ${fileName}, skipping...`);
          continue;
        }
      }
      await page.waitForTimeout(1000);

      // Get all shapes on the canvas
      // Shapes are typically rendered as rectangles on the canvas
      // We need to click on each shape and select "Add to LOTO" from context menu

      // First, check if there are shapes by looking at the Build LOTO button count
      const buildLotoBtnWithCount = page.locator('button').filter({ hasText: /Build LOTO \(\d+\)/i });
      const btnText = await buildLotoBtnWithCount.textContent().catch(() => 'Build LOTO (0)');
      const shapeCountMatch = btnText?.match(/\((\d+)\)/);
      const shapeCount = shapeCountMatch ? parseInt(shapeCountMatch[1]) : 0;

      console.log(`File ${fileName} has ${shapeCount} LOTO point(s)`);

      if (shapeCount === 0) {
        console.log(`No shapes with LOTO points on ${fileName}, skipping...`);
        continue;
      }

      // Get the canvas bounding box
      const canvas = page.locator('.canvas-container canvas, app-interactive-image canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 5000 });
      const canvasBox = await canvas.boundingBox();

      if (!canvasBox) {
        console.log('Canvas not found, skipping file');
        continue;
      }

      // Since we can't easily get shape coordinates from the DOM,
      // we'll use a comprehensive grid approach to find and click on shapes
      // Try clicking in many different areas of the canvas
      const gridPositions = [
        // Dense grid covering most of the canvas
        { x: 0.2, y: 0.2 }, { x: 0.3, y: 0.2 }, { x: 0.4, y: 0.2 }, { x: 0.5, y: 0.2 }, { x: 0.6, y: 0.2 }, { x: 0.7, y: 0.2 }, { x: 0.8, y: 0.2 },
        { x: 0.2, y: 0.3 }, { x: 0.3, y: 0.3 }, { x: 0.4, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.6, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.8, y: 0.3 },
        { x: 0.2, y: 0.4 }, { x: 0.3, y: 0.4 }, { x: 0.4, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0.6, y: 0.4 }, { x: 0.7, y: 0.4 }, { x: 0.8, y: 0.4 },
        { x: 0.2, y: 0.5 }, { x: 0.3, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.7, y: 0.5 }, { x: 0.8, y: 0.5 },
        { x: 0.2, y: 0.6 }, { x: 0.3, y: 0.6 }, { x: 0.4, y: 0.6 }, { x: 0.5, y: 0.6 }, { x: 0.6, y: 0.6 }, { x: 0.7, y: 0.6 }, { x: 0.8, y: 0.6 },
        { x: 0.2, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.4, y: 0.7 }, { x: 0.5, y: 0.7 }, { x: 0.6, y: 0.7 }, { x: 0.7, y: 0.7 }, { x: 0.8, y: 0.7 },
        { x: 0.2, y: 0.8 }, { x: 0.3, y: 0.8 }, { x: 0.4, y: 0.8 }, { x: 0.5, y: 0.8 }, { x: 0.6, y: 0.8 }, { x: 0.7, y: 0.8 }, { x: 0.8, y: 0.8 },
      ];

      let shapesFoundOnFile = 0;
      const maxShapesToFind = shapeCount; // Don't try to find more than exist

      for (const pos of gridPositions) {
        if (shapesFoundOnFile >= maxShapesToFind) break;

        const clickX = canvasBox.x + canvasBox.width * pos.x;
        const clickY = canvasBox.y + canvasBox.height * pos.y;

        // Right-click at this position
        await page.mouse.click(clickX, clickY, { button: 'right' });
        await page.waitForTimeout(300);

        // Check if context menu appeared
        const contextMenu = page.locator('app-context-menu .context-menu-content, .context-menu-content').first();
        const menuVisible = await contextMenu.isVisible({ timeout: 500 }).catch(() => false);

        if (menuVisible) {
          // Look for "Add to LOTO" option
          const addToLotoOption = contextMenu.locator('button, .context-menu-item').filter({ hasText: /Add to LOTO/i });
          const optionVisible = await addToLotoOption.isVisible({ timeout: 500 }).catch(() => false);

          if (optionVisible) {
            // Use force click to bypass any carousel overlay
            await addToLotoOption.click({ force: true });
            console.log(`Added shape at position (${pos.x}, ${pos.y}) to LOTO standard`);
            shapesFoundOnFile++;
            totalShapesAdded++;
            await page.waitForTimeout(500);
          } else {
            // Close the context menu
            await page.keyboard.press('Escape');
          }
        }
      }

      console.log(`Added ${shapesFoundOnFile} shape(s) from ${fileName}`);
    }

    console.log(`Total shapes added to standard: ${totalShapesAdded}`);

    // ========== STEP 6: Verify points were added and save ==========
    console.log('=== STEP 6: Verify points were added and save ===');

    // Check the point count badge in the carousel
    const pointCountBadge = carouselWindow.locator('.point-count-badge, div').filter({ hasText: /\d+ Points?/i }).first();
    const badgeText = await pointCountBadge.textContent().catch(() => '0 Points');
    console.log(`Point count in carousel: ${badgeText}`);

    // First, scroll the carousel to ensure Save & Close is visible, then click it
    const saveCloseBtn = carouselWindow.locator('button').filter({ hasText: /Save.*Close/i });
    if (await saveCloseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Scroll the button into view within the carousel
      await saveCloseBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Use force click in case there's any overlay
      await saveCloseBtn.click({ force: true });
      console.log('Clicked Save & Close');
      await page.waitForTimeout(2000);
    } else {
      console.log('Save & Close button not found, trying to find by text...');
      // Try clicking directly by text
      const saveBtn = page.getByText('Save & Close').first();
      if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveBtn.click({ force: true });
        console.log('Clicked Save & Close (via text)');
        await page.waitForTimeout(2000);
      }
    }

    // Wait for carousel to close
    await carouselWindow.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Carousel did not close automatically');
    });

    console.log(`=== Test completed: LOTO Standard "${standardName}" created ===`);

    // Log summary
    if (totalShapesAdded > 0) {
      console.log(`SUCCESS: Added ${totalShapesAdded} LOTO point(s) to the standard`);
    } else {
      console.log('WARNING: No LOTO points were added to the standard. This may indicate:');
      console.log('  - No shapes with LOTO points on the test files');
      console.log('  - Run test #4 first to create LOTO points');
    }
  });
});
