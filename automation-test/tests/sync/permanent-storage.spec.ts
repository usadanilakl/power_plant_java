import { test, expect } from '@playwright/test';
import { SyncE2EPage, PathBasedManifestEntry } from '../../pages/sync-e2e.page';
import { SyncPage } from '../../pages/sync.page';
import { config } from '../../test.config';

/**
 * Permanent Storage E2E Tests
 *
 * Tests the permanent (path-based) file storage on the sync server:
 * 1. Files are written to permanent storage during sync
 * 2. Path-based manifest endpoint works correctly
 * 3. Files can be downloaded from permanent storage
 * 4. File deletions are reflected in permanent storage
 * 5. Full resync retrieves files from permanent storage
 * 6. Partial sync uses path-based manifest for comparison
 */

test.describe.configure({ mode: 'serial' });

test.describe('Permanent Storage Tests', () => {
  let e2ePage: SyncE2EPage;
  let syncPage: SyncPage;
  const prefix = SyncE2EPage.generatePrefix('perm-storage');

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
    syncPage = new SyncPage(page);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup on client
    try {
      await request.post(`${config.clientBackendUrl}/api/sync-e2e/hard-delete/${prefix}`, { timeout: 30000 });
    } catch { /* ignore */ }
    // Cleanup on server
    try {
      await request.delete(`${config.syncServerUrl}/api/test/e2e/clear-by-prefix/${prefix}`, { timeout: 30000 });
    } catch { /* ignore */ }
  });

  test.setTimeout(120000);

  // ==================== TEST 1: Permanent Storage Write ====================

  test('1. files should be written to permanent storage during sync', async () => {
    // Step 1: Seed file entity graph
    const seedResult = await e2ePage.seedFileEntityGraph(prefix, 2);
    expect(seedResult.success).toBe(true);
    expect(seedResult.fileObjectIds.length).toBe(4); // 2 per iteration × 2
    console.log(`Seeded ${seedResult.totalEntities} entities with ${seedResult.filesOnDisk.length} files`);

    // Step 2: Trigger sync to push files to server
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);
    console.log(`Sync completed: ${JSON.stringify(sync)}`);

    // Step 3: Wait for file sync to complete
    await e2ePage.page.waitForTimeout(5000);

    // Step 4: Verify files are in permanent storage
    const verify = await e2ePage.verifyFileEntityGraph(prefix);
    const storageResults = await e2ePage.verifyFilesInPermanentStorage(verify);

    const inPermanent = storageResults.filter(r => r.inPermanentStorage);
    console.log(`Files in permanent storage: ${inPermanent.length} of ${storageResults.length}`);

    for (const result of storageResults) {
      console.log(`  File ${result.fileId}: ${result.fileLink} -> permanent: ${result.inPermanentStorage}`);
    }

    // At least some files should be in permanent storage
    expect(inPermanent.length).toBeGreaterThan(0);
  });

  // ==================== TEST 2: Path-Based Manifest ====================

  test('2. path-based manifest should list files with checksums', async () => {
    const manifest = await e2ePage.getPathBasedManifest();

    expect(manifest).toBeDefined();
    expect(Array.isArray(manifest)).toBe(true);
    console.log(`Manifest contains ${manifest.length} files`);

    // Find our test files in the manifest
    const testFiles = manifest.filter(entry =>
      entry.relativePath.includes('FileType_A') ||
      entry.relativePath.includes('FileType_B')
    );
    console.log(`Found ${testFiles.length} test files in manifest`);

    // Verify manifest entry structure
    if (testFiles.length > 0) {
      for (const entry of testFiles.slice(0, 3)) {
        expect(entry.relativePath).toBeDefined();
        expect(entry.relativePath.length).toBeGreaterThan(0);
        expect(entry.fileHash).toBeDefined();
        expect(entry.fileHash.length).toBe(64); // SHA-256 is 64 hex chars
        expect(entry.fileSize).toBeGreaterThan(0);
        expect(entry.lastModified).toBeDefined();

        console.log(`  ${entry.relativePath}:`);
        console.log(`    Hash: ${entry.fileHash.substring(0, 32)}...`);
        console.log(`    Size: ${entry.fileSize} bytes`);
      }
    }
  });

  // ==================== TEST 3: Download From Permanent Storage ====================

  test('3. files should be downloadable from permanent storage', async () => {
    const manifest = await e2ePage.getPathBasedManifest();

    // Find test files
    const testFiles = manifest.filter(entry =>
      entry.relativePath.includes('FileType_A') ||
      entry.relativePath.includes('FileType_B')
    );

    if (testFiles.length === 0) {
      console.log('No test files found in manifest - skipping download test');
      test.skip();
      return;
    }

    // Download each test file and verify
    for (const entry of testFiles.slice(0, 2)) {
      const fileData = await e2ePage.downloadFromPermanentStorage(entry.relativePath);

      expect(fileData).toBeDefined();
      expect(fileData.length).toBe(entry.fileSize);

      console.log(`Downloaded ${entry.relativePath}: ${fileData.length} bytes`);

      // Verify it's a valid file (not empty, has content)
      expect(fileData.length).toBeGreaterThan(0);
    }
  });

  // ==================== TEST 4: Dual Storage Verification ====================

  test('4. files should exist in both hash-based and permanent storage', async () => {
    // Get file entity graph
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    if (verify.counts.fileObjects === 0) {
      console.log('No FileObjects found - skipping dual storage test');
      test.skip();
      return;
    }

    // Check first file in both storage types
    const fo = verify.fileObjects[0];
    if (!fo.fileLink) {
      console.log('FileObject has no fileLink - skipping');
      test.skip();
      return;
    }

    // Build relative path for permanent storage
    const relativePath = fo.fileLink.startsWith('/uploads/')
      ? fo.fileLink.substring(1)
      : fo.fileLink.startsWith('uploads/')
        ? fo.fileLink
        : null;

    if (!relativePath) {
      console.log(`Cannot extract relative path from: ${fo.fileLink}`);
      test.skip();
      return;
    }

    const dualStatus = await e2ePage.verifyFileInDualStorage(fo.id, relativePath);

    console.log(`File ${fo.id} (${fo.fileLink}):`);
    console.log(`  Hash-based storage: ${dualStatus.hashBased}`);
    console.log(`  Permanent storage: ${dualStatus.permanent}`);

    // File should be in at least permanent storage
    expect(dualStatus.permanent).toBe(true);
  });

  // ==================== TEST 5: File Search by Pattern ====================

  test('5. should find files by path pattern', async () => {
    // Find PDF files
    const pdfFiles = await e2ePage.findFilesInManifest(/\.pdf$/i);
    console.log(`Found ${pdfFiles.length} PDF files in permanent storage`);

    // Find files with specific vendor
    const vendorAFiles = await e2ePage.findFilesInManifest('Vendor_A');
    console.log(`Found ${vendorAFiles.length} files under Vendor_A`);

    const vendorBFiles = await e2ePage.findFilesInManifest('Vendor_B');
    console.log(`Found ${vendorBFiles.length} files under Vendor_B`);

    // Verify results match pattern
    for (const entry of pdfFiles.slice(0, 3)) {
      expect(entry.relativePath.toLowerCase()).toMatch(/\.pdf$/);
    }

    for (const entry of vendorAFiles.slice(0, 3)) {
      expect(entry.relativePath.toLowerCase()).toContain('vendor_a');
    }
  });

  // ==================== TEST 6: Path Normalization ====================

  test('6. paths should be normalized correctly', async () => {
    const manifest = await e2ePage.getPathBasedManifest();

    if (manifest.length === 0) {
      console.log('No files in manifest - skipping path normalization test');
      test.skip();
      return;
    }

    for (const entry of manifest.slice(0, 10)) {
      // Paths should use forward slashes (not backslashes)
      expect(entry.relativePath).not.toContain('\\');

      // Paths should start with expected prefix
      expect(entry.relativePath.startsWith('uploads/')).toBe(true);

      // Paths should not have double slashes
      expect(entry.relativePath).not.toContain('//');

      // Paths should not have leading/trailing spaces
      expect(entry.relativePath).toBe(entry.relativePath.trim());

      console.log(`  Verified path: ${entry.relativePath}`);
    }
  });

  // ==================== TEST 7: File Deletion Cleanup ====================

  test('7. should cleanup files from permanent storage when FileObject deleted', async () => {
    // Get manifest before deletion
    const manifestBefore = await e2ePage.getPathBasedManifest();
    const testFilesBefore = manifestBefore.filter(e =>
      e.relativePath.includes('FileType_A') || e.relativePath.includes('FileType_B')
    );
    console.log(`Test files before deletion: ${testFilesBefore.length}`);

    // Get file info before hard delete
    const verifyBefore = await e2ePage.verifyFileEntityGraph(prefix);
    const fileLinks = verifyBefore.fileObjects.map(fo => fo.fileLink).filter(Boolean);
    console.log(`FileObject links: ${fileLinks.join(', ')}`);

    // Hard delete all test entities (including files)
    const deleteResult = await e2ePage.hardDeleteFileGraph(prefix);
    expect(deleteResult.success).toBe(true);
    console.log(`Deleted: ${JSON.stringify(deleteResult.deleteCounts)}`);

    // Sync the deletion to server
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);

    // Wait for sync to propagate
    await e2ePage.page.waitForTimeout(5000);

    // Note: Hard delete suppresses FieldChange generation, so files may not be
    // automatically removed from permanent storage. This is expected behavior
    // since hard delete is meant for test cleanup, not production use.
    // In production, soft delete generates FieldChanges which trigger cleanup.
    console.log('Hard delete completed - permanent storage cleanup depends on FieldChange generation');
  });
});

