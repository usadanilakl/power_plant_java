import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileDto } from '../../../../models/file/file.model';
import { RfFileApiService } from '../services/rf-file-api.service';
import {
  CloneFileResultDto,
  LotoSuggestionDto,
  AcceptedSuggestionItemDto,
} from '../../../../models/file/clone.model';

export interface CloneToUnitDialogData {
  file: FileDto;
}

type Phase = 'confirm' | 'confirm-force' | 'running' | 'result' | 'accept-result' | 'error';

@Component({
  selector: 'app-clone-to-unit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      Clone to Other Unit
      <span class="file-label" [title]="fileLabel()">{{ fileLabel() }}</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <!-- Phase: confirm (first click, no existing clone) -->
      @if (phase() === 'confirm') {
        <p>
          This will create a parallel <strong>Unit 2 ↔ Unit 1</strong> file with all
          equipment "highlights" copied, LOTO points auto-linked where their
          counterparts exist, and the disk file physically duplicated with a
          tag-swapped name.
        </p>
        <p class="hint">
          The cloned file starts as unverified — you'll review it (and replace the
          disk file with the actual other-unit drawing) afterwards.
        </p>
      }

      <!-- Phase: confirm-force (existing clone detected) -->
      @if (phase() === 'confirm-force' && lastResult()) {
        <div class="warning-banner">
          <mat-icon>warning</mat-icon>
          <div>
            <strong>A clone of this file already exists.</strong>
            <div class="muted">
              Existing clone ID{{ lastResult()!.existingCloneIds.length === 1 ? '' : 's' }}:
              {{ lastResult()!.existingCloneIds.join(', ') }}
            </div>
          </div>
        </div>
        <p>You can cancel and open the existing clone instead, or create another clone (with an auto-disambiguated file number).</p>
      }

      <!-- Phase: running -->
      @if (phase() === 'running') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Cloning… copying disk file and resolving counterparts.</span>
        </div>
      }

      <!-- Phase: result (clone succeeded) -->
      @if (phase() === 'result' && lastResult()) {
        <div class="success-banner">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Clone created</strong> — Unit {{ lastResult()!.sourceUnit }} → Unit {{ lastResult()!.targetUnit }}
            <div class="muted">New file ID: #{{ lastResult()!.newFileId }}</div>
          </div>
        </div>

        @if (lastResult()!.summary; as s) {
          <ul class="summary">
            <li><strong>{{ s.equipmentCount }}</strong> equipment cloned</li>
            <li><strong>{{ s.autoLinkedLotoCount }}</strong> LOTO points auto-linked to existing counterparts</li>
            <li><strong>{{ s.reusedLotoCount }}</strong> LOTO points reused (not unit-specific)</li>
            <li><strong>{{ s.copiedDiskFiles }}</strong> disk file(s) copied</li>
            <li>
              <strong>{{ s.suggestionCount }}</strong> LOTO points need review (no existing counterpart)
            </li>
          </ul>
        }

        @if (groupedSuggestions().length > 0) {
          <h3 class="section-title">Suggested counterparts — review before accepting</h3>
          <p class="hint">
            Each row creates a NEW LOTO point with the transformed tag/description,
            attaches it to the listed equipment, and links it as a counterpart to the source.
            Uncheck any you don't want.
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

      <!-- Phase: accept-result -->
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

      <!-- Phase: error -->
      @if (phase() === 'error') {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <div>
            <strong>Clone failed.</strong>
            <div class="muted">{{ errorMessage() || 'Unknown error' }}</div>
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (phase() === 'confirm') {
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="runClone(false)">Clone</button>
      }
      @if (phase() === 'confirm-force') {
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="warn" (click)="runClone(true)">Create Another Clone</button>
      }
      @if (phase() === 'running') {
        <button mat-button disabled>Working…</button>
      }
      @if (phase() === 'result') {
        @if (lastResult()!.suggestions.length > 0) {
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
       which auto-flip with .dark-theme on body. */
    :host ::ng-deep .mat-mdc-dialog-surface,
    :host ::ng-deep .mdc-dialog__surface {
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .dialog-title {
      display: flex; flex-direction: column; gap: 4px;
      padding: 16px 20px 8px;
      font-size: 1.15em; font-weight: 500;
      color: var(--primary-text, #212529);
    }
    .dialog-title .file-label {
      font-size: 0.85em; font-weight: 400;
      color: var(--secondary-text, #495057);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 100%;
    }
    .dialog-content {
      max-height: 70vh;
      padding: 8px 20px 16px;
      line-height: 1.5;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .dialog-content p { margin: 8px 0; }
    .hint { color: var(--secondary-text, #495057); font-size: 0.9em; }
    .muted { color: var(--secondary-text, #495057); font-size: 0.85em; }
    .section-title { margin: 20px 0 6px; font-size: 1em; font-weight: 500; color: var(--primary-text, #212529); }
    .spinner-row { display: flex; align-items: center; gap: 12px; padding: 32px 0; justify-content: center; }
    .success-banner, .warning-banner, .error-banner {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 12px 14px; border-radius: 4px; margin: 4px 0 12px;
    }
    .success-banner { background: #e8f5e9; color: #1b5e20; }
    .warning-banner { background: #fff3e0; color: #e65100; }
    .error-banner { background: #ffebee; color: #b71c1c; }
    .success-banner mat-icon, .warning-banner mat-icon, .error-banner mat-icon { margin-top: 2px; flex-shrink: 0; }
    ul.summary { padding-left: 22px; margin: 10px 0 12px; color: var(--primary-text, #212529); }
    ul.summary li { margin: 3px 0; }
    table.suggestions {
      width: 100%; border-collapse: collapse; margin-top: 8px;
      color: var(--primary-text, #212529);
    }
    table.suggestions th, table.suggestions td {
      text-align: left; padding: 8px 10px;
      border-bottom: 1px solid var(--border-color, #dee2e6);
      font-size: 0.9em;
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
    code { font-family: 'Roboto Mono', monospace; font-size: 0.9em; color: inherit; }
    mat-dialog-actions {
      padding: 8px 16px 12px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
  `]
})
export class CloneToUnitDialogComponent {
  phase = signal<Phase>('confirm');
  lastResult = signal<CloneFileResultDto | null>(null);
  acceptResult = signal<{ created: number; linkedCounterparts: number; errors: string[] } | null>(null);
  errorMessage = signal<string | null>(null);

  /** Source-LOTO ids the user has UNCHECKED (default: all checked). */
  private deselected = signal<Set<number>>(new Set());

  /**
   * Deduped suggestions grouped by source LOTO id. A single source point
   * attached to multiple cloned equipment shows as ONE row that says
   * "attaches to N eq" — matches backend behavior where one new counterpart
   * is created and fanned out, instead of N duplicate LotoPoints with the
   * same tag.
   */
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

  selectedCount = computed(() => {
    const total = this.groupedSuggestions().length;
    return total - this.deselected().size;
  });

  allSelected = computed(() => this.deselected().size === 0);
  someSelected = computed(() => {
    const total = this.groupedSuggestions().length;
    return total > 0 && this.deselected().size < total;
  });

  constructor(
    public dialogRef: MatDialogRef<CloneToUnitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CloneToUnitDialogData,
    private api: RfFileApiService,
  ) {}

  fileLabel(): string {
    const fn = this.data.file.fileNumber;
    if (Array.isArray(fn) && fn.length > 0) return fn.join(' / ');
    return this.data.file.name || `File #${this.data.file.id ?? '?'}`;
  }

  runClone(force: boolean): void {
    if (!this.data.file.id) {
      this.errorMessage.set('Source file has no ID');
      this.phase.set('error');
      return;
    }
    this.phase.set('running');
    this.api.cloneToUnit(this.data.file.id, force).subscribe({
      next: (resp) => {
        const result = resp.responseData;
        this.lastResult.set(result);
        if (result.status === 'created') {
          this.phase.set('result');
        } else if (result.status === 'exists') {
          this.phase.set('confirm-force');
        } else {
          this.errorMessage.set(result.error ?? 'Clone failed without a specific error');
          this.phase.set('error');
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Network/server error');
        this.phase.set('error');
      },
    });
  }

  isGroupSelected(g: GroupedSuggestion): boolean {
    return !this.deselected().has(g.sourceLotoPointId);
  }

  toggleGroup(g: GroupedSuggestion, checked: boolean): void {
    const next = new Set(this.deselected());
    if (checked) next.delete(g.sourceLotoPointId);
    else next.add(g.sourceLotoPointId);
    this.deselected.set(next);
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.deselected.set(new Set());
    } else {
      const all = this.groupedSuggestions().map(g => g.sourceLotoPointId);
      this.deselected.set(new Set(all));
    }
  }

  sourceTagForGroup(g: GroupedSuggestion): string {
    // The suggested DTO is the TARGET tag (e.g. 02XXX); derive the source by
    // swapping the prefix — we don't have it on the wire and don't need it
    // for anything but display.
    const t = g.suggested.tagNumber;
    if (!t || t.length < 2) return '(unknown)';
    if (t.startsWith('01')) return '02' + t.substring(2);
    if (t.startsWith('02')) return '01' + t.substring(2);
    return '(unknown)';
  }

  acceptSelected(): void {
    const selected = this.groupedSuggestions().filter(g => this.isGroupSelected(g));
    if (selected.length === 0) return;
    // Expand groups back to per-equipment items — the backend re-dedupes by
    // sourceLotoPointId, so this is just "tell the server every equipment to
    // attach the new counterpart to".
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

/** Dialog-local row model — one entry per source LOTO point, target equipment fanned in. */
interface GroupedSuggestion {
  sourceLotoPointId: number;
  suggested: LotoSuggestionDto['suggested'];
  equipmentIds: number[];
}
