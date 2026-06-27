import { Component, Inject, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FileDto } from '../../../../models/file/file.model';
import { CounterpartCandidateDto } from '../../../../models/file/clone.model';
import { RfFileApiService } from '../services/rf-file-api.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { ImportFromCounterpartDialogComponent } from '../import-from-counterpart-dialog/import-from-counterpart-dialog.component';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

export interface SetCounterpartDialogData {
  file: FileDto;
}

type Phase = 'loading' | 'browse' | 'linking' | 'linked' | 'error';

/**
 * "Set Counterpart File…" picker. On open, fetches ranked candidate files
 * (tag-swap + Levenshtein-1/2 + same fileType/vendor heuristics). The user can
 * filter the suggestion list with a free-text input (client-side over the
 * loaded candidates), pick one, and the dialog calls {@code /link-counterpart}
 * to wire the bidirectional pointer.
 *
 * <p>After linking, offers a "Import points now?" action that hands off to
 * {@link ImportFromCounterpartDialogComponent} so the user can copy
 * equipment+loto in one flow if they want to.
 */
@Component({
  selector: 'app-set-counterpart-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      Set Counterpart File
      <span class="file-label" [title]="fileLabel()">{{ fileLabel() }}</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (phase() === 'loading') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Looking for counterpart candidates…</span>
        </div>
      }

      @if (phase() === 'browse') {
        <p class="hint">
          @if (!filterText()) {
            Top suggestions ranked by name similarity (tag-swap U1↔U2, 1–2 letter
            difference) and same file type/vendor. Type to search across all files.
          } @else {
            Searching all files for "{{ filterText() }}". Clear to return to suggestions.
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
            @if (filterText()) {
              No files match "{{ filterText() }}". Try a different term.
            } @else {
              No candidates suggested. Type in the search box above to find any file.
            }
          </p>
        } @else {
          <!-- Clickable rows — entire row is the action, no separate Link button
               needed. Avoids the multi-column overflow the old table had. -->
          <div class="candidates-list" role="list">
            @for (c of displayedRows(); track c.id) {
              <button class="candidate-row" type="button" role="listitem" (click)="link(c)">
                <span class="row-num"><code>{{ c.fileNumber || '—' }}</code></span>
                <span class="row-name" [title]="c.name || ''">{{ c.name || '—' }}</span>
                <span class="row-vendor" [title]="'Vendor: ' + (c.vendorName || '')">{{ c.vendorName || '—' }}</span>
                <span class="row-reason" [title]="c.matchReason">{{ c.matchReason }}</span>
                <mat-icon class="row-link-icon" [title]="'Link as counterpart'">link</mat-icon>
              </button>
            }
          </div>
        }
      }

      @if (phase() === 'linking') {
        <div class="spinner-row">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Linking counterparts…</span>
        </div>
      }

      @if (phase() === 'linked' && linkedCandidate()) {
        <div class="success-banner">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Linked as counterpart</strong>
            <div class="muted">
              {{ data.file.name || ('File #' + data.file.id) }}
              ↔
              {{ linkedCandidate()!.name || ('File #' + linkedCandidate()!.id) }}
              ({{ linkedCandidate()!.fileNumber }})
            </div>
          </div>
        </div>
        <p>
          You can now use <strong>"Copy Points from Counterpart"</strong> from
          the context menu to import equipment + LOTO from this file into the
          other. Want to do it right now?
        </p>
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
      @if (phase() === 'browse' || phase() === 'loading') {
        <button mat-button (click)="dialogRef.close()">Cancel</button>
      }
      @if (phase() === 'linked') {
        <button mat-button (click)="dialogRef.close({ linked: true })">Done</button>
        <button mat-raised-button color="primary" (click)="importNow()">Import points now…</button>
      }
      @if (phase() === 'error') {
        <button mat-raised-button color="primary" (click)="dialogRef.close()">Close</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    /* Uses THE PROJECT'S theme variables (defined in theme-styles.css and
       auto-flipped by the .dark-theme class ThemeService applies to body).
       Material's --mat-sys-* tokens are unused by this app, which is why
       earlier attempts at theming the dialog produced dark-on-dark text. */

    /* Style the Material dialog wrapper itself so it doesn't show a default
       Material surface color around our themed content (was causing a "halo"
       in dark mode). */
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
      padding: 4px 20px 12px;
      line-height: 1.45;
      overflow-x: hidden;
      background: var(--card-background, #ffffff);
      color: var(--primary-text, #212529);
    }
    .hint { color: var(--secondary-text, #495057); font-size: 0.85em; margin: 6px 0; }
    .muted { color: var(--secondary-text, #495057); font-size: 0.85em; }

    /* Filter input */
    .filter-row { position: relative; margin: 4px 0 8px; }
    .filter-input {
      width: 100%; box-sizing: border-box;
      padding: 8px 32px 8px 12px;
      font: inherit; font-size: 0.9em;
      color: var(--primary-text, #212529);
      background: var(--primary-background, #ffffff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      transition: border-color 0.15s;
    }
    .filter-input:focus { outline: none; border-color: var(--accent-color, #007bff); }
    .filter-input::placeholder { color: var(--secondary-text, #495057); opacity: 0.7; }
    .filter-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; padding: 0; border: 0; background: transparent;
      color: var(--secondary-text, #495057);
      font-size: 1.15em; line-height: 1; cursor: pointer;
    }
    .filter-clear:hover { color: var(--primary-text, #212529); }
    .filter-status { font-size: 0.78em; color: var(--secondary-text, #495057); margin: 4px 0 8px; }

    .spinner-row {
      display: flex; align-items: center; gap: 12px; padding: 32px 0; justify-content: center;
      color: var(--primary-text, #212529);
    }

    /* Clickable row list */
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
      font: inherit; text-align: left;
      cursor: pointer;
      transition: background 0.12s;
    }
    .candidate-row:last-child { border-bottom: 0; }
    .candidate-row:hover,
    .candidate-row:focus-visible {
      background: var(--hover-color, rgba(65, 65, 133, 0.15));
      outline: none;
    }
    .candidate-row .row-num {
      flex: 0 0 auto;
      min-width: 0; max-width: 240px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      color: var(--secondary-text, #495057);
    }
    .candidate-row .row-name {
      flex: 1 1 auto;
      min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-weight: 500;
      color: var(--primary-text, #212529);
    }
    .candidate-row .row-vendor {
      flex: 0 0 auto;
      color: var(--secondary-text, #495057);
      font-size: 0.85em;
      white-space: nowrap;
    }
    .candidate-row .row-reason {
      flex: 0 0 auto;
      display: inline-block;
      max-width: 180px;
      background: var(--accent-color, #007bff);
      color: #ffffff;
      padding: 2px 8px; border-radius: 10px;
      font-size: 0.75em; line-height: 1.3;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      opacity: 0.85;
    }
    .candidate-row .row-link-icon {
      flex: 0 0 auto;
      color: var(--secondary-text, #495057);
      font-size: 18px; width: 18px; height: 18px;
      transition: color 0.12s;
    }
    .candidate-row:hover .row-link-icon,
    .candidate-row:focus-visible .row-link-icon {
      color: var(--accent-color, #007bff);
    }

    /* Semantic banners — fixed colors so meaning is consistent across themes. */
    .success-banner, .error-banner {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 12px 14px; border-radius: 4px; margin: 4px 0 12px;
    }
    .success-banner { background: #e8f5e9; color: #1b5e20; }
    .error-banner { background: #ffebee; color: #b71c1c; }
    .success-banner mat-icon, .error-banner mat-icon { margin-top: 2px; flex-shrink: 0; }

    mat-dialog-actions {
      padding: 8px 16px 12px;
      background: var(--card-background, #ffffff);
      border-top: 1px solid var(--border-color, #dee2e6);
    }
    code { font-family: 'Roboto Mono', monospace; font-size: 0.85em; color: inherit; }
  `]
})
export class SetCounterpartDialogComponent {
  phase = signal<Phase>('loading');
  /** Server-ranked suggestions — shown when filter is empty. */
  candidates = signal<CounterpartCandidateDto[]>([]);
  /** Server-side search hits — populated when filter has text. */
  searchResults = signal<CounterpartCandidateDto[]>([]);
  /** Filter text as a signal so the computed below re-runs when it changes.
   *  (Previously a plain string, so the computed never updated.) */
  filterText = signal('');
  searching = signal(false);
  linkedCandidate = signal<CounterpartCandidateDto | null>(null);
  errorMessage = signal<string | null>(null);

  private destroyRef = inject(DestroyRef);
  private searchTrigger$ = new Subject<string>();

  /**
   * What the table renders:
   * - Empty filter → server-ranked suggestions (top 25, scored by name/vendor/Levenshtein)
   * - Non-empty filter → server-side /files/search hits (covers ALL files, not just
   *   the suggestion pool). Lets the user pick a counterpart whose file number /
   *   name doesn't match the suggestion heuristics.
   */
  displayedRows = computed(() => {
    return this.filterText().trim() ? this.searchResults() : this.candidates();
  });

  constructor(
    public dialogRef: MatDialogRef<SetCounterpartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SetCounterpartDialogData,
    private api: RfFileApiService,
    private messages: GlobalMessageService,
    private dialog: MatDialog,
  ) {
    this.loadCandidates();
    // Debounced server-side search — fires 300ms after user stops typing,
    // switchMap cancels stale requests so only the latest result lands.
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
          type: 'global',
          query: q.trim(),
          globalFilterLogic: 'OR',
          filters: {},
        };
        return this.api.searchFiles(criteria, 50).pipe(
          catchError(err => {
            console.error('[SetCounterpartDialog] search failed:', err);
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
        .filter((f: any) => f.id !== this.data.file.id)  // exclude self
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

  /** Called from the template's (input) handler to push new filter text. */
  onFilterChange(value: string): void {
    this.filterText.set(value);
    this.searchTrigger$.next(value);
  }

  clearFilter(): void {
    this.filterText.set('');
    this.searchResults.set([]);
    this.searching.set(false);
  }

  fileLabel(): string {
    const fn = this.data.file.fileNumber;
    if (Array.isArray(fn) && fn.length > 0) return fn.join(' / ');
    return this.data.file.name || `File #${this.data.file.id ?? '?'}`;
  }

  private loadCandidates(): void {
    if (!this.data.file.id) {
      this.errorMessage.set('Source file has no ID');
      this.phase.set('error');
      return;
    }
    this.api.counterpartCandidates(this.data.file.id, 25).subscribe({
      next: (resp) => {
        this.candidates.set(resp.responseData ?? []);
        this.phase.set('browse');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Failed to load candidates');
        this.phase.set('error');
      },
    });
  }

  link(c: CounterpartCandidateDto): void {
    if (!this.data.file.id) return;
    this.phase.set('linking');
    this.api.linkCounterpart(this.data.file.id, c.id).subscribe({
      next: () => {
        this.linkedCandidate.set(c);
        this.phase.set('linked');
        this.messages.showSuccess(`Linked counterpart: ${c.fileNumber || c.id}`);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Link failed');
        this.phase.set('error');
      },
    });
  }

  /**
   * Hand off to the import dialog with the same source file. We pass a freshly
   * constructed FileDto that includes the new counterpartId so the import
   * dialog doesn't need to re-fetch (it would still work if we let it).
   */
  importNow(): void {
    const linked = this.linkedCandidate();
    if (!linked) return;
    const fileWithCounterpart = new FileDto({
      ...this.data.file,
      counterpartId: linked.id,
    });
    this.dialogRef.close({ linked: true });
    this.dialog.open(ImportFromCounterpartDialogComponent, {
      data: { file: fileWithCounterpart, counterpartName: linked.name, counterpartFileNumber: linked.fileNumber },
      autoFocus: false,
      restoreFocus: false,
    });
  }
}
