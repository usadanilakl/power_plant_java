import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SyncUpdateService, SyncActivityEvent } from '../../../services/sync/sync-update.service';

@Component({
  selector: 'app-sync-activity',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule, MatSlideToggleModule, MatSelectModule, FormsModule],
  template: `
    <div class="activity-container">
      <div class="activity-header">
        <h3>Live Sync Activity</h3>
        <div class="controls">
          <mat-slide-toggle [(ngModel)]="paused" color="warn">Pause</mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="errorsOnly" color="accent">Errors Only</mat-slide-toggle>
          <button mat-icon-button (click)="clear()" matTooltip="Clear">
            <mat-icon>delete_sweep</mat-icon>
          </button>
        </div>
      </div>

      <div class="activity-stats">
        <span class="stat">Total: {{ events().length }}</span>
        <span class="stat">Receiving: {{ receivingCount() }}</span>
        <span class="stat">Sending: {{ sendingCount() }}</span>
        @if (failedCount() > 0) {
          <span class="stat error">Failed: {{ failedCount() }}</span>
        }
      </div>

      <div class="activity-feed" #feedContainer>
        @for (event of filteredEvents(); track $index) {
          <div class="activity-row" [class.failed]="event.status === 'FAILED'" [class.skipped]="event.status === 'SKIPPED'">
            <span class="timestamp">{{ formatTime(event.timestamp) }}</span>
            <mat-icon class="direction-icon" [class.sending]="event.direction === 'SENDING'">
              {{ event.direction === 'SENDING' ? 'arrow_upward' : 'arrow_downward' }}
            </mat-icon>
            <mat-chip class="type-chip">{{ event.entityType }}</mat-chip>
            <span class="entity-id">#{{ event.entityId }}</span>
            <span class="change-type">{{ event.changeType }}</span>
            <mat-icon class="status-icon" [class]="'status-' + event.status.toLowerCase()">
              {{ event.status === 'SUCCESS' ? 'check_circle' : event.status === 'FAILED' ? 'error' : 'remove_circle_outline' }}
            </mat-icon>
            <button mat-icon-button class="drift-link-btn" (click)="viewDrift(event)"
                    [title]="'Review ' + event.entityType + ' drift in the Drift Center'">
              <mat-icon>rule</mat-icon>
            </button>
          </div>
        } @empty {
          <div class="empty-feed">
            <mat-icon>hourglass_empty</mat-icon>
            <span>Waiting for sync activity...</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .activity-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
    .activity-header { display: flex; justify-content: space-between; align-items: center; }
    .activity-header h3 { margin: 0; }
    .controls { display: flex; gap: 16px; align-items: center; }
    .activity-stats { display: flex; gap: 16px; margin: 8px 0; font-size: 12px; opacity: 0.7; }
    .stat.error { color: #f44336; font-weight: 600; }
    .activity-feed {
      flex: 1; overflow-y: auto; border: 1px solid var(--border-color, #333);
      border-radius: 8px; padding: 4px;
    }
    .activity-row {
      display: flex; align-items: center; gap: 8px; padding: 4px 8px;
      font-size: 13px; border-bottom: 1px solid var(--border-color, #222);
    }
    .activity-row:last-child { border-bottom: none; }
    .activity-row.failed { background: rgba(244, 67, 54, 0.1); }
    .activity-row.skipped { opacity: 0.5; }
    .timestamp { font-size: 11px; opacity: 0.5; min-width: 60px; font-family: monospace; }
    .direction-icon { font-size: 16px; width: 16px; height: 16px; color: #2196f3; }
    .direction-icon.sending { color: #ff9800; }
    .type-chip { font-size: 11px; min-height: 20px; padding: 0 8px; }
    .entity-id { font-family: monospace; font-size: 12px; min-width: 80px; }
    .change-type { font-size: 11px; opacity: 0.6; min-width: 50px; }
    .status-icon { font-size: 16px; width: 16px; height: 16px; }
    .status-success { color: #4caf50; }
    .status-failed { color: #f44336; }
    .status-skipped { color: #9e9e9e; }
    .drift-link-btn { margin-left: auto; width: 28px; height: 28px; line-height: 28px; opacity: 0.55; }
    .drift-link-btn:hover { opacity: 1; }
    .drift-link-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-feed { display: flex; align-items: center; gap: 8px; padding: 24px; justify-content: center; opacity: 0.5; }
  `]
})
export class SyncActivityComponent implements OnInit, OnDestroy {
  private syncUpdateService = inject(SyncUpdateService);
  private router = inject(Router);
  private sub: Subscription | null = null;
  private maxEvents = 200;

  events = signal<SyncActivityEvent[]>([]);
  paused = false;
  errorsOnly = false;

  filteredEvents = computed(() => {
    let items = this.events();
    if (this.errorsOnly) {
      items = items.filter(e => e.status === 'FAILED');
    }
    return items;
  });

  receivingCount = computed(() => this.events().filter(e => e.direction === 'RECEIVING').length);
  sendingCount = computed(() => this.events().filter(e => e.direction === 'SENDING').length);
  failedCount = computed(() => this.events().filter(e => e.status === 'FAILED').length);

  ngOnInit() {
    this.sub = this.syncUpdateService.syncActivity$.subscribe(event => {
      if (this.paused) return;
      this.events.update(items => {
        const updated = [event, ...items];
        return updated.length > this.maxEvents ? updated.slice(0, this.maxEvents) : updated;
      });
    });
  }

  formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  clear() {
    this.events.set([]);
  }

  /** Jump from an event to that entity type's drift in the Drift Center. */
  viewDrift(event: SyncActivityEvent) {
    this.router.navigate(['/sync/drift'], { queryParams: { type: event.entityType } });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
