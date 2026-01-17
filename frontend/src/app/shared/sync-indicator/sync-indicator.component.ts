import { Component, inject, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';
import { SyncUpdateService } from '../../services/sync/sync-update.service';
import { SyncStatusService } from '../../services/sync-status.service';

/**
 * Sync status indicator component for the header.
 * Shows SSE connection status and provides quick access to sync status page.
 */
@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule, MatBadgeModule],
  template: `
    <div class="sync-indicator"
         [routerLink]="['/sync']"
         [class.connected]="connectionState() === 'connected'"
         [class.connecting]="connectionState() === 'connecting'"
         [class.disconnected]="connectionState() === 'disconnected'"
         [matTooltip]="tooltipText()">
      <mat-icon [class.pulse]="connectionState() === 'connecting'">
        {{ iconName() }}
      </mat-icon>
      @if (recentUpdateCount() > 0) {
        <span class="update-badge">{{ recentUpdateCount() }}</span>
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
  `]
})
export class SyncIndicatorComponent implements OnDestroy {
  private syncUpdateService = inject(SyncUpdateService);
  private syncStatusService = inject(SyncStatusService);
  private subscriptions: Subscription[] = [];

  // Signals for reactive state
  connectionState = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  recentUpdateCount = signal<number>(0);
  private updateTimer: any = null;

  // Computed values
  iconName = computed(() => {
    switch (this.connectionState()) {
      case 'connected': return 'cloud_done';
      case 'connecting': return 'cloud_sync';
      case 'disconnected': return 'cloud_off';
    }
  });

  tooltipText = computed(() => {
    const updates = this.recentUpdateCount();
    const state = this.connectionState();

    let statusText = '';
    switch (state) {
      case 'connected':
        statusText = 'Sync connected';
        break;
      case 'connecting':
        statusText = 'Connecting to sync...';
        break;
      case 'disconnected':
        statusText = 'Sync disconnected';
        break;
    }

    if (updates > 0) {
      statusText += ` (${updates} recent update${updates > 1 ? 's' : ''})`;
    }

    return statusText + '\nClick for details';
  });

  constructor() {
    // Subscribe to connection state
    this.subscriptions.push(
      this.syncUpdateService.connectionState$.subscribe(state => {
        this.connectionState.set(state);
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
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
  }
}
