import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  FullResyncService,
  FullSyncToServerStatus,
  FullSyncToServerStatusResponse,
  BulkExportStats,
  BulkSyncMode
} from '../../services/full-resync.service';
@Component({
  selector: 'app-full-sync-to-server',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './full-sync-to-server.component.html',
  styleUrls: ['./full-sync-to-server.component.css']
})
export class FullSyncToServerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // State
  syncStatus: FullSyncToServerStatus | null = null;
  inProgress = false;

  // UI state
  loading = false;
  startLoading = false;
  message = '';
  messageType: 'success' | 'error' | 'info' | 'warning' = 'info';
  showConfirmDialog = false;

  // Sync method selection
  syncMethod: 'BULK_EXPORT' | 'FIELD_CHANGES' = 'BULK_EXPORT';
  forceOverwrite = false;
  bulkExportStats: BulkExportStats | null = null;
  statsLoading = false;

  // Sync mode selection (for bulk export)
  syncMode: BulkSyncMode = 'BOTH';

  constructor(
    private resyncService: FullResyncService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadStatus();
      this.loadBulkExportStats();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatus(): void {
    this.loading = true;
    this.resyncService.getFullSyncToServerStatus().subscribe({
      next: (response: FullSyncToServerStatusResponse) => {
        this.syncStatus = response.status;
        this.inProgress = response.inProgress;
        this.loading = false;

        // If sync is in progress, start polling
        if (this.inProgress) {
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('Failed to load sync status:', err);
        this.loading = false;
        this.showMessage('Failed to load sync status', 'error');
      }
    });
  }

  startPolling(): void {
    interval(2000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.resyncService.getFullSyncToServerStatus())
      )
      .subscribe({
        next: (response: FullSyncToServerStatusResponse) => {
          this.syncStatus = response.status;
          this.inProgress = response.inProgress;

          // Stop polling when sync is complete
          if (!this.inProgress && this.syncStatus?.phase === 'Complete') {
            this.showMessage('Full sync completed successfully!', 'success');
          }
        },
        error: (err) => {
          console.error('Polling error:', err);
        }
      });
  }

  showStartConfirmation(): void {
    this.showConfirmDialog = true;
  }

  cancelConfirmation(): void {
    this.showConfirmDialog = false;
  }

  confirmStartSync(): void {
    this.showConfirmDialog = false;
    if (this.syncMethod === 'BULK_EXPORT') {
      this.startBulkExportSync();
    } else {
      this.startFullSync();
    }
  }

  loadBulkExportStats(): void {
    this.statsLoading = true;
    this.resyncService.getBulkExportStats().subscribe({
      next: (stats) => {
        this.bulkExportStats = stats;
        this.statsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load bulk export stats:', err);
        this.statsLoading = false;
      }
    });
  }

  startFullSync(): void {
    this.startLoading = true;
    this.message = '';

    this.resyncService.startFullSyncToServer().subscribe({
      next: (response) => {
        this.startLoading = false;
        if (response.success) {
          this.syncStatus = response.status;
          this.inProgress = true;
          this.showMessage('Full sync started (FieldChange method). Monitoring progress...', 'info');
          this.startPolling();
        } else {
          this.showMessage(response.message, 'error');
        }
      },
      error: (err) => {
        this.startLoading = false;
        console.error('Failed to start sync:', err);
        this.showMessage('Failed to start sync: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  startBulkExportSync(): void {
    this.startLoading = true;
    this.message = '';

    this.resyncService.startBulkExportSync(this.forceOverwrite, this.syncMode).subscribe({
      next: (response) => {
        this.startLoading = false;
        if (response.success) {
          this.syncStatus = response.status;
          this.inProgress = true;
          this.showMessage(`Bulk export sync started (mode: ${this.syncMode}). Monitoring progress...`, 'info');
          this.startPolling();
        } else {
          this.showMessage(response.message, 'error');
        }
      },
      error: (err) => {
        this.startLoading = false;
        console.error('Failed to start bulk export sync:', err);
        this.showMessage('Failed to start sync: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.message = msg;
    this.messageType = type;
  }

  clearMessage(): void {
    this.message = '';
  }

  getProgressPercentage(): number {
    if (!this.syncStatus) return 0;

    // Use progressPercent from backend directly if available (for bulk export)
    if (this.syncStatus.progressPercent !== undefined && this.syncStatus.progressPercent > 0) {
      return this.syncStatus.progressPercent;
    }

    // Fallback for FieldChange method
    if (this.syncStatus.totalEntities === 0) return 0;
    return Math.round((this.syncStatus.entitiesSent / this.syncStatus.totalEntities) * 100);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  formatBytes(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  getPhaseClass(): string {
    if (!this.syncStatus || !this.syncStatus.phase) return '';
    const phase = this.syncStatus.phase.toLowerCase();
    if (phase.includes('complete')) return 'phase-success';
    if (phase.includes('failed') || phase.includes('error')) return 'phase-error';
    if (this.inProgress) return 'phase-progress';
    return '';
  }
}
