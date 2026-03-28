import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, interval, EMPTY } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import {
  FullResyncService,
  SyncHealthStatus,
  FileComparisonResult,
  OperationStatus,
  RestartProgress,
  SyncHealthCheckResult,
  FailedSyncItem,
  FileSyncResult,
  IntegrityCheckResult,
  IntegrityFixResult,
  TableIssues
} from '../../services/full-resync.service';

interface ElectronSyncExecuteProgress {
  phase: string;
  statusMessage: string;
  progressPercent: number;
  error?: string;
}

interface ElectronDesktopApi {
  isElectron?: boolean;
  executeSync?: (components: string[], options?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  onSyncExecuteProgress?: (callback: (progress: ElectronSyncExecuteProgress) => void) => (() => void) | void;
}
@Component({
  selector: 'app-sync-resync',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sync-resync.component.html',
  styleUrls: ['./sync-resync.component.css']
})
export class SyncResyncComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // State
  healthStatus: SyncHealthStatus | null = null;
  operationStatus: OperationStatus | null = null;
  previewResult: FileComparisonResult | null = null;

  // UI state
  loading = false;
  previewLoading = false;
  message = '';
  messageType: 'success' | 'error' | 'info' | 'warning' = 'info';
  showConfirmDialog = false;
  confirmAction: 'resync' | 'backup' | 'force-resync' | null = null;

  // Restart monitoring
  restartProgress: RestartProgress = { isRestarting: false, message: '', checkCount: 0 };

  // Background sync health check
  syncHealthCheck: SyncHealthCheckResult | null = null;
  syncHealthCheckLoading = false;

  // Failed sync items state
  failedSyncItems: (FailedSyncItem & { retrying?: boolean; dismissing?: boolean })[] = [];
  failedSyncItemsCount = 0;
  failedItemsLoading = false;
  showFailedItems = false;
  retryingAll = false;

  // Files-only sync state
  filesSyncLoading = false;
  filesSyncResult: FileSyncResult | null = null;
  showFilesSyncConfirm = false;
  forceFilesSync = false;

  // Data Integrity state
  integrityCheckResult: IntegrityCheckResult | null = null;
  integrityFixResult: IntegrityFixResult | null = null;
  integrityLoading = false;
  integrityFixLoading = false;
  showIntegrityFixConfirm = false;
  showPurgeConfirm = false;
  integrityFixType: 'duplicates' | 'orphans' | 'constraints' | 'all' = 'all';

  // Electron-managed full repair state
  isElectronManaged = false;
  desktopResyncInProgress = false;
  desktopResyncProgress: ElectronSyncExecuteProgress | null = null;
  private electronSyncProgressUnsubscribe: (() => void) | null = null;

  // Next check countdown
  nextCheckCountdown = '';
  private countdownSub: Subscription | null = null;

  constructor(
    private resyncService: FullResyncService,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isElectronManaged = !!this.getElectronApi()?.isElectron;
      this.subscribeElectronSyncProgress();
      this.loadHealth();
      this.loadStatus();
      this.loadSyncHealthCheck();
      this.loadFailedSyncItemsCount();
      this.startAutoRefresh();

      // Subscribe to restart progress
      this.resyncService.restartProgress$
        .pipe(takeUntil(this.destroy$))
        .subscribe(progress => {
          this.restartProgress = progress;
        });

      // Start countdown ticker (every second)
      this.countdownSub = interval(1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateCountdown());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.electronSyncProgressUnsubscribe?.();
  }

