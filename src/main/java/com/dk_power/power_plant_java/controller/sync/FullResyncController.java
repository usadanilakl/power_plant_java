package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.AutoResyncService;
import com.dk_power.power_plant_java.sevice.sync.FullResyncService;
import com.dk_power.power_plant_java.sevice.sync.FullResyncService.*;
import com.dk_power.power_plant_java.sevice.sync.SyncHealthChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for full resync operations.
 *
 * Provides endpoints for:
 * - Checking sync health status
 * - Previewing resync changes
 * - Triggering full resync
 * - Creating backups
 * - Monitoring operation progress
 */
@RestController
@RequestMapping("/api/resync")
@RequiredArgsConstructor
@Slf4j
public class FullResyncController {

    private final FullResyncService fullResyncService;
    private final SyncHealthChecker syncHealthChecker;
    private final AutoResyncService autoResyncService;

    /**
     * Get current sync health status.
     * This shows whether there's a potential mismatch between local and backup.
     */
    @GetMapping("/health")
    public ResponseEntity<SyncHealthStatus> getSyncHealth() {
        return ResponseEntity.ok(fullResyncService.getSyncHealth());
    }

    /**
     * Preview what would happen in a resync without making changes.
     */
    @GetMapping("/preview")
    public ResponseEntity<FileComparisonResult> previewResync() {
        if (fullResyncService.isResyncInProgress()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(fullResyncService.previewResync());
    }

    /**
     * Trigger a full resync from backup.
     *
     * @param force If true, skip deletion safety checks (use with caution)
     */
    @PostMapping("/execute")
    public ResponseEntity<ResyncResult> executeResync(
            @RequestParam(defaultValue = "false") boolean force) {

        if (fullResyncService.isResyncInProgress()) {
            return ResponseEntity.badRequest()
                .body(new ResyncResult(false, "Resync already in progress", null));
        }

        log.info("Full resync requested (force={})", force);
        ResyncResult result = fullResyncService.performFullResync(force);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Get current resync operation status.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("resyncInProgress", fullResyncService.isResyncInProgress());
        status.put("backupInProgress", fullResyncService.isBackupInProgress());
        status.put("resyncStatus", fullResyncService.getResyncStatus());
        status.put("backupStatus", fullResyncService.getBackupStatus());
        return ResponseEntity.ok(status);
    }

    /**
     * Create a full backup (DB + file manifest).
     * Only run this on a machine that is known to be up-to-date.
     */
    @PostMapping("/backup")
    public ResponseEntity<BackupResult> createBackup() {
        if (fullResyncService.isBackupInProgress()) {
            return ResponseEntity.badRequest()
                .body(new BackupResult(false, "Backup already in progress", null));
        }

        log.info("Full backup requested");
        BackupResult result = fullResyncService.createFullBackup();

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Get backup status.
     */
    @GetMapping("/backup/status")
    public ResponseEntity<BackupStatus> getBackupStatus() {
        return ResponseEntity.ok(fullResyncService.getBackupStatus());
    }

    /**
     * Get background sync health check status.
     * This runs automatically every 5 minutes and provides a quick comparison
     * between local and server data (entity counts, file counts, timestamps).
     */
    @GetMapping("/sync-health")
    public ResponseEntity<SyncHealthChecker.SyncHealthResult> getSyncHealthCheck() {
        return ResponseEntity.ok(syncHealthChecker.getCurrentHealth());
    }

    /**
     * Force an immediate sync health check.
     * Useful for getting fresh data before making decisions.
     */
    @PostMapping("/sync-health/check")
    public ResponseEntity<SyncHealthChecker.SyncHealthResult> forceSyncHealthCheck() {
        return ResponseEntity.ok(syncHealthChecker.checkNow());
    }

    // ==================== FILES-ONLY SYNC ENDPOINTS ====================

    /**
     * Preview files-only sync.
     * Compares local files with server and returns what would change.
     */
    @GetMapping("/files-sync/preview")
    public ResponseEntity<FileComparisonResult> previewFilesSync() {
        if (fullResyncService.isResyncInProgress()) {
            return ResponseEntity.badRequest().build();
        }
        log.info("Files-only sync preview requested");
        return ResponseEntity.ok(fullResyncService.previewResync());
    }

    /**
     * Execute files-only sync.
     * Downloads missing files from server and optionally deletes extra local files.
     * Does NOT touch the database - only syncs files.
     *
     * Includes retry logic for failed downloads.
     *
     * @param force If true, skip deletion safety checks
     * @param maxRetries Maximum retry attempts for failed downloads (default 3)
     */
    @PostMapping("/files-sync/execute")
    public ResponseEntity<FullResyncService.FileSyncResult> executeFilesSync(
            @RequestParam(defaultValue = "false") boolean force,
            @RequestParam(defaultValue = "3") int maxRetries) {

        if (fullResyncService.isResyncInProgress()) {
            return ResponseEntity.badRequest()
                .body(new FullResyncService.FileSyncResult(false, "Sync already in progress", null));
        }

        log.info("Files-only sync requested (force={}, maxRetries={})", force, maxRetries);
        FullResyncService.FileSyncResult result = fullResyncService.syncFilesOnly(force, maxRetries);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    // ==================== PARTIAL SYNC ENDPOINTS ====================

    /**
     * Get available dates for partial sync.
     * Returns a list of dates where sync history is available on the server.
     */
    @GetMapping("/partial-sync/dates")
    public ResponseEntity<PartialSyncDatesResponse> getAvailableSyncDates() {
        log.info("Getting available partial sync dates");
        PartialSyncDatesResponse response = fullResyncService.getAvailableSyncDates();
        if (response.getErrorMessage() != null) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Preview what would happen in a partial sync from a specific date.
     * Returns counts of changes and files that would be affected.
     */
    @GetMapping("/partial-sync/preview")
    public ResponseEntity<PartialSyncPreview> previewPartialSync(@RequestParam String date) {
        if (fullResyncService.isResyncInProgress()) {
            PartialSyncPreview preview = new PartialSyncPreview();
            preview.setErrorMessage("A resync operation is already in progress");
            return ResponseEntity.badRequest().body(preview);
        }
        log.info("Previewing partial sync from date: {}", date);
        return ResponseEntity.ok(fullResyncService.previewPartialSync(date));
    }

    /**
     * Execute a partial sync from a specific date.
     * Fetches and applies all field changes since the date, then resyncs files.
     *
     * @param date The date to sync from (yyyy-MM-dd format)
     * @param force If true, skip file deletion safety checks
     */
    @PostMapping("/partial-sync/execute")
    public ResponseEntity<PartialSyncResult> executePartialSync(
            @RequestParam String date,
            @RequestParam(defaultValue = "false") boolean force) {

        if (fullResyncService.isResyncInProgress()) {
            return ResponseEntity.badRequest()
                .body(new PartialSyncResult(false, "Resync already in progress", null, 0));
        }

        log.info("Partial sync requested from date: {} (force={})", date, force);
        PartialSyncResult result = fullResyncService.performPartialSync(date, force);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    // ==================== AUTO-RESYNC ENDPOINTS ====================

    /**
     * Get current auto-resync state (escalation level, last attempt, etc.).
     */
    @GetMapping("/auto-resync/state")
    public ResponseEntity<AutoResyncService.AutoResyncState> getAutoResyncState() {
        return ResponseEntity.ok(autoResyncService.getCurrentState());
    }

    /**
     * Reset auto-resync state. Use when the user wants to retry automatic
     * resync after exhaustion, or after a manual resync.
     */
    @PostMapping("/auto-resync/reset")
    public ResponseEntity<Map<String, String>> resetAutoResyncState() {
        autoResyncService.resetState();
        return ResponseEntity.ok(Map.of("message", "Auto-resync state reset"));
    }
}
