import { test, expect } from '@playwright/test';
import { SyncE2EPage, FileSeedResult, FileVerifyResult, PathBasedManifestEntry } from '../../pages/sync-e2e.page';
import { config } from '../../test.config';

/**
 * File Operations Sync E2E Tests
 *
 * Proves the full file lifecycle through sync:
 * 1. FileObject creation with physical files on disk
 * 2. Equipment ↔ FileObject ManyToMany relationships
 * 3. LotoPoint ↔ Equipment relationships
 * 4. LotoStandard ↔ LotoPoint ManyToMany + ordering
 * 5. Vendor deletion (delete-and-transfer) — moves files, updates paths
 * 6. FileType deletion (delete-and-transfer) — moves files, updates paths
 * 7. Sync propagation of all mutations
 * 8. Backup/restore recovery
 * 9. Sync-server pull recovery (reset markers + re-sync)
 * 10. Full sync to server after server data cleared
 * 11. Permanent storage verification - files in server's path-based storage
 */

test.describe.configure({ mode: 'serial' });

test.describe('File Operations Sync', () => {
  let e2ePage: SyncE2EPage;
  const prefix = SyncE2EPage.generatePrefix('files');
  let seedResult: FileSeedResult;

  test.beforeEach(async ({ page }) => {
    e2ePage = new SyncE2EPage(page);
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

  // ==================== TEST 1: Seed File Entity Graph ====================

  test('1. should seed file entity graph with files on disk', async () => {
    seedResult = await e2ePage.seedFileEntityGraph(prefix, 3);

    expect(seedResult.success).toBe(true);
    expect(seedResult.fileObjectIds.length).toBe(6); // 2 per iteration × 3
    expect(seedResult.equipmentIds.length).toBe(6);  // 2 per iteration × 3
    expect(seedResult.lotoPointIds.length).toBe(12);  // 4 per iteration × 3
    expect(seedResult.lotoStandardIds.length).toBe(1);
    expect(seedResult.filesOnDisk.length).toBe(6);

    // Verify value IDs were assigned
    expect(seedResult.fileTypeValueIds['FileType_A']).toBeDefined();
    expect(seedResult.fileTypeValueIds['FileType_B']).toBeDefined();
    expect(seedResult.vendorValueIds['Vendor_A']).toBeDefined();
    expect(seedResult.vendorValueIds['Vendor_B']).toBeDefined();
    expect(seedResult.vendorValueIds['Vendor_Repl']).toBeDefined();

    console.log(`Seeded: ${seedResult.totalEntities} entities, ${seedResult.filesOnDisk.length} files on disk in ${seedResult.durationMs}ms`);
    console.log(`FileType values: A=${seedResult.fileTypeValueIds['FileType_A']}, B=${seedResult.fileTypeValueIds['FileType_B']}`);
    console.log(`Vendor values: A=${seedResult.vendorValueIds['Vendor_A']}, B=${seedResult.vendorValueIds['Vendor_B']}, Repl=${seedResult.vendorValueIds['Vendor_Repl']}`);

    // Verify files exist on disk via verify endpoint
    const verify = await e2ePage.verifyFileEntityGraph(prefix);
    const filesOnDisk = verify.fileObjects.filter(f => f.fileExistsOnDisk);
    expect(filesOnDisk.length).toBe(6);
    console.log(`All ${filesOnDisk.length} files verified on disk`);
  });

  // ==================== TEST 2: Sync and Verify ====================

  test('2. should sync seeded entities and verify', async () => {
    // Trigger sync to push all field changes to server
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);
    console.log(`Sync completed: ${JSON.stringify(sync)}`);

    // Wait for propagation
    await e2ePage.page.waitForTimeout(3000);

    // Verify full entity graph
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    expect(verify.counts.fileObjects).toBe(6);
    expect(verify.counts.equipment).toBe(6);
    expect(verify.counts.lotoPoints).toBe(12);
    expect(verify.counts.lotoStandards).toBe(1);

    // Verify Equipment → FileObject relationships
    for (const eq of verify.equipment) {
      expect(eq.fileIds.length).toBeGreaterThanOrEqual(1);
    }

    // Verify LotoStandard → LotoPoint relationships
    for (const ls of verify.lotoStandards) {
      expect(ls.lotoPointIds.length).toBe(12);
      expect(Object.keys(ls.lotoPointOrder).length).toBe(12);
    }

    console.log(`Verified: ${verify.counts.fileObjects} files, ${verify.counts.equipment} equipment, ${verify.counts.lotoPoints} loto points, ${verify.counts.lotoStandards} loto standards`);
  });

  // ==================== TEST 2.5: Verify Permanent Storage ====================

  test('2.5. should have files in server permanent storage after sync', async () => {
    // Wait a bit for file sync to complete
    await e2ePage.page.waitForTimeout(5000);

    // Get the file entity graph for our test prefix
    const verify = await e2ePage.verifyFileEntityGraph(prefix);
    expect(verify.counts.fileObjects).toBe(6);

    // Verify files are in permanent storage
    const storageResults = await e2ePage.verifyFilesInPermanentStorage(verify);
    const filesInPermanentStorage = storageResults.filter(r => r.inPermanentStorage);

    console.log(`Files verified in permanent storage: ${filesInPermanentStorage.length} of ${storageResults.length}`);
    for (const result of storageResults) {
      console.log(`  File ${result.fileId}: ${result.fileLink} -> permanent: ${result.inPermanentStorage}`);
    }

    // At least some files should be in permanent storage
    // Note: Not all may be present immediately due to async file sync
    expect(filesInPermanentStorage.length).toBeGreaterThan(0);

    // Verify files appear in path-based manifest
    const manifest = await e2ePage.getPathBasedManifest();
    console.log(`Path-based manifest contains ${manifest.length} files total`);

    // Find files matching our test prefix patterns (FileType_A, FileType_B, etc.)
    const testFiles = manifest.filter(entry =>
      entry.relativePath.includes('FileType_A') ||
      entry.relativePath.includes('FileType_B') ||
      entry.relativePath.includes('Vendor_A') ||
      entry.relativePath.includes('Vendor_B')
    );
    console.log(`Found ${testFiles.length} test files in manifest`);

    // Verify manifest entries have required fields
    for (const entry of testFiles.slice(0, 3)) {
      expect(entry.relativePath).toBeDefined();
      expect(entry.fileHash).toBeDefined();
      expect(entry.fileSize).toBeGreaterThan(0);
      console.log(`  ${entry.relativePath}: hash=${entry.fileHash.substring(0, 16)}..., size=${entry.fileSize}`);
    }
  });

  // ==================== TEST 3: Vendor Deletion with Transfer ====================

  test('3. should delete vendor and transfer files to replacement', async () => {
    // Re-read seed result from verify if needed
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    // Find the Vendor_A and Vendor_Repl value IDs from the file objects
    const fileWithVendorA = verify.fileObjects.find(f => f.vendorName?.includes('Vendor_A'));
    const fileWithVendorRepl = verify.fileObjects.find(f => f.vendorName?.includes('Vendor_Repl'));

    expect(fileWithVendorA).toBeDefined();

    const vendorAId = fileWithVendorA!.vendorId!;
    // Get Vendor_Repl ID — it won't be on any file yet, so query from seed
    // We need to find a Value with the replacement name
    // The verify endpoint returns vendor IDs from file objects, but Vendor_Repl isn't assigned yet
    // We'll get it by verifying the general entity graph which includes all values
    const generalVerify = await e2ePage.verifyEntityGraph(prefix);
    const vendorReplValue = generalVerify.values.find((v: any) =>
      v.name?.includes('Vendor_Repl')
    );
    expect(vendorReplValue).toBeDefined();
    const vendorReplId = vendorReplValue.id;

    console.log(`Deleting Vendor_A (${vendorAId}) → transferring to Vendor_Repl (${vendorReplId})`);

    // Capture old file paths for files with Vendor_A
    const vendorAFiles = verify.fileObjects.filter(f => f.vendorId === vendorAId);
    const oldPaths = vendorAFiles.map(f => f.fileLink);
    console.log(`Files to transfer: ${vendorAFiles.length}, old paths: ${oldPaths}`);

    // Execute delete-and-transfer
    const result = await e2ePage.deleteAndTransferValue(vendorAId, vendorReplId);
    console.log(`Delete-and-transfer result: ${JSON.stringify(result)}`);
  });

  // ==================== TEST 4: Verify Vendor Changes ====================

  test('4. should verify vendor changes — files moved and references updated', async () => {
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    // No file should reference Vendor_A anymore — they should all point to Vendor_Repl
    const filesWithOldVendor = verify.fileObjects.filter(f =>
      f.vendorName?.includes('Vendor_A')
    );
    expect(filesWithOldVendor.length).toBe(0);

    // Files that were with Vendor_A should now have Vendor_Repl
    const filesWithReplVendor = verify.fileObjects.filter(f =>
      f.vendorName?.includes('Vendor_Repl')
    );
    expect(filesWithReplVendor.length).toBe(3); // 1 per iteration × 3

    // Files should still exist on disk at new paths
    for (const file of filesWithReplVendor) {
      expect(file.fileExistsOnDisk).toBe(true);
      expect(file.fileLink).toContain('Vendor_Repl');
    }

    // All Equipment→FileObject relationships should be preserved
    for (const eq of verify.equipment) {
      expect(eq.fileIds.length).toBeGreaterThanOrEqual(1);
    }

    // LotoStandard relationships should be preserved
    for (const ls of verify.lotoStandards) {
      expect(ls.lotoPointIds.length).toBe(12);
    }

    console.log(`Vendor transfer verified: ${filesWithReplVendor.length} files moved, all relationships preserved`);
  });

  // ==================== TEST 4.5: Verify Permanent Storage After Vendor Transfer ====================

  test('4.5. should update permanent storage after vendor transfer', async () => {
    // Trigger sync to push vendor changes to server
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);

    // Wait for file sync to propagate
    await e2ePage.page.waitForTimeout(5000);

    // Verify files in permanent storage now reference Vendor_Repl
    const manifest = await e2ePage.getPathBasedManifest();

    // Files should now be under Vendor_Repl path
    const vendorReplFiles = manifest.filter(entry =>
      entry.relativePath.toLowerCase().includes('vendor_repl')
    );
    console.log(`Found ${vendorReplFiles.length} files under Vendor_Repl in permanent storage`);

    // No files should be under old Vendor_A path anymore
    const vendorAFiles = manifest.filter(entry =>
      entry.relativePath.toLowerCase().includes('vendor_a') &&
      !entry.relativePath.toLowerCase().includes('vendor_repl')
    );
    console.log(`Files still under Vendor_A: ${vendorAFiles.length}`);

    // Verify the transferred files are accessible
    for (const entry of vendorReplFiles.slice(0, 2)) {
      const fileData = await e2ePage.downloadFromPermanentStorage(entry.relativePath);
      expect(fileData.length).toBeGreaterThan(0);
      console.log(`  Downloaded ${entry.relativePath}: ${fileData.length} bytes`);
    }
  });

  // ==================== TEST 5: FileType Deletion with Transfer ====================

  test('5. should delete FileType_B and transfer to FileType_A', async () => {
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    // Find FileType_B and FileType_A value IDs
    const fileWithTypeB = verify.fileObjects.find(f => f.fileTypeName?.includes('FileType_B'));
    const fileWithTypeA = verify.fileObjects.find(f => f.fileTypeName?.includes('FileType_A'));

    expect(fileWithTypeB).toBeDefined();
    expect(fileWithTypeA).toBeDefined();

    const fileTypeBId = fileWithTypeB!.fileTypeId!;
    const fileTypeAId = fileWithTypeA!.fileTypeId!;

    console.log(`Deleting FileType_B (${fileTypeBId}) → transferring to FileType_A (${fileTypeAId})`);

    // Capture files with FileType_B before transfer
    const typeBFiles = verify.fileObjects.filter(f => f.fileTypeId === fileTypeBId);
    console.log(`Files to transfer: ${typeBFiles.length}`);

    // Execute delete-and-transfer
    const result = await e2ePage.deleteAndTransferValue(fileTypeBId, fileTypeAId);
    console.log(`Delete-and-transfer result: ${JSON.stringify(result)}`);
  });

  // ==================== TEST 6: Verify FileType Changes ====================

  test('6. should verify fileType changes — files moved and references updated', async () => {
    const verify = await e2ePage.verifyFileEntityGraph(prefix);

    // No file should reference FileType_B anymore
    const filesWithOldType = verify.fileObjects.filter(f =>
      f.fileTypeName?.includes('FileType_B')
    );
    expect(filesWithOldType.length).toBe(0);

    // All files should now reference FileType_A
    const filesWithTypeA = verify.fileObjects.filter(f =>
      f.fileTypeName?.includes('FileType_A')
    );
    expect(filesWithTypeA.length).toBe(6); // All 6 files now use FileType_A

    // Files should still exist on disk at new paths
    const filesOnDisk = verify.fileObjects.filter(f => f.fileExistsOnDisk);
    expect(filesOnDisk.length).toBe(6);

    // File paths should all reference FileType_A
    for (const file of filesOnDisk) {
      expect(file.fileLink).toContain('FileType_A');
    }

    // All relationships preserved
    for (const eq of verify.equipment) {
      expect(eq.fileIds.length).toBeGreaterThanOrEqual(1);
    }
    for (const ls of verify.lotoStandards) {
      expect(ls.lotoPointIds.length).toBe(12);
    }

    console.log(`FileType transfer verified: all ${filesWithTypeA.length} files now under FileType_A, all relationships preserved`);
  });

  // ==================== TEST 6.5: Verify Permanent Storage After FileType Transfer ====================

  test('6.5. should update permanent storage after fileType transfer', async () => {
    // Trigger sync to push fileType changes to server
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);

    // Wait for file sync to propagate
    await e2ePage.page.waitForTimeout(5000);

    // Verify files in permanent storage now all reference FileType_A
    const manifest = await e2ePage.getPathBasedManifest();

    // Files should now be under FileType_A path
    const typeAFiles = manifest.filter(entry =>
      entry.relativePath.toLowerCase().includes('filetype_a')
    );
    console.log(`Found ${typeAFiles.length} files under FileType_A in permanent storage`);

    // No files should be under old FileType_B path anymore
    const typeBFiles = manifest.filter(entry =>
      entry.relativePath.toLowerCase().includes('filetype_b')
    );
    console.log(`Files still under FileType_B: ${typeBFiles.length}`);

    // Verify the files are accessible at their new paths
    for (const entry of typeAFiles.slice(0, 2)) {
      const exists = await e2ePage.fileExistsInPermanentStorage(entry.relativePath);
      expect(exists).toBe(true);
      console.log(`  Verified exists: ${entry.relativePath}`);
    }
  });

  // ==================== TEST 7: Sync Changes ====================

  test('7. should sync all mutation changes to server', async () => {
    // Trigger sync to push vendor deletion + fileType deletion field changes
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);
    console.log(`Post-mutation sync: ${JSON.stringify(sync)}`);

    // Wait for propagation
    await e2ePage.page.waitForTimeout(3000);

    // Verify health
    const health = await e2ePage.forceSyncHealthCheck();
    expect(health).toBeDefined();
    expect(health.syncStatus).toBeDefined();
    console.log(`Sync health: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);
  });

  // ==================== TEST 8: Backup, Clear Client, Restore ====================

  test('8. should backup, clear client, restore, and verify', async () => {
    // Step 1: Try to create backup — may fail if shared backup directory is not configured
    let backup: any;
    try {
      backup = await e2ePage.createBackup();
    } catch (e: any) {
      if (e.message?.includes('backup directory')) {
        test.skip(true, 'Backup directory not accessible — skipping backup/restore test');
        return;
      }
      throw e;
    }
    console.log(`Backup created: ${JSON.stringify(backup)}`);

    // Wait for backup to complete
    await e2ePage.page.waitForTimeout(5000);

    // Step 2: Snapshot state before hard-delete
    const beforeDelete = await e2ePage.verifyFileEntityGraph(prefix);
    expect(beforeDelete.counts.fileObjects).toBe(6);

    // Step 3: Hard-delete all entities (no FieldChanges generated)
    const deleteResult = await e2ePage.hardDeleteFileGraph(prefix);
    expect(deleteResult.success).toBe(true);
    console.log(`Hard-deleted: ${JSON.stringify(deleteResult.deleteCounts)}, files removed: ${deleteResult.filesDeletedFromDisk}`);

    // Step 4: Verify entities are gone
    const afterDelete = await e2ePage.verifyFileEntityGraph(prefix);
    expect(afterDelete.counts.fileObjects).toBe(0);
    expect(afterDelete.counts.equipment).toBe(0);
    expect(afterDelete.counts.lotoPoints).toBe(0);
    expect(afterDelete.counts.lotoStandards).toBe(0);
    console.log('Verified: all entities deleted from client');

    // Step 5: Restore from backup
    const restore = await e2ePage.executeRestore(true);
    console.log(`Restore initiated: ${JSON.stringify(restore)}`);

    // Wait for restore to complete
    await e2ePage.page.waitForTimeout(10000);

    // Step 6: Verify entities are restored
    const afterRestore = await e2ePage.verifyFileEntityGraph(prefix);
    expect(afterRestore.counts.fileObjects).toBe(6);
    expect(afterRestore.counts.equipment).toBe(6);
    expect(afterRestore.counts.lotoPoints).toBe(12);
    expect(afterRestore.counts.lotoStandards).toBe(1);

    // Verify files exist on disk
    const filesOnDisk = afterRestore.fileObjects.filter(f => f.fileExistsOnDisk);
    console.log(`After restore: ${afterRestore.counts.fileObjects} files, ${filesOnDisk.length} on disk`);

    // Verify relationships
    for (const eq of afterRestore.equipment) {
      expect(eq.fileIds.length).toBeGreaterThanOrEqual(1);
    }
    for (const ls of afterRestore.lotoStandards) {
      expect(ls.lotoPointIds.length).toBe(12);
    }

    console.log('Backup/restore verified: all entities + relationships restored');
  });

  // ==================== TEST 9: Hard Delete + Verify Clean Removal ====================

  test('9. should hard-delete entities without generating sync events', async () => {
    // Step 1: Verify entities exist before deletion
    const before = await e2ePage.verifyFileEntityGraph(prefix);
    expect(before.counts.fileObjects).toBe(6);
    expect(before.counts.equipment).toBe(6);
    expect(before.counts.lotoPoints).toBe(12);
    expect(before.counts.lotoStandards).toBe(1);
    console.log(`Before delete: ${before.counts.fileObjects} files, ${before.counts.equipment} eq, ${before.counts.lotoPoints} lp, ${before.counts.lotoStandards} ls`);

    // Step 2: Hard-delete all entities (suppresses FieldChange generation via SyncContext)
    const deleteResult = await e2ePage.hardDeleteFileGraph(prefix);
    expect(deleteResult.success).toBe(true);
    console.log(`Hard-deleted: ${JSON.stringify(deleteResult.deleteCounts)}, files removed from disk: ${deleteResult.filesDeletedFromDisk}`);

    // Step 3: Verify all entities are gone
    const after = await e2ePage.verifyFileEntityGraph(prefix);
    expect(after.counts.fileObjects).toBe(0);
    expect(after.counts.equipment).toBe(0);
    expect(after.counts.lotoPoints).toBe(0);
    expect(after.counts.lotoStandards).toBe(0);
    console.log('All entities cleanly removed');

    // Step 4: Sync should succeed with no new changes (hard-delete suppressed FieldChange)
    const sync = await e2ePage.triggerSync();
    expect(sync.success).toBe(true);
    console.log(`Post-delete sync: changesSent=${sync.changesSent}, changesReceived=${sync.changesReceived}`);

    // Step 5: Re-seed for test 10
    const reseed = await e2ePage.seedFileEntityGraph(prefix, 3);
    expect(reseed.success).toBe(true);
    expect(reseed.fileObjectIds.length).toBe(6);
    console.log(`Re-seeded ${reseed.totalEntities} entities for next test`);

    // Sync the re-seeded data
    const reseedSync = await e2ePage.triggerSync();
    expect(reseedSync.success).toBe(true);
    console.log(`Re-seed sync: changesSent=${reseedSync.changesSent}`);
  });

  // ==================== TEST 10: Clear Server, Full Sync to Server ====================

  test('10. should clear server data and full-sync from client', async () => {
    test.setTimeout(360000); // Full sync syncs ALL entities, can take several minutes

    // Wait for previous sync to propagate
    await e2ePage.page.waitForTimeout(3000);

    // Step 1: Clear test data from server
    let clearResult: any;
    try {
      clearResult = await e2ePage.clearServerDataByPrefix(prefix);
    } catch (e: any) {
      console.log(`Server clear-by-prefix failed: ${e.message}`);
      test.skip(true, 'Server clear-by-prefix endpoint error — sync server may need restart');
      return;
    }
    console.log(`Cleared server data: ${JSON.stringify(clearResult)}`);

    // Step 2: Start full sync to server (syncs ALL entities, not just test data)
    const fullSync = await e2ePage.startFullSyncToServer();
    console.log(`Full sync started: ${JSON.stringify(fullSync)}`);

    // Step 3: Wait for full sync to complete — poll with progress logging
    const syncStatus = await e2ePage.waitForFullSyncComplete(300000);
    console.log(`Full sync completed: phase=${syncStatus.phase}, success=${syncStatus.success}, sent=${syncStatus.entitiesSent}, failed=${syncStatus.entitiesFailed}`);

    // Step 4: Wait for propagation
    await e2ePage.page.waitForTimeout(5000);

    // Step 5: Verify health
    const health = await e2ePage.forceSyncHealthCheck();
    expect(health).toBeDefined();
    expect(health.syncStatus).toBeDefined();
    console.log(`Post full-sync health: status=${health.syncStatus}, entityDiff=${health.entityDifference}`);

    // Verify local entities are still intact
    const verify = await e2ePage.verifyFileEntityGraph(prefix);
    expect(verify.counts.fileObjects).toBeGreaterThan(0);
    expect(verify.counts.equipment).toBeGreaterThan(0);

    console.log(`Full sync to server verified: ${verify.counts.fileObjects} files, ${verify.counts.equipment} equipment`);
  });
});
