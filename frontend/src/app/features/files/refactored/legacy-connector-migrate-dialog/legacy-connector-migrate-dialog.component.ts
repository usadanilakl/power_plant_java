import { Component, Inject, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {
  RfFileConnectorApiService,
  CandidateFile,
  LegacyConnectorContextDto,
  ConnectorMigrationItemDto,
} from '../services/rf-file-connector-api.service';
import { RfFileApiService } from '../services/rf-file-api.service';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

export interface LegacyConnectorMigrateData {
  /** ID of the legacy Equipment (eqType='connector') the user is editing. */
  equipmentId: number;
  /** Optional source-file label for the header — falls back to context fetch. */
  sourceLabel?: string;
}

/** Result emitted on successful migration so the parent can refresh state. */
export interface LegacyConnectorMigrateResult {
  item: ConnectorMigrationItemDto;
}

/**
 * Edit dialog for legacy connector Equipment rows the bulk migration couldn't
 * auto-handle (short tag, no match, ambiguous match). Loads the context
 * (tag + source file + candidate target files), lets the user quick-pick a
 * candidate or search all files, then commits a single-item migration with
 * the chosen target. On success, closes with the audit item so the parent
 * (loto-builder) can remove the old Equipment shape and add the new
 * FileConnector to its local state.
 *
 * <p>Distinct from {@code ConnectorTargetPickerDialogComponent} (used when
 * DRAWING a new connector) because the legacy flow doesn't need to draw —
 * the shape coordinates already exist on the Equipment row, and the
 * migration runner copies them over. The dialog just chooses the target.
 */
@Component({
  selector: 'app-legacy-connector-migrate-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      Edit Legacy Connector
      <span class="sub-label">Equipment #{{ data.equipmentId }} — pick the target file</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (phase() === 'loading') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Loading context…</span>
        </div>
      }

      @if (phase() === 'browse' && context()) {
        <div class="info-block">
          <div class="info-row">
            <span class="info-label">Tag</span>
            <code class="info-value">{{ context()!.tagNumber || '(none)' }}</code>
          </div>
          <div class="info-row">
            <span class="info-label">Source</span>
            <span class="info-value">
              {{ context()!.sourceFileNumber || '?' }} — {{ context()!.sourceFileName || '?' }}
            </span>
          </div>
          @if (context()!.skipReason) {
            <div class="info-hint">{{ context()!.skipReason }}</div>
          }
        </div>

        @if (context()!.candidates.length > 0) {
          <p class="section-label">Suggested target files (file number contains tag)</p>
          <div class="candidates-list" role="list">
            @for (c of context()!.candidates; track c.id) {
              <button class="candidate-row" type="button" role="listitem" (click)="pickCandidate(c)"
                      [disabled]="migrating()">
                <span class="row-num"><code>{{ c.fileNumber || '—' }}</code></span>
                <span class="row-name" [title]="c.name || ''">{{ c.name || '—' }}</span>
                <mat-icon class="row-pick-icon" title="Use as target">arrow_forward</mat-icon>
              </button>
            }
          </div>
        } @else {
          <p class="muted">No file numbers contain this tag — use search below.</p>
        }

        <p class="section-label">Or search all files</p>
        <div class="filter-row">
          <input
            type="text"
            class="filter-input"
            [value]="filterText()"
            (input)="onFilterChange($any($event.target).value)"
            placeholder="Search by name, file number, vendor, system…"
            [disabled]="migrating()"/>
          @if (filterText()) {
            <button class="filter-clear" type="button" (click)="clearFilter()" title="Clear">×</button>
          }
        </div>
        @if (searching()) { <p class="filter-status">Searching…</p> }

        @if (filterText() && searchResults().length === 0 && !searching()) {
          <p class="muted">No files match "{{ filterText() }}".</p>
        }
        @if (filterText() && searchResults().length > 0) {
          <div class="candidates-list" role="list">
            @for (r of searchResults(); track r.id) {
              <button class="candidate-row" type="button" role="listitem" (click)="pickResult(r)"
                      [disabled]="migrating()">
                <span class="row-num"><code>{{ r.fileNumber || '—' }}</code></span>
                <span class="row-name" [title]="r.name || ''">{{ r.name || '—' }}</span>
                <mat-icon class="row-pick-icon" title="Use as target">arrow_forward</mat-icon>
              </button>
            }
          </div>
        }
      }

      @if (migrating()) {
        <div class="overlay">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Migrating…</span>
        </div>
      }

      @if (phase() === 'error') {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <div>
            <strong>Error</strong>
            <div class="muted">{{ errorMessage() || 'Unknown error' }}</div>
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(undefined)" [disabled]="migrating()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
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
    .dialog-title .sub-label {
      font-size: 0.82em; font-weight: 400;
      color: var(--secondary-text, #495057);
    }
    .dialog-content {
      max-height: 70vh; padding: 4px 20px 12px;
      line-height: 1.45; overflow-x: hidden;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
      position: relative;
    }
    .info-block {
      padding: 10px 12px; margin: 6px 0 12px;
      background: var(--secondary-background, #f6f7fa);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
    }
    .info-row { display: flex; gap: 12px; margin-bottom: 4px; font-size: 0.85em; }
    .info-label {
      flex: 0 0 60px; font-weight: 600;
      color: var(--secondary-text, #495057);
    }
    .info-value { flex: 1 1 auto; color: var(--primary-text, #212529); }
    .info-hint {
      margin-top: 6px; padding: 6px 8px;
      background: #fff3cd; color: #6a4f00;
      border-left: 3px solid #f0c040;
      font-size: 0.82em; border-radius: 2px;
    }

    .section-label {
      margin: 14px 0 6px; font-size: 0.85em; font-weight: 600;
      color: var(--secondary-text, #495057);
    }
    .muted { color: var(--secondary-text, #495057); font-size: 0.85em; }

    .filter-row { position: relative; margin: 4px 0 8px; }
    .filter-input {
      width: 100%; box-sizing: border-box;
      padding: 8px 32px 8px 12px;
      font: inherit; font-size: 0.9em;
      color: var(--primary-text, #212529);
      background: var(--primary-background, #ffffff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
    }
    .filter-input:focus { outline: none; border-color: var(--accent-color, #007bff); }
    .filter-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; padding: 0; border: 0; background: transparent;
      color: var(--secondary-text, #495057); font-size: 1.15em; line-height: 1; cursor: pointer;
    }
    .filter-status { font-size: 0.78em; color: var(--secondary-text, #495057); margin: 4px 0 8px; }

    .spinner-row { display: flex; align-items: center; gap: 12px; padding: 32px 0; justify-content: center; }
    .candidates-list {
      display: flex; flex-direction: column;
      max-height: 36vh; overflow-y: auto; overflow-x: hidden;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      background: var(--card-background, #ffffff);
    }
    .candidate-row {
      display: flex; align-items: center; gap: 10px;
      width: 100%; box-sizing: border-box;
      padding: 8px 12px;
      background: transparent; color: var(--primary-text, #212529);
      border: 0; border-bottom: 1px solid var(--border-color, #dee2e6);
      font: inherit; text-align: left; cursor: pointer;
      transition: background 0.12s;
    }
    .candidate-row:last-child { border-bottom: 0; }
    .candidate-row:hover:not([disabled]), .candidate-row:focus-visible {
      background: var(--hover-color, rgba(65, 65, 133, 0.15));
      outline: none;
    }
    .candidate-row[disabled] { opacity: 0.5; cursor: not-allowed; }
    .row-num {
      flex: 0 0 auto; max-width: 240px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      color: var(--secondary-text, #495057);
    }
    .row-name {
      flex: 1 1 auto; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-weight: 500;
    }
    .row-pick-icon {
      flex: 0 0 auto;
      color: var(--secondary-text, #495057);
      font-size: 18px; width: 18px; height: 18px;
    }
    .candidate-row:hover .row-pick-icon { color: var(--accent-color, #007bff); }

    .overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; font-size: 0.9em;
      background: rgba(255, 255, 255, 0.85);
      z-index: 5;
    }

    .error-banner {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 12px 14px; border-radius: 4px; margin: 4px 0 12px;
      background: #ffebee; color: #b71c1c;
    }
    mat-dialog-actions {
      padding: 8px 16px 12px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
    code { font-family: 'Roboto Mono', monospace; font-size: 0.85em; }
  `]
})
export class LegacyConnectorMigrateDialogComponent {
  phase = signal<'loading' | 'browse' | 'error'>('loading');
  context = signal<LegacyConnectorContextDto | null>(null);
  errorMessage = signal<string | null>(null);
  migrating = signal(false);

  filterText = signal('');
  searching = signal(false);
  searchResults = signal<CandidateFile[]>([]);

  private destroyRef = inject(DestroyRef);
  private searchTrigger$ = new Subject<string>();

  constructor(
    public dialogRef: MatDialogRef<LegacyConnectorMigrateDialogComponent, LegacyConnectorMigrateResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: LegacyConnectorMigrateData,
    private api: RfFileConnectorApiService,
    private fileApi: RfFileApiService,
  ) {
    this.loadContext();

    // Search wiring — same pattern as ConnectorTargetPickerDialogComponent
    // (debounced, switchMap-cancellable).
    this.searchTrigger$.pipe(
      debounceTime(300),
      switchMap(q => {
        if (!q.trim()) {
          this.searching.set(false);
          this.searchResults.set([]);
          return of(null);
        }
        this.searching.set(true);
        const criteria: SearchCriteria = {
          type: 'global', query: q.trim(),
          globalFilterLogic: 'OR', filters: {},
        };
        return this.fileApi.searchFiles(criteria, 50).pipe(
          catchError(err => {
            console.error('[LegacyConnectorMigrate] search failed:', err);
            this.searching.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(resp => {
      this.searching.set(false);
      if (!resp) return;
      const srcId = this.context()?.sourceFileId;
      const rows: CandidateFile[] = (resp.responseData?.content ?? [])
        .filter((f: any) => f.id !== srcId)
        .map((f: any): CandidateFile => ({
          id: f.id,
          fileNumber: f.fileNumber
            ? (Array.isArray(f.fileNumber) ? f.fileNumber.join('-') : f.fileNumber)
            : null,
          name: f.name ?? null,
          fileLink: f.fileLink ?? null,
        }));
      this.searchResults.set(rows);
    });
  }

  private loadContext(): void {
    this.api.legacyContext(this.data.equipmentId).subscribe({
      next: (resp) => {
        this.context.set(resp.responseData);
        this.phase.set('browse');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Failed to load context');
        this.phase.set('error');
      },
    });
  }

  onFilterChange(value: string): void {
    this.filterText.set(value);
    this.searchTrigger$.next(value);
  }

  clearFilter(): void {
    this.filterText.set('');
    this.searchResults.set([]);
    this.searching.set(false);
  }

  pickCandidate(c: CandidateFile): void { this.runMigration(c.id); }
  pickResult(c: CandidateFile): void { this.runMigration(c.id); }

  /**
   * Commit the migration. On MIGRATED, close with the audit item so the
   * caller can refresh state. On SKIP_HAS_DATA / FAILED, surface the reason
   * inline so the user can act (e.g. delete data, retry with different target).
   */
  private runMigration(targetFileId: number): void {
    if (this.migrating()) return;
    this.migrating.set(true);
    this.errorMessage.set(null);
    this.api.migrateOne(this.data.equipmentId, targetFileId).subscribe({
      next: (resp) => {
        const item = resp.responseData;
        if (item?.action === 'MIGRATED' || item?.action === 'SKIP_ALREADY_MIGRATED') {
          this.migrating.set(false);
          this.dialogRef.close({ item });
        } else {
          // Non-fatal skip with a reason the user can act on — stay open.
          this.migrating.set(false);
          this.errorMessage.set(item?.note || item?.action || 'Migration was skipped');
          this.phase.set('error');
        }
      },
      error: (err) => {
        this.migrating.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Migration failed');
        this.phase.set('error');
      },
    });
  }
}
