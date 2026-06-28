import { Component, Inject, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileDto } from '../../../../models/file/file.model';
import { FileConnectorDto, FileConnectorIdDto } from '../../../../models/file/file-connector.model';
import { RfFileConnectorApiService } from '../services/rf-file-connector-api.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { ConnectorTargetPickerDialogComponent } from '../connector-target-picker-dialog/connector-target-picker-dialog.component';

export interface ConnectorEditDialogData {
  /** The connector being edited. */
  connector: FileConnectorDto;
  /** The source file the connector lives on (needed for the picker's suggestion call). */
  sourceFile: FileDto;
}

/**
 * Edit a single connector — change target file and/or override label. Two
 * common actions for users post-creation:
 *  - "Wrong target" → Change Target opens the picker; on selection, this
 *    dialog updates targetFileId + persists.
 *  - "Need a clearer name on hover" → Label input overrides the default
 *    derived-from-targetFileNumber label.
 *
 * <p>Counterpart link/unlink is intentionally out of scope here — that's a
 * separate context-menu action that calls the link/unlink endpoints directly.
 */
@Component({
  selector: 'app-connector-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">Edit Connector</h2>
    <mat-dialog-content class="dialog-content">
      <div class="row">
        <span class="row-label">Source file</span>
        <span class="row-value" [title]="sourceLabel()">{{ sourceLabel() }}</span>
      </div>

      <div class="row">
        <span class="row-label">Target file</span>
        <span class="row-value" [title]="targetLabel()">{{ targetLabel() }}</span>
        <button mat-stroked-button color="primary" type="button" (click)="changeTarget()">
          Change…
        </button>
      </div>

      <div class="row">
        <label for="label-input" class="row-label">Label (optional)</label>
        <input
          id="label-input"
          type="text"
          class="row-input"
          [value]="label()"
          (input)="label.set($any($event.target).value)"
          placeholder="Leave blank to derive from target file number"/>
      </div>

      <div class="row">
        <span class="row-label">Show on canvas</span>
        <label class="checkbox-wrap">
          <input
            type="checkbox"
            [checked]="showLabel()"
            (change)="showLabel.set($any($event.target).checked)"/>
          <span class="checkbox-hint">Draw the label inside this connector's shape on the diagram.</span>
        </label>
      </div>

      @if (error()) {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()" [disabled]="saving()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Saving…' : 'Save' }}
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
      min-width: 480px; max-width: 720px; padding: 12px 20px 16px;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color, #dee2e6); }
    .row:last-of-type { border-bottom: 0; }
    .row-label {
      flex: 0 0 110px;
      font-size: 0.85em; font-weight: 600;
      color: var(--secondary-text, #495057);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .row-value {
      flex: 1 1 auto; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      color: var(--primary-text, #212529);
    }
    .row-input {
      flex: 1 1 auto; box-sizing: border-box;
      padding: 6px 10px; font: inherit; font-size: 0.9em;
      color: var(--primary-text, #212529);
      background: var(--primary-background, #ffffff);
      border: 1px solid var(--border-color, #dee2e6); border-radius: 4px;
    }
    .row-input:focus { outline: none; border-color: var(--accent-color, #007bff); }
    .checkbox-wrap {
      flex: 1 1 auto; display: flex; align-items: center; gap: 8px;
      cursor: pointer;
    }
    .checkbox-wrap input[type=checkbox] {
      margin: 0; width: 16px; height: 16px; cursor: pointer; flex: 0 0 auto;
    }
    .checkbox-hint {
      font-size: 0.85em;
      color: var(--secondary-text, #495057);
    }
    .error-banner {
      display: flex; gap: 8px; align-items: center;
      padding: 8px 12px; margin-top: 12px;
      background: #ffebee; color: #b71c1c; border-radius: 4px;
    }
    mat-dialog-actions {
      padding: 8px 16px 12px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
  `]
})
export class ConnectorEditDialogComponent {
  /** Working copy — mutated by Change Target / Label edits before save. */
  private working: FileConnectorDto;
  /** Cached new target (only populated when user picked a different file). */
  private newTarget: FileDto | null = null;
  label = signal<string>('');
  /** Whether to render this connector's label on the canvas. Initialized
   *  from the connector's persisted showLabel (null treated as false), then
   *  toggled via the dialog's checkbox and sent in the save payload. */
  showLabel = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);

  private dialog = inject(MatDialog);
  private api = inject(RfFileConnectorApiService);
  private messages = inject(GlobalMessageService);

  constructor(
    public dialogRef: MatDialogRef<ConnectorEditDialogComponent, FileConnectorDto | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectorEditDialogData,
  ) {
    this.working = new FileConnectorDto(data.connector);
    this.label.set(data.connector.label ?? '');
    this.showLabel.set(data.connector.showLabel === true);
  }

  sourceLabel(): string {
    const f = this.data.sourceFile;
    if (f.name) return f.name;
    if (Array.isArray(f.fileNumber) && f.fileNumber.length > 0) return f.fileNumber.join(' / ');
    return `File #${f.id}`;
  }

  targetLabel(): string {
    if (this.newTarget) {
      return this.newTarget.name || (Array.isArray(this.newTarget.fileNumber) ? this.newTarget.fileNumber.join(' / ') : `File #${this.newTarget.id}`);
    }
    return this.working.targetFileName || this.working.targetFileNumber || `File #${this.working.targetFileId}`;
  }

  changeTarget(): void {
    const ref = this.dialog.open(ConnectorTargetPickerDialogComponent, {
      data: { sourceFile: this.data.sourceFile },
      width: '720px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((picked: FileDto | undefined) => {
      if (picked?.id) this.newTarget = picked;
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload: FileConnectorIdDto = {
      id: this.working.id,
      sourceFileId: this.working.sourceFileId,
      targetFileId: this.newTarget?.id ?? this.working.targetFileId,
      coordinates: this.working.coordinates,
      originalPictureSize: this.working.originalPictureSize,
      rotation: this.working.rotation,
      symbolId: this.working.symbolId,
      svgPath: this.working.svgPath,
      // Don't touch counterpart pointer from the edit path — use the dedicated
      // link/unlink endpoints for that, they enforce the bidirectional invariants.
      counterpartConnectorId: this.working.counterpartConnectorId,
      label: this.label().trim() || null,
      showLabel: this.showLabel(),
    };

    this.api.save(payload).subscribe({
      next: (resp) => {
        const saved = new FileConnectorDto(resp.responseData);
        this.messages.showSuccess('Connector updated');
        this.dialogRef.close(saved);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
