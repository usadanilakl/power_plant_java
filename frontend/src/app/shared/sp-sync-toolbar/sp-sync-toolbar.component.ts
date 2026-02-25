import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, tap, catchError } from 'rxjs';
import { of } from 'rxjs';
import {
  SharePointSyncStatusService,
  SharePointSyncStatus,
} from '../../services/sharepoint-sync-status.service';
import { GlobalMessageService } from '../global-message/global-message.service';

@Component({
  selector: 'app-sp-sync-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status()?.dataStale) {
      <div class="stale-banner">
        Hub offline — data might be outdated
      </div>
    }
    <div class="sp-sync-bar">
      <span class="hub-chip" [class.online]="status()?.hubOnline" [class.offline]="status() && !status()?.hubOnline">
        {{ status()?.hubOnline ? 'Hub Online' : 'Hub Offline' }}
      </span>
      <button class="action-btn sync-btn" (click)="onSync()" [disabled]="isSyncing()">
        {{ isSyncing() ? 'Syncing...' : 'Sync SharePoint' }}
      </button>
      <span class="sync-time">{{ syncTimeDisplay() }}</span>
      @if (lastSyncSummary()) {
        <span class="sync-summary">{{ lastSyncSummary() }}</span>
      }
    </div>
  `,
  styles: [`
    .stale-banner {
      background: rgba(255, 152, 0, 0.15);
      border-left: 3px solid #ff9800;
      color: #ffb74d;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .sp-sync-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 8px;
      font-size: 12px;
      border-bottom: 1px solid var(--border-color, #444);
      flex-shrink: 0;
    }

    .hub-chip {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .hub-chip.online {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }

    .hub-chip.offline {
      background: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }

    .action-btn {
      padding: 4px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .sync-btn {
      background-color: var(--surface-secondary, #333);
      color: var(--text-primary, #e0e0e0);
      border: 1px solid var(--border-color, #444);
    }

    .sync-btn:hover:not(:disabled) {
      background-color: var(--surface-hover, #444);
    }

    .sync-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sync-time {
      color: var(--text-secondary, #aaa);
      font-style: italic;
    }

    .sync-summary {
      color: var(--text-secondary, #aaa);
      margin-left: auto;
    }
  `]
})
export class SpSyncToolbarComponent implements OnInit {
  @Input({ required: true }) entityType!: string;
  @Output() syncComplete = new EventEmitter<void>();

  private syncStatusService = inject(SharePointSyncStatusService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  status = signal<SharePointSyncStatus | null>(null);
  isSyncing = signal(false);
  lastSyncSummary = signal<string>('');
  syncTimeDisplay = signal<string>('Never synced');

  ngOnInit(): void {
    this.fetchStatus();

    // Poll status from backend every 30s
    interval(30000).pipe(
      switchMap(() => this.syncStatusService.getStatus(this.entityType)),
      tap(status => {
        if (status) {
          this.status.set(status);
          this.updateTimeDisplay();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Update time-ago display every 10s (client-side)
    interval(10000).pipe(
      tap(() => this.updateTimeDisplay()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onSync(): void {
    this.isSyncing.set(true);
    this.syncStatusService.triggerSync(this.entityType).pipe(
      tap(resp => {
        const r = resp.responseData;
        const total = (r?.created ?? 0) + (r?.updated ?? 0) + (r?.autoClosed ?? 0);
        this.messageService.showSuccess(
          `${this.entityType} sync: ${total} changes (${r?.created ?? 0} new, ${r?.updated ?? 0} updated)`
        );
        this.lastSyncSummary.set(
          `${r?.created ?? 0} new, ${r?.updated ?? 0} upd, ${r?.skipped ?? 0} skip`
        );
        this.isSyncing.set(false);
        this.fetchStatus();
        this.syncComplete.emit();
      }),
      catchError(err => {
        this.messageService.showError('Sync failed: ' + (err.error?.message || err.message));
        this.isSyncing.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private fetchStatus(): void {
    this.syncStatusService.getStatus(this.entityType).pipe(
      tap(status => {
        if (status) {
          this.status.set(status);
          this.updateTimeDisplay();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private updateTimeDisplay(): void {
    const s = this.status();
    if (!s || s.lastSyncTimeMs === 0) {
      this.syncTimeDisplay.set('Never synced');
      return;
    }
    const seconds = Math.floor((Date.now() - s.lastSyncTimeMs) / 1000);
    if (seconds < 60) {
      this.syncTimeDisplay.set(`${seconds}s ago`);
    } else if (seconds < 3600) {
      this.syncTimeDisplay.set(`${Math.floor(seconds / 60)}m ago`);
    } else {
      this.syncTimeDisplay.set(`${Math.floor(seconds / 3600)}h ago`);
    }
  }
}
