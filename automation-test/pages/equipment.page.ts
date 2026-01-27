import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { LotoBuilderPage } from './loto-builder.page';

export interface EquipmentFormData {
  name?: string;
  description?: string;
}

export interface ShapeCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Equipment Page Object for testing equipment management within the LOTO Builder
 */
export class EquipmentPage extends BasePage {
  private lotoBuilder: LotoBuilderPage;

  // Fixed test file configuration
  static readonly TEST_FILE_TYPE = 'PID-Equipment-Test';
  static readonly TEST_FILE_TYPE_ALIAS = 'pid';
  static readonly TEST_VENDOR = 'Equipment-Test-Vendor';
  static readonly TEST_VENDOR_ALIAS = 'ETV';
  static readonly TEST_FILE_NAME = 'equipment-test-file';
  static readonly TEST_FILE_NAME_U2 = 'equipment-test-file-u2';

  constructor(page: Page) {
    super(page);
    this.lotoBuilder = new LotoBuilderPage(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToLotoBuilder() {
    await this.lotoBuilder.navigateToLotoBuilder();
  }

  async selectFilesTab() {
    await this.lotoBuilder.selectFilesTab();
  }

  async selectEquipmentTab() {
    await this.page.locator('button.tab-button').filter({ hasText: /Equipment/i }).click();
    await this.page.waitForTimeout(300);
  }

  // ==================== FILE OPERATIONS (delegated to LotoBuilderPage) ====================

  /**
   * Ensure the test file exists. If it already exists, skip creation.
   * Returns the file name.
   */
  async ensureTestFileExists(): Promise<{ fileName: string; vendorName: string; fileTypeName: string }> {
    await this.lotoBuilder.switchToTreeView();
    await this.lotoBuilder.selectFileTypeCategory('pid');

    // Check if test vendor exists in the menu
    const vendorExists = await this.lotoBuilder.isVendorInLeftMenu(EquipmentPage.TEST_VENDOR);

    if (vendorExists) {
      // Check if test file exists under the vendor
      const fileExists = await this.lotoBuilder.isFileInVendorDropdown(
        EquipmentPage.TEST_VENDOR,
        EquipmentPage.TEST_FILE_NAME
      );

      if (fileExists) {
        console.log(`Test file "${EquipmentPage.TEST_FILE_NAME}" already exists under vendor "${EquipmentPage.TEST_VENDOR}". Skipping creation.`);
        return {
          fileName: EquipmentPage.TEST_FILE_NAME,
          vendorName: EquipmentPage.TEST_VENDOR,
          fileTypeName: EquipmentPage.TEST_FILE_TYPE,
        };
      }
    }

    // File doesn't exist, create it
    console.log(`Creating test file "${EquipmentPage.TEST_FILE_NAME}" with vendor "${EquipmentPage.TEST_VENDOR}"...`);
    await this.createTestFile();

    return {
      fileName: EquipmentPage.TEST_FILE_NAME,
      vendorName: EquipmentPage.TEST_VENDOR,
      fileTypeName: EquipmentPage.TEST_FILE_TYPE,
    };
  }

  /**
   * Create the test file with fixed name, vendor, and file type
   */
  async createTestFile(): Promise<string> {
    await this.lotoBuilder.clickAddNewFile();

    // Check if file type exists, create if not
    const fileTypeExists = await this.lotoBuilder.isFileTypeOptionVisible(EquipmentPage.TEST_FILE_TYPE);
    if (!fileTypeExists) {
      await this.lotoBuilder.clickAddNewFileType();
      await this.lotoBuilder.fillValueForm({
        name: EquipmentPage.TEST_FILE_TYPE,
        alias: EquipmentPage.TEST_FILE_TYPE_ALIAS,
      });
      await this.lotoBuilder.saveValueForm();
    } else {
      await this.lotoBuilder.selectFileType(EquipmentPage.TEST_FILE_TYPE);
    }

    // Check if vendor exists, create if not
    const vendorExists = await this.lotoBuilder.isVendorOptionVisible(EquipmentPage.TEST_VENDOR);
    if (!vendorExists) {
      await this.lotoBuilder.clickAddNewVendor();
      await this.lotoBuilder.fillValueForm({
        name: EquipmentPage.TEST_VENDOR,
        alias: EquipmentPage.TEST_VENDOR_ALIAS,
      });
      await this.lotoBuilder.saveValueForm();
    } else {
      await this.lotoBuilder.selectVendor(EquipmentPage.TEST_VENDOR);
    }

    // Upload file with fixed name
    await this.lotoBuilder.uploadFile('1.pdf');
    await this.lotoBuilder.fillFileName(EquipmentPage.TEST_FILE_NAME);
    await this.lotoBuilder.fillFileNumber(EquipmentPage.TEST_FILE_NAME);

    // Select Override option in case file already exists from previous runs
    await this.lotoBuilder.selectOverrideOption();

    await this.lotoBuilder.submitFileForm();

    return EquipmentPage.TEST_FILE_NAME;
  }

  /**
   * Ensure the second test file (U2) exists. If it already exists, skip creation.
   * Returns the file name. Uses same vendor and file type as U1.
   */
  async ensureSecondTestFileExists(): Promise<{ fileName: string; vendorName: string; fileTypeName: string }> {
    await this.lotoBuilder.switchToTreeView();
    await this.lotoBuilder.selectFileTypeCategory('pid');

    // Check if test vendor exists in the menu
    const vendorExists = await this.lotoBuilder.isVendorInLeftMenu(EquipmentPage.TEST_VENDOR);

    if (vendorExists) {
      // Check if second test file exists under the vendor
      const fileExists = await this.lotoBuilder.isFileInVendorDropdown(
        EquipmentPage.TEST_VENDOR,
        EquipmentPage.TEST_FILE_NAME_U2
      );

      if (fileExists) {
        console.log(`Second test file "${EquipmentPage.TEST_FILE_NAME_U2}" already exists under vendor "${EquipmentPage.TEST_VENDOR}". Skipping creation.`);
        return {
          fileName: EquipmentPage.TEST_FILE_NAME_U2,
          vendorName: EquipmentPage.TEST_VENDOR,
          fileTypeName: EquipmentPage.TEST_FILE_TYPE,
        };
      }
    }

    // File doesn't exist, create it
    console.log(`Creating second test file "${EquipmentPage.TEST_FILE_NAME_U2}" with vendor "${EquipmentPage.TEST_VENDOR}"...`);
    await this.createSecondTestFile();

    return {
      fileName: EquipmentPage.TEST_FILE_NAME_U2,
      vendorName: EquipmentPage.TEST_VENDOR,
      fileTypeName: EquipmentPage.TEST_FILE_TYPE,
    };
  }

  /**
   * Create the second test file (U2) with fixed name, using existing vendor and file type
   */
  async createSecondTestFile(): Promise<string> {
    await this.lotoBuilder.clickAddNewFile();

    // Select existing file type
    await this.lotoBuilder.selectFileType(EquipmentPage.TEST_FILE_TYPE);

    // Select existing vendor
    await this.lotoBuilder.selectVendor(EquipmentPage.TEST_VENDOR);

    // Upload file with fixed name for U2 (use different source file than U1)
    await this.lotoBuilder.uploadFile('2.pdf');
    await this.lotoBuilder.fillFileName(EquipmentPage.TEST_FILE_NAME_U2);
    await this.lotoBuilder.fillFileNumber(EquipmentPage.TEST_FILE_NAME_U2);

    // Select Override option in case file already exists from previous runs
    await this.lotoBuilder.selectOverrideOption();

    await this.lotoBuilder.submitFileForm();

    return EquipmentPage.TEST_FILE_NAME_U2;
  }

  async createFileWithNewVendorAndFileType(
    fileTypeName: string,
    fileTypeAlias: string,
    vendorName: string,
    vendorAlias: string,
    testFileName: string,
    uniqueSuffix: string
  ): Promise<string> {
    await this.lotoBuilder.clickAddNewFile();
    await this.lotoBuilder.clickAddNewFileType();
    await this.lotoBuilder.fillValueForm({ name: fileTypeName, alias: fileTypeAlias });
    await this.lotoBuilder.saveValueForm();
    await this.lotoBuilder.clickAddNewVendor();
    await this.lotoBuilder.fillValueForm({ name: vendorName, alias: vendorAlias });
    await this.lotoBuilder.saveValueForm();
    const fileName = await this.lotoBuilder.uploadFileWithUniqueName(testFileName, uniqueSuffix);
    await this.lotoBuilder.submitFileForm();
    return fileName;
  }

  /**
   * Create a test file with a custom name using existing vendor and file type.
   * Creates vendor and file type if they don't exist (without creating default file).
   * Useful for iteration tests that need unique files for each run.
   * @param customFileName - The custom file name to use
   * @param pdfFile - The PDF file to upload ('1.pdf' or '2.pdf')
   * @param maxRetries - Maximum number of retry attempts (default 2)
   */
  async createTestFileWithCustomName(customFileName: string, pdfFile: string = '1.pdf', maxRetries: number = 2): Promise<{ fileName: string; vendorName: string; fileTypeName: string }> {
    await this.lotoBuilder.switchToTreeView();
    await this.lotoBuilder.selectFileTypeCategory('pid');

    // Try to create the file with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Creating test file "${customFileName}" with vendor "${EquipmentPage.TEST_VENDOR}" (attempt ${attempt}/${maxRetries})...`);

      // Close any lingering popups
      await this.page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

      await this.lotoBuilder.clickAddNewFile();

      // Wait for file form to appear
      await this.page.locator('app-rf-file-form').waitFor({ state: 'visible', timeout: 10000 });

      // Check if file type exists, create if not (similar to createTestFile)
      const fileTypeExists = await this.lotoBuilder.isFileTypeOptionVisible(EquipmentPage.TEST_FILE_TYPE);
      if (!fileTypeExists) {
        console.log(`File type "${EquipmentPage.TEST_FILE_TYPE}" not found, creating...`);
        await this.lotoBuilder.clickAddNewFileType();
        await this.lotoBuilder.fillValueForm({
          name: EquipmentPage.TEST_FILE_TYPE,
          alias: EquipmentPage.TEST_FILE_TYPE_ALIAS,
        });
        await this.lotoBuilder.saveValueForm();
      } else {
        await this.lotoBuilder.selectFileType(EquipmentPage.TEST_FILE_TYPE);
      }

      // Check if vendor exists, create if not (similar to createTestFile)
      const vendorExists = await this.lotoBuilder.isVendorOptionVisible(EquipmentPage.TEST_VENDOR);
      if (!vendorExists) {
        console.log(`Vendor "${EquipmentPage.TEST_VENDOR}" not found, creating...`);
        await this.lotoBuilder.clickAddNewVendor();
        await this.lotoBuilder.fillValueForm({
          name: EquipmentPage.TEST_VENDOR,
          alias: EquipmentPage.TEST_VENDOR_ALIAS,
        });
        await this.lotoBuilder.saveValueForm();
      } else {
        await this.lotoBuilder.selectVendor(EquipmentPage.TEST_VENDOR);
      }

      // Upload file with custom name
      await this.lotoBuilder.uploadFile(pdfFile);

      // Wait for file info to appear (indicates successful upload)
      const fileInfo = this.page.locator('app-rf-file-form .file-info, app-rf-file-form .uploaded-file');
      const uploadSuccess = await fileInfo.isVisible({ timeout: 10000 }).catch(() => false);
      if (!uploadSuccess) {
        console.log(`File upload attempt ${attempt} may have failed - retrying...`);
        // Close the form and retry
        const closeBtn = this.page.locator('.popup-overlay button').filter({ hasText: /×|close|cancel/i }).first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click();
        }
        await this.page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(1000);
        continue;
      }

      await this.lotoBuilder.fillFileName(customFileName);
      await this.lotoBuilder.fillFileNumber(customFileName);

      // Select Override option in case file already exists
      await this.lotoBuilder.selectOverrideOption();

      await this.lotoBuilder.submitFileForm();

      // Verify the file was created by checking if it appears in the tree
      await this.page.waitForTimeout(1000);
      await this.lotoBuilder.switchToTreeView();
      await this.lotoBuilder.selectFileTypeCategory('pid');

      const fileCreated = await this.lotoBuilder.isFileInVendorDropdown(EquipmentPage.TEST_VENDOR, customFileName);
      if (fileCreated) {
        console.log(`File "${customFileName}" created successfully`);
        return {
          fileName: customFileName,
          vendorName: EquipmentPage.TEST_VENDOR,
          fileTypeName: EquipmentPage.TEST_FILE_TYPE,
        };
      }

      console.log(`File "${customFileName}" not found in tree after attempt ${attempt} - retrying...`);
      await this.page.waitForTimeout(1000);
    }

    // If we get here, all retries failed
    throw new Error(`Failed to create file "${customFileName}" after ${maxRetries} attempts`);
  }

