package com.dk_power.power_plant_java.controller.sync;

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
}
