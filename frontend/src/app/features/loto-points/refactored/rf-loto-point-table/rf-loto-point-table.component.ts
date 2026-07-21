import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  effect,
  computed,
  viewChild,
  TemplateRef,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  FilterOutRules,
  TableComponent,
} from '../../../../shared/table/refactored/table.component';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { LotoPointContextMenuService } from '../services/loto-point-context-menu.service';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { LotoPointBulkEditFormComponent } from '../loto-point-bulk-edit-form/loto-point-bulk-edit-form.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfLotoPointClickService } from './rf-loto-point-click.service';
import { CommentCellComponent } from '../../../../shared/comments-dialog/comment-cell.component';
import { LotoPointFieldName } from '../../../../models/loto/loto-point.model';
import { LotoPointService } from '../../../../services/loto/loto-point.service';
import { FileDto } from '../../../../models/file/file.model';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { LotoPointFileViewerComponent } from '../loto-point-file-viewer/loto-point-file-viewer.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-rf-loto-point-table',
  standalone: true,
  // forwardRef on the bulk-edit form breaks the import cycle (see loto-point-bulk-edit-form).
  imports: [CommonModule, TableComponent, forwardRef(() => LotoPointBulkEditFormComponent), CommentCellComponent, RfPopupProjectionComponent, LotoPointFileViewerComponent],
  // providers: [
  //   { provide: TableClickService, useClass: RfLotoPointClickService }
  // ],
  templateUrl: './rf-loto-point-table.component.html',
  styleUrl: './rf-loto-point-table.component.css',
})
export class RfLotoPointTableComponent implements OnInit, AfterViewInit {
  private apiService = inject(RfLotoPointApiService);
  protected stateService = inject(RfLotoPointStateService);
  private mapperService = inject(LotoPointMapperService);
  protected contextMenuService = inject(LotoPointContextMenuService);
  private tableUtilService = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-loto-point-table');
  inputItems = input<LotoPointDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  hoveredItemId = input<number | null>(null);
  /** ID of item to scroll to (triggered by external click events) */
  scrollToItemId = input<number | null>(null);
  /** ID of item externally "clicked" — highlights the row without a real click. See TableComponent. */
  externalClickedItemId = input<number | null>(null);
  fieldsToDisplay = input<LotoPointFieldName[]>();
  /** Initial search criteria to apply when the table loads */
  initialSearchCriteria = input<SearchCriteria | null>(null);

  // Outputs
  selectedItemsEvent = output<LotoPointDto[]>();
  itemsReorderedEvent = output<LotoPointDto[]>();
  rowHoveredEvent = output<LotoPointDto | null>();
  rowDoubleClickedEvent = output<LotoPointDto>();
  /** Emitted when bulk edit is applied - parent should refresh data if using inputItems */
  bulkEditAppliedEvent = output<LotoPointDto[]>();

  // Template refs
  commentCellTemplate = viewChild<TemplateRef<any>>('commentCellTemplate');
  photosCellTemplate = viewChild<TemplateRef<any>>('photosCellTemplate');
  pidsCellTemplate = viewChild<TemplateRef<any>>('pidsCellTemplate');

  private lotoPointService = inject(LotoPointService);

  //===== P&IDs on-demand fetch state =====
  /**
   * Per-row P&ID button: on click, fetch related files for THAT specific
   * LotoPoint (not on page load) and open a popup. Keeps table render cheap
   * even for pages with 50+ rows — the P&IDs join walks
   * LotoPoint → Equipment → FileObject and would N+1 across a page.
   */
  isPidsPopupOpen = signal<boolean>(false);
  pidsPopupLotoPoint = signal<LotoPointDto | null>(null);
  pidsPopupRowSummary = signal<LotoPointDto | null>(null); // holds row DTO for popup title while full DTO fetches
  isLoadingPids = signal<boolean>(false);
  pidsError = signal<string | null>(null);

