import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SyncHealthStatus {
  machineId: string;
  machineName: string;
  timestamp: string;
  backupAvailable: boolean;
  backupTimestamp: string | null;
  backupMachineId: string | null;
  backupFileCount: number;
  localFileCount: number;
  fileDifference: number;
  potentialMismatch: boolean;
  errorMessage: string | null;
  serverEntityCount: number;  // Number of entities on sync server
}

export interface FileManifestEntry {
  relativePath: string;
  checksum: string;
  size: number;
  lastModified: string;
}

export interface FileComparisonResult {
  totalBackupFiles: number;
  totalLocalFiles: number;
  filesToDownload: FileManifestEntry[];
  filesToDelete: string[];
  unchangedFiles: string[];
  errorMessage: string | null;
}

export interface BackupMetadata {
  timestamp: string;
  machineId: string;
  machineName: string;
  databaseBackupFile: string;
  fileCount: number;
  totalFileSize: number;
}

export interface BackupResult {
  success: boolean;
  message: string;
  metadata: BackupMetadata | null;
}

export interface ResyncResult {
  success: boolean;
  message: string;
  comparison: FileComparisonResult | null;
}

export interface ResyncStatus {
  startTime: string | null;
  endTime: string | null;
  phase: string;
  totalFiles: number;
  processedFiles: number;
  success: boolean;
}

export interface BackupStatus {
  startTime: string | null;
  endTime: string | null;
  phase: string;
  totalFiles: number;
  processedFiles: number;
  success: boolean;
}

export interface OperationStatus {
  resyncInProgress: boolean;
  backupInProgress: boolean;
  resyncStatus: ResyncStatus;
  backupStatus: BackupStatus;
}

export interface RestartProgress {
  isRestarting: boolean;
  message: string;
  checkCount: number;
}

export type SyncStatus = 'IN_SYNC' | 'POSSIBLY_OUT_OF_SYNC' | 'OUT_OF_SYNC' | 'UNKNOWN';

export interface LocalSyncStats {
  entityCounts: Record<string, number>;
  totalEntities: number;
  fileCount: number;
  latestChangeTime: string | null;
  recentChangeCount: number;
  pendingSyncCount: number;
}

export interface ServerSyncStats {
  entityCounts: Record<string, number>;
  totalEntities: number;
  fileCount: number;
  latestChangeTime: string | null;
  totalFieldChanges: number;
}

export interface SyncHealthCheckResult {
  checkTime: string;
  machineId: string;
  syncStatus: SyncStatus;
  message: string;
  serverReachable: boolean;
  entityDifference: number;
  fileDifference: number;
  localStats: LocalSyncStats | null;
  serverStats: ServerSyncStats | null;
  // Sync suggestion fields
  suggestResync: boolean;              // True if system recommends a resync
  suggestedSyncDate: string | null;    // yyyy-MM-dd format date to sync from
  lastSuccessfulSyncTime: string | null; // When was the last successful sync
  recommendation: string | null;       // Human-readable recommendation message
  consecutiveOutOfSyncCount: number;   // How many consecutive checks were out of sync
}

// Partial Sync interfaces
export interface PartialSyncDatesResponse {
  availableDates: string[];        // List of dates in yyyy-MM-dd format
  oldestDate: string | null;       // Oldest available date
  latestDate: string | null;       // Most recent date
  totalChangesInHistory: number;   // Total changes available
  retentionDays: number;           // How long history is kept
  errorMessage: string | null;
}

export interface PartialSyncPreview {
  date: string;
  changeCount: number;
  filesToDownload: number;
  filesToDelete: number;
  filesUnchanged: number;
  errorMessage: string | null;
}

export interface PartialSyncResult {
  success: boolean;
  message: string;
  fileComparison: FileComparisonResult | null;
  changesApplied: number;
}

// Files-only sync interfaces
export interface FileSyncStats {
  filesDownloaded: number;
  filesFailed: number;
  filesDeleted: number;
  failedFiles: string[];
}

export interface FileSyncResult {
  success: boolean;
  message: string;
  comparison: FileComparisonResult | null;
  stats: FileSyncStats | null;
}

// Full Sync to Server interfaces
export interface FullSyncToServerStatus {
  startTime: string | null;
  endTime: string | null;
  phase: string;
  currentEntityType: string | null;
  totalEntities: number;
  entitiesSent: number;      // Actual entities processed
  changesSent: number;        // FieldChange records sent (multiple per entity)
  entitiesFailed: number;
  filesQueued: number;
  success: boolean;
  errors: string[];
}