  async openFileInViewer(vendorName: string, fileName: string, fileTypeCategory: string = 'pid') {
    await this.lotoBuilder.selectFileTypeCategory(fileTypeCategory);
    await this.lotoBuilder.clickFileInLeftMenu(vendorName, fileName);
    await this.lotoBuilder.waitForFileToLoad();
  }

  // ==================== SHAPE DRAWING ====================

  /**
   * Get the current scale factor and offset of the interactive image.
   * The image is displayed scaled to fit the canvas, so we need to calculate
   * the transformation to convert image coordinates to screen coordinates.
   */
  async getImageTransform(): Promise<{ scale: number; offsetX: number; offsetY: number; imageWidth: number; imageHeight: number }> {
    // Try to get transform info from the canvas or image element
    const transform = await this.page.evaluate(() => {
      // Look for the interactive image component
      const interactiveImage = document.querySelector('app-interactive-image');
      if (!interactiveImage) {
        return null;
      }

      // Try multiple ways to find the image and its dimensions
      const img = interactiveImage.querySelector('img') as HTMLImageElement;
      const canvas = interactiveImage.querySelector('canvas.shape-canvas') as HTMLCanvasElement;
      // Also check for canvas with image data
      const imageCanvas = interactiveImage.querySelector('canvas.image-canvas, canvas:not(.shape-canvas)') as HTMLCanvasElement;

      if (!canvas) {
        return null;
      }

      const canvasRect = canvas.getBoundingClientRect();

      let scale = 1;
      let imageWidth = canvasRect.width;
      let imageHeight = canvasRect.height;

      // Method 1: Get scale from img element natural dimensions
      if (img && img.naturalWidth && img.naturalHeight) {
        imageWidth = img.naturalWidth;
        imageHeight = img.naturalHeight;
        const scaleX = canvasRect.width / img.naturalWidth;
        const scaleY = canvasRect.height / img.naturalHeight;
        scale = Math.min(scaleX, scaleY);
      }
      // Method 2: Get scale from canvas internal dimensions vs display dimensions
      else if (canvas.width && canvas.height) {
        // canvas.width/height are the internal resolution
        // canvasRect.width/height are the displayed size
        imageWidth = canvas.width;
        imageHeight = canvas.height;
        const scaleX = canvasRect.width / canvas.width;
        const scaleY = canvasRect.height / canvas.height;
        scale = Math.min(scaleX, scaleY);
      }
      // Method 3: Check imageCanvas for dimensions
      else if (imageCanvas && imageCanvas.width && imageCanvas.height) {
        imageWidth = imageCanvas.width;
        imageHeight = imageCanvas.height;
        const scaleX = canvasRect.width / imageCanvas.width;
        const scaleY = canvasRect.height / imageCanvas.height;
        scale = Math.min(scaleX, scaleY);
      }

      // Method 4: Try to get transform from CSS
      const computedStyle = window.getComputedStyle(canvas);
      const transformMatrix = computedStyle.transform;
      let cssScale = 1;

      if (transformMatrix && transformMatrix !== 'none') {
        const matrixMatch = transformMatrix.match(/matrix\(([^)]+)\)/);
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
          cssScale = values[0];
        }
      }

      // If CSS transform has a scale, multiply it
      if (cssScale !== 1) {
        scale = scale * cssScale;
      }

      return {
        scale,
        offsetX: canvasRect.left,
        offsetY: canvasRect.top,
        imageWidth,
        imageHeight,
        canvasWidth: canvasRect.width,
        canvasHeight: canvasRect.height,
        // Debug info
        hasImg: !!img,
        imgNaturalWidth: img?.naturalWidth,
        imgNaturalHeight: img?.naturalHeight,
        canvasInternalWidth: canvas.width,
        canvasInternalHeight: canvas.height,
        cssScale,
      };
    });

    if (!transform) {
      // Fallback: get canvas bounding box and assume scale 1
      const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
      const box = await canvas.boundingBox();
      console.warn('Could not detect image transform, using fallback scale=1');
      return {
        scale: 1,
        offsetX: box?.x || 0,
        offsetY: box?.y || 0,
        imageWidth: box?.width || 0,
        imageHeight: box?.height || 0,
      };
    }

    // Log debug info
    console.log('Transform debug info:', JSON.stringify(transform, null, 2));

    return transform;
  }

  /**
   * Draw a rectangle shape on the interactive image canvas using image coordinates.
   * The canvas internally handles coordinate transformation, so we need to find
   * the relationship between screen pixels and image pixels.
   *
   * @param coordinates - The coordinates in original image space (unscaled)
   */
  async drawShapeWithImageCoordinates(coordinates: ShapeCoordinates) {
    const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found or not visible');
    }

    // Get image transform info
    const transform = await this.getImageTransform();

    console.log(`Image transform - scale: ${transform.scale}`);
    console.log(`Image dimensions: ${transform.imageWidth}x${transform.imageHeight}`);
    console.log(`Canvas box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    console.log(`Requested image coordinates: start(${coordinates.startX}, ${coordinates.startY}) end(${coordinates.endX}, ${coordinates.endY})`);

    // The canvas displays the image scaled to fit.
    // To draw at image coordinates, we need to:
    // 1. Calculate where those image coordinates appear on screen
    // screenX = canvasX + (imageX * scale)
    // screenY = canvasY + (imageY * scale)
    //
    // But the scale should be: canvasSize / imageSize
    // So if image is 5000px wide and canvas is 500px wide, scale = 0.1
    // An image coordinate of 2500 would be at screen position: canvasX + (2500 * 0.1) = canvasX + 250

    const screenStartX = box.x + (coordinates.startX * transform.scale);
    const screenStartY = box.y + (coordinates.startY * transform.scale);
    const screenEndX = box.x + (coordinates.endX * transform.scale);
    const screenEndY = box.y + (coordinates.endY * transform.scale);

    console.log(`Calculated screen coordinates: start(${screenStartX}, ${screenStartY}) end(${screenEndX}, ${screenEndY})`);
    console.log(`Expected shape size in screen pixels: ${screenEndX - screenStartX}x${screenEndY - screenStartY}`);

    // Verify coordinates are within canvas bounds
    if (screenStartX < box.x || screenStartY < box.y ||
        screenEndX > box.x + box.width || screenEndY > box.y + box.height) {
      console.warn('WARNING: Calculated screen coordinates are outside canvas bounds!');
      console.warn(`Canvas bounds: x=${box.x}-${box.x + box.width}, y=${box.y}-${box.y + box.height}`);
    }

    // Right-click drag to draw shape
    await this.page.mouse.move(screenStartX, screenStartY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(screenEndX, screenEndY, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });
    await this.page.waitForTimeout(300);
  }

  /**
   * Draw a rectangle shape on the interactive image canvas using right-click drag
   * @param coordinates - The coordinates for the shape (startX, startY, endX, endY) in screen space
   * @deprecated Use drawShapeWithImageCoordinates for image-space coordinates
   */
  async drawShapeWithCoordinates(coordinates: ShapeCoordinates) {
    const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found or not visible');
    }

    // Right-click drag to draw shape
    await this.page.mouse.move(coordinates.startX, coordinates.startY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(coordinates.endX, coordinates.endY, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });
    await this.page.waitForTimeout(300);
  }

  /**
   * Draw a rectangle shape at a relative position on the canvas
   * @param relativeStartX - Start X as percentage of canvas width (0-1)
   * @param relativeStartY - Start Y as percentage of canvas height (0-1)
   * @param relativeEndX - End X as percentage of canvas width (0-1)
   * @param relativeEndY - End Y as percentage of canvas height (0-1)
   */
  async drawShapeRelative(
    relativeStartX: number = 0.2,
    relativeStartY: number = 0.2,
    relativeEndX: number = 0.4,
    relativeEndY: number = 0.4
  ) {
    const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found or not visible');
    }

    const startX = box.x + box.width * relativeStartX;
    const startY = box.y + box.height * relativeStartY;
    const endX = box.x + box.width * relativeEndX;
    const endY = box.y + box.height * relativeEndY;

    // Right-click drag to draw shape
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });
    await this.page.waitForTimeout(300);
  }

  // ==================== EQUIPMENT FORM ====================

  /**
   * Wait for the equipment form to appear after drawing a shape
   */
  async waitForEquipmentForm() {
    await this.page.waitForSelector('app-rf-equipment-form, .equipment-form', { timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill the equipment form with the provided data
   */
  async fillEquipmentForm(data: EquipmentFormData) {
    if (data.name) {
      const nameInput = this.page.locator('app-rf-equipment-form input.form-input-element, .equipment-form input').first();
      await nameInput.click();
      await nameInput.clear();
      await nameInput.fill(data.name);
    }

    if (data.description) {
      const descInput = this.page.locator('app-rf-equipment-form textarea, .equipment-form textarea').first();
      await descInput.click();
      await descInput.clear();
      await descInput.fill(data.description);
    }
  }

  /**
   * Submit the equipment form
   */
  async submitEquipmentForm() {
    const saveButton = this.page.locator('app-rf-equipment-form button, .equipment-form button').filter({ hasText: /save|submit/i });
    await saveButton.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Close the equipment form without saving
   */
  async closeEquipmentForm() {
    const closeButton = this.page.locator('app-rf-popup-projection button').filter({ hasText: /close|cancel|×/i });
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ==================== VERIFICATION ====================

  /**
   * Check if a shape is visible on the canvas
   */
  async isShapeVisible(): Promise<boolean> {
    // Shapes are typically rendered on the shape-canvas
    // We can check for shape elements or rely on visual inspection
    const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
    return await canvas.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Check if the equipment form is visible
   */
  async isEquipmentFormVisible(): Promise<boolean> {
    return await this.page.locator('app-rf-equipment-form, .equipment-form').isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Verify equipment exists in the equipment tab/list
   */
  async isEquipmentInList(equipmentName: string): Promise<boolean> {
    await this.selectEquipmentTab();
    const equipmentItem = this.page.locator('.item-content .item-name, .equipment-item').filter({ hasText: equipmentName });
    return await equipmentItem.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
