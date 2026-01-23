import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for Sync/Resync functionality
 */
export class SyncPage extends BasePage {
  // Default URLs - can be overridden via environment variables
  readonly syncServerUrl: string;
  readonly clientBackendUrl: string;

  constructor(page: Page) {
    super(page);
    this.syncServerUrl = process.env.SYNC_SERVER_URL || 'http://localhost:8090';
    this.clientBackendUrl = process.env.CLIENT_BACKEND_URL || 'http://localhost:8080';
  }

  // ==================== NAVIGATION ====================

  async navigateToSyncPage() {
    await this.page.goto('/sync-resync');
    await this.waitForPageLoad();
  }

  // ==================== SYNC SERVER API CALLS ====================

  /**
   * Create backdated field changes on the sync server
   */
  async createTestDataOnServer(date: string, count: number = 3): Promise<any> {
    const response = await this.page.request.post(
      `${this.syncServerUrl}/api/test/field-changes/generate/${date}?count=${count}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get count of changes for a specific date on sync server
   */
  async getServerChangeCount(date: string): Promise<any> {
    const response = await this.page.request.get(
      `${this.syncServerUrl}/api/test/field-changes/count/${date}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get test data summary from sync server
   */
  async getTestDataSummary(): Promise<any> {
    const response = await this.page.request.get(
      `${this.syncServerUrl}/api/test/field-changes/summary`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Clear all test data from sync server
   */
  async clearServerTestData(): Promise<any> {
    const response = await this.page.request.delete(
      `${this.syncServerUrl}/api/test/field-changes`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Clear test data for a specific date from sync server
   */
  async clearServerTestDataForDate(date: string): Promise<any> {
    const response = await this.page.request.delete(
      `${this.syncServerUrl}/api/test/field-changes/${date}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== CLIENT BACKEND API CALLS ====================

  /**
   * Get available sync dates from client
   */
  async getAvailableSyncDates(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/partial-sync/dates`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Preview partial sync from client
   */
  async previewPartialSync(date: string): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/partial-sync/preview?date=${date}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Execute partial sync from client
   */
  async executePartialSync(date: string, force: boolean = false): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/partial-sync/execute?date=${date}&force=${force}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get sync health status from client
   */
  async getSyncHealth(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/health`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get sync health check result from client
   */
  async getSyncHealthCheck(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/sync-health`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Force sync health check from client
   */
  async forceSyncHealthCheck(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/sync-health/check`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get entity counts from sync test service
   */
  async getEntityCounts(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-test/entity-counts`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== UI INTERACTIONS ====================

  /**
   * Load partial sync dates dropdown
   */
  async loadPartialSyncDates() {
    await this.page.getByRole('button', { name: /load.*dates/i }).click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Select a date from the partial sync dropdown
   */
  async selectPartialSyncDate(date: string) {
    await this.page.locator('select.form-select').selectOption(date);
  }

  /**
   * Get the currently selected partial sync date
   */
  async getSelectedPartialSyncDate(): Promise<string> {
    return await this.page.locator('select.form-select').inputValue();
  }

  /**
   * Click preview partial sync button
   */
  async clickPreviewPartialSync() {
    await this.page.getByRole('button', { name: /preview/i }).click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Click execute partial sync button
   */
  async clickExecutePartialSync() {
    await this.page.getByRole('button', { name: /execute.*sync|start.*sync/i }).click();
  }

  /**
   * Confirm partial sync in the dialog
   */
  async confirmPartialSync() {
    await this.page.getByRole('button', { name: /confirm|yes|proceed/i }).click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Cancel partial sync dialog
   */
  async cancelPartialSync() {
    await this.page.getByRole('button', { name: /cancel|no/i }).click();
  }

  /**
   * Get the sync health status text
   */
  async getSyncStatusText(): Promise<string> {
    const statusBadge = this.page.locator('.status-badge').first();
    return await statusBadge.textContent() || '';
  }

  /**
   * Check if sync suggestion box is visible
   */
  async isSyncSuggestionVisible(): Promise<boolean> {
    return await this.page.locator('.sync-suggestion-box').isVisible();
  }

  /**
   * Click the suggested sync button
   */
  async clickSuggestedSync() {
    await this.page.getByRole('button', { name: /sync.*now|execute.*suggested/i }).click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Get the message displayed on the page
   */
  async getMessage(): Promise<string> {
    const message = this.page.locator('.message').first();
    if (await message.isVisible()) {
      return await message.textContent() || '';
    }
    return '';
  }

  /**
   * Wait for a success message
   */
  async waitForSuccessMessage() {
    await this.page.locator('.message-success').waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Wait for an error message
   */
  async waitForErrorMessage() {
    await this.page.locator('.message-error').waitFor({ state: 'visible', timeout: 30000 });
  }

  // ==================== VERIFICATION HELPERS ====================

  /**
   * Get the partial sync preview summary
   */
  async getPreviewSummary(): Promise<{ changeCount: number; filesToDownload: number; filesToDelete: number }> {
    const changeCountText = await this.page.locator('.summary-item.download .count').textContent();
    const deleteCountText = await this.page.locator('.summary-item.delete .count').textContent();

    return {
      changeCount: parseInt(changeCountText || '0'),
      filesToDownload: parseInt(changeCountText || '0'),
      filesToDelete: parseInt(deleteCountText || '0'),
    };
  }
}