  openPidsPopup(item: LotoPointDto, event?: MouseEvent): void {
    event?.stopPropagation(); // don't fire a row-click while opening
    if (!item?.id) return;
    this.pidsPopupRowSummary.set(item);
    this.pidsPopupLotoPoint.set(null);
    this.pidsError.set(null);
    this.isLoadingPids.set(true);
    this.isPidsPopupOpen.set(true);
    // Refetch the full DTO — the paginated row carries only `equipmentIds`
    // (comma-separated), not the `equipmentList` shape data that
    // LotoPointFileViewerComponent needs to draw equipment overlays on the
    // JPG. One targeted GET per popup open; nothing pre-fetched.
    this.lotoPointService.getLotoPointById(String(item.id)).subscribe({
      next: (response) => {
        const full = response?.responseData
          ? LotoPointDto.fromJson(response.responseData)
          : null;
        this.pidsPopupLotoPoint.set(full);
        this.isLoadingPids.set(false);
      },
      error: (err) => {
        console.error('Failed to load P&IDs:', err);
        this.pidsError.set(err?.error?.message || err?.message || 'Failed to load P&IDs');
        this.isLoadingPids.set(false);
      },
    });
  }

  closePidsPopup(): void {
    this.isPidsPopupOpen.set(false);
  }

  getPictureUrl(picture: FileDto): string {
    if (!picture?.fileLink) return '';
    return `${environment.baseApiUrl}/${picture.fileLink}`;
  }

  //===== Photos expand popup =====
  /**
   * Photos cell click: open a popup with every attached picture on the row
   * at full size. Uses the row's LotoPointDto.pictures (already hydrated on
   * the /paginated response since d4c5f70d/ad37ca6f), so no extra fetch.
   * Click a tile inside the popup to open the picture in a new tab.
   */
  isPhotosPopupOpen = signal<boolean>(false);
  photosPopupLotoPoint = signal<LotoPointDto | null>(null);

  photosPopupPictures = computed<FileDto[]>(
    () => this.photosPopupLotoPoint()?.pictures ?? []
  );

