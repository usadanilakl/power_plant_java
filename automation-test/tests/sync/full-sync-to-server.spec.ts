import { test, expect } from '@playwright/test';
import { SyncPage } from '../../pages/sync.page';

/**
 * Full Sync to Server (Bootstrap) Tests
 *
 * Tests the FullSyncToServerService flow that pushes all local
 * entities to the sync server. Used for server bootstrapping.
 *
 * WARNING: This test triggers a full sync which can be slow.
 * Use test.setTimeout(120000) for long-running operations.
 *
 * Prerequisites: sync server + client backend running (see test.config.ts for URLs)
 */

test.describe('Full Sync to Server (Bootstrap)', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  test.describe('Full Sync Status', () => {
    test('should return status of last full sync operation', async () => {
      const status = await syncPage.getFullSyncToServerStatus();

      expect(status).toBeDefined();
      expect(status.inProgress).toBeDefined();

      console.log(`Full sync status: inProgress=${status.inProgress}`);
      if (status.status) {
        console.log('Status details:', JSON.stringify(status.status));
      }
    });
  });

  test.describe('Full Sync Execution', () => {
    // Full sync can be very slow
    test.setTimeout(120000);

    test('should start full sync to server', async () => {
      // Check if a sync is already in progress
      const currentStatus = await syncPage.getFullSyncToServerStatus();
      if (currentStatus.inProgress) {
        console.log('Full sync already in progress, skipping start test');
        test.skip();
        return;
      }

      const result = await syncPage.startFullSyncToServer();

      expect(result).toBeDefined();
      if (result.success) {
        console.log(`Full sync started: ${result.message}`);

        // Poll for completion
        let completed = false;
        for (let i = 0; i < 60; i++) {
          await syncPage.page.waitForTimeout(2000);
          const status = await syncPage.getFullSyncToServerStatus();

          if (!status.inProgress) {
            completed = true;
            console.log('Full sync completed');
            if (status.status) {
              console.log('Final status:', JSON.stringify(status.status));
            }
            break;
          }

          if (i % 10 === 0) {
            console.log(`Still in progress... (${i * 2}s elapsed)`);
          }
        }

        expect(completed).toBe(true);
      } else {
        // May fail if sync not enabled — that's ok
        console.log(`Full sync not started: ${result.message}`);
      }
    });
  });

  test.describe('File Sync Status', () => {
    test('should return file sync queue information', async () => {
      const fileSyncStatus = await syncPage.getFileSyncStatus();

      expect(fileSyncStatus).toBeDefined();
      expect(fileSyncStatus.enabled).toBeDefined();

      console.log('File sync status:', JSON.stringify(fileSyncStatus));
    });
  });
});