  private startAutoRefresh(): void {
    if (!this.isBrowser) return;

    // Refresh health and status every 10 seconds
    interval(10000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (!this.loading) {
            this.loadHealth();
            return this.resyncService.getStatus();
          }
          return EMPTY;
        })
      )
      .subscribe({
        next: (status) => {
          if (status) this.operationStatus = status;
        }
      });
  }

  loadHealth(): void {
    this.resyncService.getSyncHealth().subscribe({
      next: (health) => {
        this.healthStatus = health;
        if (health.potentialMismatch) {
          this.showMessage(
            `Potential sync mismatch detected: ${health.fileDifference} file difference`,
            'warning'
          );
        }
      },
      error: (err) => this.showMessage('Failed to load health status: ' + err.message, 'error')
    });
  }

  loadStatus(): void {
    this.resyncService.getStatus().subscribe({
      next: (status) => this.operationStatus = status,
      error: (err) => console.error('Failed to load status:', err)
    });
  }

  loadSyncHealthCheck(): void {
    this.resyncService.getSyncHealthCheck().subscribe({
      next: (result) => {
        this.syncHealthCheck = result;
      },
      error: (err) => console.debug('Could not load sync health check:', err.message)
    });
  }

  /**
   * Compute the countdown string from nextCheckDueAt.
   */
  private updateCountdown(): void {
    if (!this.syncHealthCheck?.nextCheckDueAt) {
      this.nextCheckCountdown = '';
      return;
    }

    const dueAt = this.parseTimestamp(this.syncHealthCheck.nextCheckDueAt);
    if (!dueAt) {
      this.nextCheckCountdown = '';
      return;
    }

    const remainingMs = dueAt - Date.now();
    if (remainingMs <= 0) {
      this.nextCheckCountdown = 'due now';
      return;
    }

    const totalSec = Math.ceil(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    this.nextCheckCountdown = min > 0
      ? `${min}m ${sec.toString().padStart(2, '0')}s`
      : `${sec}s`;
  }

  /**
   * Parse various Java Instant serialization formats into epoch millis.
   */
  private parseTimestamp(ts: any): number | null {
    if (!ts) return null;
    if (typeof ts === 'number') {
      return ts < 10000000000 ? ts * 1000 : ts;
    }
    if (typeof ts === 'object' && ts.epochSecond) {
      return ts.epochSecond * 1000;
    }
    if (typeof ts === 'string') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d.getTime();
    }
    return null;
  }

  private getElectronApi(): ElectronDesktopApi | null {
    if (!this.isBrowser) return null;
    return (window as Window & { electronAPI?: ElectronDesktopApi }).electronAPI ?? null;
  }

  private subscribeElectronSyncProgress(): void {
    const api = this.getElectronApi();
    if (!api?.onSyncExecuteProgress) return;

    const unsubscribe = api.onSyncExecuteProgress((progress) => {
      this.desktopResyncProgress = progress;
      this.desktopResyncInProgress = progress.phase !== 'done' && progress.phase !== 'error';
      this.loading = this.desktopResyncInProgress;

      if (progress.phase === 'done') {
        this.loading = false;
        this.desktopResyncInProgress = false;
        this.showMessage('Desktop full resync completed', 'success');
        this.loadHealth();
        this.loadStatus();
        this.loadSyncHealthCheck();
      } else if (progress.phase === 'error') {
        this.loading = false;
        this.desktopResyncInProgress = false;
        this.showMessage('Desktop full resync failed: ' + (progress.error || progress.statusMessage), 'error');
      }
    });

    this.electronSyncProgressUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
  }

  executeSuggestedSync(): void {
    if (this.syncHealthCheck?.suggestResync) {
      this.confirmResync();
    }
  }

  forceSyncHealthCheck(): void {
    this.syncHealthCheckLoading = true;
    this.resyncService.forceSyncHealthCheck().subscribe({
      next: (result) => {
        this.syncHealthCheck = result;
        this.syncHealthCheckLoading = false;
        this.showMessage('Sync health check completed', 'info');
      },
      error: (err) => {
        this.syncHealthCheckLoading = false;
        this.showMessage('Sync health check failed: ' + err.message, 'error');
      }
    });
  }

  getSyncStatusClass(): string {
    if (!this.syncHealthCheck) return '';
    switch (this.syncHealthCheck.syncStatus) {
      case 'IN_SYNC': return 'status-ok';
      case 'POSSIBLY_OUT_OF_SYNC': return 'status-warning';
      case 'OUT_OF_SYNC': return 'status-error';
      default: return 'status-info';
    }
  }

  getSyncStatusText(): string {
    if (!this.syncHealthCheck) return 'Unknown';
    switch (this.syncHealthCheck.syncStatus) {
      case 'IN_SYNC': return 'In Sync';
      case 'POSSIBLY_OUT_OF_SYNC': return 'Possibly Out of Sync';
      case 'OUT_OF_SYNC': return 'Out of Sync';
      default: return 'Unknown';
    }
  }

  hasEntityDrift(): boolean {
    return (this.syncHealthCheck?.entityDrift?.length ?? 0) > 0;
  }

  hasFileDrift(): boolean {
    return (this.syncHealthCheck?.fileDrift?.difference ?? 0) > 0;
  }

  loadPreview(): void {
    this.previewLoading = true;
    this.previewResult = null;

    this.resyncService.previewResync().subscribe({
      next: (result) => {
        this.previewResult = result;
        this.previewLoading = false;

        if (result.errorMessage) {
          this.showMessage(result.errorMessage, 'error');
        } else {
          this.showMessage(
            `Preview: ${result.filesToDownload.length} to download, ${result.filesToDelete.length} to delete, ${result.unchangedFiles.length} unchanged`,
            'info'
          );
        }
      },
      error: (err) => {
        this.previewLoading = false;
        this.showMessage('Failed to preview: ' + err.message, 'error');
      }
    });
  }

  // Confirmation dialog actions
  confirmResync(): void {
    this.confirmAction = 'resync';
    this.showConfirmDialog = true;
  }

  confirmForceResync(): void {
    this.confirmAction = 'force-resync';
    this.showConfirmDialog = true;
  }

  confirmBackup(): void {
    this.confirmAction = 'backup';
    this.showConfirmDialog = true;
  }

  cancelConfirm(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  executeConfirmed(): void {
    this.showConfirmDialog = false;

    switch (this.confirmAction) {
      case 'resync':
        this.executeResync(false);
        break;
      case 'force-resync':
        this.executeResync(true);
        break;
      case 'backup':
        this.executeBackup();
        break;
    }

    this.confirmAction = null;
  }

  private executeResync(force: boolean): void {
    if (this.isElectronManaged) {
      this.executeElectronResync();
      return;
    }

    this.loading = true;
    this.showMessage('Starting full resync...', 'info');

    this.resyncService.executeResync(force).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.showMessage(result.message, 'success');
          // Start monitoring for restart if resync was successful
          if (result.message.includes('restarting')) {
            this.resyncService.startRestartMonitoring();
          }
        } else {
          this.showMessage(result.message, 'error');
        }
        // Don't reload health/status if restarting - server will be down
        if (!result.message.includes('restarting')) {
          this.loadHealth();
          this.loadStatus();
        }
      },
      error: (err) => {
        this.loading = false;
        // If we get a connection error right after starting resync,
        // the server might be restarting
        if (err.status === 0 || err.status === 504) {
          this.showMessage('Connection lost - server may be restarting...', 'warning');
          this.resyncService.startRestartMonitoring();
        } else {
          this.showMessage('Resync failed: ' + (err.error?.message || err.message), 'error');
        }
      }
    });
  }

  private executeElectronResync(): void {
    const api = this.getElectronApi();
    if (!api?.executeSync) {
      this.showMessage('Electron sync bridge is not available', 'error');
      return;
    }

    this.loading = true;
    this.desktopResyncInProgress = true;
    this.desktopResyncProgress = {
      phase: 'stopping_sb',
      statusMessage: 'Preparing desktop full resync...',
      progressPercent: 0
    };
    this.showMessage('Starting desktop full resync...', 'info');

    api.executeSync(['db', 'files'], { cleanFiles: true })
      .then((result) => {
        if (!result.success) {
          this.loading = false;
          this.desktopResyncInProgress = false;
          this.showMessage('Desktop full resync failed: ' + (result.error || 'Unknown error'), 'error');
        }
      })
      .catch((err) => {
        this.loading = false;
        this.desktopResyncInProgress = false;
        this.showMessage('Desktop full resync failed: ' + (err?.message || err), 'error');
      });
  }

  private executeBackup(): void {
    this.loading = true;
    this.showMessage('Creating full backup...', 'info');

    this.resyncService.createBackup().subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.showMessage(result.message, 'success');
        } else {
          this.showMessage(result.message, 'error');
        }
        this.loadHealth();
        this.loadStatus();
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('Backup failed: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.message = msg;
    this.messageType = type;

    // Scroll to ensure the message banner is visible
    if (this.isBrowser) {
      // Use timeout to allow Angular to render the message element after *ngIf becomes true
      setTimeout(() => {
        // Query the message element directly from the DOM (more reliable with *ngIf)
        const messageEl = this.elementRef.nativeElement.querySelector('.message');
        if (messageEl) {
          // Scroll so the message is visible at the top of the viewport
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll the window to the top of the page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  }

  // Utility methods
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';

    let date: Date;

    // Handle different timestamp formats from Java Instant serialization
    if (typeof timestamp === 'number') {
      // Epoch seconds - convert to milliseconds
      // Check if it's seconds (small number) or already milliseconds (large number)
      date = timestamp < 10000000000
        ? new Date(timestamp * 1000)  // Seconds
        : new Date(timestamp);         // Milliseconds
    } else if (typeof timestamp === 'object' && timestamp.epochSecond) {
      // Object format: {epochSecond: number, nano: number}
      date = new Date(timestamp.epochSecond * 1000);
    } else if (typeof timestamp === 'string') {
      // ISO-8601 string
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }

    return date.toLocaleString();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  getHealthStatusClass(): string {
    if (!this.healthStatus) return '';
    if (this.healthStatus.errorMessage) return 'status-error';
    if (this.healthStatus.potentialMismatch) return 'status-warning';
    if (!this.healthStatus.backupAvailable) return 'status-info';
    return 'status-ok';
  }

  getHealthStatusText(): string {
    if (!this.healthStatus) return 'Loading...';
    if (this.healthStatus.errorMessage) return 'Error';
    if (this.healthStatus.potentialMismatch) return 'Mismatch Detected';
    if (!this.healthStatus.backupAvailable) return 'No Backup Available';
    return 'Healthy';
  }

  getConfirmMessage(): string {
    if (this.isElectronManaged && this.confirmAction === 'resync') {
      return 'Are you sure you want to run a desktop full resync? Electron will stop the app, replace the local database and files from the hub, then start the app again.';
    }

    switch (this.confirmAction) {
      case 'resync':
        return 'Are you sure you want to perform a full resync? This will restore database and files from the shared backup.';
      case 'force-resync':
        return 'WARNING: Force resync will skip deletion safety checks. This could delete a large number of files. Are you sure?';
      case 'backup':
        return 'Are you sure you want to create a full backup? This will upload database and file manifest to the shared drive.';
      default:
        return '';
    }
  }

  isOperationInProgress(): boolean {
    return this.desktopResyncInProgress || this.operationStatus?.resyncInProgress || this.operationStatus?.backupInProgress || false;
  }

  /**
   * Get overall progress percentage for resync operations.
   * Uses backend-computed progressPercent for accurate phase-weighted progress.
   */
  getProgressPercent(): number {
    if (this.desktopResyncInProgress && this.desktopResyncProgress) {
      return this.desktopResyncProgress.progressPercent || 0;
    }

    if (this.operationStatus?.resyncInProgress) {
      const status = this.operationStatus.resyncStatus;
      // Use backend-computed progressPercent for accurate phase-weighted progress
      if (status?.progressPercent !== undefined && status.progressPercent > 0) {
        return status.progressPercent;
      }
      // Fallback to file-based calculation for backwards compatibility
      if (status && status.totalFiles > 0) {
        return Math.round((status.processedFiles / status.totalFiles) * 100);
      }
    }

    if (this.operationStatus?.backupInProgress) {
      const status = this.operationStatus.backupStatus;
      if (status && status.totalFiles > 0) {
        return Math.round((status.processedFiles / status.totalFiles) * 100);
      }
    }

    return 0;
  }

  /**
   * Format bytes to human-readable string.
   */
  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  /**
   * Get phase-specific progress percentage within current phase.
   */
  getPhaseProgressPercent(): number {
    const status = this.operationStatus?.resyncStatus;
    return status?.phaseProgressPercent || 0;
  }

  /**
   * Get current phase name for display.
   */
  getCurrentPhaseName(): string {
    if (this.desktopResyncInProgress && this.desktopResyncProgress?.phase) {
      switch (this.desktopResyncProgress.phase) {
        case 'stopping_sb': return 'Stopping App';
        case 'db_download': return 'Database Download';
        case 'db_extract': return 'Database Restore';
        case 'files': return 'Files Sync';
        case 'starting_sb': return 'Starting App';
        default: return this.desktopResyncProgress.phase;
      }
    }

    const status = this.operationStatus?.resyncStatus;
    if (!status?.currentPhase) return '';

    switch (status.currentPhase) {
      case 'db_download': return 'Database Download';
      case 'db_restore': return 'Database Restore';
      case 'file_compare': return 'File Comparison';
      case 'file_download': return 'File Download';
      case 'file_delete': return 'File Cleanup';
      default: return status.currentPhase;
    }
  }

  /**
   * Get download progress text for file download phase.
   */
  getDownloadProgressText(): string {
    const status = this.operationStatus?.resyncStatus;
    if (!status) return '';

    if (status.currentPhase === 'file_download' && status.totalFileBytes > 0) {
      return `${this.formatBytes(status.downloadedBytes)} / ${this.formatBytes(status.totalFileBytes)}`;
    }

    return '';
  }

  /**
   * Check if we're in a file operation phase (for detailed stats display).
   */
  isFileOperationPhase(): boolean {
    const status = this.operationStatus?.resyncStatus;
    return status?.currentPhase === 'file_download' || status?.currentPhase === 'file_delete';
  }

  getCurrentPhase(): string {
    if (this.desktopResyncInProgress && this.desktopResyncProgress) {
      return this.desktopResyncProgress.statusMessage || 'Processing...';
    }
    if (this.operationStatus?.resyncInProgress) {
      return this.operationStatus.resyncStatus?.phase || 'Processing...';
    }
    if (this.operationStatus?.backupInProgress) {
      return this.operationStatus.backupStatus?.phase || 'Processing...';
    }
    return '';
  }

  // ==================== FAILED SYNC ITEMS METHODS ====================

  /**
   * Load count of failed sync items (for badge display)
   */
  loadFailedSyncItemsCount(): void {
    this.resyncService.getFailedSyncItemsCount().subscribe({
      next: (response) => {
        this.failedSyncItemsCount = response.count;
      },
      error: (err) => console.debug('Could not load failed items count:', err.message)
    });
  }

  /**
   * Load all failed sync items
   */
  loadFailedSyncItems(): void {
    this.failedItemsLoading = true;
    this.resyncService.getFailedSyncItems().subscribe({
      next: (items) => {
        this.failedSyncItems = items;
        this.failedSyncItemsCount = items.length;
        this.failedItemsLoading = false;
      },
      error: (err) => {
        this.failedItemsLoading = false;
        this.showMessage('Failed to load failed sync items: ' + err.message, 'error');
      }
    });
  }

  /**
   * Toggle visibility of failed items section
   */
  toggleFailedItems(): void {
    this.showFailedItems = !this.showFailedItems;
    if (this.showFailedItems && this.failedSyncItems.length === 0) {
      this.loadFailedSyncItems();
    }
  }

  /**
   * Retry a specific failed sync item
   */
  retryFailedItem(item: FailedSyncItem & { retrying?: boolean }): void {
    item.retrying = true;
    this.resyncService.retryFailedItem(item.id).subscribe({
      next: (result) => {
        item.retrying = false;
        if (result.success) {
          this.showMessage('Successfully retried relationship', 'success');
          // Remove from list
          this.failedSyncItems = this.failedSyncItems.filter(i => i.id !== item.id);
          this.failedSyncItemsCount = this.failedSyncItems.length;
        } else {
          this.showMessage('Retry failed: ' + result.message, 'warning');
        }
      },
      error: (err) => {
        item.retrying = false;
        this.showMessage('Retry failed: ' + err.message, 'error');
      }
    });
  }

  /**
   * Dismiss a failed sync item
   */
  dismissFailedItem(item: FailedSyncItem & { dismissing?: boolean }): void {
    item.dismissing = true;
    this.resyncService.dismissFailedItem(item.id).subscribe({
      next: () => {
        // Remove from list
        this.failedSyncItems = this.failedSyncItems.filter(i => i.id !== item.id);
        this.failedSyncItemsCount = this.failedSyncItems.length;
        this.showMessage('Item dismissed', 'info');
      },
      error: (err) => {
        item.dismissing = false;
        this.showMessage('Failed to dismiss: ' + err.message, 'error');
      }
    });
  }

  /**
   * Retry all failed sync items
   */
  retryAllFailedItems(): void {
    this.retryingAll = true;
    this.resyncService.retryAllFailedItems().subscribe({
      next: (result) => {
        this.retryingAll = false;
        this.showMessage(`Retried ${result.retried} items, ${result.failed} still failing`, 'info');
        this.loadFailedSyncItems(); // Reload the list
      },
      error: (err) => {
        this.retryingAll = false;
        this.showMessage('Retry all failed: ' + err.message, 'error');
      }
    });
  }

  // ==================== FILES-ONLY SYNC METHODS ====================

  /**
   * Show confirmation for files-only sync
   */
  confirmFilesSync(): void {
    this.forceFilesSync = false;
    this.showFilesSyncConfirm = true;
  }

  /**
   * Show confirmation for force files-only sync
   */
  confirmForceFilesSync(): void {
    this.forceFilesSync = true;
    this.showFilesSyncConfirm = true;
  }

  /**
   * Cancel files-only sync confirmation
   */
  cancelFilesSyncConfirm(): void {
    this.showFilesSyncConfirm = false;
    this.forceFilesSync = false;
  }

  /**
   * Execute files-only sync
   */
  executeFilesSync(): void {
    this.showFilesSyncConfirm = false;
    this.filesSyncLoading = true;
    this.filesSyncResult = null;
    this.showMessage('Starting files-only sync...', 'info');

    this.resyncService.executeFilesSync(this.forceFilesSync, 3).subscribe({
      next: (result) => {
        this.filesSyncLoading = false;
        this.filesSyncResult = result;
        if (result.success) {
          this.showMessage(result.message, 'success');
        } else {
          this.showMessage(result.message, 'warning');
        }
        this.loadHealth();
        this.loadSyncHealthCheck();
      },
      error: (err) => {
        this.filesSyncLoading = false;
        this.showMessage('Files sync failed: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  /**
   * Get files sync confirmation message
   */
  getFilesSyncConfirmMessage(): string {
    if (this.forceFilesSync) {
      return 'WARNING: Force files sync will skip deletion safety checks and may delete many files. ' +
             'This only syncs files - database is not affected. Are you sure?';
    }
    return 'Are you sure you want to sync files only? ' +
           'This will download missing files and delete extra local files. ' +
           'Database is not affected.';
  }

  // ==================== DATA INTEGRITY METHODS ====================

  /**
   * Load data integrity check
   */
  loadIntegrityCheck(): void {
    this.integrityLoading = true;
    this.integrityCheckResult = null;
    this.integrityFixResult = null;

    this.resyncService.checkIntegrity().subscribe({
      next: (result) => {
        this.integrityCheckResult = result;
        this.integrityLoading = false;
        if (result.hasIssues) {
          this.showMessage(
            `Found ${result.totalDuplicates} duplicates, ${result.totalOrphans} orphans, ${result.totalSoftDeleted} soft-deleted`,
            'warning'
          );
        } else {
          this.showMessage('No integrity issues found', 'success');
        }
      },
      error: (err) => {
        this.integrityLoading = false;
        this.showMessage('Integrity check failed: ' + err.message, 'error');
      }
    });
  }

  /**
   * Get integrity status class
   */
  getIntegrityStatusClass(): string {
    if (!this.integrityCheckResult) return 'status-info';
    if (this.integrityCheckResult.hasIssues) return 'status-warning';
    return 'status-ok';
  }

  /**
   * Get integrity status text
   */
  getIntegrityStatusText(): string {
    if (!this.integrityCheckResult) return 'Not Checked';
    if (this.integrityCheckResult.hasIssues) return 'Issues Found';
    return 'Clean';
  }

  /**
   * Preview integrity fix (dry run)
   */
  previewIntegrityFix(): void {
    this.integrityFixLoading = true;
    this.integrityFixResult = null;

    this.resyncService.fixAll(true).subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        this.showMessage('Preview complete (no changes made)', 'info');
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Preview failed: ' + err.message, 'error');
      }
    });
  }

  /**
   * Show confirmation for integrity fix
   */
  confirmIntegrityFix(type: 'duplicates' | 'orphans' | 'constraints' | 'all'): void {
    this.integrityFixType = type;
    this.showIntegrityFixConfirm = true;
  }

  /**
   * Cancel integrity fix confirmation
   */
  cancelIntegrityFixConfirm(): void {
    this.showIntegrityFixConfirm = false;
  }

  /**
   * Execute integrity fix
   */
  executeIntegrityFix(): void {
    this.showIntegrityFixConfirm = false;
    this.integrityFixLoading = true;
    this.integrityFixResult = null;

    let observable;
    switch (this.integrityFixType) {
      case 'duplicates':
        observable = this.resyncService.fixDuplicates(false);
        break;
      case 'orphans':
        observable = this.resyncService.fixOrphans(false);
        break;
      case 'constraints':
        observable = this.resyncService.fixConstraints(false);
        break;
      default:
        observable = this.resyncService.fixAll(false);
    }

    observable.subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        if (result.success) {
          this.showMessage(result.message, 'success');
          // Refresh the check results
          this.loadIntegrityCheck();
        } else {
          this.showMessage(result.message, 'warning');
        }
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Fix failed: ' + err.message, 'error');
      }
    });
  }

  /**
   * Show confirmation for purge deleted
   */
  confirmPurgeDeleted(): void {
    this.showPurgeConfirm = true;
  }

  /**
   * Cancel purge confirmation
   */
  cancelPurgeConfirm(): void {
    this.showPurgeConfirm = false;
  }

  /**
   * Execute purge of soft-deleted entities
   */
  executePurgeDeleted(): void {
    this.showPurgeConfirm = false;
    this.integrityFixLoading = true;

    const retentionDays = this.integrityCheckResult?.softDeleteRetentionDays || 90;
    this.resyncService.purgeDeleted(false, retentionDays).subscribe({
      next: (result) => {
        this.integrityFixResult = result;
        this.integrityFixLoading = false;
        if (result.success) {
          this.showMessage(`Purged ${result.softDeletedPurged} soft-deleted entities`, 'success');
          // Refresh the check results
          this.loadIntegrityCheck();
        } else {
          this.showMessage(result.message, 'warning');
        }
      },
      error: (err) => {
        this.integrityFixLoading = false;
        this.showMessage('Purge failed: ' + err.message, 'error');
      }
    });
  }

  /**
   * Get table issues as array for display
   */
  getTableIssuesArray(): TableIssues[] {
    if (!this.integrityCheckResult?.tableIssues) return [];
    return Object.values(this.integrityCheckResult.tableIssues)
      .filter(t => t.duplicateCount > 0 || t.orphanCount > 0 || !t.hasPrimaryKey);
  }

  /**
   * Get soft-deleted entries as array for display
   */
  getSoftDeletedEntries(): Array<{key: string, value: number}> {
    if (!this.integrityCheckResult?.softDeletedByEntity) return [];
    return Object.entries(this.integrityCheckResult.softDeletedByEntity)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({ key, value }));
  }

}