  openPhotosPopup(item: LotoPointDto, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!item?.pictures || item.pictures.length === 0) return;
    this.photosPopupLotoPoint.set(item);
    this.isPhotosPopupOpen.set(true);
  }

  closePhotosPopup(): void {
    this.isPhotosPopupOpen.set(false);
  }

  openPhotoInNewTab(picture: FileDto, event?: MouseEvent): void {
    event?.stopPropagation();
    const url = this.getPictureUrl(picture);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  // State
  items$ = toSignal(this.stateService.allLoadedLotoPoints$, {
    initialValue: [],
  });
  columnInFocus = signal<string | null>(null);

  /**
   * This table instance's current row selection. Fed to the bulk-edit form so
   * each table edits its OWN selection — the root state service is shared across
   * tables (e.g. double-table source + destination) and can't disambiguate.
   */
  currentSelection = signal<LotoPointDto[]>([]);

  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

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

  currentColumnUniqueItems = computed(() => {
    if(this.uniqueOptionsMap() && this.columnInFocus()) return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    else{
      return this.stateService.currentColumnUniqueItems();
    }
  });

  private _initialized = false;

  /**
   * Monotonic token for "replace" loads (initial / search / sort). Each such
   * load captures the current value; its response is only applied if no newer
   * load has started since. This drops stale in-flight responses that would
   * otherwise be appended AFTER a clearLotoPoints() — the cause of previous /
   * non-matching results lingering when the search term changes rapidly.
   */
  private loadSeq = 0;

  constructor() {
    // Initialize columns whenever fieldsToDisplay changes
    effect(() => {
      const fields = this.fieldsToDisplay();
      const cols = this.mapperService.toTableColumns(fields);
      // Assign comment cell template if available
      const template = this.commentCellTemplate();
      if (template) {
        const commentCol = cols.find(c => c.id === 'comment');
        if (commentCol) {
          commentCol.template = template;
        }
      }
      // Photos + P&IDs custom-cell templates. viewChild is null until the
      // view initializes so this pass may skip; ngAfterViewInit re-wires
      // once the templates exist. Assigning `template` swaps the
      // accessorFn-based default rendering for the ng-template.
      const photosTpl = this.photosCellTemplate();
      if (photosTpl) {
        const col = cols.find(c => c.id === 'pictures');
        if (col) col.template = photosTpl;
      }
      const pidsTpl = this.pidsCellTemplate();
      if (pidsTpl) {
        const col = cols.find(c => c.id === 'pids');
        if (col) col.template = pidsTpl;
      }
      this.columns.set(cols);
    });

    // React to initialSearchCriteria changes after the first load (e.g. from query param updates)
    effect(() => {
      const criteria = this.initialSearchCriteria();
      if (!this._initialized) return;
      if (criteria && (criteria.query || (criteria.filters && Object.keys(criteria.filters).length > 0))) {
        this.stateService.clearLotoPoints();
        this.loadInitialDataWithCriteria(criteria);
      }
    });
  }

  ngAfterViewInit(): void {
    // Assign comment / photos / pids cell templates now that viewChild
    // refs have resolved. Rebuild the columns signal once with all three
    // wired so the table renders custom cells on the first paint.
    const cols = this.columns();
    let mutated = false;
    const commentTpl = this.commentCellTemplate();
    if (commentTpl) {
      const c = cols.find(x => x.id === 'comment');
      if (c && c.template !== commentTpl) { c.template = commentTpl; mutated = true; }
    }
    const photosTpl = this.photosCellTemplate();
    if (photosTpl) {
      const c = cols.find(x => x.id === 'pictures');
      if (c && c.template !== photosTpl) { c.template = photosTpl; mutated = true; }
    }
    const pidsTpl = this.pidsCellTemplate();
    if (pidsTpl) {
      const c = cols.find(x => x.id === 'pids');
      if (c && c.template !== pidsTpl) { c.template = pidsTpl; mutated = true; }
    }
    if (mutated) this.columns.set([...cols]);
  }

  ngOnInit(): void {
    // Only the no-criteria case loads here. Criteria-driven loads are owned by
    // the initialSearchCriteria effect (which runs once after init and on every
    // change) — loading them here too would fire a duplicate concurrent fetch
    // and render every row twice.
    const initialCriteria = this.initialSearchCriteria();
    const hasCriteria = !!(initialCriteria && (initialCriteria.query || (initialCriteria.filters && Object.keys(initialCriteria.filters).length > 0)));
    if (!hasCriteria) {
      this.loadInitialData();
    }
    this._initialized = true;
  }

  /**
   * Load initial batch of LOTO points with search criteria applied
   */
  private loadInitialDataWithCriteria(criteria: SearchCriteria): void {
    if (this.inputItems()) return;

    const seq = ++this.loadSeq;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const searchCriteria: SearchCriteria = {
      ...criteria,
      page: 1,
      pageSize: 50,
    };

    this.stateService.setSearchCriteria(searchCriteria);

    this.apiService
      .searchLotoPoints(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (seq !== this.loadSeq) return; // a newer load superseded this one
          if (response.responseData?.content) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading LOTO points with criteria:', error);
          this.errorMessage.set('Failed to load LOTO points');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Load initial batch of LOTO points
   */
  private loadInitialData(): void {
    if (this.inputItems()) return; // If items are provided, no need to load initial data.

    const seq = ++this.loadSeq;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getLotoPoints(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (seq !== this.loadSeq) return; // a newer load superseded this one
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading LOTO points:', error);
          this.errorMessage.set('Failed to load LOTO points');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
  /**
   * Load unique items for a column (delegates to state service)
   */
  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoPointDto;
    this.columnInFocus.set(key);
    if(!this.isTableIsolated())this.stateService.loadUniqueItems(key, searchString);
  }

  /**
   * Load more unique items for a column (delegates to state service)
   */
  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoPointDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated())
      this.stateService.loadMoreUniqueItems(key, searchString);
    // this.onLoadMore()
  }

  /**
   * Clear unique values cache (delegates to state service)
   */
  clearUniqueValuesCache(): void {
    this.stateService.clearUniqueValuesCache();
  }

  /**
   * Handle search/filter from table component
   */
  onSearch(criteria: SearchCriteria): void {
    const isUsingInputItems = this.inputItems();

    if (isUsingInputItems) {
      // Search within provided items only
      this.searchWithinInputItems(criteria);
    } else {
      // Search in database
      this.searchInDatabase(criteria);
    }
  }

  /**
   * Search within the provided input items
   */
  private searchWithinInputItems(criteria: SearchCriteria): void {
    const inputItems = this.inputItems();
    if (!inputItems || inputItems.length === 0) return;

    let filtered = inputItems;

    if (criteria.type === 'global' && criteria.query) {
      // Global search across all properties
      filtered = inputItems.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(criteria.query!.toLowerCase())
        )
      );
    } else if (criteria.type === 'column' && criteria.filters) {
      // Column-specific search
      filtered = inputItems.filter((item) =>
        Object.entries(criteria.filters!).every(([key, value]) => {
          if (!value) return true;
          const itemValue = (item as any)[key];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        })
      );
    }
  }

  /**
   * Search in database
   */

  private searchInDatabase(criteria: SearchCriteria): void {
    const seq = ++this.loadSeq;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Get existing criteria and merge with new search
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

    const mergedCriteria: SearchCriteria = {
      ...existingCriteria,
      ...criteria,
      page: 1,
      pageSize: 50,
    };

    // Save the merged search criteria to state for later use (e.g., when sorting)
    this.stateService.setSearchCriteria(mergedCriteria);
    this.stateService.resetPage();
    this.stateService.clearLotoPoints();

    this.apiService
      .searchLotoPoints(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (seq !== this.loadSeq) return; // a newer load superseded this one
          if (response.responseData?.content) {
            // Replace current items with search results
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching LOTO points:', error);
          this.errorMessage.set('Search failed');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    const isUsingInputItems = this.inputItems();

    if (isUsingInputItems) {
      return;
    }

    // Get the existing search criteria and merge with new sort
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

    const searchCriteria: SearchCriteria = {
      ...existingCriteria,
      sortColumn: event.column.accessorKey || event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: 50,
      type: existingCriteria.type ?? 'sort',
    };

    this.stateService.clearLotoPoints();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    const seq = ++this.loadSeq;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchLotoPoints(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (seq !== this.loadSeq) return; // a newer load superseded this one
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted LOTO points:', error);
          this.errorMessage.set('Failed to load sorted data');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (!this.loadMoreEnabled()) return;
    if (this.isLoading()) return;

    const seq = ++this.loadSeq;
    this.isLoading.set(true);

    // Combine incoming criteria with existing state, preserving sort
    const existingCriteria = this.stateService.getCurrentSearchCriteria();
    const incomingCriteria = criteria || {};

    const loadMoreCriteria: SearchCriteria = {
      ...(existingCriteria || { type: 'column', filters: {} }),
      ...incomingCriteria,
      // Explicitly preserve sort state - don't let incoming criteria override it
      sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
      sortDirection:
        incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };

    this.apiService
      .searchLotoPoints(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (seq !== this.loadSeq) return; // a newer load (e.g. fresh search) superseded this page
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more LOTO points:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Capture this table's row selection (for the bulk-edit form) and re-emit
   * it to the parent. Keeping a local copy lets the bulk-edit form operate on
   * THIS table's selection rather than the shared root signal.
   */
  onTableSelected(items: LotoPointDto[]): void {
    this.currentSelection.set(items);
    this.selectedItemsEvent.emit(items);
  }

  /**
   * Handle bulk edit applied event
   * Refresh the table to show updated items
   */
  onBulkEditApplied(updatedItems: LotoPointDto[]): void {
    console.log(`Bulk edit applied to ${updatedItems.length} items`);

    // Always emit the event so parents can handle refresh if needed
    this.bulkEditAppliedEvent.emit(updatedItems);

    // If using input items, we can't refresh from API
    // The parent component should handle the update via the event
    const isUsingInputItems = this.inputItems();

    if (!isUsingInputItems) {
      // Refresh from database to get updated data
      const currentCriteria = this.stateService.getCurrentSearchCriteria();

      if (currentCriteria) {
        // Re-run the current search to refresh data
        this.onSearch(currentCriteria);
      } else {
        // No active search, just reload all items
        this.stateService.clearLotoPoints();
        this.stateService.resetPage();
        this.loadInitialData();
      }
    }

    // Clear selection after bulk edit
    // The selection service should be available through the table
  }
}
