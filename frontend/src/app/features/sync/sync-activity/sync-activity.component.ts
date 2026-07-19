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
    :host {
      --bg:#0c0e13; --panel:#151922; --panel2:#1b202b; --panel3:#212734;
      --line:#2a303c; --line2:#353c4a; --tx:#e7ebf2; --dim:#98a2b3; --dim2:#6b7480;
      --accent:#3b82f6; --green:#22c55e; --red:#ef4444; --amber:#f59e0b; --sky:#38bdf8;
      --mono:ui-monospace,Menlo,Consolas,monospace;
      display:block; height:100%; color:var(--tx);
    }
    .activity-container { padding:16px; height:100%; display:flex; flex-direction:column; background:var(--bg); box-sizing:border-box; }
    .activity-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .activity-header h3 { margin:0; font-weight:650; font-size:16px; }
    .controls { display:flex; gap:16px; align-items:center; }
    .activity-stats { display:flex; gap:8px; margin:8px 0; font-size:12px; }
    .stat { background:var(--panel3); border:1px solid var(--line); border-radius:999px; padding:5px 11px; color:var(--dim); }
    .stat.error { color:var(--red); border-color:rgba(239,68,68,.4); font-weight:600; }
    .activity-feed {
      flex:1; overflow-y:auto; border:1px solid var(--line); border-radius:10px; background:var(--panel); padding:4px;
    }
    .activity-row {
      display:flex; align-items:center; gap:10px; padding:6px 10px;
      font-size:13px; border-bottom:1px solid var(--line); border-radius:6px;
    }
    .activity-row:last-child { border-bottom:none; }
    .activity-row:hover { background:var(--panel2); }
    .activity-row.failed { background:rgba(239,68,68,.12); }
    .activity-row.skipped { opacity:0.5; }
    .timestamp { font-size:11px; color:var(--dim2); min-width:64px; font-family:var(--mono); }
    .direction-icon { font-size:16px; width:16px; height:16px; color:var(--sky); }
    .direction-icon.sending { color:var(--amber); }
    .type-chip { font-size:11px; min-height:20px; padding:0 8px; background:var(--panel3) !important; color:var(--tx) !important; border:1px solid var(--line2); }
    .entity-id { font-family:var(--mono); font-size:12px; min-width:84px; color:var(--dim); }
    .change-type { font-size:11px; color:var(--dim2); min-width:52px; text-transform:uppercase; letter-spacing:.03em; }
    .status-icon { font-size:16px; width:16px; height:16px; }
    .status-success { color:var(--green); }
    .status-failed { color:var(--red); }
    .status-skipped { color:var(--dim2); }
    .drift-link-btn { margin-left:auto; width:28px; height:28px; line-height:28px; color:var(--dim); }
    .drift-link-btn:hover { color:var(--accent); }
    .drift-link-btn mat-icon { font-size:16px; width:16px; height:16px; }
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
