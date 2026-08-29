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
import { Router } from '@angular/router';
import { timer, forkJoin } from 'rxjs';
import { DriftService, RowDrift, DriftRecord, ThreeWayFieldDiff, ThreeWayFieldEntry } from '../../../services/drift.service';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
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
import {
  TableColumnPrefs,
  TableLocalStorageService,
} from './services/table-local-storage.service';

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
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
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
    .ds-id { font-weight:600; color:#fff; }
    .ds-idnum { color:#78909c; font-size:11px; }
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
  /**
   * Every value the focused column has, ignoring the active filters. Optional:
   * supply it and each column's dropdown splits into "in current view" /
   * "not in current view"; leave it out and the dropdown stays single-section.
   */
  columnAllOptions = input<string[]>([]);


  /**
   * Column the server-side option lists currently belong to.
   * <p>
   * There is ONE columnUniqueOptions / columnAllOptions array per table, and every
   * column's filter input binds the same one — whichever column loaded last wins. So
   * opening column B showed column A's values until B's own response landed, and if B's
   * request failed it showed A's values indefinitely. (Observed: a column whose rows were
   * all empty had loaded, and the next column opened listed that column's single blank
   * entry as its own "in current view".) Gate the arrays on the column they were fetched
   * for so one column's answer can never render under another's dropdown.
   */
  private optionsColumnKey = signal<string | null>(null);

  /** Server option list for this column, or nothing if the list belongs to another column. */
  serverOptionsFor(column: Column, options: string[]): string[] {
    return this.optionsColumnKey() === (column.accessorKey || column.id) ? options : [];
  }

  onLoadColumnOptions(columnKey: string, filter: string): void {
    this.optionsColumnKey.set(columnKey);
    this.searchService.onLoadColumnFilterOptions(columnKey, filter);
  }

  onLoadMoreColumnOptions(columnKey: string, filter: string): void {
    this.optionsColumnKey.set(columnKey);
    this.searchService.onLoadMoreColumnFilterOptions(columnKey, filter);
  }
  isLoadingMore = input<boolean>(false);
  deleteItem = input<string | undefined>();
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);
  /** Set false to show an ordered (unsortable) list the user may not re-order. */
  canReorder = input<boolean>(true);
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
  /**
   * Optional hover-triggered floating action templates. Rendered outside
   * cdk-virtual-scroll-viewport, positioned next to whichever row is
   * currently hovered — pinned to the container's left / right edge so
   * horizontal scroll doesn't move them. Bypasses the position:sticky-
   * inside-transformed-ancestor fragility (arrows never drift, never
   * flicker, no z-index conflict with row cells). Template receives the
   * hovered row via $implicit context.
   */
  hoverActionLeftTemplate = input<TemplateRef<{ $implicit: any }> | undefined>(undefined);
  hoverActionRightTemplate = input<TemplateRef<{ $implicit: any }> | undefined>(undefined);
  /**
   * Show a 1-based row-index column at the far left (before the drift
   * column). Default true — every table gets numbers unless opted out.
   * Non-invasive: existing tables just gain a narrow index column;
   * anything that already worked continues to work.
   */
  showRowIndex = input<boolean>(true);

  /**
   * Screen-coordinate rect (getBoundingClientRect) of the currently
   * hovered row + its host .table-container. Fed to a position:fixed
   * hover-action wrapper — fixed positioning bypasses ALL container-
   * overflow / stacking-context / transformed-ancestor traps that
   * broke every earlier attempt (position:sticky drifted with the row
   * inside cdk-virtual-scroll-viewport's transformed wrapper;
   * position:absolute inside .table-container was somehow only visible
   * when the row was scrolled fully into view).
   */
  hoverOverlayTop = signal<number>(0);
  hoverOverlayHeight = signal<number>(0);
  hoverOverlayLeftX = signal<number>(0);
  hoverOverlayRightX = signal<number>(0);
  /** Item the overlay is currently anchored to. Separate from
   *  dataService.hoveredRow() so we can DELAY clearing it — otherwise the
   *  mouse-transit from row → floating button fires row.mouseleave
   *  (dataService.hoveredRow=null → overlay unmounts) BEFORE the button's
   *  own mouseenter fires (overlayHovered=true), and the overlay flashes
   *  off/on. The 150ms grace window is short enough not to feel laggy
   *  but long enough for the OS-level pointerleave/enter pair to land. */
  overlayItem = signal<any | null>(null);
  private overlayHideTimer: ReturnType<typeof setTimeout> | null = null;
  private overlayHovered = signal<boolean>(false);
  /** Currently anchored row DOM element. Kept so the scroll listener
   *  can re-read its screen rect after any ancestor scrolls — position:
   *  fixed alone isn't enough because captured coords go stale the
   *  moment the row moves under scroll. */
  private trackedRowEl: HTMLElement | null = null;
  private overlayScrollListener: (() => void) | null = null;
  // OPT-IN drift badge: set to a synced entity type (e.g. "LotoPoint") to show a per-row hub/SharePoint
  // drift indicator in the first cell + a "Scan drift" control. Unset (every existing table) → no change.
  driftEntityType = input<string | undefined>(undefined);
  private driftService = inject(DriftService);
  private driftDestroyRef = inject(DestroyRef);
  private driftRouter = inject(Router);
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
  driftLabels = signal<Map<number, string>>(new Map()); // id -> friendly hub label for the strip
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

  //====================== Adaptive toolbar density ======================
  /**
   * The control bar, the search bar and the selection bar all share the
   * wrapper's height with the scroll viewport — and the viewport is the only
   * one of them that can shrink to 0 (`overflow:hidden` zeroes its automatic
   * minimum size). So every extra line a wrapping button row grows is taken
   * straight out of the rows: the bars end up covering the table.
   *
   * The bars are therefore collapsed instead of allowed to wrap, in tiers.
   * The tier is chosen from the table's OWN measured box rather than a
   * `@media` query, because these tables live inside split panes, floating
   * windows and dialogs that are far narrower than the browser viewport —
   * a viewport-width media query simply never fires for them.
   */
  private hostRef = inject(ElementRef<HTMLElement>);
  private measuredWidth = signal(0);
  private measuredHeight = signal(0);
  private densityObserver?: ResizeObserver;

  toolbarDensity = computed<'normal' | 'compact' | 'icon'>(() => {
    const w = this.measuredWidth();
    const h = this.measuredHeight();
    if (w === 0) return 'normal'; // not measured yet — start at the desktop look
    if (w < 640) return 'icon';
    if (w < 1000 || h < 600) return 'compact';
    return 'normal';
  });

  private setupDensityObserver(): void {
    const el = this.hostRef.nativeElement;
    // Idempotent, matching TableSyncService: a re-mounted table must not stack
    // observers on a service/component instance that outlives the view.
    this.densityObserver?.disconnect();
    this.densityObserver = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      // Whole pixels only — a drag-resize otherwise writes the signals (and so
      // re-runs change detection) on every sub-pixel frame.
      const w = Math.round(box.width);
      const h = Math.round(box.height);
      if (w !== this.measuredWidth()) this.measuredWidth.set(w);
      if (h !== this.measuredHeight()) this.measuredHeight.set(h);
    });
    // observe() itself delivers the first measurement (after layout, before
    // paint), so no synchronous read is needed here — and writing the signals
    // from the observer rather than from inside the AfterViewInit hook keeps
    // the first tier change out of the change-detection pass that created it.
    this.densityObserver.observe(el);
  }

  //====================== Column layout (order / visibility / width) ======================
  /**
   * The user's own column layout for THIS table, on top of the column set the host
   * declares through [columns]. Host stays the source of truth for which columns exist
   * and how they render; this only decides which of them show, in what order, and how
   * wide — so a host changing its field list can never be broken by a saved preference.
   * <p>
   * Persisted per tableId. Tables that don't set a tableId keep their layout for the
   * session only (see TableLocalStorageService.getColumnPrefs for why).
   */
  private columnPrefs = signal<TableColumnPrefs>({});
  columnPanelOpen = signal<boolean>(false);

  /**
   * Storage identity for this table's layout: the tableId PLUS a fingerprint of the
   * column set the host declared.
   * <p>
   * tableId alone is not unique enough. Several wrappers give it a component-level
   * DEFAULT (rf-loto-point-table defaults to 'rf-loto-point-table'), and hosts that never
   * override it all write to that one key — so hiding a column on the Tag Number screen
   * also hid it inside the Equipment editor, which renders the same wrapper with a
   * different field list. Folding the declared ids into the key keeps those screens apart,
   * and has the useful side effect that changing a host's field list starts a fresh
   * layout rather than applying a preference saved against columns that no longer exist.
   */
  private prefsKey = computed(() => {
    const tableId = this.tableId();
    if (!tableId) return '';
    const ids = this.columns().map((c) => c.id).join('|');
    let hash = 5381;
    for (let i = 0; i < ids.length; i++) hash = ((hash << 5) + hash + ids.charCodeAt(i)) | 0;
    return `${tableId}~${(hash >>> 0).toString(36)}`;
  });

  /**
   * What actually renders: hidden columns removed, the rest in the user's order.
   * <p>
   * Columns absent from the saved order keep their declared order AFTER the ordered ones,
   * so a column added to a host's field list later simply appears at the end instead of
   * vanishing because it isn't mentioned in a preference saved months ago.
   */
  visibleColumns = computed<Column[]>(() => {
    const declared = this.columns();
    const prefs = this.columnPrefs();
    const hidden = new Set(prefs.hidden ?? []);
    let shown = declared.filter((c) => !hidden.has(c.id));

    // Floor: a saved preference must never leave a table with no columns at all. The
    // interactive guard only runs when the user clicks, so a preference saved against a
    // different column set could otherwise hide every column this host declares and
    // render an empty grid with no way back except Reset.
    if (shown.length === 0) shown = declared;

    const order = prefs.order ?? [];
    const rank = new Map(order.map((id, i) => [id, i]));
    const pinned = prefs.pinned ?? [];
    const pinRank = new Map(pinned.map((id, i) => [id, i]));

    // Pinned columns lead, in the order they were pinned: a frozen column has to be
    // adjacent to the left edge, so one sitting mid-table could not park anywhere
    // sensible. Everything else keeps the user's order, then the declared order.
    return [...shown].sort((a, b) => {
      const pa = pinRank.has(a.id) ? pinRank.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const pb = pinRank.has(b.id) ? pinRank.get(b.id)! : Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      const ra = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return declared.indexOf(a) - declared.indexOf(b); // stable for unlisted columns
    });
  });

  /**
   * Push saved widths into the resize service instead of onto the Column objects, and
   * re-push whenever they change. getColumnWidth() reads that map first, so this renders
   * identically to a drag while leaving the host's column array untouched.
   */
  private widthApplyEffect = effect(() => {
    const widths = this.columnPrefs().widths ?? {};
    Object.entries(widths).forEach(([id, width]) => this.resizeService.setStoredWidth(id, width));
  });

  /** Every declared column plus whether it is currently shown — drives the panel. */
  columnPanelRows = computed<{ column: Column; visible: boolean }[]>(() => {
    const hidden = new Set(this.columnPrefs().hidden ?? []);
    const order = this.columnPrefs().order ?? [];
    const rank = new Map(order.map((id, i) => [id, i]));
    const pinned = this.columnPrefs().pinned ?? [];
    const pinRank = new Map(pinned.map((id, i) => [id, i]));
    const declared = this.columns();
    // Same comparator visibleColumns() uses, pinned rank included: the panel is how the
    // order is edited, so listing it in a different order than the table renders makes
    // every drag land somewhere the user did not aim for.
    return [...declared]
      .sort((a, b) => {
        const pa = pinRank.has(a.id) ? pinRank.get(a.id)! : Number.MAX_SAFE_INTEGER;
        const pb = pinRank.has(b.id) ? pinRank.get(b.id)! : Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        const ra = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER;
        const rb = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return declared.indexOf(a) - declared.indexOf(b);
      })
      .map((column) => ({ column, visible: !hidden.has(column.id) }));
  });

  //====================== Pinned (frozen) columns ======================
  /**
   * Width of the two fixed columns the table renders ahead of the data columns. They
   * have to freeze along with the pinned ones — a pinned column parked at x=100 while the
   * index column scrolled away would leave a gap of scrolled content beside it.
   */
  private static readonly ROW_INDEX_WIDTH = 44;
  private static readonly SYNC_COL_WIDTH = 56;

  pinnedIds = computed<string[]>(() => this.columnPrefs().pinned ?? []);
  hasPinnedColumns = computed(() => this.pinnedIds().length > 0);

  isColumnPinned(column: Column): boolean {
    return this.pinnedIds().includes(column.id);
  }

  /** Offset of the leading fixed columns, so the first pinned data column starts after them. */
  private leadingPinWidth(): number {
    return (
      (this.showRowIndex() ? TableComponent.ROW_INDEX_WIDTH : 0) +
      (this.driftEntityType() ? TableComponent.SYNC_COL_WIDTH : 0)
    );
  }

  /** Left offset for the sync column (it sits after the row-index column). */
  syncColumnLeft(): number {
    return this.showRowIndex() ? TableComponent.ROW_INDEX_WIDTH : 0;
  }

  /**
   * Distance from the left edge at which this pinned column parks — the leading fixed
   * columns plus every pinned column before it.
   * <p>
   * Computed per call rather than memoised because the widths come from the resize
   * service's plain Map, which is not reactive; the template already re-reads
   * getColumnWidth() for every cell on every pass, so this follows a drag the same way.
   * Pinned counts are small, so the walk is cheap.
   */
  pinnedLeft(column: Column): number {
    let offset = this.leadingPinWidth();
    for (const candidate of this.visibleColumns()) {
      if (candidate.id === column.id) break;
      if (this.isColumnPinned(candidate)) offset += this.resizeService.getColumnWidth(candidate.id);
    }
    return offset;
  }

  /** The rightmost pinned column carries the seam shadow. Precomputed: the template asks
   *  this for every header cell and every body cell of every rendered row. */
  private lastPinnedId = computed<string | null>(() => {
    const pinned = this.visibleColumns().filter((c) => this.isColumnPinned(c));
    return pinned.length ? pinned[pinned.length - 1].id : null;
  });

  isLastPinnedColumn(column: Column): boolean {
    return this.lastPinnedId() === column.id;
  }

  togglePin(column: Column): void {
    const pinned = this.pinnedIds().filter((id) => id !== column.id);
    if (!this.isColumnPinned(column)) pinned.push(column.id);
    this.updatePrefs({ pinned });
    // Pinning reorders the table, so the shared-by-position filter boxes move seats.
    this.refreshFilterInputs();
  }

  /**
   * Inline style for a body cell.
   * <p>
   * A sticky cell paints nothing of its own, so the scrolling rows slide UNDER it unless
   * it carries an opaque background. Class-based row states are handled in CSS; the one
   * thing CSS cannot reach is the inline highlight {@link TableSyncService#getRowStyle}
   * puts on the {@code <tr>} — an inline background on the row never paints the cell. So
   * for pinned cells the row's own style is merged in underneath the cell style.
   */
  cellStyle(item: any, column: Column): { [key: string]: string } {
    const cellStyle = this.clickService.getCellStyleWithHover(item, column);
    if (!this.isColumnPinned(column)) return cellStyle;

    // Merge only the keys the cell actually sets. Mappers express "no styling" as
    // { 'background-color': '', 'color': '' }, and spreading those blanks over the row
    // highlight cleared it — the frozen cell went plain while the rest of the row stayed
    // highlighted.
    const merged: { [key: string]: string } = { ...this.syncService.getRowStyle(item) };
    Object.entries(cellStyle).forEach(([key, value]) => {
      if (value !== '' && value != null) merged[key] = value;
    });
    return merged;
  }

  /**
   * Row highlight for the row-index and sync cells. They carry no cell styling of their
   * own, so once frozen they showed the plain pinned background while the rest of the row
   * was highlighted. Only needed while pinned — unfrozen, the row paints through them.
   */
  leadingCellStyle(item: any): { [key: string]: string } {
    return this.hasPinnedColumns() ? this.syncService.getRowStyle(item) : {};
  }

  /**
   * Width both <table> elements are sized to.
   * <p>
   * Summed from the SAME source the cells render with. dataService.totalTableWidth() sums
   * Column.width, but a cell's width comes from resizeService.getColumnWidth(), which
   * prefers its own map — so a restored width preference made the table's declared width
   * disagree with the sum of its cells, and table-layout:fixed redistributed the
   * difference, pushing every pinned column's computed offset off its real edge.
   */
  renderedTableWidth(): number {
    const columns = this.visibleColumns().reduce(
      (sum, c) => sum + this.resizeService.getColumnWidth(c.id),
      0
    );
    return columns + this.leadingPinWidth();
  }

  /** How many declared columns the user has hidden — shown on the Columns button. */
  hiddenColumnCount = computed(
    () => this.columns().filter((c) => (this.columnPrefs().hidden ?? []).includes(c.id)).length
  );

  /** Guard so the last visible column can't be hidden, leaving an unusable table. */
  canHideMore = computed(() => this.visibleColumns().length > 1);

  /**
   * Screen position for the panel. It is position:FIXED and anchored to the button's
   * screen rect for the same reason the drift popover is — .table-wrapper is
   * overflow:hidden, so an absolutely positioned panel is clipped the moment the table
   * is shorter than the panel, which is most of the time in a split pane.
   */
  columnPanelPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  toggleColumnPanel(event?: MouseEvent): void {
    const opening = !this.columnPanelOpen();
    if (opening && event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const width = 260;
      const maxHeight = Math.round(window.innerHeight * 0.6);
      this.columnPanelPos.set({
        // Keep it on screen when the button sits near an edge.
        x: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        y: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - maxHeight - 8)),
      });
    }
    this.columnPanelOpen.set(opening);
  }

  toggleColumnVisibility(column: Column): void {
    const hidden = new Set(this.columnPrefs().hidden ?? []);
    if (hidden.has(column.id)) {
      hidden.delete(column.id);
    } else {
      if (!this.canHideMore()) return;
      hidden.add(column.id);
    }
    // A hidden column must not keep a pin: it would hold a slot in the frozen block
    // that nothing renders into, pushing every other pinned column's offset out.
    const pinned = this.pinnedIds().filter((id) => !hidden.has(id));
    this.updatePrefs({ hidden: Array.from(hidden), pinned });
    // The filter boxes are shared by position, so whichever column now sits in each seat
    // has to be re-seeded — otherwise showing a column again leaves it displaying the
    // text of whatever used to occupy that slot.
    this.refreshFilterInputs();
  }

  /** True when this column carries an active filter — surfaced in the panel so hiding it
   *  never becomes invisible state. The filter is deliberately NOT cleared on hide: some
   *  are set by the host through [initialSearchCriteria] (the counterpart dialog pins a
   *  unit that way), and dropping those would quietly widen the host's own query. */
  isColumnFiltered(column: Column): boolean {
    return !!this.dataService.columnFilters()[column.accessorKey || column.id];
  }

  private refreshFilterInputs(): void {
    // After the view has re-rendered with the new column set.
    setTimeout(() => this.syncColumnFilterInputs(), 0);
  }

  /** Drag-reorder inside the panel. Ordering the panel rows orders the table. */
  onColumnReorder(event: CdkDragDrop<unknown>): void {
    const ids = this.columnPanelRows().map((r) => r.column.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    // Pinned columns are sorted by their position in `pinned`, which takes precedence
    // over `order` — so their new relative order has to be written back there too, or
    // dragging one pinned column past another looked like it did nothing.
    const pinned = ids.filter((id) => this.pinnedIds().includes(id));
    this.updatePrefs({ order: ids, pinned });
  }

  showAllColumns(): void {
    this.updatePrefs({ hidden: [] });
    this.refreshFilterInputs();
  }

  /** Back to exactly what the host declared — order, visibility and widths. */
  resetColumnLayout(): void {
    // Clearing the stored widths is what actually restores them on screen: the resize
    // service's map is read before the column's declared width, so dropping the saved
    // preference alone left every dragged column at its dragged size.
    this.resizeService.clearStoredWidths();
    this.columnPrefs.set({});
    this.localStorageService.clearColumnPrefs(this.prefsKey());
    this.refreshFilterInputs();
  }

  private updatePrefs(patch: Partial<TableColumnPrefs>): void {
    const next = { ...this.columnPrefs(), ...patch };
    this.columnPrefs.set(next);
    this.localStorageService.saveColumnPrefs(next, this.prefsKey());
  }


  /** Load this table's saved layout whenever the table identity changes. */
  private columnPrefsEffect = effect(() => {
    this.columnPrefs.set(this.localStorageService.getColumnPrefs(this.prefsKey()) ?? {});
  });

  /**
   * Persist widths when a drag-resize finishes. Watching the flag keeps the resize
   * service unaware of storage; it just reports whether a resize is in progress.
   */
  private wasResizing = false;
  private widthPersistEffect = effect(() => {
    const resizing = this.resizeService.isResizing();
    if (this.wasResizing && !resizing) {
      const widths: { [id: string]: number } = { ...(this.columnPrefs().widths ?? {}) };
      this.visibleColumns().forEach((c) => {
        widths[c.id] = this.resizeService.getColumnWidth(c.id);
      });
      this.updatePrefs({ widths });
    }
    this.wasResizing = resizing;
  });

  filterInputs = viewChildren(ColumnFilterInputComponent);
  headerContainer = viewChild<ElementRef<HTMLDivElement>>('headerContainer');
  tableContainerRef = viewChild<ElementRef<HTMLDivElement>>('tableContainer');
  headerTable = viewChild<ElementRef<HTMLTableElement>>('headerTable');
  bodyTable = viewChild<ElementRef<HTMLTableElement>>('bodyTable');
  tableBody = viewChild<ElementRef<HTMLDivElement>>('tableBody');
  viewport = viewChild(CdkVirtualScrollViewport);
  selectionActionsTemplate = viewChild(TemplateRef);


  // Signals from services
  lastClickedItem = this.selectionService.lastClickedItem$;


  private columnsEffect = effect(() => {
    const columns = this.visibleColumns();
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
    this.dataService.isReorderAllowed.set(this.canReorder());
    this.dataService.isTableIsolated.set(this.isTableIsolated());
  });

  /**
   * Apply a search criteria pushed in through {@code [initialSearchCriteria]}.
   * <p>
   * Runs the criteria through the SAME path a typed search takes: filter state,
   * client-side re-filter, and the `search` output. It used to update the filter
   * state only, which is why a programmatic search (LOTO builder OCR term, query
   * param, dialog pre-filter) put the new term in the search box and left the
   * rows on the previous query — the search itself was never triggered. Hosts
   * therefore no longer need their own criteria-watching fetch effect; the
   * `(search)` handler they already have covers it, and having exactly one
   * fetch path removes the double-load the two used to race into.
   * <p>
   * Re-applies whenever the criteria CHANGES, never on a bare re-render:
   * identical criteria are ignored so a change-detection pass can't restage a
   * search (and re-clear the list underneath the user).
   */
  private lastAppliedInitialCriteria: string | null = null;
  private initialSearchCriteriaEffect = effect(() => {
    const criteria = this.initialSearchCriteria();
    const key = criteria ? JSON.stringify(criteria) : null;
    if (!criteria || key === this.lastAppliedInitialCriteria) return;
    this.lastAppliedInitialCriteria = key;
    this.searchService.applyExternalCriteria(criteria);
    this.syncColumnFilterInputs();
  });

  /**
   * Push the filter state back into the per-column filter boxes. They own their
   * own text (no value input), so a criteria applied from outside would leave
   * them showing the previous filter — or blank while the table is filtered.
   */
  private syncColumnFilterInputs(): void {
    const filters = this.dataService.columnFilters();
    // visibleColumns(), not columns(): filterInputs is positional against what the
    // template actually rendered, so hiding or reordering a column would otherwise
    // put each box's text one seat off.
    const filterable = this.visibleColumns().filter((c) => c.filterable);
    this.filterInputs().forEach((input, i) => {
      const column = filterable[i];
      if (!column) return;
      input.setValue(filters[column.accessorKey || column.id] ?? '');
    });
  }

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
  /**
   * Clear the global search and every column filter.
   * <p>
   * The empty criteria goes out through the normal search channel. It used to
   * only re-run the CLIENT-side filter and emit `filtersCleared` — which is a
   * no-op on a server-backed table (they pass rows through untouched), and only
   * one host in the app ever subscribed to that output. On every other table the
   * boxes emptied while the rows stayed filtered, because nothing ever asked the
   * server for the unfiltered list.
   */
  clearAllFilters(): void {
    const criteria = this.utilService.buildSearchCriteria(
      '', {}, this.dataService.columnFilterLogic, this.dataService.globalFilterLogic);
    this.searchService.applyExternalCriteria(criteria);
    this.filterInputs().forEach(input => input.reset());
    this.localStorageService.saveTableFilters(criteria, this.dataService.tableId);
    this.filtersCleared.emit();
  }

  ngOnInit(): void {}

  /** Row mouseenter — capture the row's SCREEN rect so the fixed-
   *  positioned hover-action wrapper anchors next to it. Cancels any
   *  pending hide timer from the previous row's mouseleave so the
   *  overlay doesn't flash when the pointer moves row-to-row. */
  onRowMouseEnter(item: any, event: MouseEvent): void {
    this.clickService.onRowHover(item);
    // Skip the getBoundingClientRect calls when no overlay is configured
    // — every table in the app fires mouseenter; only the LOTO Standard
    // editor's opted-in tables need the rect math.
    const hasOverlay = this.hoverActionLeftTemplate() != null || this.hoverActionRightTemplate() != null;
    if (!hasOverlay) return;
    const tr = event.currentTarget as HTMLElement | null;
    if (tr) {
      this.trackedRowEl = tr;
      this.updateOverlayFromTrackedRow();
      this.ensureOverlayScrollListener();
    }
    this.overlayItem.set(item);
    if (this.overlayHideTimer != null) {
      clearTimeout(this.overlayHideTimer);
      this.overlayHideTimer = null;
    }
  }

  /** Re-read the tracked row's screen rect and push it into the overlay
   *  position signals. Called on mouseenter (initial anchor) and on any
   *  ancestor scroll (row + container may have moved). If the row has
   *  been virtualized out or removed, hide the overlay instead. */
  private updateOverlayFromTrackedRow(): void {
    const row = this.trackedRowEl;
    const container = this.tableContainerRef()?.nativeElement;
    if (!row || !container) return;
    const rowRect = row.getBoundingClientRect();
    if (rowRect.width === 0 && rowRect.height === 0) {
      this.overlayItem.set(null);
      this.detachOverlayScrollListener();
      return;
    }
    const containerRect = container.getBoundingClientRect();
    this.hoverOverlayTop.set(rowRect.top);
    this.hoverOverlayHeight.set(rowRect.height);
    this.hoverOverlayLeftX.set(containerRect.left);
    this.hoverOverlayRightX.set(containerRect.right);
  }

  /** Global {capture:true} scroll listener — a non-bubbling scroll on
   *  any ancestor (window, .cdk-virtual-scroll-viewport, a wrapping
   *  panel, etc.) still passes through window during the capture phase,
   *  so a single listener covers every scroll container above us
   *  without knowing which is scrollable. Recomputes the overlay's
   *  position from the still-anchored row. */
  private ensureOverlayScrollListener(): void {
    if (this.overlayScrollListener) return;
    const handler = () => this.updateOverlayFromTrackedRow();
    this.overlayScrollListener = handler;
    window.addEventListener('scroll', handler, { passive: true, capture: true });
  }

  private detachOverlayScrollListener(): void {
    if (this.overlayScrollListener) {
      window.removeEventListener('scroll', this.overlayScrollListener, true);
      this.overlayScrollListener = null;
    }
    this.trackedRowEl = null;
  }

  /** Row mouseleave — clear hover state in the click service (existing
   *  behavior) AND schedule the overlay hide. Delayed so the pointer's
   *  transit from cell to floating button has time to fire the button's
   *  mouseenter (which cancels the timer). */
  onRowMouseLeave(): void {
    this.clickService.onRowLeave();
    this.scheduleOverlayHide();
  }

  /** Overlay button mouseenter — cancel any pending hide so moving from
   *  cell → button (a common gesture that fires row.mouseleave right
   *  before button.mouseenter) doesn't collapse the overlay. */
  onOverlayEnter(): void {
    this.overlayHovered.set(true);
    if (this.overlayHideTimer != null) {
      clearTimeout(this.overlayHideTimer);
      this.overlayHideTimer = null;
    }
  }
  /** Overlay button mouseleave — schedule hide (unless pointer moves
   *  back onto a row within the grace window). */
  onOverlayLeave(): void {
    this.overlayHovered.set(false);
    this.scheduleOverlayHide();
  }

  private scheduleOverlayHide(): void {
    if (this.overlayHideTimer != null) clearTimeout(this.overlayHideTimer);
    this.overlayHideTimer = setTimeout(() => {
      this.overlayHideTimer = null;
      // Cancel the hide if the pointer landed on a row or on the overlay
      // itself in the meantime (either would have re-set overlayItem or
      // set overlayHovered).
      if (this.dataService.hoveredRow() == null && !this.overlayHovered()) {
        this.overlayItem.set(null);
        this.detachOverlayScrollListener();
      }
    }, 150);
  }

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
      .subscribe((m) => {
        this.driftMap.set(m);
        this.cdr.markForCheck();
        if (this.driftStripOpen()) this.fetchDriftLabels(); // label any newly-missing rows the poll surfaced
      });
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

  /** Toggle the missing strip; fetch friendly labels lazily on open. */
  toggleDriftStrip(): void {
    const open = !this.driftStripOpen();
    this.driftStripOpen.set(open);
    if (open) this.fetchDriftLabels();
  }
  /** Fetch hub labels for any missing rows we don't have a label for yet (best-effort). */
  private fetchDriftLabels(): void {
    const t = this.driftEntityType();
    if (!t) return;
    const need = this.driftMissingRows().map((r) => r.id).filter((id) => !this.driftLabels().has(id));
    if (!need.length) return;
    this.driftService.hubLabels(t, need)
      .pipe(takeUntilDestroyed(this.driftDestroyRef))
      .subscribe((m) => {
        this.driftLabels.update((prev) => { const n = new Map(prev); m.forEach((v, k) => n.set(k, v)); return n; });
        this.cdr.markForCheck();
      });
  }
  /** Friendly label for a missing row (falls back to #id until the hub label loads). */
  driftLabel(id: number): string { return this.driftLabels().get(id) ?? ('#' + id); }

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

  /** Popover value rendering — shared with the Drift Center + form popovers, so a relationship field
   *  reads "OPEN → CLOSED" instead of "4711 → 4712". The raw value stays in the cell's title tooltip. */
  driftText(entry: ThreeWayFieldEntry, side: 'local' | 'hub'): string {
    return this.driftService.valueText(entry, side);
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

  /** Leave the quick popover and open the focused full LOCAL-vs-HUB side-by-side for this row — the
   *  readable surface for complex entities (LotoStandard etc.) where the popover's one-line diff isn't enough. */
  openFullCompare(): void {
    const pop = this.driftPopover(); const t = this.driftEntityType();
    if (!pop || !t) return;
    this.closeDriftPopover();
    this.driftRouter.navigate(['/sync/compare'], { queryParams: { type: t, id: Number(pop.item.id) } });
  }

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

  /**
   * Row click entry point. While the table is in click-to-order mode the click
   * records a position instead of selecting/opening the row — routed here
   * rather than inside TableClickService because features subclass that
   * service's handlers and would each have to re-implement the guard.
   */
  onRowClick(item: any, event: MouseEvent): void {
    if (this.dragService.sequenceMode()) {
      event.preventDefault();
      event.stopPropagation();
      this.dragService.pickItem(item);
      return;
    }
    this.clickService.onRowClick(item, event);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.syncService.initializeTable();
    this.syncService.setupResizeObserver();
    this.syncService.setupHorizontalScrollSync();
    this.resizeService.setupResizeListeners();
    this.setupDensityObserver();
  }

  ngOnDestroy(): void {
    this.densityObserver?.disconnect();
    this.densityObserver = undefined;
    this.clickService.onDestroy();
    if (this.overlayHideTimer != null) {
      clearTimeout(this.overlayHideTimer);
      this.overlayHideTimer = null;
    }
    this.detachOverlayScrollListener();
  }
}
