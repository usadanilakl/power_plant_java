import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { EntitySyncCheckComponent } from './entity-sync-check.component';

export interface SyncCheckDialogData {
  entityType: string;
  entityId: number;
  /** If set, shows a warning header and Continue/Cancel buttons */
  actionLabel?: string;
}

@Component({
  selector: 'app-sync-check-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, EntitySyncCheckComponent],
  template: `
    <h2 mat-dialog-title>
      @if (data.actionLabel) {
        Sync Check — {{ data.actionLabel }}
      } @else {
        Sync Status: {{ data.entityType }} #{{ data.entityId }}
      }
    </h2>
    <mat-dialog-content>
      <app-entity-sync-check
        [entityType]="data.entityType"
        [entityId]="data.entityId"
        mode="panel">
      </app-entity-sync-check>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (data.actionLabel) {
        <button mat-button (click)="dialogRef.close(false)">Cancel</button>
        <button mat-raised-button color="warn" (click)="dialogRef.close(true)">
          Continue Anyway
        </button>
      } @else {
        <button mat-button (click)="dialogRef.close()">Close</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 380px; }
  `]
})
export class SyncCheckDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SyncCheckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SyncCheckDialogData
  ) {}
}
