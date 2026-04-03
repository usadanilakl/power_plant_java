import { Component, Input, inject, signal, computed, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EntitySyncCheckService, EntitySyncStatus, PushPullPreview } from '../../services/sync/entity-sync-check.service';
import { FieldChange } from '../../services/sync-status.service';

@Component({
  selector: 'app-entity-sync-check',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatExpansionModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <!-- Badge mode -->
    @if (mode === 'badge') {
      <div class="sync-badge" (click)="panelOpen.set(!panelOpen())" [matTooltip]="statusLabel()">
        @if (loading()) {
          <mat-spinner diameter="16"></mat-spinner>
        } @else {
          <mat-icon [class]="'badge-' + statusClass()">{{ statusIcon() }}</mat-icon>
        }
      </div>
      @if (panelOpen()) {
        <ng-container *ngTemplateOutlet="panelTemplate"></ng-container>
      }
    }

    <!-- Panel mode (always visible) -->
    @if (mode === 'panel') {
      <ng-container *ngTemplateOutlet="panelTemplate"></ng-container>
    }

    <!-- Shared panel template -->
    <ng-template #panelTemplate>
      <div class="sync-panel">
        <div class="sync-status-row">
          @if (loading()) {
            <mat-spinner diameter="20"></mat-spinner>
            <span>Checking...</span>
          } @else {
            <mat-icon [class]="'status-' + statusClass()">{{ statusIcon() }}</mat-icon>
            <span class="status-label">{{ statusLabel() }}</span>
          }
        </div>

        @if (status() && !loading()) {
          <div class="timestamps">
            <span>Local: {{ formatTime(status()!.localModified) }}</span>
            <span>Server: {{ formatTime(status()!.serverModified) }}</span>
          </div>

          <div class="sync-actions">
            <button mat-button (click)="pull()" [disabled]="resolving()">
              <mat-icon>cloud_download</mat-icon> Pull
            </button>
            <button mat-button (click)="push()" [disabled]="resolving()">
              <mat-icon>cloud_upload</mat-icon> Push
            </button>
            <button mat-button (click)="refresh()">
              <mat-icon>refresh</mat-icon> Recheck
            </button>
          </div>

          <!-- History -->
          <mat-expansion-panel class="sub-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>Change History</mat-panel-title>
            </mat-expansion-panel-header>
            @if (!history()) {
              <button mat-button (click)="loadHistory()">Load History</button>
            } @else if (history()!.length === 0) {
              <span class="muted">No changes recorded</span>
            } @else {
              <div class="history-list">
                @for (change of history()!.slice(0, 20); track $index) {
                  <div class="history-item">
                    <span class="field-name">{{ change.fieldName }}</span>
                    <span class="change-type">{{ change.changeType }}</span>
                    <span class="origin">{{ change.originMachineName }}</span>
                    <span class="time">{{ formatTime(change.timestamp) }}</span>
                  </div>
                }
              </div>
            }
          </mat-expansion-panel>

          <!-- Field Diff -->
          <mat-expansion-panel class="sub-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>Field Diff</mat-panel-title>
            </mat-expansion-panel-header>
            @if (!diff()) {
              <button mat-button (click)="loadDiff()">Load Diff</button>
            } @else if (diff()!.diffs.length === 0) {
              <span class="muted">All fields match</span>
            } @else {
              <table mat-table [dataSource]="diff()!.diffs" class="diff-table">
                <ng-container matColumnDef="fieldName">
                  <th mat-header-cell *matHeaderCellDef>Field</th>
                  <td mat-cell *matCellDef="let row">{{ row.fieldName }}</td>
                </ng-container>
                <ng-container matColumnDef="localValue">
                  <th mat-header-cell *matHeaderCellDef>Local</th>
                  <td mat-cell *matCellDef="let row" class="mono">{{ truncate(row.localValue) }}</td>
                </ng-container>
                <ng-container matColumnDef="serverValue">
                  <th mat-header-cell *matHeaderCellDef>Server</th>
                  <td mat-cell *matCellDef="let row" class="mono">{{ truncate(row.serverValue) }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['fieldName','localValue','serverValue']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['fieldName','localValue','serverValue']"></tr>
              </table>
            }
          </mat-expansion-panel>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .sync-badge { cursor: pointer; display: inline-flex; align-items: center; padding: 2px; }
    .badge-in-sync { color: #4caf50; font-size: 18px; width: 18px; height: 18px; }
    .badge-warning { color: #ff9800; font-size: 18px; width: 18px; height: 18px; }
    .badge-error { color: #f44336; font-size: 18px; width: 18px; height: 18px; }
    .badge-unknown { color: #9e9e9e; font-size: 18px; width: 18px; height: 18px; }

    .sync-panel {
      padding: 12px;
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      background: var(--card-background, #1e1e1e);
      min-width: 320px;
    }
    .sync-status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .status-label { font-weight: 600; }
    .status-in-sync { color: #4caf50; }
    .status-warning { color: #ff9800; }
    .status-error { color: #f44336; }
    .status-unknown { color: #9e9e9e; }
    .timestamps { display: flex; gap: 16px; font-size: 11px; opacity: 0.6; margin-bottom: 8px; }
    .sync-actions { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
    .sync-actions button { font-size: 12px; }
    .sync-actions mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 2px; }
    .sub-panel { margin: 4px 0; }
    .history-list { max-height: 200px; overflow-y: auto; }
    .history-item {
      display: flex; gap: 8px; padding: 2px 0; font-size: 12px;
      border-bottom: 1px solid var(--border-color, #333);
    }
    .field-name { font-weight: 500; min-width: 100px; }
    .change-type { opacity: 0.6; min-width: 50px; }
    .origin { opacity: 0.5; min-width: 80px; }
    .time { opacity: 0.4; font-family: monospace; }
    .muted { opacity: 0.5; font-size: 12px; }
    .diff-table { width: 100%; }
    .mono { font-family: monospace; font-size: 11px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class EntitySyncCheckComponent implements OnInit, OnChanges {
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: number;
  @Input() mode: 'badge' | 'panel' = 'badge';

  private syncCheckService = inject(EntitySyncCheckService);
  private snackBar = inject(MatSnackBar);

  status = signal<EntitySyncStatus | null>(null);
  loading = signal(false);
  resolving = signal(false);
  panelOpen = signal(false);
  history = signal<FieldChange[] | null>(null);
  diff = signal<any | null>(null);

  statusClass = computed(() => {
    const s = this.status()?.status;
    if (!s) return 'unknown';
    switch (s) {
      case 'IN_SYNC': return 'in-sync';
      case 'STALE_LOCAL':
      case 'STALE_SERVER': return 'warning';
      case 'LOCAL_ONLY':
      case 'SERVER_ONLY': return 'error';
      default: return 'unknown';
    }
  });

  statusIcon = computed(() => {
    const s = this.status()?.status;
    switch (s) {
      case 'IN_SYNC': return 'cloud_done';
      case 'STALE_LOCAL': return 'cloud_download';
      case 'STALE_SERVER': return 'cloud_upload';
      case 'LOCAL_ONLY': return 'cloud_off';
      case 'SERVER_ONLY': return 'cloud_queue';
      default: return 'help_outline';
    }
  });

  statusLabel = computed(() => {
    const s = this.status()?.status;
    switch (s) {
      case 'IN_SYNC': return 'In Sync';
      case 'STALE_LOCAL': return 'Local is older';
      case 'STALE_SERVER': return 'Server is older';
      case 'LOCAL_ONLY': return 'Local only (not on server)';
      case 'SERVER_ONLY': return 'Server only (not local)';
      case 'NOT_FOUND': return 'Not found';
      default: return 'Unknown';
    }
  });

  ngOnInit() { this.check(); }

  ngOnChanges() {
    this.status.set(null);
    this.history.set(null);
    this.diff.set(null);
    this.check();
  }

  check() {
    if (!this.entityType || !this.entityId) return;
    this.loading.set(true);
    this.syncCheckService.checkEntity(this.entityType, this.entityId).subscribe({
      next: s => { this.status.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  refresh() {
    this.history.set(null);
    this.diff.set(null);
    this.check();
  }

  pull() {
    this.resolving.set(true);
    // Preview first to check for dependencies
    this.syncCheckService.previewPull(this.entityType, this.entityId).subscribe({
      next: preview => {
        if (preview && preview.totalCount > 1) {
          const summary = this.formatPreviewSummary(preview);
          if (!confirm(`Pull will include ${preview.totalCount} entities:\n${summary}\n\nProceed?`)) {
            this.resolving.set(false);
            return;
          }
        }
        this.syncCheckService.executePull(this.entityType, this.entityId).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Pulled from hub', 'OK', { duration: 3000 });
            this.resolving.set(false);
            this.refresh();
          },
          error: () => this.resolving.set(false)
        });
      },
      error: () => {
        // Fallback to simple pull if preview fails
        this.syncCheckService.pullFromHub(this.entityType, this.entityId).subscribe({
          next: () => { this.snackBar.open('Pulled from hub', 'OK', { duration: 3000 }); this.resolving.set(false); this.refresh(); },
          error: () => this.resolving.set(false)
        });
      }
    });
  }

  push() {
    this.resolving.set(true);
    // Preview first to check for dependencies
    this.syncCheckService.previewPush(this.entityType, this.entityId).subscribe({
      next: preview => {
        if (preview && preview.totalCount > 1) {
          const summary = this.formatPreviewSummary(preview);
          if (!confirm(`Push will include ${preview.totalCount} entities:\n${summary}\n\nProceed?`)) {
            this.resolving.set(false);
            return;
          }
        }
        this.syncCheckService.executePush(this.entityType, this.entityId).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Pushed to hub', 'OK', { duration: 3000 });
            this.resolving.set(false);
            this.refresh();
          },
          error: () => this.resolving.set(false)
        });
      },
      error: () => {
        // Fallback to simple push if preview fails
        this.syncCheckService.pushToHub(this.entityType, this.entityId).subscribe({
          next: () => { this.snackBar.open('Pushed to hub', 'OK', { duration: 3000 }); this.resolving.set(false); this.refresh(); },
          error: () => this.resolving.set(false)
        });
      }
    });
  }

  private formatPreviewSummary(preview: PushPullPreview): string {
    return Object.entries(preview.countByType)
      .map(([type, count]) => `  ${type}: ${count}`)
      .join('\n');
  }

  loadHistory() {
    this.syncCheckService.getChangeHistory(this.entityType, this.entityId).subscribe({
      next: h => this.history.set(h),
      error: () => this.history.set([])
    });
  }

  loadDiff() {
    this.syncCheckService.getFieldDiff(this.entityType, this.entityId).subscribe({
      next: d => this.diff.set(d),
      error: () => this.diff.set({ diffs: [] })
    });
  }

  formatTime(ts: string | null | undefined): string {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' });
    } catch { return ts; }
  }

  truncate(value: string | null): string {
    if (!value) return '(null)';
    return value.length > 60 ? value.substring(0, 60) + '...' : value;
  }
}
