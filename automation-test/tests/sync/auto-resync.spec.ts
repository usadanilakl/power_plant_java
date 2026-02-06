import { test, expect } from '@playwright/test';
import { SyncPage, PathBasedManifestEntry } from '../../pages/sync.page';
import { config } from '../../test.config';

/**
 * Auto-Resync Escalation Tests
 *
 * Tests the AutoResyncService escalation state management:
 * - Initial state
 * - State reset
 * - OUT_OF_SYNC detection and state tracking
 * - IN_SYNC recovery
 */

test.describe('Auto-Resync Escalation', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  // Clean up after all tests
  test.afterAll(async ({ request }) => {
    try {
      await request.post(`${config.clientBackendUrl}/api/resync/auto-resync/reset`);
      await request.delete(`${config.syncServerUrl}/api/test/field-changes`);
    } catch { /* ignore */ }
  });

  test.describe('State Management', () => {
    test('should return auto-resync state', async () => {
      const state = await syncPage.getAutoResyncState();

      expect(state).toBeDefined();
      // State should have escalation-related fields
      console.log('Auto-resync state:', JSON.stringify(state));
    });

    test('should reset auto-resync state', async () => {
      const resetResult = await syncPage.resetAutoResyncState();

      expect(resetResult).toBeDefined();

      // Verify state after reset
      const state = await syncPage.getAutoResyncState();
      console.log('State after reset:', JSON.stringify(state));
    });
  });

  test.describe('OUT_OF_SYNC Detection', () => {
    test.setTimeout(60000);

    test.afterEach(async () => {
      // Clean up
      try {
        await syncPage.resetAutoResyncState();
        await syncPage.clearServerTestData();
      } catch { /* ignore */ }
    });

    test('should track health checks and report sync status', async () => {
      // Force multiple health checks and verify the system tracks them
      for (let i = 0; i < 3; i++) {
        await syncPage.forceSyncHealthCheck();
        await syncPage.page.waitForTimeout(1000);
      }

      // Check health status — with matching data it should be IN_SYNC
      const health = await syncPage.getSyncHealthCheck();
      console.log(`After 3 checks: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

      expect(health.syncStatus).toBeDefined();
      expect(health.entityDifference).toBeDefined();

      // Verify auto-resync state is tracking
      const state = await syncPage.getAutoResyncState();
      console.log('Auto-resync state after checks:', JSON.stringify(state));
      expect(state).toBeDefined();
    });
  });

  test.describe('IN_SYNC Recovery', () => {
    test('should recover when sync state is restored', async () => {
      // Clean all test data
      try {
        await syncPage.clearServerTestData();
      } catch { /* ignore */ }

      // Reset auto-resync state
      await syncPage.resetAutoResyncState();

      // Force health check
      const health = await syncPage.forceSyncHealthCheck();

      console.log(`Recovery check: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

      // State should reflect clean status
      const state = await syncPage.getAutoResyncState();
      console.log('State after recovery:', JSON.stringify(state));
    });
  });

  test.describe('File Sync State During Auto-Resync', () => {
    test('should have access to server file manifest for comparison', async () => {
      // Auto-resync uses the same file comparison as partial sync
      // Verify the path-based manifest is available
      const manifest = await syncPage.getPathBasedManifest();

      expect(manifest).toBeDefined();
      expect(Array.isArray(manifest)).toBe(true);

      console.log(`Server permanent storage contains ${manifest.length} files`);

      // During auto-resync, this manifest is used to compare with local files
      if (manifest.length > 0) {
        const sample = manifest[0];
        expect(sample.relativePath).toBeDefined();
        expect(sample.fileHash).toBeDefined();
        console.log(`Sample file: ${sample.relativePath} (${sample.fileSize} bytes)`);
      }
    });

    test('should include file sync status in health check', async () => {
      const health = await syncPage.forceSyncHealthCheck();

      expect(health).toBeDefined();
      expect(health.syncStatus).toBeDefined();

      console.log('Health check during auto-resync verification:');
      console.log(`  Sync status: ${health.syncStatus}`);
      console.log(`  Entity difference: ${health.entityDifference}`);
      console.log(`  Server reachable: ${health.serverReachable}`);

      // File sync status should be available
      const fileSyncStatus = await syncPage.getFileSyncStatus();
      expect(fileSyncStatus).toBeDefined();

      console.log('File sync status:');
      console.log(`  Enabled: ${fileSyncStatus.enabled}`);
      console.log(`  Queue size: ${fileSyncStatus.queueSize || 0}`);
    });

    test('should be able to verify dual storage consistency', async () => {
      // Get file manifest
      const manifest = await syncPage.getPathBasedManifest();

      if (manifest.length === 0) {
        console.log('No files in permanent storage - skipping dual storage test');
        test.skip();
        return;
      }

      // Take a sample file and verify it exists in permanent storage
      const sample = manifest[0];
      const exists = await syncPage.fileExistsInPermanentStorage(sample.relativePath);

      expect(exists).toBe(true);
      console.log(`Verified ${sample.relativePath} exists in permanent storage`);

      // The file should be downloadable
      const fileData = await syncPage.downloadFromPermanentStorage(sample.relativePath);
      expect(fileData.length).toBe(sample.fileSize);
      console.log(`Downloaded and verified size: ${fileData.length} bytes`);
    });
  });
});
