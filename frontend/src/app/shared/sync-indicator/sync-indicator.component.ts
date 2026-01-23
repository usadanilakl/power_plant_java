import { Component, inject, OnDestroy, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';
import { SyncUpdateService } from '../../services/sync/sync-update.service';
import { SyncStatusService, SyncHealthStatusType } from '../../services/sync-status.service';

/**
 * Sync status indicator component for the header.
 * Shows SSE connection status, sync health status, and provides quick access to sync status page.
 */
@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule, MatBadgeModule],
  template: `
    <div class="sync-indicator"
         [routerLink]="['/sync-resync']"
         [class.connected]="connectionState() === 'connected' && syncHealthState() === 'IN_SYNC'"
         [class.connecting]="connectionState() === 'connecting'"
         [class.disconnected]="connectionState() === 'disconnected'"
         [class.out-of-sync]="syncHealthState() === 'OUT_OF_SYNC'"
         [class.possibly-out-of-sync]="syncHealthState() === 'POSSIBLY_OUT_OF_SYNC'"
         [matTooltip]="tooltipText()">
      <mat-icon [class.pulse]="connectionState() === 'connecting' || syncHealthState() === 'OUT_OF_SYNC'">
        {{ iconName() }}
      </mat-icon>
      @if (recentUpdateCount() > 0) {
        <span class="update-badge">{{ recentUpdateCount() }}</span>
      }
      @if (syncHealthState() === 'OUT_OF_SYNC' || syncHealthState() === 'POSSIBLY_OUT_OF_SYNC') {
        <span class="warning-indicator" [class.error]="syncHealthState() === 'OUT_OF_SYNC'">!</span>
      }
    </div>
  `,
  styles: [`
    .sync-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .sync-indicator:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .sync-indicator.connected mat-icon {
      color: #4caf50; /* Green */
    }

    .sync-indicator.connecting mat-icon {
      color: #ff9800; /* Orange */
    }

    .sync-indicator.disconnected mat-icon {
      color: #f44336; /* Red */
    }

    .sync-indicator.out-of-sync mat-icon {
      color: #f44336; /* Red */
    }

    .sync-indicator.possibly-out-of-sync mat-icon {
      color: #ff9800; /* Orange */
    }

    .pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .update-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: #2196f3;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 14px;
      text-align: center;
    }

    .warning-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background-color: #ff9800;
      color: white;
      font-size: 9px;
      font-weight: bold;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .warning-indicator.error {
      background-color: #f44336;
      animation: pulse 1s ease-in-out infinite;
    }
  `]
})
export class SyncIndicatorComponent implements OnInit, OnDestroy {
  private syncUpdateService = inject(SyncUpdateService);
  private syncStatusService = inject(SyncStatusService);
  private platformId = inject(PLATFORM_ID);
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean;

  // Signals for reactive state
  connectionState = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  syncHealthState = signal<SyncHealthStatusType>('UNKNOWN');
  syncHealthMessage = signal<string>('');
  suggestResync = signal<boolean>(false);
  suggestedSyncDate = signal<string | null>(null);
  recentUpdateCount = signal<number>(0);
  private updateTimer: any = null;

  // Computed values
  iconName = computed(() => {
    const health = this.syncHealthState();
    const connection = this.connectionState();

    // Prioritize sync health status for icon
    if (health === 'OUT_OF_SYNC') {
      return 'sync_problem';
    }
    if (health === 'POSSIBLY_OUT_OF_SYNC') {
      return 'sync';
    }

    // Fall back to connection state
    switch (connection) {
      case 'connected': return 'cloud_done';
      case 'connecting': return 'cloud_sync';
      case 'disconnected': return 'cloud_off';
    }
  });

  tooltipText = computed(() => {
    const updates = this.recentUpdateCount();
    const state = this.connectionState();
    const health = this.syncHealthState();
    const healthMessage = this.syncHealthMessage();
    const shouldSuggestResync = this.suggestResync();
    const syncDate = this.suggestedSyncDate();

    let statusText = '';

    // Sync health status takes priority
    switch (health) {
      case 'IN_SYNC':
        statusText = 'Data is in sync';
        break;
      case 'POSSIBLY_OUT_OF_SYNC':
        statusText = 'Possibly out of sync';
        if (healthMessage) {
          statusText += `\n${healthMessage}`;
        }
        break;
      case 'OUT_OF_SYNC':
        statusText = 'OUT OF SYNC!';
        if (healthMessage) {
          statusText += `\n${healthMessage}`;
        }
        break;
      case 'UNKNOWN':
        // Fall back to connection state
        switch (state) {
          case 'connected':
            statusText = 'Connected to server';
            break;
          case 'connecting':
            statusText = 'Connecting...';
            break;
          case 'disconnected':
            statusText = 'Server disconnected';
            break;
        }
        break;
    }

    // Add sync suggestion if available
    if (shouldSuggestResync) {
      if (syncDate) {
        statusText += `\n⚠️ Sync recommended from ${syncDate}`;
      } else {
        statusText += `\n⚠️ Full resync recommended`;
      }
    }

    if (updates > 0) {
      statusText += `\n${updates} recent update${updates > 1 ? 's' : ''}`;
    }

    return statusText + '\nClick for details';
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Start polling for sync health check (every 60 seconds)
    this.syncStatusService.startHealthCheckPolling(60000);

    // Subscribe to connection state
    this.subscriptions.push(
      this.syncUpdateService.connectionState$.subscribe(state => {
        this.connectionState.set(state);
      })
    );

    // Subscribe to sync health check updates
    this.subscriptions.push(
      this.syncStatusService.syncHealth$.subscribe(health => {
        if (health) {
          this.syncHealthState.set(health.syncStatus);
          this.syncHealthMessage.set(health.message || '');
          this.suggestResync.set(health.suggestResync || false);
          this.suggestedSyncDate.set(health.suggestedSyncDate || null);
        }
      })
    );

    // Subscribe to entity updates to show recent activity badge
    this.subscriptions.push(
      this.syncUpdateService.entityUpdated$.subscribe(() => {
        this.incrementUpdateCount();
      })
    );

    // Subscribe to sync complete events
    this.subscriptions.push(
      this.syncUpdateService.syncComplete$.subscribe(event => {
        if (event.changesApplied > 0) {
          this.recentUpdateCount.update(count => count + event.changesApplied);
          this.scheduleCountReset();
        }
      })
    );
  }

  private incrementUpdateCount(): void {
    this.recentUpdateCount.update(count => Math.min(count + 1, 99));
    this.scheduleCountReset();
  }

  private scheduleCountReset(): void {
    // Clear existing timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // Reset count after 30 seconds of no activity
    this.updateTimer = setTimeout(() => {
      this.recentUpdateCount.set(0);
    }, 30000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.isBrowser) {
      this.syncStatusService.stopHealthCheckPolling();
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
      }
    }
  }
}
