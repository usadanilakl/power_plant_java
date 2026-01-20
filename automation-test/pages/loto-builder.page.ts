import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import path from 'path';

export interface FileFormData {
  name?: string;
  fileType?: string;
  fileNumber?: string;
  vendor?: string;
  filePath?: string;
  isVerified?: boolean;
}

export interface ValueFormData {
  name: string;
  alias?: string;
}

/**
 * LOTO Builder Page Object for testing file management within the LOTO Builder
 */
export class LotoBuilderPage extends BasePage {
  // Test data paths - works on both Windows and Linux
  readonly testDataPath = process.platform === 'win32'
    ? 'C:\\Users\\usada\\my_projects\\power_plant_java\\automation-test\\test-data\\pdf'
    : '/home/dk-power/IdeaProjects/power_plant_java/automation-test/test-data/pdf';

  constructor(page: Page) {
    super(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToLotoBuilder() {
    await this.goto('/loto-builder');
    await this.skipOnboarding();
    // Wait for the builder container to be fully loaded (don't use networkidle - it times out on SPAs)
    await this.page.waitForSelector('app-loto-builder-container', { timeout: 15000 });
    // Wait for left panel to be ready
    await this.page.waitForSelector('app-loto-builder-left-panel', { timeout: 10000 });
    await this.page.waitForTimeout(500);
  }

  // ==================== LEFT PANEL ====================

  async selectFilesTab() {
    await this.page.locator('button.tab-button').filter({ hasText: /Files/i }).click();
    await this.page.waitForTimeout(300);
  }

  async selectLotoPointsTab() {
    await this.page.locator('button.tab-button').filter({ hasText: /LOTO Points/i }).click();
    await this.page.waitForTimeout(300);
  }

  async switchToTreeView() {
    // Check if tree view button already has .active class
    const treeViewButtonActive = this.page.locator('button.mode-button.active[title="Tree View"]');
    const isActive = await treeViewButtonActive.count() > 0;
    if (!isActive) {
      const treeViewButton = this.page.locator('button.mode-button[title="Tree View"]');
      await treeViewButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async switchToTableView() {
    // Check if table view button already has .active class
    const tableViewButtonActive = this.page.locator('button.mode-button.active[title="Table View"]');
    const isActive = await tableViewButtonActive.count() > 0;
    if (!isActive) {
      const tableViewButton = this.page.locator('button.mode-button[title="Table View"]');
      await tableViewButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  // ==================== FILE FORM - OPEN/CLOSE ====================

  async clickAddNewFile() {
    // Click the + button in the left menu (Files section)
    await this.page.locator('.add-button, button[title="Add New File"]').click();
    await this.page.waitForTimeout(500);
    // Wait for file form popup to appear
    await this.page.waitForSelector('app-rf-file-form', { timeout: 5000 });
  }

  async closeFileForm() {
    // Close the file form popup
    const closeButton = this.page.locator('app-rf-popup-projection button').filter({ hasText: /close|×/i });
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async isFileFormVisible(): Promise<boolean> {
    return await this.page.locator('app-rf-file-form').isVisible({ timeout: 1000 }).catch(() => false);
  }

  // ==================== FILE TYPE MANAGEMENT ====================

  async openFileTypeDropdown() {
    // Click on the dropdown-input inside the File Type field
    // The structure is: app-rf-value-select > app-searchable-select-input > .dropdown-input
    const fileTypeField = this.page.locator('app-rf-value-select').filter({ hasText: /File Type/i });
    await fileTypeField.locator('.dropdown-input').click();
    await this.page.waitForTimeout(300);
  }

  async clickAddNewFileType() {
    await this.openFileTypeDropdown();
    // Click on "Add New" in dropdown options - it's a div with class .add-new-option
    const addNewOption = this.page.locator('.add-new-option').filter({ hasText: /Add New/i }).first();
    await addNewOption.click();
    await this.page.waitForTimeout(300);
    // Wait for dialog to appear
    await this.page.waitForSelector('.dialog-content', { timeout: 5000 });
  }

  async fillValueForm(data: ValueFormData) {
    // Fill the value dialog form (used for both file type and vendor)
    // The dialog has input fields with class .input-field
    const nameInput = this.page.locator('.dialog-content input.input-field').first();
    await nameInput.click();
    await nameInput.fill(data.name);

    if (data.alias) {
      const aliasInput = this.page.locator('.dialog-content input.input-field').nth(1);
      await aliasInput.click();
      await aliasInput.fill(data.alias);
    }
  }

  async saveValueForm() {
    const saveButton = this.page.locator('.dialog-content button.save-btn, .dialog-content button').filter({ hasText: /save/i });
    await saveButton.click();
    await this.waitForLoadingToFinish();
  }

  async createNewFileType(data: ValueFormData) {
    await this.clickAddNewFileType();
    await this.fillValueForm(data);
    await this.saveValueForm();
  }

  async selectFileType(fileTypeName: string) {
    await this.openFileTypeDropdown();
    // Click on the option in dropdown-options
    await this.page.locator('.dropdown-option, .dropdown-options div').filter({ hasText: fileTypeName }).first().click();
    await this.page.waitForTimeout(300);
  }

  async isFileTypeOptionVisible(fileTypeName: string): Promise<boolean> {
    await this.openFileTypeDropdown();
    const isVisible = await this.page.locator('.dropdown-option').filter({ hasText: fileTypeName }).isVisible({ timeout: 2000 }).catch(() => false);
    // Close dropdown by clicking elsewhere
    await this.page.keyboard.press('Escape');
    return isVisible;
  }

  // ==================== VENDOR MANAGEMENT ====================

  async openVendorDropdown() {
    // First check if dropdown is already open
    const dropdownOptions = this.page.locator('.dropdown-options');
    const isAlreadyOpen = await dropdownOptions.isVisible().catch(() => false);

    if (!isAlreadyOpen) {
      const vendorField = this.page.locator('app-rf-value-select').filter({ hasText: /Vendor/i });
      await vendorField.locator('.dropdown-input').click();
      // Wait for dropdown options to appear
      await dropdownOptions.waitFor({ state: 'visible', timeout: 5000 });
    }
    await this.page.waitForTimeout(300);
  }

  async closeVendorDropdown() {
    const dropdownOptions = this.page.locator('.dropdown-options');
    const isOpen = await dropdownOptions.isVisible().catch(() => false);
    if (isOpen) {
      await this.page.keyboard.press('Escape');
      await dropdownOptions.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(200);
    }
  }

  async clickAddNewVendor() {
    await this.openVendorDropdown();
    const addNewOption = this.page.locator('.add-new-option').filter({ hasText: /Add New/i }).first();
    await addNewOption.click();
    await this.page.waitForTimeout(300);
    await this.page.waitForSelector('.dialog-content', { timeout: 5000 });
  }

  async createNewVendor(data: ValueFormData) {
    await this.clickAddNewVendor();
    await this.fillValueForm(data);
    await this.saveValueForm();
  }

  async selectVendor(vendorName: string) {
    // Close dropdown first if already open (to ensure clean state)
    await this.closeVendorDropdown();
    await this.openVendorDropdown();
    const vendorOption = this.page.locator('.dropdown-option').filter({ hasText: vendorName }).first();
    await vendorOption.waitFor({ state: 'visible', timeout: 5000 });
    await vendorOption.click();
    await this.page.waitForTimeout(300);
  }

  async isVendorOptionVisible(vendorName: string): Promise<boolean> {
    await this.openVendorDropdown();
    const isVisible = await this.page.locator('.dropdown-option').filter({ hasText: vendorName }).isVisible({ timeout: 2000 }).catch(() => false);
    await this.closeVendorDropdown();
    return isVisible;
  }

  /**
   * Get all vendor options from the dropdown
   */
  async getVendorOptions(): Promise<string[]> {
    await this.openVendorDropdown();
    const options = this.page.locator('.dropdown-option');
    const count = await options.count();
    const vendorNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) {
        vendorNames.push(text.trim());
      }
    }
    await this.closeVendorDropdown();
    return vendorNames;
  }

  /**
   * Click the delete option in the vendor dropdown (requires a vendor to be selected)
   */
  async clickDeleteVendor() {
    // Close dropdown first if already open (to ensure clean state)
    await this.closeVendorDropdown();
    await this.openVendorDropdown();
    // Click on "Delete" option in dropdown - it's a div with class .delete-option
    const deleteOption = this.page.locator('.add-new-option.delete-option').filter({ hasText: /Delete/i });
    await deleteOption.click();
    await this.page.waitForTimeout(300);
    // Wait for delete confirmation dialog to appear
    await this.page.waitForSelector('.dialog-content', { timeout: 5000 });
  }

  /**
   * Select a vendor to transfer items to in the delete confirmation dialog
   */
  async selectTransferVendor(vendorName: string) {
    const transferSelect = this.page.locator('.dialog-content select.input-field');
    await transferSelect.selectOption({ label: vendorName });
    await this.page.waitForTimeout(300);
  }

  /**
   * Confirm the vendor deletion in the delete confirmation dialog
   */
  async confirmVendorDelete() {
    const deleteButton = this.page.locator('.dialog-content button.delete-btn-confirm');
    await deleteButton.click();
    // Wait for deletion to complete (loading spinner disappears)
    await this.page.locator('.loading-message').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    // Wait for dialog to close
    await this.page.locator('.dialog-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.waitForLoadingToFinish();
    // Small delay for UI to stabilize
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel the vendor deletion dialog
   */
  async cancelVendorDelete() {
    const cancelButton = this.page.locator('.dialog-content button.cancel-btn');
    await cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Delete a vendor and transfer its items to another vendor
   * @param vendorToDelete - Name of the vendor to delete
   * @param transferToVendor - Name of the vendor to transfer items to
   */
  async deleteVendorWithTransfer(vendorToDelete: string, transferToVendor: string) {
    // First select the vendor to delete
    await this.selectVendor(vendorToDelete);
    // Click delete option
    await this.clickDeleteVendor();
    // Select vendor to transfer to
    await this.selectTransferVendor(transferToVendor);
    // Confirm deletion
    await this.confirmVendorDelete();
  }

  // ==================== FILE FORM FILL ====================

  async fillFileName(name: string) {
    // File Name field - find the input within the form-input component labeled "File Name"
    // Structure: app-rf-form-input > .form-input > .label-container > label + input.form-input-element
    const fileNameField = this.page.locator('app-rf-file-form .form-input').filter({ hasText: /File Name/i }).locator('input.form-input-element');
    await fileNameField.click();
    await fileNameField.clear();
    await fileNameField.fill(name);
  }

  async fillFileNumber(fileNumber: string) {
    // File Number field is a multi-input component with structure:
    // .multi-input-container > .label-container > label + .input-values > .input-value > input
    const fileNumberContainer = this.page.locator('app-rf-file-form .multi-input-container').filter({ hasText: /File Number/i });

    // Clear existing values by clicking X buttons (in reverse to avoid index issues)
    const removeButtons = fileNumberContainer.locator('.input-value button');
    const count = await removeButtons.count();
    for (let i = count - 1; i >= 0; i--) {
      await removeButtons.nth(i).click();
      await this.page.waitForTimeout(100);
    }

    // Click "Add" button to add a new input
    await fileNumberContainer.locator('.add-button').click();
    await this.page.waitForTimeout(100);

    // Fill the new input
    const newInput = fileNumberContainer.locator('.input-value input').first();
    await newInput.fill(fileNumber);
  }

  async uploadFile(fileName: string) {
    const filePath = path.join(this.testDataPath, fileName);
    const fileInput = this.page.locator('app-rf-file-form input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  /**
   * Upload a file and set unique file name and file number
   * @param testFileName - The actual test file to upload (e.g., '1.pdf')
   * @param uniqueSuffix - A unique suffix to append to file name and number (e.g., timestamp)
   * @returns The unique file name used (without extension)
   */
  async uploadFileWithUniqueName(testFileName: string, uniqueSuffix: string): Promise<string> {
    // Generate unique name based on test file and suffix
    const baseName = testFileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const uniqueName = `${baseName}-${uniqueSuffix}`;

    // Upload the actual test file (this will auto-fill file name and file number with the original name)
    await this.uploadFile(testFileName);

    // Override with unique file name and file number
    await this.fillFileName(uniqueName);
    await this.fillFileNumber(uniqueName);

    return uniqueName;
  }

  async submitFileForm() {
    const saveButton = this.page.locator('app-rf-file-form button').filter({ hasText: /save|submit/i });
    await saveButton.click();
    await this.waitForLoadingToFinish();
    // After submission, switch back to tree view since it may switch to table view
    await this.switchToTreeView();
  }

  async fillFileForm(data: FileFormData) {
    if (data.name) {
      await this.fillFileName(data.name);
    }

    if (data.fileType) {
      await this.selectFileType(data.fileType);
    }

    if (data.vendor) {
      await this.selectVendor(data.vendor);
    }

    if (data.filePath) {
      await this.uploadFile(data.filePath);
    }
  }

  // ==================== CREATE FILE WITH NEW VALUES ====================

  async createFileWithNewFileTypeAndVendor(
    fileTypeName: string,
    fileTypeAlias: string,
    vendorName: string,
    vendorAlias: string,
    fileName: string
  ) {
    await this.clickAddNewFile();

    // Create new file type
    await this.clickAddNewFileType();
    await this.fillValueForm({ name: fileTypeName, alias: fileTypeAlias });
    await this.saveValueForm();

    // Create new vendor
    await this.clickAddNewVendor();
    await this.fillValueForm({ name: vendorName, alias: vendorAlias });
    await this.saveValueForm();

    // Upload file
    await this.uploadFile(fileName);

    // Submit
    await this.submitFileForm();
  }

  async createFileWithExistingTypeAndNewVendor(
    fileTypeName: string,
    vendorName: string,
    vendorAlias: string,
    fileName: string
  ) {
    await this.clickAddNewFile();

    // Select existing file type
    await this.selectFileType(fileTypeName);

    // Create new vendor
    await this.clickAddNewVendor();
    await this.fillValueForm({ name: vendorName, alias: vendorAlias });
    await this.saveValueForm();

    // Upload file
    await this.uploadFile(fileName);

    // Submit
    await this.submitFileForm();
  }

  async createFileWithExistingTypeAndVendor(
    fileTypeName: string,
    vendorName: string,
    fileName: string
  ) {
    await this.clickAddNewFile();

    // Select existing file type
    await this.selectFileType(fileTypeName);

    // Select existing vendor
    await this.selectVendor(vendorName);

    // Upload file
    await this.uploadFile(fileName);

    // Submit
    await this.submitFileForm();
  }

  // ==================== LEFT MENU (TREE VIEW) ====================

  /**
   * Select a predefined file type category in the left menu.
   * Valid options: 'pid', 'elect', 'ht panel', 'iso' (or display names: 'PID', 'Electrical', 'Heat Trace', 'Isometrics')
   */
  async selectFileTypeCategory(category: 'pid' | 'elect' | 'ht panel' | 'iso' | string) {
    await this.switchToTreeView();
    // Map display names to internal names if needed
    const categoryMap: Record<string, string> = {
      'pid': 'PID',
      'elect': 'Electrical',
      'ht panel': 'Heat Trace',
      'iso': 'Isometrics',
      'PID': 'PID',
      'Electrical': 'Electrical',
      'Heat Trace': 'Heat Trace',
      'Isometrics': 'Isometrics'
    };
    const buttonText = categoryMap[category] || category;
    await this.page.locator('.type-button').filter({ hasText: new RegExp(`^${buttonText}$`, 'i') }).click();
    await this.page.waitForTimeout(500);
  }

  async isVendorInLeftMenu(vendorName: string): Promise<boolean> {
    await this.switchToTreeView();
    // The toggle menu uses .item-content > .item-name structure
    const vendorItem = this.page.locator('.item-content .item-name').filter({ hasText: vendorName });
    return await vendorItem.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isFileInVendorDropdown(vendorName: string, fileName: string): Promise<boolean> {
    await this.switchToTreeView();
    // First check if vendor is visible and expand if needed
    const vendorItem = this.page.locator('.item-content').filter({ hasText: vendorName }).first();
    if (await vendorItem.isVisible()) {
      // Check if vendor is already expanded by looking at the toggle icon
      const toggleIcon = vendorItem.locator('.toggle-icon');
      const toggleText = await toggleIcon.textContent().catch(() => '');
      const isExpanded = toggleText?.includes('▼');

      // Only click to expand if not already expanded
      if (!isExpanded) {
        await vendorItem.click();
        await this.page.waitForTimeout(500);
      }

      // Check if file is now visible - use exact match
      const fileItem = this.page.locator('.item-content .item-name').filter({ hasText: new RegExp(`^${fileName}$`) });
      return await fileItem.first().isVisible({ timeout: 3000 }).catch(() => false);
    }
    return false;
  }

  async clickFileInLeftMenu(vendorName: string, fileName: string) {
    await this.switchToTreeView();

    // Find the vendor item - wait for it to be visible
    const vendorItem = this.page.locator('.item-content').filter({ hasText: vendorName }).first();
    await vendorItem.waitFor({ state: 'visible', timeout: 10000 });

    // Check if vendor is already expanded by looking at the toggle icon
    // ▼ means expanded, ▶ means collapsed
    const toggleIcon = vendorItem.locator('.toggle-icon');
    const toggleText = await toggleIcon.textContent().catch(() => '');
    const isExpanded = toggleText?.includes('▼');

    // Only click to expand if not already expanded
    if (!isExpanded) {
      await vendorItem.click();
      await this.page.waitForTimeout(300);
    }

    // Click on file - use exact match on .item-name to avoid matching vendor names
    // Wait for the file item to appear (may take a moment after expanding vendor)
    const fileItem = this.page.locator('.item-content .item-name').filter({ hasText: new RegExp(`^${fileName}$`) }).first();
    await fileItem.waitFor({ state: 'visible', timeout: 5000 });
    await fileItem.click();
    await this.page.waitForTimeout(300);
  }

  // ==================== RIGHT PANEL (FILE VIEWER) ====================

  async isFileDisplayedInViewer(): Promise<boolean> {
    // Check if interactive-image is present (it only shows when a file is loaded)
    // The empty state shows "No File Selected" when no file is loaded
    const interactiveImage = this.page.locator('app-interactive-image');
    const emptyState = this.page.locator('.empty-state');

    // Wait a moment for the view to update
    await this.page.waitForTimeout(500);

    // If empty state is visible, no file is displayed
    if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) {
      return false;
    }

    // Check if interactive image component is visible
    return await interactiveImage.isVisible({ timeout: 10000 }).catch(() => false);
  }

  async waitForFileToLoad() {
    // Wait for interactive image to appear (indicates file is loaded)
    await this.page.waitForSelector('app-interactive-image', { timeout: 15000 });
    // Wait for any loading/processing overlays to disappear
    await this.page.locator('.processing-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.waitForLoadingToFinish();
  }

  // ==================== VENDOR MODIFICATION ====================

  async modifyVendorName(oldVendorName: string, newVendorName: string) {
    // To modify a vendor, we need to:
    // 1. Open the file form
    // 2. Select the vendor in the dropdown
    // 3. Click "Edit vendors" option in the dropdown
    // 4. Edit the name in the dialog

    // Open file form
    await this.clickAddNewFile();

    // Select the vendor to edit
    await this.selectVendor(oldVendorName);

    // Open vendor dropdown again and click Edit option
    await this.openVendorDropdown();
    await this.page.waitForTimeout(300);

    // Click "Edit vendors" option in the dropdown
    const editOption = this.page.locator('.dropdown-options .add-new-option').filter({ hasText: /Edit.*vendor/i });
    await editOption.click();
    await this.page.waitForTimeout(300);

    // Wait for the edit dialog to appear and fill new name
    const dialogContent = this.page.locator('.dialog-content');
    await dialogContent.waitFor({ state: 'visible', timeout: 5000 });

    // Find the name input field in the dialog
    const nameInput = dialogContent.locator('input.input-field').first();
    await nameInput.click();
    await nameInput.clear();
    await nameInput.fill(newVendorName);

    // Click Save button in dialog
    await dialogContent.locator('button.save-btn').click();
    await this.waitForLoadingToFinish();

    // Close file form
    await this.closeFileForm();
  }

  // ==================== VERIFICATION HELPERS ====================

  /**
   * Verify a predefined file type category is selected.
   * Valid options: 'PID', 'Electrical', 'Heat Trace', 'Isometrics'
   */
  async verifyCategoryIsSelected(category: string): Promise<boolean> {
    const tab = this.page.locator('.type-button.active').filter({ hasText: new RegExp(`^${category}$`, 'i') });
    return await tab.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async verifyVendorPresentInMenu(vendorName: string): Promise<boolean> {
    return await this.isVendorInLeftMenu(vendorName);
  }

  async verifyFileOpensInViewer(vendorName: string, fileName: string, fileTypeCategory: string = 'pid'): Promise<boolean> {
    // Ensure we're viewing the correct file type category
    await this.selectFileTypeCategory(fileTypeCategory);
    await this.clickFileInLeftMenu(vendorName, fileName);
    await this.waitForFileToLoad();
    return await this.isFileDisplayedInViewer();
  }

  // ==================== CLEANUP ====================

  async deleteFile(vendorName: string, fileName: string) {
    await this.switchToTreeView();
    // Expand vendor
    const vendorItem = this.page.locator('app-rf-toggle-menu .menu-item').filter({ hasText: vendorName });
    await vendorItem.click();
    await this.page.waitForTimeout(300);

    // Right-click on file
    const fileItem = this.page.locator('app-rf-toggle-menu').getByText(fileName);
    await fileItem.click({ button: 'right' });
    await this.page.waitForTimeout(300);

    // Click delete
    await this.clickContextMenuItem('Delete');
    await this.confirmDelete();
  }
}