export interface FullSyncToServerResponse {
  success: boolean;
  message: string;
  status: FullSyncToServerStatus;
}

export interface FullSyncToServerStatusResponse {
  inProgress: boolean;
  status: FullSyncToServerStatus;
}

// Bulk Export (Fast Full Sync) interfaces
export interface BulkExportStats {
  success: boolean;
  totalEntities: number;
  totalJoinRecords: number;
  fileCount: number;
  totalFileSize: number;
  totalFileSizeMB: string;
  message?: string;
}

export interface BulkExportResponse {
  success: boolean;
  message: string;
  method: string;
  status: FullSyncToServerStatus;
}

// Failed Sync Item interfaces
export interface FailedSyncItem {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  relatedEntityType: string;
  relatedEntityId: number;
  errorMessage: string | null;
  failedAt: string;
  resolved: boolean;
}

export interface FailedSyncRetryResult {
  success: boolean;
  message: string;
}

export interface FailedSyncRetryAllResult {
  success: boolean;
  retried: number;
  failed: number;
  total: number;
}

// Data Integrity interfaces
export interface TableIssues {
  tableName: string;
  duplicateCount: number;
  orphanCount: number;
  hasPrimaryKey: boolean;
}

export interface IntegrityCheckResult {
  checkedAt: string;
  hasIssues: boolean;
  totalDuplicates: number;
  totalOrphans: number;
  constraintsMissing: boolean;
  totalSoftDeleted: number;
  softDeleteRetentionDays: number;
  tableIssues: { [key: string]: TableIssues };
  softDeletedByEntity: { [key: string]: number };
}