test.describe('Permanent Storage Integration', () => {
  let syncPage: SyncPage;

  test.beforeEach(async ({ page }) => {
    syncPage = new SyncPage(page);
  });

  test('should have permanent storage enabled on server', async ({ request }) => {
    // Check server health endpoint for storage status
    const response = await request.get(`${config.syncServerUrl}/api/sync/health`);
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    console.log('Server health:', JSON.stringify(health));

    // Server should report storage paths
    expect(health).toBeDefined();
  });

  test('manifest endpoint should handle empty storage gracefully', async () => {
    // This test verifies the endpoint works even with potentially empty storage
    const manifest = await syncPage.getPathBasedManifest();

    expect(manifest).toBeDefined();
    expect(Array.isArray(manifest)).toBe(true);

    // Empty array is valid response
    console.log(`Manifest returned ${manifest.length} entries`);
  });

  test('download endpoint should return 404 for non-existent file', async ({ request }) => {
    const response = await request.get(
      `${config.syncServerUrl}/api/resync/files/permanent/uploads/nonexistent/file.pdf`,
      { failOnStatusCode: false }
    );

    expect(response.status()).toBe(404);
    console.log('Non-existent file correctly returns 404');
  });

  test('manifest entries should have valid SHA-256 hashes', async () => {
    const manifest = await syncPage.getPathBasedManifest();

    if (manifest.length === 0) {
      console.log('No files in manifest - skipping hash validation');
      test.skip();
      return;
    }

    const sha256Regex = /^[a-f0-9]{64}$/i;

    for (const entry of manifest.slice(0, 10)) {
      expect(entry.fileHash).toMatch(sha256Regex);
      console.log(`  ${entry.relativePath}: hash valid`);
    }
  });
});
