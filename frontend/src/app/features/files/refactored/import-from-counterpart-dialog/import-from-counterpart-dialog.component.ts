import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FileDto } from '../../../../models/file/file.model';
import { RfFileApiService } from '../services/rf-file-api.service';
import {
  ImportFromCounterpartResultDto,
  LotoSuggestionDto,
  AcceptedSuggestionItemDto,
} from '../../../../models/file/clone.model';

export interface ImportFromCounterpartDialogData {
  file: FileDto;
  /** Optional pre-known counterpart label so we don't need another round-trip just to show it. */
  counterpartName?: string | null;
  counterpartFileNumber?: string | null;
}

type Phase = 'confirm' | 'running' | 'result' | 'accept-result' | 'error';

interface GroupedSuggestion {
  sourceLotoPointId: number;
  suggested: LotoSuggestionDto['suggested'];
  equipmentIds: number[];
}

/**
 * Imports equipment + LOTO from a file's already-linked counterpart into THIS
 * file. The user picks a disposition for the file's existing equipment first
 * (keep-and-add OR soft-delete-then-import), runs the import, then reviews
 * any LOTO suggestions just like the clone-to-unit flow.
 *
 * <p>Pre-requisite: the target file MUST have {@code counterpartId} set —
 * the calling context-menu code only offers this option when that's the case.
 */
