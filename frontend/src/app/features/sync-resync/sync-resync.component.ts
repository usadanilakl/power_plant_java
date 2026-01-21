import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, interval, EMPTY } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import {
  FullResyncService,
  SyncHealthStatus,
  FileComparisonResult,
  OperationStatus,
  ResyncResult,
  BackupResult,
  RestartProgress
} from '../../services/full-resync.service';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-sync-resync',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
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

  constructor(
    private resyncService: FullResyncService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadHealth();
      this.loadStatus();
      this.startAutoRefresh();

      // Subscribe to restart progress
      this.resyncService.restartProgress$
        .pipe(takeUntil(this.destroy$))
        .subscribe(progress => {
          this.restartProgress = progress;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  }

  // Utility methods
  formatTimestamp(timestamp: string | null): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
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
    return this.operationStatus?.resyncInProgress || this.operationStatus?.backupInProgress || false;
  }

  getProgressPercent(): number {
    const status = this.operationStatus?.resyncStatus || this.operationStatus?.backupStatus;
    if (!status || status.totalFiles === 0) return 0;
    return Math.round((status.processedFiles / status.totalFiles) * 100);
  }

  getCurrentPhase(): string {
    if (this.operationStatus?.resyncInProgress) {
      return this.operationStatus.resyncStatus?.phase || 'Processing...';
    }
    if (this.operationStatus?.backupInProgress) {
      return this.operationStatus.backupStatus?.phase || 'Processing...';
    }
    return '';
  }
}
