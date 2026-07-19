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
import { timer, forkJoin } from 'rxjs';
import { DriftService, RowDrift, DriftRecord, ThreeWayFieldDiff } from '../../../services/drift.service';
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
    .sync-col, .sync-col-h { text-align:center; }
    .sync-col-h { font-size:11px; color:#9aa4b2; }
    .drift-badges { display:inline-flex; gap:3px; vertical-align:middle; }
    .drift-badges.clickable { cursor:pointer; }
    .drift-dot { display:inline-flex; align-items:center; justify-content:center; min-width:15px;
      height:15px; padding:0 3px; border-radius:8px; font-size:9px; font-weight:700; color:#fff;
      background:#e67e22; }               /* hub drift = orange */
    .drift-dot.sp { background:#2980b9; }  /* SharePoint drift = blue */
    .drift-dot.clean { background:#2e7d32; } /* verified in sync = green */
    .drift-dot.ack { opacity:0.45; }       /* acknowledged = dimmed */
    .drift-result { margin-left:8px; font-size:12px; color:#cfd8dc; }
    .drift-checked { margin-left:8px; font-size:11px; color:#90a4ae; font-style:italic; }
    .drift-strip { margin:6px 0; border:1px solid #4a5a2e; border-radius:6px; background:#2a3320; overflow:hidden; }
    .drift-strip-head { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; font-size:13px; color:#dce8c8; }
    .drift-strip-head b { color:#fff; }
    .ds-caret { width:12px; color:#9ccc65; }
    .ds-badge { display:inline-flex; align-items:center; justify-content:center; min-width:15px; height:15px; padding:0 4px;
      border-radius:4px; font-size:10px; font-weight:700; color:#fff; background:#e67e22; }
    .ds-spacer { flex:1 1 auto; }
    .ds-pullall { margin-left:auto; }
    .ds-result { padding:0 10px 7px 30px; font-size:12px; color:#c5e1a5; }
    .drift-strip-list { border-top:1px solid #3d4a26; max-height:180px; overflow-y:auto; }
    .ds-row { display:flex; align-items:center; gap:10px; padding:5px 10px 5px 30px; font-size:12px; color:#cfd8dc; border-top:1px solid #333c22; }
    .ds-row:first-child { border-top:none; }
    .ds-id { font-weight:600; color:#fff; min-width:70px; }
    .ds-note { color:#90a4ae; flex:1 1 auto; }
    /* row-action popover */
    .drift-backdrop { position:fixed; inset:0; z-index:900; }
    .drift-pop { position:fixed; z-index:901; min-width:210px; background:#212734; border:1px solid #353c4a;
      border-radius:10px; box-shadow:0 16px 40px rgba(0,0,0,.55); overflow:hidden; color:#e7ebf2; font-size:13px; }
    .dp-head { padding:9px 12px; border-bottom:1px solid #2a303c; font-weight:700; font-size:12px; }
    .dp-sec { padding:9px 12px; border-bottom:1px solid #2a303c; }
    .dp-foot { border-bottom:0; display:flex; align-items:center; gap:8px; }
    .dp-lbl { font-size:11px; color:#98a2b3; margin-bottom:7px; display:flex; align-items:center; gap:7px; }
    .dp-acts { display:flex; gap:6px; flex-wrap:wrap; }
    .dp-btn { border:1px solid #4a5568; background:#2a303c; color:#e7ebf2; border-radius:6px; padding:4px 9px;
      font:600 12px system-ui; cursor:pointer; }
    .dp-btn:disabled { opacity:.55; cursor:default; }
    .dp-btn.hub { border-color:rgba(245,158,11,.55); }
    .dp-btn.loc { border-color:rgba(59,130,246,.55); }
    .dp-btn.sp { border-color:rgba(56,189,248,.55); }
    .dp-busy { font-size:11px; color:#98a2b3; }
    .dp-diffnote { font-size:11px; color:#98a2b3; padding:2px 0 6px; }
    .dp-diff { margin:2px 0 8px; max-height:170px; overflow:auto; }
    .dp-field { padding:5px 0; border-top:1px solid #2a303c; }
    .dp-fn { font:600 11px ui-monospace,Consolas,monospace; color:#98a2b3; margin-bottom:3px; }
    .dp-vals { display:flex; align-items:center; gap:6px; font-size:12px; }
    .dp-loc, .dp-hub { max-width:96px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      padding:1px 6px; border-radius:4px; background:#1b202b; border:1px solid #2a303c; }
    .dp-hub { border-color:rgba(245,158,11,.5); }
    .dp-arr { color:#6b7480; }
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
  /** #2: when the last drift scan ran for this type (from the shared scanState) — shown by the Re-check button. */
  driftLastCheck = computed<string | null>(() => {
    const t = this.driftEntityType();
    return t ? (this.driftService.scanState().get(t)?.lastScannedAt ?? null) : null;
  });
  private driftRenderedScanAt: string | null = null; // the scan the badge map currently reflects (plain, non-reactive)
  private driftPollStarted = false;
  // #1: rows the HUB has but LOCAL doesn't. They have no local row to badge, so they surface in a strip above
  // the table with per-row + bulk "Pull". Fed from the same driftMap, so it stays reactive with the poll.
  driftStripOpen = signal(false);
  driftPullBusy = signal(false);
  driftPullResult = signal<string>('');
  /** Emitted after hub-only rows are pulled down, so a parent list can reload its data to show the new rows. */
  driftEntityPulled = output<{ type: string; ids: number[] }>();
  driftMissingRows = computed<{ id: number; rec: DriftRecord }[]>(() => {
    const out: { id: number; rec: DriftRecord }[] = [];
    for (const [id, row] of this.driftMap()) {
      if (row.hub?.kind === 'MISSING_LOCALLY') out.push({ id, rec: row.hub });
    }
    return out.sort((a, b) => a.id - b.id);
  });
  private driftLoadEffect = effect(() => {
    const type = this.driftEntityType();
    if (type) { this.loadDrift(type); this.startDriftPoll(); }
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

  /** Load the persisted per-row drift map — cheap (one GET), runs automatically as the table renders.
   *  Also refreshes the per-type overview so a clean row shows a confident GREEN once the type is scanned
   *  (by the background scheduler or a manual re-check), even on a fresh page load. */
  loadDrift(type: string): void {
    // Refresh the shared scan-time overview (drives driftLastCheck + the reactive poll) and remember which
    // scan the badge map reflects, so the poll only re-pulls when a NEWER scan lands.
    this.driftService.refreshOverview()
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe((list) => {
        this.driftRenderedScanAt = list.find((o) => o.entityType === type)?.lastScannedAt ?? this.driftRenderedScanAt;
      });
    this.reloadDriftMap(type);
  }

  /** Pull the persisted per-row drift map (the badges). */
  private reloadDriftMap(type: string): void {
    this.driftService.statusForType(type)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe((m) => { this.driftMap.set(m); this.cdr.markForCheck(); });
  }

  /** #3 reactive: while this table is open, poll the cheap overview so a background (scheduler) scan — or a
   *  scan triggered from the Drift Center — refreshes THIS table's badges + "last checked" time without a
   *  manual re-check. Re-pulls the badge map only when the scan timestamp actually advances (no churn). */
  private startDriftPoll(): void {
    if (this.driftPollStarted) return;
    this.driftPollStarted = true;
    timer(30000, 30000)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe(() => {
        const t = this.driftEntityType();
        if (!t) return;
        this.driftService.refreshOverview()
          .pipe(takeUntilDestroyed(this.driftDestroyRef))
          .subscribe((list) => {
            const at = list.find((o) => o.entityType === t)?.lastScannedAt ?? null;
            if (at && at !== this.driftRenderedScanAt) { this.driftRenderedScanAt = at; this.reloadDriftMap(t); }
            this.cdr.markForCheck(); // keep the "checked Xm ago" relative time current even when nothing changed
          });
      });
  }

  /** Relative "x ago" for the last-checked time (mirrors the Drift Center). */
  driftFmt(iso: string | null): string {
    if (!iso) return 'not checked yet';
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }

  /** #1: pull ONE hub-only row down (dependency-aware), then re-scan so it leaves the strip. */
  pullMissing(id: number): void { this.runDriftPull([id]); }
  /** #1: pull EVERY hub-only row down at once. */
  pullAllMissing(): void { this.runDriftPull(this.driftMissingRows().map((r) => r.id)); }

  private runDriftPull(ids: number[]): void {
    const t = this.driftEntityType();
    if (!t || !ids.length || this.driftPullBusy()) return;
    this.driftPullBusy.set(true);
    this.driftPullResult.set('');
    forkJoin(ids.map((id) => this.driftService.acceptHub(t, id)))
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe(() => {
        // Re-detect so the pulled rows clear from MISSING_LOCALLY, then refresh the badge map + strip.
        this.driftService.scanType(t)
          .pipe(takeUntilDestroyed(this.driftDestroyRef))
          .subscribe(() => {
            this.driftPullBusy.set(false);
            this.driftPullResult.set(`Pulled ${ids.length} row(s) from hub — refresh the list to see them`);
            this.loadDrift(t);
            this.driftEntityPulled.emit({ type: t, ids });
          });
      });
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

  // ---- Row-action popover: click a drift badge to resolve it in place ----
  driftPopover = signal<{ item: any; drift: RowDrift; x: number; y: number } | null>(null);
  driftBusy = signal(false);
  driftDiff = signal<ThreeWayFieldDiff | null>(null);
  driftDiffLoading = signal(false);

  onBadgeClick(item: any, ev: MouseEvent): void {
    ev.stopPropagation();
    const drift = this.driftFor(item);
    if (!drift) return; // a clean (green) row has nothing to act on
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    this.driftPopover.set({ item, drift, x: Math.round(rect.left), y: Math.round(rect.bottom + 4) });
    // Fetch the field diff so the user sees WHAT differs before choosing (hub drift only).
    this.driftDiff.set(null);
    const t = this.driftEntityType();
    if (t && drift.hub) {
      this.driftDiffLoading.set(true);
      this.driftService.fieldDiff(t, Number(item.id))
        .pipe(takeUntilDestroyed(this.driftDestroyRef))
        .subscribe(d => { this.driftDiff.set(d); this.driftDiffLoading.set(false); });
    }
  }
  closeDriftPopover(): void { this.driftPopover.set(null); this.driftDiff.set(null); }

  /** Reconcile the whole row (hub/local/SP), then re-scan the type so the badge reflects the new truth. */
  driftAct(kind: 'hub' | 'local' | 'sp'): void {
    const pop = this.driftPopover(); const t = this.driftEntityType();
    if (!pop || !t || this.driftBusy()) return;
    const id = Number(pop.item.id);
    const call = kind === 'hub' ? this.driftService.acceptHub(t, id)
      : kind === 'local' ? this.driftService.keepLocal(t, id)
        : this.driftService.pushToSp(t, id);
    this.driftBusy.set(true);
    call.pipe(takeUntilDestroyed(this.driftDestroyRef)).subscribe(() => {
      this.driftService.scanType(t).pipe(takeUntilDestroyed(this.driftDestroyRef))
        .subscribe(() => { this.driftBusy.set(false); this.closeDriftPopover(); this.loadDrift(t); });
    });
  }

  /** Acknowledge the row's drift record(s) — leaves the data, stops flagging. */
  driftAck(): void {
    const pop = this.driftPopover(); const t = this.driftEntityType();
    if (!pop || !t || this.driftBusy()) return;
    const ids = [pop.drift.hub?.id, pop.drift.sp?.id].filter((x): x is number => x != null);
    if (!ids.length) return;
    this.driftBusy.set(true);
    let done = 0;
    ids.forEach((id) => this.driftService.acknowledge(id)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe(() => { if (++done === ids.length) { this.driftBusy.set(false); this.closeDriftPopover(); this.loadDrift(t); } }));
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