export interface IntegrityFixResult {
  success: boolean;
  message: string;
  dryRun: boolean;
  duplicatesRemoved: number;
  orphansRemoved: number;
  constraintsAdded: number;
  softDeletedPurged: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FullResyncService {
  private baseUrl = `${environment.baseApiUrl}/api/resync`;

  // Observable for tracking restart progress
  private restartProgress = new BehaviorSubject<RestartProgress>({
    isRestarting: false,
    message: '',
    checkCount: 0
  });

  restartProgress$ = this.restartProgress.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current sync health status
   */
  getSyncHealth(): Observable<SyncHealthStatus> {
    return this.http.get<SyncHealthStatus>(`${this.baseUrl}/health`);
  }

  /**
   * Preview what would happen in a resync
   */
  previewResync(): Observable<FileComparisonResult> {
    return this.http.get<FileComparisonResult>(`${this.baseUrl}/preview`);
  }

  /**
   * Execute full resync
   */
  executeResync(force: boolean = false): Observable<ResyncResult> {
    return this.http.post<ResyncResult>(`${this.baseUrl}/execute?force=${force}`, {});
  }

  /**
   * Get current operation status
   */
  getStatus(): Observable<OperationStatus> {
    return this.http.get<OperationStatus>(`${this.baseUrl}/status`);
  }

  /**
   * Create a full backup
   */
  createBackup(): Observable<BackupResult> {
    return this.http.post<BackupResult>(`${this.baseUrl}/backup`, {});
  }

  /**
   * Get backup status
   */
  getBackupStatus(): Observable<BackupStatus> {
    return this.http.get<BackupStatus>(`${this.baseUrl}/backup/status`);
  }

  /**
   * Check if backend is available (for restart detection)
   */
  checkBackendHealth(): Observable<boolean> {
    return this.http.get<SyncHealthStatus>(`${this.baseUrl}/health`, {
      // Short timeout to quickly detect if server is down
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Start monitoring for application restart completion.
   * Shows restart message and polls until backend is available again.
   */
  startRestartMonitoring(): void {
    this.restartProgress.next({
      isRestarting: true,
      message: 'Application is restarting. Please wait...',
      checkCount: 0
    });

    // Wait a bit before starting to poll (give the app time to shut down)
    setTimeout(() => {
      this.pollForRestart();
    }, 3000);
  }

  /**
   * Poll the backend until it becomes available again
   */
  private pollForRestart(): void {
    let checkCount = 0;
    const maxChecks = 60; // Max 60 checks (about 2 minutes)

    const checkInterval = interval(2000).pipe(
      takeWhile(() => checkCount < maxChecks),
      switchMap(() => {
        checkCount++;
        this.restartProgress.next({
          isRestarting: true,
          message: `Waiting for application to restart... (${checkCount})`,
          checkCount
        });
        return this.checkBackendHealth();
      })
    ).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          checkInterval.unsubscribe();
          this.restartProgress.next({
            isRestarting: false,
            message: 'Application restarted successfully!',
            checkCount
          });

          // Auto-reload the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      },
      error: () => {
        this.restartProgress.next({
          isRestarting: false,
          message: 'Restart monitoring stopped. Please refresh the page manually.',
          checkCount
        });
      },
      complete: () => {
        if (checkCount >= maxChecks) {
          this.restartProgress.next({
            isRestarting: false,
            message: 'Restart taking longer than expected. Please refresh the page manually.',
            checkCount
          });
        }
      }
    });
  }

  /**
   * Stop restart monitoring (if needed)
   */
  stopRestartMonitoring(): void {
    this.restartProgress.next({
      isRestarting: false,
      message: '',
      checkCount: 0
    });
  }

  /**
   * Get background sync health check status.
   * This runs automatically every 5 minutes on the backend.
   */
  getSyncHealthCheck(): Observable<SyncHealthCheckResult> {
    return this.http.get<SyncHealthCheckResult>(`${this.baseUrl}/sync-health`);
  }

  /**
   * Force an immediate sync health check.
   */
  forceSyncHealthCheck(): Observable<SyncHealthCheckResult> {
    return this.http.post<SyncHealthCheckResult>(`${this.baseUrl}/sync-health/check`, {});
  }

  // ==================== FILES-ONLY SYNC METHODS ====================

  /**
   * Preview files-only sync.
   * Compares local files with server and returns what would change.
   */
  previewFilesSync(): Observable<FileComparisonResult> {
    return this.http.get<FileComparisonResult>(`${this.baseUrl}/files-sync/preview`);
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
  executeFilesSync(force: boolean = false, maxRetries: number = 3): Observable<FileSyncResult> {
    return this.http.post<FileSyncResult>(
      `${this.baseUrl}/files-sync/execute?force=${force}&maxRetries=${maxRetries}`, {}
    );
  }

  // ==================== PARTIAL SYNC METHODS ====================

  /**
   * Get available dates for partial sync.
   * Returns a list of dates where sync history is available on the server.
   */
  getAvailableSyncDates(): Observable<PartialSyncDatesResponse> {
    return this.http.get<PartialSyncDatesResponse>(`${this.baseUrl}/partial-sync/dates`);
  }

  /**
   * Preview what would happen in a partial sync from a specific date.
   * Returns counts of changes and files that would be affected.
   */
  previewPartialSync(date: string): Observable<PartialSyncPreview> {
    return this.http.get<PartialSyncPreview>(`${this.baseUrl}/partial-sync/preview?date=${date}`);
  }

  /**
   * Execute a partial sync from a specific date.
   * Fetches and applies all field changes since the date, then resyncs files.
   */
  executePartialSync(date: string, force: boolean = false): Observable<PartialSyncResult> {
    return this.http.post<PartialSyncResult>(
      `${this.baseUrl}/partial-sync/execute?date=${date}&force=${force}`, {}
    );
  }

  // ==================== AUTO-RESYNC METHODS ====================

  /**
   * Reset auto-resync state. Use when the user wants to retry automatic
   * resync after exhaustion, or after a manual resync.
   */
  resetAutoResyncState(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auto-resync/reset`, {});
  }

  // ==================== FULL SYNC TO SERVER METHODS ====================

  private fieldSyncUrl = `${environment.baseApiUrl}/api/field-sync`;

  /**
   * Start a full sync of all entities from client to server.
   * This is a one-time operation to populate the server with all existing data.
   */
  startFullSyncToServer(): Observable<FullSyncToServerResponse> {
    return this.http.post<FullSyncToServerResponse>(
      `${this.fieldSyncUrl}/full-sync/start`, {}
    );
  }

  /**
   * Get the status of the current or last full sync to server operation.
   */
  getFullSyncToServerStatus(): Observable<FullSyncToServerStatusResponse> {
    return this.http.get<FullSyncToServerStatusResponse>(
      `${this.fieldSyncUrl}/full-sync/status`
    );
  }

  // ==================== BULK EXPORT (FAST FULL SYNC) METHODS ====================

  /**
   * Get statistics about what would be exported in a bulk export.
   * Useful for showing the user what will be synced before starting.
   */
  getBulkExportStats(): Observable<BulkExportStats> {
    return this.http.get<BulkExportStats>(
      `${this.fieldSyncUrl}/full-sync/bulk/stats`
    );
  }

  /**
   * Start a fast bulk export sync to the server.
   * This creates an H2 database export + files ZIP and uploads both.
   * Much faster than the FieldChange approach (2-5 minutes vs 30-60 minutes).
   *
   * @param force If true, overwrite existing data on server
   */
  startBulkExportSync(force: boolean = false): Observable<BulkExportResponse> {
    return this.http.post<BulkExportResponse>(
      `${this.fieldSyncUrl}/full-sync/bulk/start?force=${force}`, {}
    );
  }

  // ==================== FAILED SYNC ITEMS METHODS ====================

  private syncServerUrl = environment.syncServerUrl;
  private integrityUrl = `${environment.baseApiUrl}/api/data-integrity`;

  /**
   * Get all unresolved failed sync items from the sync server.
   */
  getFailedSyncItems(): Observable<FailedSyncItem[]> {
    return this.http.get<FailedSyncItem[]>(`${this.syncServerUrl}/api/sync/failed`);
  }

  /**
   * Get count of unresolved failed sync items.
   */
  getFailedSyncItemsCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.syncServerUrl}/api/sync/failed/count`);
  }

  /**
   * Retry a specific failed sync item.
   */
  retryFailedItem(id: number): Observable<FailedSyncRetryResult> {
    return this.http.post<FailedSyncRetryResult>(
      `${this.syncServerUrl}/api/sync/failed/${id}/retry`, {}
    );
  }

  /**
   * Dismiss (mark as resolved) a failed sync item.
   */
  dismissFailedItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.syncServerUrl}/api/sync/failed/${id}`);
  }

  /**
   * Retry all failed sync items.
   */
  retryAllFailedItems(): Observable<FailedSyncRetryAllResult> {
    return this.http.post<FailedSyncRetryAllResult>(
      `${this.syncServerUrl}/api/sync/failed/retry-all`, {}
    );
  }

  // ==================== DATA INTEGRITY METHODS ====================

  /**
   * Check all data integrity issues (read-only).
   * Scans for duplicates in join tables, orphaned references, missing constraints,
   * and soft-deleted entities eligible for purge.
   */
  checkIntegrity(): Observable<IntegrityCheckResult> {
    return this.http.get<IntegrityCheckResult>(`${this.integrityUrl}/check`);
  }

  /**
   * Fix duplicate entries in join tables.
   * @param dryRun If true (default), only report what would be fixed
   */
  fixDuplicates(dryRun: boolean = true): Observable<IntegrityFixResult> {
    return this.http.post<IntegrityFixResult>(
      `${this.integrityUrl}/fix/duplicates?dryRun=${dryRun}`, {}
    );
  }

  /**
   * Fix orphaned FK references in join tables.
   * @param dryRun If true (default), only report what would be fixed
   */
  fixOrphans(dryRun: boolean = true): Observable<IntegrityFixResult> {
    return this.http.post<IntegrityFixResult>(
      `${this.integrityUrl}/fix/orphans?dryRun=${dryRun}`, {}
    );
  }

  /**
   * Add missing primary key constraints to join tables.
   * @param dryRun If true (default), only report what would be added
   */
  fixConstraints(dryRun: boolean = true): Observable<IntegrityFixResult> {
    return this.http.post<IntegrityFixResult>(
      `${this.integrityUrl}/fix/constraints?dryRun=${dryRun}`, {}
    );
  }

  /**
   * Fix all integrity issues (duplicates, orphans, constraints).
   * Does NOT purge soft-deleted entities.
   * @param dryRun If true (default), only report what would be fixed
   */
  fixAll(dryRun: boolean = true): Observable<IntegrityFixResult> {
    return this.http.post<IntegrityFixResult>(
      `${this.integrityUrl}/fix/all?dryRun=${dryRun}`, {}
    );
  }

  /**
   * Permanently delete soft-deleted entities older than retention period.
   * @param dryRun If true (default), only report what would be deleted
   * @param retentionDays Minimum age of soft-deleted entities to purge (default 90)
   */
  purgeDeleted(dryRun: boolean = true, retentionDays: number = 90): Observable<IntegrityFixResult> {
    return this.http.post<IntegrityFixResult>(
      `${this.integrityUrl}/fix/purge-deleted?dryRun=${dryRun}&retentionDays=${retentionDays}`, {}
    );
  }
}
