import { Component, Inject, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FileDto } from '../../../../models/file/file.model';
import { CounterpartCandidateDto } from '../../../../models/file/clone.model';
import { RfFileApiService } from '../services/rf-file-api.service';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

export interface ConnectorTargetPickerData {
  /** The file the connector is being drawn ON (used to exclude self + run name-similarity suggestions). */
  sourceFile: FileDto;
}

/**
 * Lean file picker for the "draw a connector → pick its target file" flow.
 * Reuses the {@code /files/{id}/counterpart-candidates} suggestion endpoint
 * (already smart about tag-swap and name similarity) plus server-side search
 * via {@code /files/search} when the user types.
 *
 * <p>Distinct from {@code SetCounterpartDialogComponent} because that one
 * links files as bidirectional counterparts (different domain concept). This
 * dialog's only output is the picked {@link FileDto} — the caller (the draw
 * handler) is responsible for persisting whatever connector entity uses it.
 */
@Component({
  selector: 'app-connector-target-picker-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      Pick Target File for Connector
      <span class="file-label" [title]="sourceLabel()">on {{ sourceLabel() }}</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (phase() === 'loading') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Loading suggestions…</span>
        </div>
      }

      @if (phase() === 'browse') {
        <p class="hint">
          @if (!filterText()) {
            Suggested files (same fileType / similar number / similar name). Type to search across all files.
          } @else {
            Searching all files for "{{ filterText() }}".
          }
        </p>
        <div class="filter-row">
          <input
            type="text"
            class="filter-input"
            [value]="filterText()"
            (input)="onFilterChange($any($event.target).value)"
            placeholder="Search all files by name, file number, vendor, system…"/>
          @if (filterText()) {
            <button class="filter-clear" type="button" (click)="clearFilter()" title="Clear search">×</button>
          }
        </div>
        @if (searching()) {
          <p class="filter-status">Searching…</p>
        }

        @if (displayedRows().length === 0) {
          <p class="muted">
            @if (filterText()) { No files match "{{ filterText() }}".
            } @else { No suggestions. Type to search. }
          </p>
        } @else {
          <div class="candidates-list" role="list">
            @for (c of displayedRows(); track c.id) {
              <button class="candidate-row" type="button" role="listitem" (click)="pick(c)">
                <span class="row-num"><code>{{ c.fileNumber || '—' }}</code></span>
                <span class="row-name" [title]="c.name || ''">{{ c.name || '—' }}</span>
                <span class="row-vendor">{{ c.vendorName || '—' }}</span>
                <span class="row-reason" [title]="c.matchReason">{{ c.matchReason }}</span>
                <mat-icon class="row-pick-icon" title="Use as target">arrow_forward</mat-icon>
              </button>
            }
          </div>
        }
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
      <button mat-button (click)="dialogRef.close()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Uses project's theme tokens — matches SetCounterpartDialog styling. */
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
      max-height: 70vh; padding: 4px 20px 12px;
      line-height: 1.45; overflow-x: hidden;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .hint { color: var(--secondary-text, #495057); font-size: 0.85em; margin: 6px 0; }
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
    .filter-input::placeholder { color: var(--secondary-text, #495057); opacity: 0.7; }
    .filter-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; padding: 0; border: 0; background: transparent;
      color: var(--secondary-text, #495057); font-size: 1.15em; line-height: 1; cursor: pointer;
    }
    .filter-status { font-size: 0.78em; color: var(--secondary-text, #495057); margin: 4px 0 8px; }
    .spinner-row { display: flex; align-items: center; gap: 12px; padding: 32px 0; justify-content: center; }
    .candidates-list {
      display: flex; flex-direction: column;
      max-height: 50vh; overflow-y: auto; overflow-x: hidden;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      background: var(--card-background, #ffffff);
    }
    .candidate-row {
      display: flex; align-items: center; gap: 10px;
      width: 100%; box-sizing: border-box;
      padding: 8px 12px;
      background: transparent;
      color: var(--primary-text, #212529);
      border: 0;
      border-bottom: 1px solid var(--border-color, #dee2e6);
      font: inherit; text-align: left; cursor: pointer;
      transition: background 0.12s;
    }
    .candidate-row:last-child { border-bottom: 0; }
    .candidate-row:hover, .candidate-row:focus-visible {
      background: var(--hover-color, rgba(65, 65, 133, 0.15));
      outline: none;
    }
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
    .row-vendor {
      flex: 0 0 auto;
      color: var(--secondary-text, #495057);
      font-size: 0.85em; white-space: nowrap;
    }
    .row-reason {
      flex: 0 0 auto;
      max-width: 180px;
      background: var(--accent-color, #007bff);
      color: #fff;
      padding: 2px 8px; border-radius: 10px;
      font-size: 0.75em; line-height: 1.3; opacity: 0.85;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .row-pick-icon {
      flex: 0 0 auto;
      color: var(--secondary-text, #495057);
      font-size: 18px; width: 18px; height: 18px;
    }
    .candidate-row:hover .row-pick-icon { color: var(--accent-color, #007bff); }
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
export class ConnectorTargetPickerDialogComponent {
  phase = signal<'loading' | 'browse' | 'error'>('loading');
  candidates = signal<CounterpartCandidateDto[]>([]);
  searchResults = signal<CounterpartCandidateDto[]>([]);
  filterText = signal('');
  searching = signal(false);
  errorMessage = signal<string | null>(null);

  private destroyRef = inject(DestroyRef);
  private searchTrigger$ = new Subject<string>();

  /** Empty filter → suggestions; non-empty → server search hits. */
  displayedRows = computed(() => {
    return this.filterText().trim() ? this.searchResults() : this.candidates();
  });

  constructor(
    public dialogRef: MatDialogRef<ConnectorTargetPickerDialogComponent, FileDto | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectorTargetPickerData,
    private api: RfFileApiService,
  ) {
    this.loadSuggestions();

    // Debounced server-side search — switchMap cancels stale requests.
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
        return this.api.searchFiles(criteria, 50).pipe(
          catchError(err => {
            console.error('[ConnectorTargetPicker] search failed:', err);
            this.searching.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(resp => {
      this.searching.set(false);
      if (!resp) return;
      const rows = (resp.responseData?.content ?? [])
        .filter((f: any) => f.id !== this.data.sourceFile.id)
        .map((f: any): CounterpartCandidateDto => ({
          id: f.id,
          fileNumber: f.fileNumber ? (Array.isArray(f.fileNumber) ? f.fileNumber.join('-') : f.fileNumber) : null,
          name: f.name,
          fileTypeName: f.fileType?.name ?? null,
          vendorName: f.vendor?.name ?? null,
          score: 0,
          matchReason: 'Search match',
        }));
      this.searchResults.set(rows);
    });
  }

  sourceLabel(): string {
    const fn = this.data.sourceFile.fileNumber;
    if (Array.isArray(fn) && fn.length > 0) return fn.join(' / ');
    return this.data.sourceFile.name || `File #${this.data.sourceFile.id ?? '?'}`;
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

  private loadSuggestions(): void {
    if (!this.data.sourceFile.id) {
      this.errorMessage.set('Source file has no ID');
      this.phase.set('error');
      return;
    }
    this.api.counterpartCandidates(this.data.sourceFile.id, 25).subscribe({
      next: (resp) => {
        this.candidates.set(resp.responseData ?? []);
        this.phase.set('browse');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Failed to load suggestions');
        this.phase.set('error');
      },
    });
  }

  /**
   * Pick the candidate — fetch its full FileDto (the row only has a slim
   * projection) and close the dialog with it as the result. Caller decides
   * what to do with the file (e.g., save a FileConnector).
   */
  pick(c: CounterpartCandidateDto): void {
    this.api.getFileById(String(c.id)).subscribe({
      next: (resp) => this.dialogRef.close(FileDto.fromJson(resp.responseData)),
      error: () => {
        // Fallback — close with a minimal FileDto built from the candidate.
        // Caller usually only needs id + name; full DTO is best-effort.
        const fallback = new FileDto({
          id: c.id, name: c.name ?? '',
          fileNumber: c.fileNumber ? [c.fileNumber] : [],
        });
        this.dialogRef.close(fallback);
      },
    });
  }
}
