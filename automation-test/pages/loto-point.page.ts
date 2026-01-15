import { Page } from '@playwright/test';
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
    const box = await canvas.boundingBox();

    if (!box) {
      throw new Error('Canvas not found or not visible');
    }

    // Calculate random position within canvas for variety
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
