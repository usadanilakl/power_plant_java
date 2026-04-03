import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SyncStatusService, EntityFieldDiff, FieldDiffEntry } from '../../../services/sync-status.service';
import {
  EntitySyncCheckService, ThreeWayFieldDiff, ThreeWayFieldEntry, PushPullPreview
} from '../../../services/sync/entity-sync-check.service';

@Component({
  selector: 'app-sync-entity-diff',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="diff-container">
      <div class="diff-header">
        <h4>Field Diff: {{ entityType }} #{{ entityId }}</h4>
        <div class="diff-actions">
          <button mat-raised-button color="accent" (click)="acceptRemote()" [disabled]="resolving()">
            <mat-icon>cloud_download</mat-icon> Accept Hub
          </button>
          <button mat-raised-button color="primary" (click)="acceptLocal()" [disabled]="resolving()">
            <mat-icon>cloud_upload</mat-icon> Accept Local
          </button>
          @if (useThreeWay && threeWayDiff()?.spBacked) {
            <button mat-raised-button (click)="acceptSp()" [disabled]="resolving()"
                    style="background: rgba(0,150,136,0.2); color: #4db6ac;">
              <mat-icon>table_view</mat-icon> Accept SP
            </button>
          }
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-spinner diameter="24"></mat-spinner>
      } @else if (useThreeWay && threeWayDiff()) {
        <!-- 3-way diff view -->
        @if (threeWayDiff()!.mismatchCount === 0) {
          <div class="no-diff">
            <mat-icon>check_circle</mat-icon>
            <span>All fields match across all sources</span>
          </div>
        } @else {
          <div class="mismatch-count">{{ threeWayDiff()!.mismatchCount }} field(s) differ</div>
          <table mat-table [dataSource]="threeWayMismatches()" class="diff-table">
            <ng-container matColumnDef="fieldName">
              <th mat-header-cell *matHeaderCellDef>Field</th>
              <td mat-cell *matCellDef="let row">{{ row.fieldName }}</td>
            </ng-container>
            <ng-container matColumnDef="localValue">
              <th mat-header-cell *matHeaderCellDef>Local</th>
              <td mat-cell *matCellDef="let row" class="value-cell"
                  [class.match]="row.localHubMatch && row.localSpMatch"
                  [class.diff]="!row.localHubMatch || !row.localSpMatch">
                {{ truncate(row.localValue) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="hubValue">
              <th mat-header-cell *matHeaderCellDef>Hub</th>
              <td mat-cell *matCellDef="let row" class="value-cell"
                  [class.diff]="!row.localHubMatch">
                {{ truncate(row.hubValue) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="spValue">
              <th mat-header-cell *matHeaderCellDef>SharePoint</th>
              <td mat-cell *matCellDef="let row" class="value-cell"
                  [class.diff]="row.spMapped && !row.localSpMatch"
                  [class.unmapped]="!row.spMapped">
                {{ row.spMapped ? truncate(row.spValue) : '-' }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="threeWayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: threeWayColumns;" class="diff-row"></tr>
          </table>
        }
      } @else if (diff()) {
        <!-- 2-way diff view (fallback) -->
        @if (diff()!.diffs.length === 0) {
          <div class="no-diff">
            <mat-icon>check_circle</mat-icon>
            <span>No field differences found</span>
          </div>
        } @else {
          <table mat-table [dataSource]="diff()!.diffs" class="diff-table">
            <ng-container matColumnDef="fieldName">
              <th mat-header-cell *matHeaderCellDef>Field</th>
              <td mat-cell *matCellDef="let row">{{ row.fieldName }}</td>
            </ng-container>
            <ng-container matColumnDef="localValue">
              <th mat-header-cell *matHeaderCellDef>Local</th>
              <td mat-cell *matCellDef="let row" class="value-cell local">
                {{ truncate(row.localValue) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="serverValue">
              <th mat-header-cell *matHeaderCellDef>Server</th>
              <td mat-cell *matCellDef="let row" class="value-cell server">
                {{ truncate(row.serverValue) }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="twoWayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: twoWayColumns;" class="diff-row"></tr>
          </table>
        }
      }
    </div>
  `,
  styles: [`
    .diff-container {
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      background: var(--card-background, #1e1e1e);
    }
    .diff-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .diff-header h4 { margin: 0; }
    .diff-actions { display: flex; gap: 8px; align-items: center; }
    .diff-table { width: 100%; }
    .value-cell {
      max-width: 250px; overflow: hidden; text-overflow: ellipsis;
      font-family: monospace; font-size: 12px; white-space: nowrap;
    }
    .value-cell.diff { color: #ffb74d; background: rgba(255,152,0,0.06); }
    .value-cell.match { color: #81c784; }
    .value-cell.unmapped { color: #666; font-style: italic; }
    .diff-row { background: rgba(255, 152, 0, 0.05); }
    .no-diff { display: flex; align-items: center; gap: 8px; padding: 16px; opacity: 0.6; }
    .no-diff mat-icon { color: #4caf50; }
    .mismatch-count { font-size: 12px; color: #ffb74d; padding: 4px 0 8px; }
  `]
})
export class SyncEntityDiffComponent implements OnInit, OnChanges {
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: number;
  @Input() useThreeWay = false;
  @Output() resolved = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private syncStatusService = inject(SyncStatusService);
  private syncCheckService = inject(EntitySyncCheckService);
  private snackBar = inject(MatSnackBar);

  diff = signal<EntityFieldDiff | null>(null);
  threeWayDiff = signal<ThreeWayFieldDiff | null>(null);
  loading = signal(false);
  resolving = signal(false);

  twoWayColumns = ['fieldName', 'localValue', 'serverValue'];
  threeWayColumns = ['fieldName', 'localValue', 'hubValue', 'spValue'];

  // Filter to only mismatched fields
  threeWayMismatches = signal<ThreeWayFieldEntry[]>([]);

  ngOnInit() {
    this.loadDiff();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['entityId'] || changes['entityType']) && !changes['entityId']?.firstChange) {
      this.loadDiff();
    }
  }

  loadDiff() {
    this.loading.set(true);
    this.diff.set(null);
    this.threeWayDiff.set(null);

    if (this.useThreeWay) {
      this.syncCheckService.threeWayDiff(this.entityType, this.entityId).subscribe({
        next: d => {
          this.threeWayDiff.set(d);
          this.threeWayMismatches.set(d?.fields?.filter(f => !f.allMatch) ?? []);
          // Adjust columns based on SP backing
          this.threeWayColumns = d?.spBacked
            ? ['fieldName', 'localValue', 'hubValue', 'spValue']
            : ['fieldName', 'localValue', 'hubValue'];
          this.loading.set(false);
        },
        error: () => {
          // Fall back to 2-way
          this.loadTwoWayDiff();
        }
      });
    } else {
      this.loadTwoWayDiff();
    }
  }

  private loadTwoWayDiff() {
    this.syncStatusService.compareEntity(this.entityType, this.entityId).subscribe({
      next: d => { this.diff.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  acceptRemote() {
    this.resolving.set(true);
    // Preview first, then execute with dependencies
    this.syncCheckService.previewPull(this.entityType, this.entityId).subscribe({
      next: preview => {
        if (preview && preview.totalCount > 1) {
          const summary = this.formatPreview(preview);
          if (!confirm(`Pull will include ${preview.totalCount} entities:\n${summary}\n\nProceed?`)) {
            this.resolving.set(false);
            return;
          }
        }
        this.syncCheckService.executePull(this.entityType, this.entityId).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Accepted hub version', 'OK', { duration: 3000 });
            this.resolving.set(false);
            this.resolved.emit();
          },
          error: () => this.resolving.set(false)
        });
      },
      error: () => {
        // Fallback to simple
        this.syncStatusService.acceptRemote(this.entityType, this.entityId).subscribe({
          next: () => { this.snackBar.open('Accepted hub version', 'OK', { duration: 3000 }); this.resolving.set(false); this.resolved.emit(); },
          error: () => this.resolving.set(false)
        });
      }
    });
  }

  acceptLocal() {
    this.resolving.set(true);
    this.syncCheckService.previewPush(this.entityType, this.entityId).subscribe({
      next: preview => {
        if (preview && preview.totalCount > 1) {
          const summary = this.formatPreview(preview);
          if (!confirm(`Push will include ${preview.totalCount} entities:\n${summary}\n\nProceed?`)) {
            this.resolving.set(false);
            return;
          }
        }
        this.syncCheckService.executePush(this.entityType, this.entityId).subscribe({
          next: (res) => {
            this.snackBar.open(res?.message || 'Pushed to hub', 'OK', { duration: 3000 });
            this.resolving.set(false);
            this.resolved.emit();
          },
          error: () => this.resolving.set(false)
        });
      },
      error: () => {
        this.syncStatusService.acceptLocal(this.entityType, this.entityId).subscribe({
          next: () => { this.snackBar.open('Pushed to hub', 'OK', { duration: 3000 }); this.resolving.set(false); this.resolved.emit(); },
          error: () => this.resolving.set(false)
        });
      }
    });
  }

  private formatPreview(preview: PushPullPreview): string {
    return Object.entries(preview.countByType).map(([t, c]) => `  ${t}: ${c}`).join('\n');
  }

  acceptSp() {
    this.resolving.set(true);
    this.syncCheckService.acceptFromSp(this.entityType, this.entityId).subscribe({
      next: () => {
        this.snackBar.open('Accepted SharePoint version', 'OK', { duration: 3000 });
        this.resolving.set(false);
        this.resolved.emit();
      },
      error: () => this.resolving.set(false)
    });
  }

  truncate(value: string | null): string {
    if (!value) return '(null)';
    return value.length > 80 ? value.substring(0, 80) + '...' : value;
  }
}
