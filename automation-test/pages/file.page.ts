import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface FileFormData {
  name?: string;
  fileType?: string;
  fileNumber?: string;
  vendor?: string;
}

/**
 * File Page Object for File management operations
 */
export class FilePage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToFilesPage() {
    await this.goto('/home');
    await this.skipOnboarding();
    await this.clickNavLink('Files');
    await this.waitForPageLoad();
  }

  async navigateDirectToFiles() {
    await this.goto('/files');
    await this.waitForPageLoad();
  }

  // ==================== CREATE ====================

  async clickAddNewFile() {
    await this.clickButton(/add.*new.*file|new.*file/i);
    await this.page.waitForTimeout(500);
  }

  async fillFileForm(data: FileFormData) {
    // Name (first input)
    if (data.name) {
      await this.formInputs.first().click();
      await this.formInputs.first().fill(data.name);
    }

    // File Type dropdown
    if (data.fileType) {
      await this.selectDropdownOption(data.fileType);
    }

    // File Number
    if (data.fileNumber) {
      await this.fillNextUntouchedInput(data.fileNumber);
    }

    // Vendor dropdown
    if (data.vendor) {
      await this.selectDropdownOption(data.vendor);
    }
  }

  async createFile(data: FileFormData) {
    await this.clickAddNewFile();
    await this.fillFileForm(data);
    await this.clickSave();
  }

  // ==================== READ ====================

  async searchFile(term: string) {
    await this.search(term);
  }

  async selectFile(name: string) {
    await this.clickTableRow(name);
  }

  async isFileVisible(name: string): Promise<boolean> {
    return await this.isRowVisible(name);
  }

  // ==================== UPDATE ====================

  async modifyFile(name: string, newData: FileFormData) {
    await this.clickTableRow(name);
    await this.page.waitForTimeout(300);

    if (newData.name) {
      await this.fillInputByIndex(0, newData.name);
    }

    if (newData.fileType) {
      await this.selectDropdownOption(newData.fileType);
    }

    await this.clickSave();
  }

  // ==================== DELETE ====================

  async deleteFile(name: string) {
    await this.rightClickTableRow(name);
    await this.clickContextMenuItem('Delete');
    await this.confirmDelete();
  }

  // ==================== VENDOR MANAGEMENT ====================

  async openVendorDropdown() {
    // Click on vendor value-select to open management
    await this.page.locator('app-rf-value-select').filter({ hasText: /vendor/i }).click();
  }

  async createVendorFromForm(vendorName: string) {
    await this.openVendorDropdown();
    await this.clickButton(/add.*new|create.*new/i);
    await this.page.waitForTimeout(300);

    // Fill vendor name in the popup
    await this.page.locator('.form-input-element').last().fill(vendorName);
    await this.clickSave();
  }

  async selectVendor(vendorName: string) {
    await this.openVendorDropdown();
    await this.page.getByText(vendorName, { exact: true }).click();
  }

  // ==================== FILE TYPE MANAGEMENT ====================

  async openFileTypeDropdown() {
    await this.page.locator('app-rf-value-select').filter({ hasText: /file.*type/i }).click();
  }

  async createFileTypeFromForm(typeName: string) {
    await this.openFileTypeDropdown();
    await this.clickButton(/add.*new|create.*new/i);
    await this.page.waitForTimeout(300);

    await this.page.locator('.form-input-element').last().fill(typeName);
    await this.clickSave();
  }

  async selectFileType(typeName: string) {
    await this.openFileTypeDropdown();
    await this.page.getByText(typeName, { exact: true }).click();
  }
}