@Component({
  selector: 'app-import-from-counterpart-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatCheckboxModule, MatRadioModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      Import Points from Counterpart
      <span class="file-label" [title]="fileLabel()">into {{ fileLabel() }}</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (phase() === 'confirm') {
        <p>
          This will copy every Equipment "highlight" from the linked counterpart
          file into this one, transforming text fields (Unit 1 ↔ Unit 2) and
          attaching LOTO point counterparts where they exist.
        </p>
        @if (counterpartLabel()) {
          <p class="muted">Counterpart: <strong>{{ counterpartLabel() }}</strong></p>
        }
        <h3 class="section-title">Existing equipment on this file</h3>
        <p class="hint">
          Choose whether to keep the equipment currently on this file (merged with
          imported ones) or soft-delete them first (clean replace, recoverable).
        </p>
        <mat-radio-group [(ngModel)]="keepExisting" class="radio-stack">
          <mat-radio-button [value]="true">Keep existing equipment (merge)</mat-radio-button>
          <mat-radio-button [value]="false">Soft-delete existing equipment first (clean replace)</mat-radio-button>
        </mat-radio-group>
      }

      @if (phase() === 'running') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>{{ runningMessage() }}</span>
        </div>
      }

      @if (phase() === 'result' && lastResult()) {
        <div class="success-banner">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Import complete</strong> — Unit {{ lastResult()!.sourceUnit }} → Unit {{ lastResult()!.targetUnit }}
            @if (lastResult()!.deletedExistingCount > 0) {
              <div class="muted">{{ lastResult()!.deletedExistingCount }} existing equipment soft-deleted before import</div>
            }
          </div>
        </div>

        @if (lastResult()!.summary; as s) {
          <ul class="summary">
            <li><strong>{{ s.equipmentCount }}</strong> equipment cloned</li>
            <li><strong>{{ s.autoLinkedLotoCount }}</strong> LOTO points auto-linked to existing counterparts</li>
            <li><strong>{{ s.reusedLotoCount }}</strong> LOTO points reused (not unit-specific)</li>
            <li><strong>{{ s.suggestionCount }}</strong> LOTO points need review (no existing counterpart)</li>
          </ul>
        }

        @if (groupedSuggestions().length > 0) {
          <h3 class="section-title">Suggested counterparts — review before accepting</h3>
          <p class="hint">
            Each row saves a new LOTO point with the transformed tag/description,
            attaches it to the listed equipment, and links it as a counterpart
            to the source.
          </p>
          <table class="suggestions">
            <thead>
              <tr>
                <th class="check-col">
                  <mat-checkbox
                    [checked]="allSelected()"
                    [indeterminate]="someSelected() && !allSelected()"
                    (change)="toggleAll($event.checked)">
                  </mat-checkbox>
                </th>
                <th>Source tag</th>
                <th>Suggested tag</th>
                <th>Attaches to</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              @for (g of groupedSuggestions(); track g.sourceLotoPointId) {
                <tr>
                  <td>
                    <mat-checkbox
                      [checked]="isGroupSelected(g)"
                      (change)="toggleGroup(g, $event.checked)">
                    </mat-checkbox>
                  </td>
                  <td><code>{{ sourceTagForGroup(g) }}</code></td>
                  <td><code>{{ g.suggested.tagNumber }}</code></td>
                  <td>
                    {{ g.equipmentIds.length }} eq
                    @if (g.equipmentIds.length > 1) {
                      <span class="muted">(shared)</span>
                    }
                  </td>
                  <td class="desc">{{ g.suggested.description || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      @if (phase() === 'accept-result' && acceptResult(); as ar) {
        <div class="success-banner">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>{{ ar.created }}</strong> suggestion{{ ar.created === 1 ? '' : 's' }} accepted
            ({{ ar.linkedCounterparts }} counterpart link{{ ar.linkedCounterparts === 1 ? '' : 's' }} established)
          </div>
        </div>
        @if (ar.errors.length > 0) {
          <details>
            <summary>{{ ar.errors.length }} error(s) — click to expand</summary>
            <ul>
              @for (err of ar.errors; track err) {
                <li><code>{{ err }}</code></li>
              }
            </ul>
          </details>
        }
      }

      @if (phase() === 'error') {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <div>
            <strong>Import failed.</strong>
            <div class="muted">{{ errorMessage() || 'Unknown error' }}</div>
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (phase() === 'confirm') {
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="runImport()">Import</button>
      }
      @if (phase() === 'result') {
        @if (groupedSuggestions().length > 0) {
          <button mat-button (click)="dialogRef.close(lastResult())">Skip Suggestions</button>
          <button mat-raised-button color="primary" [disabled]="selectedCount() === 0" (click)="acceptSelected()">
            Accept Selected ({{ selectedCount() }})
          </button>
        } @else {
          <button mat-raised-button color="primary" (click)="dialogRef.close(lastResult())">Done</button>
        }
      }
      @if (phase() === 'accept-result' || phase() === 'error') {
        <button mat-raised-button color="primary" (click)="dialogRef.close(lastResult())">Close</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    /* Uses the project's theme tokens (--primary-text, --card-background, etc.)
       which auto-flip with .dark-theme on body. Avoids Material's --mat-sys-*
       tokens that aren't part of this app's theme system. */
    :host ::ng-deep .mat-mdc-dialog-surface,
    :host ::ng-deep .mdc-dialog__surface {
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .dialog-title {
      display: flex; flex-direction: column; gap: 2px;
      padding: 14px 20px 6px; margin: 0;
      font-size: 1.05em; font-weight: 500;
      color: var(--primary-text, #212529);
    }
    .dialog-title .file-label {
      font-size: 0.82em; font-weight: 400;
      color: var(--secondary-text, #495057);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
    }
    .dialog-content {
      max-height: 70vh;
      padding: 4px 20px 12px; line-height: 1.45;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .dialog-content p { margin: 8px 0; }
    .hint { color: var(--secondary-text, #495057); font-size: 0.85em; }
    .muted { color: var(--secondary-text, #495057); font-size: 0.82em; }
    .section-title { margin: 16px 0 4px; font-size: 0.95em; font-weight: 500; color: var(--primary-text, #212529); }
    .radio-stack { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
    .spinner-row { display: flex; align-items: center; gap: 12px; padding: 32px 0; justify-content: center; }
    .success-banner, .error-banner {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 10px 14px; border-radius: 4px; margin: 4px 0 12px;
    }
    .success-banner { background: #e8f5e9; color: #1b5e20; }
    .error-banner { background: #ffebee; color: #b71c1c; }
    .success-banner mat-icon, .error-banner mat-icon { margin-top: 2px; flex-shrink: 0; }
    ul.summary { padding-left: 22px; margin: 8px 0 12px; color: var(--primary-text, #212529); }
    ul.summary li { margin: 2px 0; }
    table.suggestions { width: 100%; border-collapse: collapse; margin-top: 6px; color: var(--primary-text, #212529); }
    table.suggestions th, table.suggestions td {
      text-align: left; padding: 6px 10px;
      border-bottom: 1px solid var(--border-color, #dee2e6);
      font-size: 0.85em;
    }
    table.suggestions th {
      font-weight: 600;
      background: var(--secondary-background, #f0f2f5);
      color: var(--primary-text, #212529);
    }
    table.suggestions td.desc {
      color: var(--secondary-text, #495057);
      max-width: 320px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .check-col { width: 36px; }
    details { margin-top: 8px; color: var(--primary-text, #212529); }
    details summary { cursor: pointer; padding: 4px 0; }
    code { font-family: 'Roboto Mono', monospace; font-size: 0.85em; color: inherit; }
    mat-dialog-actions {
      padding: 8px 16px 12px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
  `]
})
export class ImportFromCounterpartDialogComponent {
  phase = signal<Phase>('confirm');
  keepExisting = true;
  lastResult = signal<ImportFromCounterpartResultDto | null>(null);
  acceptResult = signal<{ created: number; linkedCounterparts: number; errors: string[] } | null>(null);
  errorMessage = signal<string | null>(null);
  private deselected = signal<Set<number>>(new Set());

  groupedSuggestions = computed<GroupedSuggestion[]>(() => {
    const all = this.lastResult()?.suggestions ?? [];
    const byId = new Map<number, GroupedSuggestion>();
    for (const sug of all) {
      const existing = byId.get(sug.sourceLotoPointId);
      if (existing) {
        existing.equipmentIds.push(sug.newEquipmentId);
      } else {
        byId.set(sug.sourceLotoPointId, {
          sourceLotoPointId: sug.sourceLotoPointId,
          suggested: sug.suggested,
          equipmentIds: [sug.newEquipmentId],
        });
      }
    }
    return Array.from(byId.values());
  });

  selectedCount = computed(() => this.groupedSuggestions().length - this.deselected().size);
  allSelected = computed(() => this.deselected().size === 0);
  someSelected = computed(() => {
    const total = this.groupedSuggestions().length;
    return total > 0 && this.deselected().size < total;
  });

  runningMessage = computed(() => {
    const phase = this.phase();
    return phase === 'running' && !this.lastResult() ? 'Importing equipment and LOTO points…' : 'Saving accepted suggestions…';
  });

  constructor(
    public dialogRef: MatDialogRef<ImportFromCounterpartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportFromCounterpartDialogData,
    private api: RfFileApiService,
  ) {}

  fileLabel(): string {
    const fn = this.data.file.fileNumber;
    if (Array.isArray(fn) && fn.length > 0) return fn.join(' / ');
    return this.data.file.name || `File #${this.data.file.id ?? '?'}`;
  }

  counterpartLabel(): string | null {
    const name = this.data.counterpartName;
    const num = this.data.counterpartFileNumber;
    if (!name && !num) return null;
    return [num, name].filter(Boolean).join(' — ');
  }

  runImport(): void {
    if (!this.data.file.id) {
      this.errorMessage.set('Target file has no ID');
      this.phase.set('error');
      return;
    }
    this.phase.set('running');
    this.api.importFromCounterpart(this.data.file.id, this.keepExisting).subscribe({
      next: (resp) => {
        const result = resp.responseData;
        this.lastResult.set(result);
        if (result.status === 'created') {
          this.phase.set('result');
        } else {
          this.errorMessage.set(result.error ?? 'Import failed');
          this.phase.set('error');
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Network/server error');
        this.phase.set('error');
      },
    });
  }

  isGroupSelected(g: GroupedSuggestion): boolean { return !this.deselected().has(g.sourceLotoPointId); }

  toggleGroup(g: GroupedSuggestion, checked: boolean): void {
    const next = new Set(this.deselected());
    if (checked) next.delete(g.sourceLotoPointId);
    else next.add(g.sourceLotoPointId);
    this.deselected.set(next);
  }

  toggleAll(checked: boolean): void {
    if (checked) this.deselected.set(new Set());
    else this.deselected.set(new Set(this.groupedSuggestions().map(g => g.sourceLotoPointId)));
  }

  sourceTagForGroup(g: GroupedSuggestion): string {
    const t = g.suggested.tagNumber;
    if (!t || t.length < 2) return '(unknown)';
    if (t.startsWith('01')) return '02' + t.substring(2);
    if (t.startsWith('02')) return '01' + t.substring(2);
    return '(unknown)';
  }

  acceptSelected(): void {
    const selected = this.groupedSuggestions().filter(g => this.isGroupSelected(g));
    if (selected.length === 0) return;
    const items: AcceptedSuggestionItemDto[] = selected.flatMap(g =>
      g.equipmentIds.map(eqId => ({
        newEquipmentId: eqId,
        sourceLotoPointId: g.sourceLotoPointId,
        lotoPoint: g.suggested,
      }))
    );
    this.phase.set('running');
    this.api.acceptCloneSuggestions({ items }).subscribe({
      next: (resp) => {
        this.acceptResult.set(resp.responseData);
        this.phase.set('accept-result');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Network/server error');
        this.phase.set('error');
      },
    });
  }
}
