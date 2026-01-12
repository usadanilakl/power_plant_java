import { Component, inject } from '@angular/core';
import { NetworkModeService, NetworkMode } from '../../services/network-mode.service';
import { DataSyncService } from '../../services/data-sync.service';

@Component({
  selector: 'app-network-status',
  standalone: true,
  template: `
    <div class="network-status" [class]="getStatusClass()">
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-label">{{ getStatusLabel() }}</span>
      </div>

      <div class="status-details">
        @if (isOffline()) {
          <span class="read-only-badge">Read-Only</span>
        }

        <span class="last-sync">
          Last sync: {{ getLastSyncTime() }}
        </span>

        <button class="refresh-btn" (click)="refresh()" [disabled]="isRefreshing">
          {{ isRefreshing ? 'Checking...' : 'Refresh' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .network-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      gap: 16px;
    }

    .network-status.offline {
      background: rgba(255, 68, 68, 0.2);
      border: 1px solid #f44;
    }

    .network-status.esp-only {
      background: rgba(0, 170, 255, 0.2);
      border: 1px solid #0af;
    }

    .network-status.server {
      background: rgba(68, 255, 68, 0.2);
      border: 1px solid #4f4;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .offline .status-dot {
      background: #f44;
    }

    .esp-only .status-dot {
      background: #0af;
    }

    .server .status-dot {
      background: #4f4;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-label {
      font-weight: 500;
    }

    .status-details {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .read-only-badge {
      background: #f44;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .last-sync {
      color: #888;
      font-size: 12px;
    }

    .refresh-btn {
      background: transparent;
      border: 1px solid #555;
      color: #aaa;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      border-color: #0af;
      color: #0af;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class NetworkStatusComponent {
  private networkModeService = inject(NetworkModeService);
  private dataSyncService = inject(DataSyncService);

  isRefreshing = false;

  getStatusClass(): string {
    const mode = this.networkModeService.networkMode();
    switch (mode) {
      case NetworkMode.OFFLINE:
        return 'offline';
      case NetworkMode.ESP_ONLY:
        return 'esp-only';
      case NetworkMode.SERVER:
        return 'server';
      default:
        return 'offline';
    }
  }

  getStatusLabel(): string {
    return this.networkModeService.getNetworkModeLabel();
  }

  isOffline(): boolean {
    return this.networkModeService.networkMode() === NetworkMode.OFFLINE;
  }

  getLastSyncTime(): string {
    return this.dataSyncService.getTimeSinceSync();
  }

  async refresh(): Promise<void> {
    this.isRefreshing = true;
    try {
      await this.networkModeService.refresh();
    } finally {
      this.isRefreshing = false;
    }
  }
}
