import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../test.config';

/**
 * Page object for Sync/Resync functionality
 */
export class SyncPage extends BasePage {
  readonly syncServerUrl: string;
  readonly clientBackendUrl: string;

  constructor(page: Page) {
    super(page);
    this.syncServerUrl = config.syncServerUrl;
    this.clientBackendUrl = config.clientBackendUrl;
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

  // ==================== SYNC TEST SERVICE API (/api/sync-test/*) ====================

  /**
   * Generate bulk test data.
   * POST /api/sync-test/generate?count=N&testType=TYPE
   */
  async generateTestData(count: number = 100, testType: string = 'BULK_CREATE'): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/generate?count=${count}&testType=${testType}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Generate mixed changes (creates, updates, deletes).
   * POST /api/sync-test/generate/mixed
   */
  async generateMixedTestData(creates: number = 100, updates: number = 50, deletes: number = 25): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/generate/mixed?creates=${creates}&updates=${updates}&deletes=${deletes}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Trigger sync and measure performance.
   * POST /api/sync-test/sync
   */
  async triggerTestSync(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/sync`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Run full test cycle: generate -> sync -> verify.
   * POST /api/sync-test/full-cycle
   */
  async runFullTestCycle(count: number = 100, testType: string = 'BULK_CREATE'): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/full-cycle?count=${count}&testType=${testType}`,
      { timeout: 30000 }
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Test sync with existing Equipment entities.
   * POST /api/sync-test/test/equipment
   */
  async testEquipmentSync(revert: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/test/equipment?revert=${revert}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Test sync with existing LotoPoint entities.
   * POST /api/sync-test/test/loto-points
   */
  async testLotoPointSync(revert: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/test/loto-points?revert=${revert}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Test sync with existing FileObject entities.
   * POST /api/sync-test/test/file-objects
   */
  async testFileObjectSync(revert: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/test/file-objects?revert=${revert}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Test all existing entity types (Equipment, LotoPoint, FileObject).
   * POST /api/sync-test/test/all-entities
   */
  async testAllEntitiesSync(revert: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/test/all-entities?revert=${revert}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Test any entity type by name.
   * POST /api/sync-test/test/entity
   */
  async testEntitySync(type: string, field: string, revert: boolean = true): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/sync-test/test/entity?type=${type}&field=${field}&revert=${revert}`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Clear all synthetic test data.
   * DELETE /api/sync-test/clear
   */
  async clearSyncTestData(): Promise<any> {
    const response = await this.page.request.delete(
      `${this.clientBackendUrl}/api/sync-test/clear`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get current test metrics.
   * GET /api/sync-test/metrics
   */
  async getSyncTestMetrics(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-test/metrics`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get test run history.
   * GET /api/sync-test/history
   */
  async getSyncTestHistory(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-test/history`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get current sync test status.
   * GET /api/sync-test/status
   */
  async getSyncTestStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/sync-test/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== FIELD SYNC API (/api/field-sync/*) ====================

  /**
   * Trigger field sync manually.
   * POST /api/field-sync/trigger
   */
  async triggerFieldSync(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/trigger`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get field sync status (machineId, syncMode, serverAvailable, sseConnected, etc.)
   * GET /api/field-sync/status
   */
  async getFieldSyncStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get field sync metrics (consecutiveFailures, totalChangesInDb, etc.)
   * GET /api/field-sync/metrics
   */
  async getFieldSyncMetrics(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/metrics`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Set sync toggle (enable/disable sync at runtime).
   * POST /api/field-sync/sync-toggle
   */
  async setSyncToggle(enabled: boolean): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/sync-toggle`,
      { data: { enabled }, timeout: 30000 }
    );
    return response.json();
  }

  /**
   * Get sync toggle state.
   * GET /api/field-sync/sync-toggle
   */
  async getSyncToggle(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/sync-toggle`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Reset circuit breaker manually.
   * POST /api/field-sync/reset-circuit-breaker
   */
  async resetCircuitBreaker(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/reset-circuit-breaker`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Start full sync of all entities to server (bootstrap).
   * POST /api/field-sync/full-sync/start
   */
  async startFullSyncToServer(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/field-sync/full-sync/start`
    );
    return response.json();
  }

  /**
   * Get status of current or last full sync to server.
   * GET /api/field-sync/full-sync/status
   */
  async getFullSyncToServerStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/full-sync/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get file sync status and queue information.
   * GET /api/field-sync/file-sync/status
   */
  async getFileSyncStatus(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/field-sync/file-sync/status`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== AUTO-RESYNC API (/api/resync/*) ====================

  /**
   * Get current auto-resync state (escalation level, last attempt, etc.).
   * GET /api/resync/auto-resync/state
   */
  async getAutoResyncState(): Promise<any> {
    const response = await this.page.request.get(
      `${this.clientBackendUrl}/api/resync/auto-resync/state`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Reset auto-resync state (retry after exhaustion).
   * POST /api/resync/auto-resync/reset
   */
  async resetAutoResyncState(): Promise<any> {
    const response = await this.page.request.post(
      `${this.clientBackendUrl}/api/resync/auto-resync/reset`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ==================== POLLING HELPERS ====================

  /**
   * Poll health check until sync status matches expected value.
   */
  async waitForSyncStatus(expected: string, timeoutMs: number = 30000): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const health = await this.getSyncHealthCheck();
      if (health.syncStatus === expected) return health;
      await this.page.waitForTimeout(2000);
    }
    throw new Error(`Sync status did not reach '${expected}' within ${timeoutMs}ms`);
  }

  /**
   * Poll until pending changes reach 0.
   */
  async waitForPendingChangesZero(timeoutMs: number = 30000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const status = await this.getSyncTestStatus();
      if (status.pendingChanges === 0) return true;
      await this.page.waitForTimeout(1000);
    }
    return false;
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

  // ==================== PERMANENT STORAGE API (SYNC SERVER) ====================

  /**
   * Get path-based file manifest from sync server's permanent storage.
   * GET /api/resync/files/path-manifest
   */
  async getPathBasedManifest(): Promise<PathBasedManifestEntry[]> {
    const response = await this.page.request.get(
      `${this.syncServerUrl}/api/resync/files/path-manifest`
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Check if a file exists in permanent storage on sync server.
   * GET /api/resync/files/permanent/{relativePath}
   */
  async fileExistsInPermanentStorage(relativePath: string): Promise<boolean> {
    const response = await this.page.request.get(
      `${this.syncServerUrl}/api/resync/files/permanent/${relativePath}`,
      { failOnStatusCode: false }
    );
    return response.ok();
  }

  /**
   * Download a file from permanent storage on sync server.
   * GET /api/resync/files/permanent/{relativePath}
   */
  async downloadFromPermanentStorage(relativePath: string): Promise<Buffer> {
    const response = await this.page.request.get(
      `${this.syncServerUrl}/api/resync/files/permanent/${relativePath}`
    );
    expect(response.ok()).toBeTruthy();
    return response.body();
  }

  /**
   * Verify file exists in both hash-based and permanent storage.
   * Returns { hashBased: boolean, permanent: boolean }
   */
  async verifyFileInDualStorage(
    fileId: number,
    permanentRelativePath: string
  ): Promise<{ hashBased: boolean; permanent: boolean }> {
    // Check hash-based storage
    const hashResponse = await this.page.request.get(
      `${this.syncServerUrl}/api/resync/files/${fileId}`,
      { failOnStatusCode: false }
    );

    // Check permanent storage
    const permResponse = await this.page.request.get(
      `${this.syncServerUrl}/api/resync/files/permanent/${permanentRelativePath}`,
      { failOnStatusCode: false }
    );

    return {
      hashBased: hashResponse.ok(),
      permanent: permResponse.ok(),
    };
  }

  /**
   * Get file manifest entries that match a specific path pattern.
   */
  async findFilesInManifest(pathPattern: string | RegExp): Promise<PathBasedManifestEntry[]> {
    const manifest = await this.getPathBasedManifest();
    return manifest.filter(entry => {
      if (typeof pathPattern === 'string') {
        return entry.relativePath.includes(pathPattern);
      }
      return pathPattern.test(entry.relativePath);
    });
  }
}

// ==================== TYPE DEFINITIONS ====================

export interface PathBasedManifestEntry {
  relativePath: string;
  fileHash: string;
  fileSize: number;
  lastModified: string;
}
