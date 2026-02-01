import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import {
  FullResyncService,
  FullSyncToServerStatus,
  FullSyncToServerStatusResponse
} from '../../services/full-resync.service';
@Component({
  selector: 'app-full-sync-to-server',
  standalone: true,
  imports: [CommonModule],
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

  constructor(
    private resyncService: FullResyncService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadStatus();
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
    this.startFullSync();
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
          this.showMessage('Full sync started. Monitoring progress...', 'info');
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

  private showMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.message = msg;
    this.messageType = type;
  }

  clearMessage(): void {
    this.message = '';
  }

  getProgressPercentage(): number {
    if (!this.syncStatus || this.syncStatus.totalEntities === 0) {
      return 0;
    }
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

  getPhaseClass(): string {
    if (!this.syncStatus) return '';
    const phase = this.syncStatus.phase.toLowerCase();
    if (phase.includes('complete')) return 'phase-success';
    if (phase.includes('failed') || phase.includes('error')) return 'phase-error';
    if (this.inProgress) return 'phase-progress';
    return '';
  }
}
