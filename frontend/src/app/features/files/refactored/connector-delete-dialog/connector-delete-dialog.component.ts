import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileConnectorDto } from '../../../../models/file/file-connector.model';

export interface ConnectorDeleteDialogData {
  connector: FileConnectorDto;
  /** Display label for the counterpart's file — shown so the user knows
   *  which other drawing would be affected. Computed by the caller from
   *  the connector's targetFileNumber/targetFileName. */
  counterpartFileLabel: string;
}

/**
 * Three-option delete prompt for paired connectors. Returned value:
 *   - {@code 'both'}    — soft-delete this connector AND its counterpart
 *                          (DELETE endpoint with deleteCounterpart=true).
 *   - {@code 'this'}    — soft-delete this side only, peer stays alive
 *                          but unpaired (legacy behavior).
 *   - {@code undefined} — user cancelled.
 *
 * <p>Default-focused button is "Delete both" because, for an intentional
 * pair, leaving the orphan on the other drawing is rarely the user's intent.
 * The cancel and "this only" buttons are unstyled secondaries so the
 * default doesn't lead users into a destructive choice without thought.
 *
 * <p>Unpaired connectors don't use this dialog — caller uses the simple
 * browser confirm for those (one less click for the common case).
 */
@Component({
  selector: 'app-connector-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">Delete Connector</h2>
    <mat-dialog-content class="dialog-content">
      <p class="lead">
        This connector is paired with a counterpart on
        <strong class="file-label">{{ data.counterpartFileLabel }}</strong>.
      </p>
      <p class="muted">
        Deleting both keeps the two drawings in sync. Deleting only this
        side leaves the counterpart alive but unpaired — useful if you're
        about to draw a replacement connector for it.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-stroked-button (click)="dialogRef.close('this')">Delete only this side</button>
      <button mat-raised-button color="warn" (click)="dialogRef.close('both')" cdkFocusInitial>
        Delete both
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-surface,
    :host ::ng-deep .mdc-dialog__surface {
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .dialog-title { padding: 14px 20px 6px; margin: 0; font-size: 1.05em; font-weight: 500; color: var(--primary-text, #212529); }
    .dialog-content {
      min-width: 420px; max-width: 560px; padding: 8px 20px 12px;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .lead { margin: 6px 0; font-size: 0.95em; }
    .file-label { color: var(--accent-color, #1565c0); }
    .muted { margin: 8px 0; font-size: 0.85em; color: var(--secondary-text, #495057); line-height: 1.45; }
    mat-dialog-actions {
      padding: 8px 16px 12px; gap: 4px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
  `]
})
export class ConnectorDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConnectorDeleteDialogComponent, 'both' | 'this' | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectorDeleteDialogData,
  ) {}
}
