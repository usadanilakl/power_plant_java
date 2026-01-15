import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface LotoStandardFormData {
  name?: string;
  description?: string;
  isVerified?: boolean;
  groups?: string[];
}

/**
 * LOTO Standard Page Object for LOTO Standard management operations
 */
export class LotoStandardPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToLotoStandardsPage() {
    await this.goto('/home');
    await this.skipOnboarding();
    await this.clickNavLink('LOTO Standard');
    await this.waitForPageLoad();
  }

  async navigateDirectToLotoStandards() {
    await this.goto('/loto-standards');
    await this.waitForPageLoad();
  }

  // ==================== CREATE ====================

  async clickAddNewLotoStandard() {
    await this.clickButton(/add.*new|new.*standard/i);
    await this.page.waitForTimeout(500);
  }

  async fillLotoStandardForm(data: LotoStandardFormData) {
    // Name (first input)
    if (data.name) {
      await this.formInputs.first().click();
      await this.formInputs.first().fill(data.name);
    }

    // Description (second input or textarea)
    if (data.description) {
      const descInput = this.page.locator('textarea, .form-input-element').nth(1);
      await descInput.click();
      await descInput.fill(data.description);
    }

    // Is Verified checkbox
    if (data.isVerified !== undefined) {
      const checkbox = this.page.locator('[formcontrolname="isVerified"], [name="isVerified"]');
      if (data.isVerified) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    // Groups multi-select
    if (data.groups && data.groups.length > 0) {
      const groupsSelect = this.page.locator('app-multi-value-select, [formcontrolname="groups"]');
      await groupsSelect.click();
      for (const group of data.groups) {
        await this.page.getByText(group, { exact: true }).click();
      }
      await this.page.keyboard.press('Escape');
    }
  }

  async createLotoStandard(data: LotoStandardFormData) {
    await this.clickAddNewLotoStandard();
    await this.fillLotoStandardForm(data);
    await this.clickSave();
  }

  // ==================== READ ====================

  async searchLotoStandard(term: string) {
    await this.search(term);
  }

  async selectLotoStandard(name: string) {
    await this.clickTableRow(name);
  }

  async isLotoStandardVisible(name: string): Promise<boolean> {
    return await this.isRowVisible(name);
  }

  // ==================== UPDATE ====================

  async modifyLotoStandard(name: string, newData: LotoStandardFormData) {
    await this.clickTableRow(name);
    await this.page.waitForTimeout(300);

    if (newData.name) {
      await this.fillInputByIndex(0, newData.name);
    }

    if (newData.description) {
      const descInput = this.page.locator('textarea, .form-input-element').nth(1);
      await descInput.click();
      await descInput.clear();
      await descInput.fill(newData.description);
    }

    await this.clickSave();
  }

  // ==================== DELETE ====================

  async deleteLotoStandard(name: string) {
    await this.clickTableRow(name);
    await this.page.waitForTimeout(300);
    await this.clickDelete();
    await this.confirmDelete();
  }

  async deleteLotoStandardViaContextMenu(name: string) {
    await this.rightClickTableRow(name);
    await this.clickContextMenuItem('Delete');
    await this.confirmDelete();
  }

  // ==================== LOTO POINTS MANAGEMENT ====================

  async goToLotoPointsTab() {
    // Click on LOTO Points tab in carousel
    await this.page.locator('.nav-btn').filter({ hasText: /loto.*point/i }).click();
    await this.page.waitForTimeout(300);
  }

  async addLotoPointToStandard(tagNumber: string) {
    await this.goToLotoPointsTab();

    // Click add button in the double table
    await this.clickButton(/add/i);
    await this.page.waitForTimeout(300);

    // Search and select the LOTO point
    await this.search(tagNumber);
    await this.clickTableRow(tagNumber);
    await this.clickButton(/select|add/i);
  }

  async removeLotoPointFromStandard(tagNumber: string) {
    await this.goToLotoPointsTab();

    // Find and remove the LOTO point
    await this.clickTableRow(tagNumber);
    await this.clickButton(/remove/i);
  }

  // ==================== IMAGES TAB ====================

  async goToImagesTab() {
    await this.page.locator('.nav-btn').filter({ hasText: /image/i }).click();
    await this.page.waitForTimeout(300);
  }

  // ==================== CAROUSEL NAVIGATION ====================

  async goToGeneralInfoTab() {
    await this.page.locator('.nav-btn').filter({ hasText: /general|info/i }).click();
    await this.page.waitForTimeout(300);
  }

  async nextSlide() {
    await this.page.locator('.carousel-arrow-right').click();
    await this.page.waitForTimeout(300);
  }

  async previousSlide() {
    await this.page.locator('.carousel-arrow-left').click();
    await this.page.waitForTimeout(300);
  }
}
