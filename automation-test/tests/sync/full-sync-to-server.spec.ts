import { test, expect } from '@playwright/test';
import { SyncPage, PathBasedManifestEntry } from '../../pages/sync.page';
import { config } from '../../test.config';

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

  test.describe('Permanent Storage (Path-Based Manifest)', () => {
    test('should retrieve path-based file manifest from server', async () => {
      const manifest = await syncPage.getPathBasedManifest();

      expect(manifest).toBeDefined();
      expect(Array.isArray(manifest)).toBe(true);

      console.log(`Path-based manifest contains ${manifest.length} files`);

      // If there are files, verify structure
      if (manifest.length > 0) {
        const sample = manifest[0];
        expect(sample.relativePath).toBeDefined();
        expect(sample.fileHash).toBeDefined();
        expect(sample.fileSize).toBeDefined();
        expect(sample.lastModified).toBeDefined();

        console.log('Sample entry:', JSON.stringify(sample));

        // Log summary by directory
        const byDir = manifest.reduce((acc, entry) => {
          const parts = entry.relativePath.split('/');
          const dir = parts.length > 2 ? parts.slice(0, 3).join('/') : parts[0];
          acc[dir] = (acc[dir] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('Files by directory:', JSON.stringify(byDir));
      }
    });

    test('should be able to download file from permanent storage', async () => {
      const manifest = await syncPage.getPathBasedManifest();

      if (manifest.length === 0) {
        console.log('No files in permanent storage - skipping download test');
        test.skip();
        return;
      }

      // Try to download the first file
      const entry = manifest[0];
      const exists = await syncPage.fileExistsInPermanentStorage(entry.relativePath);
      expect(exists).toBe(true);

      const fileData = await syncPage.downloadFromPermanentStorage(entry.relativePath);
      expect(fileData).toBeDefined();
      expect(fileData.length).toBeGreaterThan(0);

      console.log(`Downloaded ${entry.relativePath}: ${fileData.length} bytes (expected ${entry.fileSize})`);
      expect(fileData.length).toBe(entry.fileSize);
    });

    test('should find files by path pattern', async () => {
      const manifest = await syncPage.getPathBasedManifest();

      if (manifest.length === 0) {
        console.log('No files in permanent storage - skipping pattern test');
        test.skip();
        return;
      }

      // Find PDF files
      const pdfFiles = await syncPage.findFilesInManifest(/\.pdf$/i);
      console.log(`Found ${pdfFiles.length} PDF files`);

      // Find files in uploads directory
      const uploadFiles = await syncPage.findFilesInManifest('uploads');
      console.log(`Found ${uploadFiles.length} files under uploads/`);

      // Verify pattern matching works
      for (const entry of pdfFiles.slice(0, 3)) {
        expect(entry.relativePath.toLowerCase()).toContain('.pdf');
      }
    });
  });
});
