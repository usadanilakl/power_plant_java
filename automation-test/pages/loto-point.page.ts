import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface LotoPointFormData {
  unit?: string;
  tagNumber?: string;
  description?: string;
  eqType?: string;
  isoPos?: string;
  isoPosIndex?: number;
  normPos?: string;
  normPosIndex?: number;
  specificLocation?: string;
  location?: string;
  vendor?: string;
  file?: string;
  zeroEnergy?: {
    phrase?: {
      name: string;
      text: string;
      placeholderCount?: number;
    };
    equipment?: {
      vendor: string;
      file: string;
    };
  };
}

/**
 * LOTO Point Page Object for LOTO Point management operations
 */
export class LotoPointPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToLotoPointsPage() {
    await this.goto('/home');
    await this.skipOnboarding();
    await this.clickNavLink('LOTO Points');
    await this.waitForPageLoad();
  }

  async navigateDirectToLotoPoints() {
    await this.goto('/loto-points');
    await this.waitForPageLoad();
  }

  // ==================== CREATE ====================

  async clickAddNewLotoPoint() {
    await this.clickButton('Add New Loto Point');
    await this.page.waitForTimeout(500);
  }

  async fillLotoPointForm(data: LotoPointFormData) {
    // Unit (first input)
    if (data.unit) {
      await this.formInputs.first().click();
      await this.formInputs.first().fill(data.unit);
    }

    // Tag Number
    if (data.tagNumber) {
      await this.fillNextUntouchedInput(data.tagNumber);
    }

    // Description
    if (data.description) {
      await this.fillNextUntouchedInput(data.description);
    }

    // Equipment Type dropdown
    if (data.eqType) {
      await this.selectDropdownOption(data.eqType);
    }

    // Isolated Position - by text or index
    if (data.isoPos) {
      await this.selectDropdownOption(data.isoPos);
    } else if (data.isoPosIndex) {
      await this.selectDropdownByIndex(data.isoPosIndex);
    }

    // Normal Position - by text or index
    if (data.normPos) {
      await this.selectDropdownOption(data.normPos);
    } else if (data.normPosIndex) {
      await this.selectDropdownByIndex(data.normPosIndex);
    }

    // Specific Location
    if (data.specificLocation) {
      const invalidInput = this.page.locator('.ng-untouched.ng-pristine.ng-invalid > .form-input > .form-input-element');
      await invalidInput.click();
      await invalidInput.fill(data.specificLocation);
    }

    // Location dropdown
    if (data.location) {
      await this.selectDropdownOption(data.location);
    }

    // Equipment (optional)
    if (data.vendor || data.file) {
      await this.clickButton('Add Equipment');
      await this.page.waitForTimeout(300);

      if (data.vendor) {
        await this.page.getByText(data.vendor).click();
      }

      if (data.file) {
        await this.page.locator('div').filter({ hasText: new RegExp(`^${data.file}$`) }).click();
      }
    }
  }

  async createLotoPoint(data: LotoPointFormData) {
    await this.clickAddNewLotoPoint();
    await this.fillLotoPointForm(data);

    // Fill zero energy if provided
    if (data.zeroEnergy) {
      if (data.zeroEnergy.phrase) {
        await this.createZeroEnergyPhrase(
          data.zeroEnergy.phrase.name,
          data.zeroEnergy.phrase.text,
          data.zeroEnergy.phrase.placeholderCount || 0
        );
      }
      if (data.zeroEnergy.equipment) {
        await this.addZeroEnergyEquipment(
          data.zeroEnergy.equipment.vendor,
          data.zeroEnergy.equipment.file
        );
      }
    }

    await this.clickSave();
  }

  // ==================== READ ====================

  async searchLotoPoint(term: string) {
    await this.search(term);
  }

  async selectLotoPoint(tagNumber: string) {
    await this.clickTableRow(tagNumber);
  }

  async isLotoPointVisible(tagNumber: string): Promise<boolean> {
    return await this.isRowVisible(tagNumber);
  }

  // ==================== UPDATE ====================

  async modifyLotoPoint(tagNumber: string, newData: LotoPointFormData) {
    await this.clickTableRow(tagNumber);
    await this.page.waitForTimeout(300);

    if (newData.description) {
      await this.fillInputByIndex(2, newData.description);
    }

    if (newData.specificLocation) {
      // Find specific location input and update
      const inputs = this.formInputs;
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const value = await input.inputValue();
        if (value && i > 3) {
          await input.click();
          await input.clear();
          await input.fill(newData.specificLocation);
          break;
        }
      }
    }

    await this.clickSave();
  }

  // ==================== DELETE ====================

  async deleteLotoPoint(tagNumber: string) {
    await this.clickTableRow(tagNumber);
    await this.page.waitForTimeout(300);
    await this.clickDelete();
    await this.confirmDelete();
  }

  async deleteLotoPointViaContextMenu(tagNumber: string) {
    await this.rightClickTableRow(tagNumber);
    await this.clickContextMenuItem('Delete');
    await this.confirmDelete();
  }

  // ==================== ZERO ENERGY ====================

  async addZeroEnergyPhrase(phraseName: string) {
    // Navigate to zero energy section or open the builder
    await this.page.locator('app-zero-energy-phrase-builder').first().click();
    await this.page.waitForTimeout(300);

    await this.clickButton(/add.*new|create/i);
    await this.page.locator('.form-input-element').last().fill(phraseName);
    await this.clickSave();
  }

  async selectZeroEnergyPhrase(phraseName: string) {
    await this.page.locator('app-zero-energy-phrase-builder').first().click();
    await this.page.getByText(phraseName, { exact: true }).click();
  }

  /**
   * Creates a new zero energy phrase via the phrase dialog.
   * @param phraseName - Name for the phrase (e.g., "Valve Open Verification")
   * @param verificationPhrase - The phrase text with placeholders (e.g., "Verify that [tag1] is open")
   * @param placeholderCount - Number of tag placeholders to add (default: 0)
   */
  async createZeroEnergyPhrase(phraseName: string, verificationPhrase: string, placeholderCount: number = 0) {
    // Click the dropdown to open it
    const phraseBuilder = this.page.locator('app-zero-energy-phrase-builder').first();
    await phraseBuilder.locator('.dropdown-input').click();
    await this.page.waitForTimeout(300);

    // Click "Add New" option in the dropdown (typically first or has specific text)
    await this.page.getByText(/add.*new|create.*new/i).first().click();
    await this.page.waitForTimeout(500);

    // Fill phrase name
    const phraseNameInput = this.page.locator('.dialog-content input[type="text"]').first();
    await phraseNameInput.fill(phraseName);

    // Add placeholders if needed
    for (let i = 0; i < placeholderCount; i++) {
      await this.page.getByRole('button', { name: /add tag placeholder/i }).click();
      await this.page.waitForTimeout(200);
    }

    // Fill verification phrase in textarea
    const phraseTextarea = this.page.locator('.dialog-content textarea.phrase-input');
    await phraseTextarea.fill(verificationPhrase);

    // Click Create Phrase button
    await this.page.getByRole('button', { name: /create phrase/i }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Adds equipment to the Zero Energy section by drawing on a P&ID file.
   * This is separate from the main equipment list - it's in the Zero Energy form group.
   * @param vendorName - The vendor folder name to expand
   * @param fileName - The file name to select
   */
  async addZeroEnergyEquipment(vendorName: string, fileName: string) {
    // Find the Zero Energy section's equipment list manager (second one in form)
    const zeroEnergyEquipmentManager = this.page.locator('app-form-group-input app-equipment-list-manager');
    await zeroEnergyEquipmentManager.getByRole('button', { name: 'Add Equipment' }).click();
    await this.page.waitForTimeout(500);

    // Expand vendor folder and select file - scope to equipment dialog to avoid matching main view
    const equipmentDialog = this.page.locator('app-equipment-unified-dialog');
    await equipmentDialog.getByText(vendorName).click();
    await this.page.waitForTimeout(300);
    await equipmentDialog.getByText(fileName).click();
    await this.page.waitForTimeout(500);

    // Wait for image to load - scope to equipment dialog
    const dialogCanvas = equipmentDialog.locator('app-interactive-image canvas.shape-canvas');
    await dialogCanvas.waitFor({ state: 'visible', timeout: 10000 });

    // Draw shape on the canvas using right-click drag
    await this.drawShapeOnCanvas(dialogCanvas);

    // Click Save & Select or Select Equipment button
    await this.page.getByRole('button', { name: /save.*select|select.*equipment/i }).click();
    await this.page.waitForTimeout(500);

    // Check if zero-energy-loto-point-form appears (when creating new equipment)
    const lotoPointForm = this.page.locator('.loto-form-section');
    if (await lotoPointForm.isVisible().catch(() => false)) {
      await this.fillZeroEnergyLotoPointForm();

      // After creating the LOTO point, click Select Equipment to confirm selection
      const selectEquipmentBtn = equipmentDialog.getByRole('button', { name: /select.*equipment/i });
      if (await selectEquipmentBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await selectEquipmentBtn.click();
        await this.page.waitForTimeout(500);
      }
    }

    // Wait for equipment dialog to close
    await equipmentDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Also wait for any popup overlay to disappear
    await this.page.locator('.popup-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Fills out the LOTO Point form that appears when adding new equipment to zero energy.
   * This form requires: Tag Number, Description, Equipment Type, Location, Isolated Position, Normal Position.
   */
  async fillZeroEnergyLotoPointForm(data?: {
    tagNumber?: string;
    description?: string;
    eqTypeIndex?: number;
    locationIndex?: number;
    isoPosIndex?: number;
    normPosIndex?: number;
  }) {
    const form = this.page.locator('.loto-form-section');
    const timestamp = Date.now();

    // Tag Number (required)
    const tagInput = form.locator('input[formcontrolname="tagNumber"]');
    await tagInput.fill(data?.tagNumber || `ZE-${timestamp}`);

    // Description (required)
    const descInput = form.locator('input[formcontrolname="description"]');
    await descInput.fill(data?.description || 'Zero Energy Equipment');

    // Equipment Type dropdown
    const eqTypeSelect = form.locator('select[formcontrolname="eqType"]');
    if (data?.eqTypeIndex) {
      await eqTypeSelect.selectOption({ index: data.eqTypeIndex });
    } else {
      // Select first available option after "-- Select --"
      await eqTypeSelect.selectOption({ index: 1 });
    }

    // Location dropdown
    const locationSelect = form.locator('select[formcontrolname="location"]');
    if (data?.locationIndex) {
      await locationSelect.selectOption({ index: data.locationIndex });
    } else {
      await locationSelect.selectOption({ index: 1 });
    }

    // Isolated Position dropdown
    const isoPosSelect = form.locator('select[formcontrolname="isoPos"]');
    if (data?.isoPosIndex) {
      await isoPosSelect.selectOption({ index: data.isoPosIndex });
    } else {
      await isoPosSelect.selectOption({ index: 1 });
    }

    // Normal Position dropdown
    const normPosSelect = form.locator('select[formcontrolname="normPos"]');
    if (data?.normPosIndex) {
      await normPosSelect.selectOption({ index: data.normPosIndex });
    } else {
      await normPosSelect.selectOption({ index: 1 });
    }

    // Click Create LOTO Point button
    await form.getByRole('button', { name: /create loto point/i }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete zero energy step: creates phrase and adds equipment.
   * @param phraseData - Data for creating the phrase
   * @param equipmentData - Data for adding equipment
   */
  async fillZeroEnergy(
    phraseData: { name: string; phrase: string; placeholderCount?: number },
    equipmentData: { vendor: string; file: string }
  ) {
    // Create the zero energy phrase
    await this.createZeroEnergyPhrase(
      phraseData.name,
      phraseData.phrase,
      phraseData.placeholderCount || 0
    );

    // Add equipment to zero energy
    await this.addZeroEnergyEquipment(equipmentData.vendor, equipmentData.file);
  }

  // ==================== EQUIPMENT DRAWING ====================

  async drawOnCanvas(canvasSelector: string) {
    const canvas = this.page.locator(canvasSelector);
    const box = await canvas.boundingBox();

    if (!box) return;

    await this.page.mouse.move(box.x + 50, box.y + 50);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 150, box.y + 150);
    await this.page.mouse.up();
  }

  /**
   * Opens the Add Equipment dialog, selects a file, draws a shape, and confirms.
   * @param vendorName - The vendor folder name to expand
   * @param fileName - The file name to select
   */
  async addEquipmentByDrawing(vendorName: string, fileName: string) {
    // Click Add Equipment button in the equipment list manager (use first() as there may be multiple)
    await this.page.locator('app-equipment-list-manager').first().getByRole('button', { name: 'Add Equipment' }).click();
    await this.page.waitForTimeout(500);

    // Expand vendor folder and select file
    await this.page.getByText(vendorName).click();
    await this.page.waitForTimeout(300);
    await this.page.getByText(fileName).click();
    await this.page.waitForTimeout(500);

    // Wait for image to load (shape-canvas is the drawing layer)
    await this.page.locator('app-interactive-image canvas.shape-canvas').waitFor({ state: 'visible', timeout: 10000 });

    // Draw shape on the canvas using right-click drag
    await this.drawShapeOnInteractiveImage();

    // Click Save & Select button
    await this.page.getByRole('button', { name: /save.*select/i }).click();

    // Wait for dialog to close (popup should disappear)
    await this.page.locator('app-rf-popup-projection[ng-reflect-is-open="true"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Draws a rectangle shape on the interactive image canvas using right-click drag.
   */
  async drawShapeOnInteractiveImage() {
    const canvas = this.page.locator('app-interactive-image canvas.shape-canvas');
    await this.drawShapeOnCanvas(canvas);
  }

  /**
   * Draws a rectangle shape on the provided canvas locator using right-click drag.
   * @param canvas - Locator for the canvas element
   */
  async drawShapeOnCanvas(canvas: Locator) {
    const box = await canvas.boundingBox();

    if (!box) {
      throw new Error('Canvas not found or not visible');
    }

    // Calculate position within canvas for variety
    const startX = box.x + box.width * 0.2;
    const startY = box.y + box.height * 0.2;
    const endX = box.x + box.width * 0.4;
    const endY = box.y + box.height * 0.4;

    // Right-click drag to draw shape
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });
    await this.page.waitForTimeout(300);
  }

  // ==================== GENERATE TAG ====================

  async generateTagNumber() {
    await this.clickButton('Generate Tag Number');
    await this.page.waitForTimeout(500);
  }
}
