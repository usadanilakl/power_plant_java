import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SyncStatusService, EntityFieldDiff, FieldDiffEntry } from '../../../services/sync-status.service';

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
            <mat-icon>cloud_download</mat-icon> Accept Remote
          </button>
          <button mat-raised-button color="primary" (click)="acceptLocal()" [disabled]="resolving()">
            <mat-icon>cloud_upload</mat-icon> Accept Local
          </button>
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-spinner diameter="24"></mat-spinner>
      } @else if (diff()) {
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
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="diff-row"></tr>
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
    .diff-header { display: flex; justify-content: space-between; align-items: center; }
    .diff-header h4 { margin: 0; }
    .diff-actions { display: flex; gap: 8px; align-items: center; }
    .diff-table { width: 100%; }
    .value-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; font-family: monospace; font-size: 12px; }
    .diff-row { background: rgba(255, 152, 0, 0.05); }
    .no-diff { display: flex; align-items: center; gap: 8px; padding: 16px; opacity: 0.6; }
    .no-diff mat-icon { color: #4caf50; }
  `]
})
export class SyncEntityDiffComponent implements OnInit {
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: number;
  @Output() resolved = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private syncStatusService = inject(SyncStatusService);
  private snackBar = inject(MatSnackBar);

  diff = signal<EntityFieldDiff | null>(null);
  loading = signal(false);
  resolving = signal(false);
  columns = ['fieldName', 'localValue', 'serverValue'];

  ngOnInit() {
    this.loadDiff();
  }

  loadDiff() {
    this.loading.set(true);
    this.syncStatusService.compareEntity(this.entityType, this.entityId).subscribe({
      next: d => { this.diff.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  acceptRemote() {
    this.resolving.set(true);
    this.syncStatusService.acceptRemote(this.entityType, this.entityId).subscribe({
      next: () => {
        this.snackBar.open('Accepted remote version', 'OK', { duration: 3000 });
        this.resolving.set(false);
        this.resolved.emit();
      },
      error: () => this.resolving.set(false)
    });
  }

  acceptLocal() {
    this.resolving.set(true);
    this.syncStatusService.acceptLocal(this.entityType, this.entityId).subscribe({
      next: () => {
        this.snackBar.open('Pushed local version to hub', 'OK', { duration: 3000 });
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
