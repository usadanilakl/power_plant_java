import { Component, DestroyRef, inject, input, OnInit, signal, computed, effect, output, TemplateRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError, switchMap, exhaustMap, debounceTime, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { TableComponent, FilterOutRules } from '../../../../shared/table/refactored/table.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { FileTableControlService } from '../rf-file-table/rf-file-table-control.service';
import { RfFileApiService } from '../services/rf-file-api.service';
import { RfFileStateService } from '../services/rf-file-state.service';
import { FileMapperService } from '../services/rf-file-mapper.service';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { RfFileNavClickService } from './rf-file-nav-click.service';
import { CurrentFileService } from '../../../../services/current-file.service';
import { RevisionInfo, deriveRevisionKey, buildRevisionFileDto } from '../services/rf-file-api.service';

/**
 * Compact file navigation table for left panels.
 * Uses reactive pipelines (switchMap/exhaustMap) for search and load-more.
 * Default click service sets the current file — override at parent level for custom behavior.
 */
@Component({
  selector: 'app-rf-file-nav-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    { provide: TableClickService, useClass: RfFileNavClickService },
    { provide: TableControlsService, useClass: FileTableControlService },
  ],
  template: `
    <div class="file-table-container">
      @if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      }

      @if (isLoading()) {
        <div class="loading-indicator">
          Loading files...
        </div>
      }

      <!-- Revision badge cell: rendered in the leftmost column for rows whose
           file number is the head of a multi-revision group. -->
      <ng-template #revBadgeTpl let-item>
        @if (revisionCountFor(item) > 1) {
          <button
            type="button"
            class="rev-badge"
            title="Show revisions"
            (mousedown)="$event.stopPropagation()"
            (click)="openRevisions(item, $event)"
          >▾ {{ revisionCountFor(item) }}</button>
        }
      </ng-template>

      <!-- (filtersCleared) intentionally not bound: clearing publishes an empty
           criteria through (search), so binding both would fetch twice. -->
      <app-table
        [tableId]="tableId()"
        [items]="displayItems()"
        [columns]="columns()"
        [isTableIsolated]="isTableIsolated()"
        [columnUniqueOptions]="currentColumnUniqueItems()!"
        [columnAllOptions]="currentColumnAllItems()"
        [isLoadingMore]="stateService.loadingUniqueItems()"
        [isDragAndDropEnabled]="enableDragDrop()"
        [hoverDebounceTime]="0"
        [hoveredItemId]="null"
        [filterOutItems]="filterOutItems()"

        (search)="onSearch($event)"
        (sortChanged)="onTableSortChanged($event)"
        (loadMoreItems)="onLoadMore($event)"
        (loadInitialOptions)="loadUniqueItems($event.column, $event.filter)"
        (loadMoreOptions)="loadMoreUniqueItems($event.column, $event.filter)"
        (selectedItemsEvent)="selectedItemsEvent.emit($event)"
        (itemsReordered)="itemsReorderedEvent.emit($event)"
        (rowHoveredEvent)="rowHoveredEvent.emit($event)"
      ></app-table>

      <!-- Revision popover: lists the physical revisions of a document. -->
      @if (revPopover(); as pop) {
        <div class="rev-popover-backdrop" (mousedown)="closeRevisions()"></div>
        <div
          class="rev-popover"
          [style.left.px]="pop.x"
          [style.top.px]="pop.y"
          (mousedown)="$event.stopPropagation()"
        >
          <div class="rev-popover-header">
            Revisions
            <button type="button" class="rev-popover-close" (click)="closeRevisions()">&times;</button>
          </div>
          @if (pop.items.length === 0) {
            <div class="rev-popover-msg">No revisions found.</div>
          } @else {
            @for (rev of pop.items; track rev.fileName) {
              <button type="button" class="rev-row" (click)="openRevision(rev)">
                <span class="rev-label" [class.rev-current]="rev.revisionNumber === currentRev(pop.parent)">{{ revLabel(rev) }}</span>
                <span class="rev-fn">{{ rev.fileName }}</span>
                <span class="rev-view">Open</span>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .file-table-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .file-table-container app-table {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .error-message {
      padding: 8px 12px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin: 8px;
      flex-shrink: 0;
    }

    .loading-indicator {
      padding: 8px 12px;
      background-color: #e3f2fd;
      color: #1565c0;
      border-radius: 4px;
      margin: 8px;
      flex-shrink: 0;
    }

    /* Revision badge in the leftmost table cell */
    .rev-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
      color: #fff;
      background: var(--primary-color, #2196F3);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .rev-badge:hover { filter: brightness(0.92); }

    /* Revision popover */
    .rev-popover-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: transparent;
    }
    .rev-popover {
      position: fixed;
      z-index: 1001;
      min-width: 280px;
      max-width: 420px;
      max-height: 60vh;
      overflow-y: auto;
      background: var(--primary-background, #fff);
      border: 1px solid var(--border-color, #d0d0d0);
      border-radius: 6px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      padding: 4px 0;
    }
    .rev-popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text, #666);
      border-bottom: 1px solid var(--border-color, #eee);
    }
    .rev-popover-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; line-height: 1; color: var(--secondary-text, #888);
    }
    .rev-popover-msg { padding: 12px; font-size: 13px; color: var(--secondary-text, #777); }
    .rev-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 12px;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      background: none;
      border: none;
      text-decoration: none;
      color: var(--primary-text, #333);
      border-bottom: 1px solid var(--border-color, #f2f2f2);
    }
    .rev-row:last-child { border-bottom: none; }
    .rev-row:hover { background: rgba(33, 150, 243, 0.08); }
    .rev-label {
      flex-shrink: 0;
      min-width: 54px;
      font-weight: 600;
      color: var(--secondary-text, #888);
    }
    .rev-label.rev-current { color: var(--primary-color, #2196F3); }
    .rev-fn {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary-text, #333);
    }
    .rev-view {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--primary-color, #2196F3);
      text-decoration: none;
    }
    .rev-view:hover { text-decoration: underline; }
  `],
})
export class RfFileNavTableComponent implements OnInit {
  private apiService = inject(RfFileApiService);
  protected stateService = inject(RfFileStateService);
  private mapperService = inject(FileMapperService);
  private tableUtilService = inject(TableUtilService);
  private currentFileService = inject(CurrentFileService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-file-nav-table');
  inputItems = input<FileDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  fieldsToDisplay = input<(keyof FileDto)[]>();

  // Outputs
  selectedItemsEvent = output<FileDto[]>();
  itemsReorderedEvent = output<FileDto[]>();
  rowHoveredEvent = output<FileDto | null>();

  // Reactive pipeline triggers
  private searchTrigger$ = new Subject<SearchCriteria>();
  private loadMoreTrigger$ = new Subject<SearchCriteria>();

  // State
  items$ = toSignal(this.stateService.allLoadedFiles$, {
    initialValue: [],
  });
  columnInFocus = signal<string | null>(null);
  baseColumns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Revisions (disk-based): map of revision-key -> physical revision files.
  private revBadgeTpl = viewChild<TemplateRef<any>>('revBadgeTpl');
  revisionsMap = signal<Record<string, RevisionInfo[]>>({});
  revPopover = signal<{ x: number; y: number; parent: FileDto; items: RevisionInfo[] } | null>(null);

  // Columns = revision badge column (leftmost) + the configured display columns.
  columns = computed<Column[]>(() => {
    const cols = this.baseColumns();
    const tpl = this.revBadgeTpl();
    if (!tpl) return cols;
    const revCol: Column = {
      id: 'revisions', header: '', template: tpl, width: 64, sortable: false, filterable: false,
    };
    return [revCol, ...cols];
  });

  uniqueOptionsMap = computed(() => {
    if (this.isTableIsolated() && this.inputItems() && this.columns()) {
      return this.tableUtilService.getUniqueColumnOptionsMap(
        this.inputItems()!,
        this.columns()
      );
    }
    return null;
  });

  items = computed(() => {
    return this.inputItems() ?? this.items$();
  });

  // Revisions are physical sibling files, not separate DB rows — so there is one
  // table row per FileObject and nothing to collapse. The badge column simply
  // flags rows whose on-disk document has more than one revision.
  displayItems = computed<FileDto[]>(() => this.items());

  /** Full value set for the focused column — drives the dropdown's second section. */
  currentColumnAllItems = computed(() => this.stateService.currentColumnAllItems());

  currentColumnUniqueItems = computed(() => {
    if (this.uniqueOptionsMap() && this.columnInFocus()) {
      return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    }
    return this.stateService.currentColumnUniqueItems();
  });

  constructor() {
    effect(() => {
      const fields = this.fieldsToDisplay();
      this.baseColumns.set(this.mapperService.toTableColumns(fields));
    });

    // Search pipeline: debounce 300ms + switchMap (cancels stale requests)
    this.searchTrigger$.pipe(
      debounceTime(300),
      tap(() => {
        this.isLoading.set(true);
        this.errorMessage.set(null);
      }),
      switchMap(criteria =>
        this.apiService.searchFiles(criteria, 50).pipe(
          catchError(error => {
            console.error('Error searching files:', error);
            this.errorMessage.set('Search failed');
            this.isLoading.set(false);
            return of(null);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.stateService.clearFiles();
      this.stateService.resetPage();
      if (response?.responseData?.content) {
        this.stateService.addFiles(response.responseData.content);
        this.stateService.incrementPage();
      }
      this.isLoading.set(false);
    });

    // Load-more pipeline: exhaustMap (ignores triggers while loading)
    this.loadMoreTrigger$.pipe(
      filter(() => !this.isLoading()),
      exhaustMap(criteria => {
        this.isLoading.set(true);
        return this.apiService.searchFiles(criteria, 50).pipe(
          catchError(error => {
            console.error('Error loading more files:', error);
            this.isLoading.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response && response.responseData?.content && response.responseData.content.length > 0) {
        this.stateService.addFiles(response.responseData.content);
        this.stateService.incrementPage();
      }
      this.isLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadRevisionsMap();
  }

  private loadRevisionsMap(): void {
    if (this.inputItems()) return;
    this.apiService.getRevisionsMap().pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      if (res?.responseData) this.revisionsMap.set(res.responseData);
    });
  }

  private loadInitialData(): void {
    if (this.inputItems()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getFiles(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
            this.stateService.addFiles(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading files:', error);
          this.errorMessage.set('Failed to load files');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadUniqueItems(key, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadMoreUniqueItems(key, searchString);
  }

  clearUniqueValuesCache(): void {
    this.stateService.clearUniqueValuesCache();
  }

  onSearch(criteria: SearchCriteria): void {
    if (this.inputItems()) return;
    this.searchInDatabase(criteria);
  }

  /** Clear-all from the shared table: drop search criteria and reload the first page. */
  onClearFilters(): void {
    if (this.inputItems()) return;
    this.stateService.setSearchCriteria(null);
    this.stateService.clearFiles();
    this.stateService.resetPage();
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.apiService.getFiles(this.stateService.getCurrentPage(), 50).pipe(
      catchError((error) => {
        console.error('Error reloading files:', error);
        this.errorMessage.set('Failed to load files');
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      if (response?.responseData?.content?.length) {
        this.stateService.addFiles(response.responseData.content);
        this.stateService.incrementPage();
      }
      this.isLoading.set(false);
    });
  }

  private searchInDatabase(criteria: SearchCriteria): void {
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
    const mergedCriteria: SearchCriteria = {
      ...existingCriteria,
      ...criteria,
      page: 1,
      pageSize: 50,
    };
    this.stateService.setSearchCriteria(mergedCriteria);
    this.searchTrigger$.next(mergedCriteria);
  }

  onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    if (this.inputItems()) return;
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
    const searchCriteria: SearchCriteria = {
      ...existingCriteria,
      sortColumn: event.column.accessorKey || event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: 50,
      type: existingCriteria.type ?? 'sort',
    };
    this.stateService.setSearchCriteria(searchCriteria);
    this.searchTrigger$.next(searchCriteria);
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (!this.loadMoreEnabled() || this.isLoading()) return;
    const existingCriteria = this.stateService.getCurrentSearchCriteria();
    const incomingCriteria = criteria || {};
    const loadMoreCriteria: SearchCriteria = {
      ...(existingCriteria || { type: 'column', filters: {} }),
      ...incomingCriteria,
      sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
      sortDirection: incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };
    this.loadMoreTrigger$.next(loadMoreCriteria);
  }

  // ===== Revisions (disk-based) =====

  /** Physical revisions for a row's on-disk document, keyed by its fileLink. */
  private revisionsFor(f: FileDto): RevisionInfo[] {
    return this.revisionsMap()[deriveRevisionKey(f.fileLink)] ?? [];
  }

  /** Number of physical revisions for a row (0 or 1 means "no revision badge"). */
  revisionCountFor(f: FileDto): number {
    return this.revisionsFor(f).length;
  }

  revLabel(rev: RevisionInfo): string {
    return rev.revisionNumber === 0 ? 'Original' : `rev ${rev.revisionNumber}`;
  }

  /** Revision number the row's DB entry currently points at (from its fileNumber). */
  currentRev(f: FileDto): number {
    const joined = (f.fileNumber ?? []).join('__SEP__');
    const m = joined.match(/-rev(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  openRevisions(item: FileDto, event: MouseEvent): void {
    event.stopPropagation();
    const items = this.revisionsFor(item);
    // Position the popover near the click, clamped to the viewport.
    const x = Math.min(event.clientX, window.innerWidth - 440);
    const y = Math.min(event.clientY, window.innerHeight - 200);
    this.revPopover.set({ x: Math.max(8, x), y: Math.max(8, y), parent: item, items });
  }

  closeRevisions(): void {
    this.revPopover.set(null);
  }

  /** Open a revision in the main in-app viewer (pdf/jpg toggle works there). */
  openRevision(rev: RevisionInfo): void {
    const parent = this.revPopover()?.parent;
    this.closeRevisions();
    if (!parent) return;
    if (rev.revisionNumber === this.currentRev(parent)) {
      // The DB row already points at this revision — open it with full markup.
      this.currentFileService.setCurrentFile(parent);
    } else {
      this.currentFileService.setCurrentFile(buildRevisionFileDto(parent, rev, 'jpg'));
    }
  }
}
