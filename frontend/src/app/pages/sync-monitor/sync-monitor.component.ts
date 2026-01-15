import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import {
  SyncStatusService,
  SyncStatus,
  Peer,
  FieldChange
} from '../../services/sync-status.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterMenuComponent],
  templateUrl: './sync-monitor.component.html',
  styleUrls: ['./sync-monitor.component.css']
})
export class SyncMonitorComponent implements OnInit, OnDestroy {
  status: SyncStatus | null = null;
  allPeers: Peer[] = [];
  recentChanges: FieldChange[] = [];

  // Register peer form
  newPeerIp: string = '';
  newPeerPort: number = 8082;
  newPeerName: string = '';

  // Messages
  message: string = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  // Loading states
  isLoading: boolean = false;
  isSyncing: boolean = false;
  isRegistering: boolean = false;

  // View state
  showChanges: boolean = false;
  selectedEntityType: string = '';
  selectedEntityId: number | null = null;

  private statusSub?: Subscription;

  constructor(private syncService: SyncStatusService) {}

  ngOnInit(): void {
    this.loadData();
    this.syncService.startPolling(5000); // Poll every 5 seconds
    this.statusSub = this.syncService.status$.subscribe(status => {
      this.status = status;
    });
  }

  ngOnDestroy(): void {
    this.syncService.stopPolling();
    this.statusSub?.unsubscribe();
  }

  loadData(): void {
    this.isLoading = true;
    this.loadAllPeers();
    this.loadRecentChanges();
    this.isLoading = false;
  }

  loadAllPeers(): void {
    this.syncService.getAllPeers().subscribe({
      next: (peers) => this.allPeers = peers,
      error: (err) => this.showMessage('Failed to load peers: ' + err.message, 'error')
    });
  }

  loadRecentChanges(): void {
    this.syncService.getAllChanges().subscribe({
      next: (changes) => this.recentChanges = changes.slice(0, 50), // Last 50 changes
      error: (err) => this.showMessage('Failed to load changes: ' + err.message, 'error')
    });
  }

  triggerSync(): void {
    this.isSyncing = true;
    this.syncService.triggerSync().subscribe({
      next: (result) => {
        if (result.success) {
          this.showMessage(`Sync completed. Active peers: ${result.activePeers}`, 'success');
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

  broadcastPresence(): void {
    this.syncService.broadcastPresence().subscribe({
      next: (result) => {
        this.showMessage(result.message, result.success ? 'success' : 'error');
      },
      error: (err) => this.showMessage('Broadcast failed: ' + err.message, 'error')
    });
  }

  registerPeer(): void {
    if (!this.newPeerIp) {
      this.showMessage('Please enter an IP address', 'error');
      return;
    }

    this.isRegistering = true;
    this.syncService.registerPeer(this.newPeerIp, this.newPeerPort, this.newPeerName || undefined).subscribe({
      next: (result) => {
        if (result.success) {
          this.showMessage(`Peer registered: ${result.peer?.machineName} (${result.peer?.machineId})`, 'success');
          this.newPeerIp = '';
          this.newPeerName = '';
          this.loadAllPeers();
        } else {
          this.showMessage(result.message, 'error');
        }
        this.isRegistering = false;
      },
      error: (err) => {
        this.showMessage('Registration failed: ' + err.message, 'error');
        this.isRegistering = false;
      }
    });
  }

  refreshStatus(): void {
    this.syncService.fetchStatus().subscribe({
      next: () => this.showMessage('Status refreshed', 'success'),
      error: (err) => this.showMessage('Refresh failed: ' + err.message, 'error')
    });
  }

  getPeerStatusClass(status: string): string {
    switch (status) {
      case 'ONLINE': return 'status-online';
      case 'SYNCING': return 'status-syncing';
      case 'OFFLINE': return 'status-offline';
      case 'ERROR': return 'status-error';
      default: return '';
    }
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
