import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriftService, RowDrift } from '../../../services/drift.service';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { TableDragService } from './services/table-drag.service';
import { TableClickService } from './services/table-click.service';
import { TableSyncService } from './services/table-sync.service';
import { filterLogic, TableSearchService } from './services/table-search.service';
import { TableSortService } from './services/table-sort.service';
import { TableSelectionService } from './services/table-selection.service';
import { TableResizeService } from './services/table-resize.service';
import { ColumnFilterInputComponent } from './column-filter-input/column-filter-input.component';
import {
  ButtonConfig,
  ButtonsComponent,
} from '../../menu/buttons/buttons.component';
import { TableControlsService } from './services/table-controls.service';
import { TableDataService } from './services/table-data.service';
import { TableUtilService } from './services/table-util.service';
import { TableLocalStorageService } from './services/table-local-storage.service';

export interface ClickSetup {
  applyTo: 'row' | 'cell';
  actions: ('leftClick' | 'rightClick' | 'middleClick' | 'doubleClick')[];
}

export interface FilterOutRules {
  action: 'highlight' | 'exclude';
  items: any[];
  style: { [key: string]: string };
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    ColumnFilterInputComponent,
    ButtonsComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  styles: [`
    .drift-scan-btn { background:#37474f; color:#eee; border:1px solid #546e7a; border-radius:4px;
      padding:2px 10px; font-size:12px; cursor:pointer; margin-left:8px; }
    .drift-scan-btn:disabled { opacity:0.6; cursor:default; }
    .drift-badges { display:inline-flex; gap:3px; margin-right:6px; vertical-align:middle; }
    .drift-dot { display:inline-flex; align-items:center; justify-content:center; min-width:15px;
      height:15px; padding:0 3px; border-radius:8px; font-size:9px; font-weight:700; color:#fff;
      background:#e67e22; }               /* hub drift = orange */
    .drift-dot.sp { background:#2980b9; }  /* SharePoint drift = blue */
    .drift-dot.clean { background:#2e7d32; } /* verified in sync = green */
    .drift-dot.ack { opacity:0.45; }       /* acknowledged = dimmed */
    .drift-result { margin-left:8px; font-size:12px; color:#cfd8dc; }
  `],
})
export class TableComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  protected dragService = inject(TableDragService);
  public clickService = inject(TableClickService);
  protected syncService = inject(TableSyncService);
  protected searchService = inject(TableSearchService);
  protected sortService = inject(TableSortService);
  protected selectionService = inject(TableSelectionService);
  protected resizeService = inject(TableResizeService);
  protected controlsService = inject(TableControlsService);
  protected dataService = inject(TableDataService);
  protected utilService = inject(TableUtilService);
  protected localStorageService = inject(TableLocalStorageService);

  // Inputs
  tableId = input<string>('');
  items = input.required<any[]>();
  columns = input<Column[]>([]);
  isTableIsolated = input<boolean>(false);
  columnUniqueOptions = input<string[]>([]);
  isLoadingMore = input<boolean>(false);
  deleteItem = input<string | undefined>();
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoveredItemId = input<number | null>(null);
  /** ID of item to scroll to (triggered by external click events) */
  scrollToItemId = input<number | null>(null);
  /**
   * ID of item that an external source has "clicked". Applies the
   * {@code .external-click} row class so the row is visually highlighted
   * even though no in-table click occurred. Kept separate from
   * {@code hoveredItemId} so hover semantics don't fight click semantics
   * — clicking a shape in a paired image viewer should leave a persistent
   * highlight until another shape is clicked, whereas hover comes and goes.
   */
  externalClickedItemId = input<number | null>(null);
  clickSetupInput = input<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });
  // OPT-IN drift badge: set to a synced entity type (e.g. "LotoPoint") to show a per-row hub/SharePoint
  // drift indicator in the first cell + a "Scan drift" control. Unset (every existing table) → no change.
  driftEntityType = input<string | undefined>(undefined);
  private driftService = inject(DriftService);
  private driftDestroyRef = inject(DestroyRef);
  driftMap = signal<Map<number, RowDrift>>(new Map());
  driftScanning = signal(false);
  driftResultText = signal<string>(''); // visible readout of the last scan so we can see what happened
  private driftLoadEffect = effect(() => {
    const type = this.driftEntityType();
    if (type) this.loadDrift(type);
  });
  /** Initial search criteria to apply when the table loads */
  initialSearchCriteria = input<SearchCriteria | null>(null);

  // Outputs
  loadMoreItems = output<SearchCriteria>();
  search = output<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();
  sortChanged = output<{ column: Column; isAscending: boolean }>();
  loadMoreOptions = output<{ column: string; filter: string, logic: filterLogic }>();
  loadInitialOptions = output<{ column: string; filter: string, logic: filterLogic }>();
  rowDoubleClicked = output<any>();
  /** Emitted when the user clears all filters — server-backed tables should reload. */
  filtersCleared = output<void>();

  filterInputs = viewChildren(ColumnFilterInputComponent);
  headerContainer = viewChild<ElementRef<HTMLDivElement>>('headerContainer');
  headerTable = viewChild<ElementRef<HTMLTableElement>>('headerTable');
  bodyTable = viewChild<ElementRef<HTMLTableElement>>('bodyTable');
  tableBody = viewChild<ElementRef<HTMLDivElement>>('tableBody');
  viewport = viewChild(CdkVirtualScrollViewport);
  selectionActionsTemplate = viewChild(TemplateRef);


  // Signals from services
  lastClickedItem = this.selectionService.lastClickedItem$;


  private columnsEffect = effect(() => {
    const columns = this.columns();
    const tableId = this.tableId();
    this.dataService.columns.set(columns);
    this.dataService.tableId = tableId;
  });
  
  private itemsEffect = effect(() => {
    const items = this.items();
    this.dataService.items.set(items);
    this.clickService.allItems.set(items);
    this.searchService.updateFilteredItems();
    this.cdr.markForCheck();
  });

  private flagEffects = effect(() => {
    this.dataService.isDragAndDropEnabled.set(this.isDragAndDropEnabled());
    this.dataService.isTableIsolated.set(this.isTableIsolated());
  });

  /** Apply initial search criteria when provided - only updates UI state, does NOT trigger search event.
   *  The parent component is responsible for loading data with initial criteria.
   */
  private initialSearchCriteriaApplied = false;
  private initialSearchCriteriaEffect = effect(() => {
    const criteria = this.initialSearchCriteria();
    // Only apply once when criteria is first provided
    if (criteria && !this.initialSearchCriteriaApplied) {
      this.initialSearchCriteriaApplied = true;
      // Apply global search UI state if provided
      if (criteria.type === 'global' && criteria.query) {
        this.dataService.globalSearchQuery = criteria.query;
        if (criteria.globalFilterLogic) {
          this.dataService.globalFilterLogic = criteria.globalFilterLogic;
        }
      }
      // Apply column filters UI state if provided
      else if (criteria.type === 'column' && criteria.filters) {
        this.dataService.columnFilters.set(criteria.filters);
        if (criteria.columnFilterLogic) {
          this.dataService.columnFilterLogic = criteria.columnFilterLogic;
        }
      }
      // Update current search criteria for state tracking (but don't emit search event)
      this.dataService.currentSearchCriteria = criteria;
    }
  });

  private filterOutEffect = effect(() => {
    const rules = this.filterOutItems();
    this.dataService.excludedItemIds.clear();
    this.dataService.highlightedItemIds.clear();
    this.dataService.highlightStyle = {};

    if (rules && rules.items.length > 0) {
      const itemIds = new Set(rules.items.map((item) => item.id));
      if (rules.action === 'exclude') {
        this.dataService.excludedItemIds = itemIds;
      } else if (rules.action === 'highlight') {
        this.dataService.highlightedItemIds = itemIds;
        this.dataService.highlightStyle = rules.style;
      }
    }
    this.searchService.updateFilteredItems();
  });

  /**
   * Scroll to the specified item when scrollToItemId changes (triggered by external click events).
   * This enables auto-scrolling when clicking on shapes in an image viewer, for example.
   */
  private scrollToItemEffect = effect(() => {
    const scrollToId = this.scrollToItemId();
    if (scrollToId === null) return;

    const filteredItems = this.dataService.filteredItems();
    const viewport = this.dataService.viewport();
    if (!viewport || filteredItems.length === 0) return;

    const index = filteredItems.findIndex((item) => item.id === scrollToId);
    if (index !== -1) {
      viewport.scrollToIndex(index, 'smooth');
    }
  });

  private syncDataTableServiceEffect = effect(() => {
    this.dataService.headerContainer.set(this.headerContainer());
    this.dataService.headerTable.set(this.headerTable());
    this.dataService.bodyTable.set(this.bodyTable());
    this.dataService.tableBody.set(this.tableBody());
    this.dataService.viewport.set(this.viewport());
    this.dataService.selectionActionsTemplate.set(
      this.selectionActionsTemplate()
    );
  });

 

  constructor() {
    effect(() => {
      this.loadMoreItems.emit(this.dataService.loadMoreItems());
    });
    effect(() => {
      this.selectedItemsEvent.emit(this.dataService.selectedItems());
    });
    effect(() => {
      const value = this.dataService.search();
      const notEmpty = value && (value.filters || value.query);
      if(notEmpty)this.search.emit(value);
    });
    effect(() => {
      const value = this.dataService.sortChanged();
      if(value)this.sortChanged.emit(value);
    });
    effect(() => {
      const value = this.dataService.itemsReordered();
      const notEmpty = value && value.length > 0;
      if (notEmpty) this.itemsReordered.emit(value);
    });
    effect(() => {
      this.rowHoveredEvent.emit(this.dataService.hoveredRow());
    });
    effect(() => {
      if(this.dataService.loadInitialOptions()){
        this.loadInitialOptions.emit(this.dataService.loadInitialOptions()!);
      }
    });
    effect(() => {
      if (this.dataService.loadMoreOptions()) {
        this.loadMoreOptions.emit(this.dataService.loadMoreOptions()!);
      }
    });
    effect(() => {
      const value = this.dataService.rowDoubleClicked();
      if (value) {
        this.rowDoubleClicked.emit(value);
        // Reset to avoid emitting the same item again
        this.dataService.rowDoubleClicked.set(null);
      }
    });
  }

  /** True when any column filter or the global search has a value. */
  hasActiveFilters = computed(() => {
    if ((this.dataService.globalSearchQuery ?? '').trim().length > 0) return true;
    const filters = this.dataService.columnFilters();
    return Object.values(filters).some(v => (v ?? '').toString().trim().length > 0);
  });

  /**
   * Clear every column filter and the global search, reset the filter inputs, then
   * refresh. Client-side (isolated) tables re-show all loaded rows immediately;
   * server-backed tables get a {@link filtersCleared} event so the parent can reload
   * (the normal `search` output is suppressed for empty criteria, so it can't be
   * used to signal a clear).
   */
  clearAllFilters(): void {
    this.dataService.globalSearchQuery = '';
    this.dataService.columnFilters.set({});
    this.filterInputs().forEach(input => input.reset());
    const criteria = this.utilService.buildSearchCriteria(
      '', {}, this.dataService.columnFilterLogic, this.dataService.globalFilterLogic);
    this.dataService.currentSearchCriteria = criteria;
    this.localStorageService.saveTableFilters(criteria, this.dataService.tableId);
    this.searchService.updateFilteredItems();
    this.filtersCleared.emit();
  }

  ngOnInit(): void {}

  // ==================== Drift badge (opt-in via driftEntityType) ====================

  /** Load the persisted per-row drift map — cheap (one GET), runs automatically as the table renders. */
  loadDrift(type: string): void {
    this.driftService.statusForType(type)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe((m) => { this.driftMap.set(m); this.cdr.markForCheck(); });
  }

  /** Force a fresh re-detection for this type (hub + SharePoint), then reload the badges. */
  scanDrift(): void {
    const type = this.driftEntityType();
    if (!type || this.driftScanning()) return;
    this.driftScanning.set(true);
    this.driftResultText.set('');
    this.driftService.scanType(type)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe((r) => {
        this.driftScanning.set(false);
        this.driftResultText.set(
          r == null
            ? '⚠ scan failed — no response from /ng/sync/drift (backend endpoint?)'
            : `${r.flagged + r.stillDrifting} drift(s)${r.errors ? ', ' + r.errors + ' err' : ''}`);
        this.loadDrift(type);
      });
  }

  /** Drift for a row (or undefined) — drives the badge in the first cell. */
  driftFor(item: any): RowDrift | undefined {
    return item?.id != null ? this.driftMap().get(Number(item.id)) : undefined;
  }

  /** True once a scan has run for this type — lets a clean row show a confident GREEN check. */
  isDriftScanned(): boolean {
    return this.driftService.isScanned(this.driftEntityType());
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.syncService.initializeTable();
    this.syncService.setupResizeObserver();
    this.syncService.setupHorizontalScrollSync();
    this.resizeService.setupResizeListeners();
  }

  ngOnDestroy(): void {
    this.clickService.onDestroy();
  }
}
