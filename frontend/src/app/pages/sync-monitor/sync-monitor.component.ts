import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SyncStatusService,
  SyncStatus,
  FieldChange
} from '../../services/sync-status.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-monitor.component.html',
  styleUrls: ['./sync-monitor.component.css']
})
export class SyncMonitorComponent implements OnInit, OnDestroy {
  status: SyncStatus | null = null;
  recentChanges: FieldChange[] = [];

  // Messages
  message: string = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  // Loading states
  isLoading: boolean = true;
  isStatusLoaded: boolean = false;
  statusError: string | null = null;
  isSyncing: boolean = false;

  // View state
  showChanges: boolean = false;
  selectedEntityType: string = '';
  selectedEntityId: number | null = null;

  private statusSub?: Subscription;

  constructor(private syncService: SyncStatusService) {}

  ngOnInit(): void {
    this.loadData();
    // Subscribe to status updates
    this.statusSub = this.syncService.status$.subscribe(status => {
      this.status = status;
      if (status) {
        this.isStatusLoaded = true;
        this.statusError = null;
      }
    });
    // Start polling after initial load
    this.syncService.startPolling(10000); // Poll every 10 seconds
  }

  ngOnDestroy(): void {
    this.syncService.stopPolling();
    this.statusSub?.unsubscribe();
  }

  loadData(): void {
    this.isLoading = true;
    this.statusError = null;

    // Load status first
    this.syncService.fetchStatus().subscribe({
      next: (status) => {
        if (status) {
          this.isStatusLoaded = true;
        } else {
          this.statusError = 'Failed to load sync status - check if backend is running';
        }
      },
      error: (err) => {
        this.statusError = 'Failed to connect to sync API: ' + (err.message || err);
        this.isLoading = false;
      }
    });

    this.loadRecentChanges();
  }

  loadRecentChanges(): void {
    this.syncService.getAllChanges().subscribe({
      next: (changes) => {
        this.recentChanges = changes.slice(0, 50);
        this.isLoading = false;
      },
      error: (err) => {
        this.showMessage('Failed to load changes: ' + err.message, 'error');
        this.isLoading = false;
      }
    });
  }

  triggerSync(): void {
    this.isSyncing = true;
    this.syncService.triggerSync().subscribe({
      next: (result) => {
        if (result.success) {
          this.showMessage(result.message || 'Sync completed', 'success');
          this.loadData();
        } else {
          this.showMessage(result.message, 'error');
        }
        this.isSyncing = false;
      },
      error: (err) => {
        this.showMessage('Sync failed: ' + err.message, 'error');
        this.isSyncing = false;
      }
    });
  }

  refreshStatus(): void {
    this.syncService.fetchStatus().subscribe({
      next: () => this.showMessage('Status refreshed', 'success'),
      error: (err) => this.showMessage('Refresh failed: ' + err.message, 'error')
    });
  }

  getChangeTypeClass(changeType: string): string {
    switch (changeType) {
      case 'CREATE': return 'change-create';
      case 'UPDATE': return 'change-update';
      case 'DELETE': return 'change-delete';
      default: return '';
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  formatValue(value: string | null): string {
    if (value === null || value === undefined) return '(null)';
    if (value.length > 50) return value.substring(0, 47) + '...';
    return value;
  }

  toggleChangesView(): void {
    this.showChanges = !this.showChanges;
    if (this.showChanges) {
      this.loadRecentChanges();
    }
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info'): void {
    this.message = msg;
    this.messageType = type;

    // Auto-clear success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (this.message === msg) {
          this.message = '';
        }
      }, 5000);
    }
  }

  clearMessage(): void {
    this.message = '';
  }
}
