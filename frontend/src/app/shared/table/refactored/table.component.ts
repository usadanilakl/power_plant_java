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
  ViewChild,
} from '@angular/core';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { TableDragService } from './services/table-drag.service';
import { TableClickService } from './services/table-click.service';
import { TableSyncService } from './services/table-sync.service';
import { TableSearchService } from './services/table-search.service';
import { TableSortService } from './services/table-sort.service';
import { TableSelectionService } from './services/table-selection.service';
import { TableResizeService } from './services/table-resize.service';
import { ColumnFilterInputComponent } from './column-filter-input/column-filter-input.component';
import {
  ButtonColor,
  ButtonConfig,
  ButtonsComponent,
} from '../../menu/buttons/buttons.component';
import { TableStateService } from './services/table-state.service';
import { TableControlsService } from './services/table-controls.service';
import { TableDataService } from './services/table-data.service';
import { TableUtilService } from './services/table-util.service';

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
  providers: [
    TableDragService,
    // TableClickService,
    TableSyncService,
    // TableSelectionService,
    TableResizeService,
    TableSearchService,
    TableSortService,
    // TableControlsService,
    // TableStateService
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dragService = inject(TableDragService);
  public clickService = inject(TableClickService);
  protected syncService = inject(TableSyncService);
  private searchService = inject(TableSearchService);
  private sortService = inject(TableSortService);
  private selectionService = inject(TableSelectionService);
  private resizeService = inject(TableResizeService);
  private tableStateService = inject(TableStateService);
  private controlsService = inject(TableControlsService);
  protected dataService = inject(TableDataService);
  private utilService = inject(TableUtilService);

  // Inputs
  items = input.required<any[]>();
  columns = input<Column[]>([]);
  columnUniqueOptions = input<string[]>([]);
  isLoadingMore = input<boolean>(false);
  deleteItem = input<string | undefined>();
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  clickSetupInput = input<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });

  tableControlButtonsInput = input<ButtonConfig[] | undefined>();
  defaultTableControlsEnabled = input<boolean>(true);

  // Outputs
  loadMoreItems = output<SearchCriteria>();
  search = output<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();
  sortChanged = output<{ column: Column; isAscending: boolean }>();
  loadMoreOptions = output<{ column: string; filter: string }>();
  loadInitialOptions = output<{ column: string; filter: string }>();

 
  headerContainer = viewChild<ElementRef<HTMLDivElement>>('headerContainer');
  headerTable = viewChild<ElementRef<HTMLTableElement>>('headerTable');
  bodyTable = viewChild<ElementRef<HTMLTableElement>>('bodyTable');
  tableBody = viewChild<ElementRef<HTMLDivElement>>('tableBody');
  viewport = viewChild(CdkVirtualScrollViewport);
  selectionActionsTemplate = viewChild(TemplateRef);

  rowHeight = 50;
  private resizeObserver?: ResizeObserver;

  //Resize state
  resizeState = this.resizeService.resizeState$;
  private columnWidths = new Map<string, number>();
  private resizeMouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private resizeMouseUpListener: (() => void) | null = null;

  // Signals from services
  dragState = this.dragService.dragState$;
  selectedItems = this.selectionService.selectedItems$;
  lastClickedItem = this.selectionService.lastClickedItem$;

  // protected _items: any[] = [];
  hoveredItem = this.clickService.hoveredRow;
  private selectedItems$ = toObservable(this.selectedItems).pipe(
    takeUntilDestroyed(this.destroyRef)
  );

  // Move effects to field initializers
  private itemsEffect = effect(() => {
    const items = this.items();
    // this.dataService.items() = items;
    this.dataService.items.set(items);
    this.clickService.allItems.set(items);
    this.searchService.updateFilteredItems();
    this.cdr.detectChanges();
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

  tableControlButtons = computed(() => {
    return this.controlsService.getTableControlButtons(
      this.tableControlButtonsInput(),
      this.defaultTableControlsEnabled()
    );
  });

  // NEW: Store unique values per column based on ORIGINAL items
  columnUniqueValuesMap = signal<{ [columnId: string]: string[] }>({});

  // Effect to calculate unique values whenever items change
  private calculateUniqueValues = effect(() => {
    const currentItems = this.items();
    const currentColumns = this.columns();

    if (!currentItems || !currentColumns) return;

    const uniqueValuesMap: { [columnId: string]: string[] } = {};

    currentColumns.forEach((column) => {
      if (!column.filterable) return;

      const uniqueValues = new Set<string>();

      currentItems.forEach((item) => {
        const value = this.getCellValue(item, column);
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(String(value).toLowerCase());
        }
      });

      uniqueValuesMap[column.id] = Array.from(uniqueValues).sort();
      console.log('Updating unique values: ', uniqueValues.size);
    });

    this.columnUniqueValuesMap.set(uniqueValuesMap);
  });

  private syncDataTableServiceEffect = effect(() => {
    this.dataService.headerContainer.set(this.headerContainer());
    this.dataService.headerTable.set(this.headerTable());
    this.dataService.bodyTable.set(this.bodyTable());
    this.dataService.viewport.set(this.viewport());
    this.dataService.selectionActionsTemplate.set(
      this.selectionActionsTemplate()
    );
  });

  constructor() {
    effect(() => {this.loadMoreItems.emit(this.dataService.loadMoreItems());});
  }

  ngOnInit(): void {
    this.setupSelectionEmitter();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initializeTable();
    this.setupResizeObserver();
    this.syncService.setupHorizontalScrollSync();
    this.setupResizeListeners();
  }

  get totalTableWidth(): number {
    return this.columns().reduce((sum, col) => sum + (col.width || 120), 0);
  }

  // ============ Initialization Methods ============


  private setupSelectionEmitter(): void {
    this.selectedItems$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        console.log('Selected items:', items);
        this.selectedItemsEvent.emit(items);
      });
  }

  private initializeTable(): void {
    setTimeout(() => {
      this.detectRowHeight();
      this.calculateInitialColumnWidths();
      this.syncService.synchronizeColumnWidths();
      this.searchService.updateItemIndices();
    });
  }

  private detectRowHeight(): void {
    if (this.tableBody() && this.tableBody()!.nativeElement) {
      const sampleRow = this.tableBody()!.nativeElement.querySelector('tr');
      if (sampleRow) {
        this.rowHeight = sampleRow.offsetHeight;
        if (this.viewport) {
          this.viewport()!.checkViewportSize();
        }
        this.cdr.detectChanges();
      }
    }
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.viewport) {
        this.viewport()!.checkViewportSize();
      }
      this.syncService.synchronizeColumnWidths();
    });

    if (this.viewport()!.elementRef.nativeElement) {
      this.resizeObserver.observe(this.viewport()!.elementRef.nativeElement);
    }

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }

  private calculateInitialColumnWidths(): void {
    if (!this.columns || this.columns.length === 0) return;

    this.columns().forEach((column) => {
      if (!column.width || column.width === 0) {
        // Estimate width: ~8px per character + padding
        const estimatedWidth = Math.max(
          120, // minimum width
          (column.header?.length || 10) * 8 + 24
        );
        column.width = estimatedWidth;
      }
    });
  }
  // ============ Search and Filter Methods ============

  onGlobalSearchChange(): void {
    this.performSearch();
  }

  onColumnSearchChange(): void {
    this.performSearch();
  }

  private performSearch(): void {
    const searchCriteria = this.utilService.buildSearchCriteria(
      this.dataService.globalSearchQuery,
      this.dataService.columnFilters()
    );

    this.searchService.updateFilteredItems();
    this.search.emit(searchCriteria);
  }

  /**
   * Handle column filter change
   */

  onColumnFilterChange(columnId: string, filterValue: string): void {
    const currentFilters = this.dataService.columnFilters();
    this.dataService.columnFilters.set({
      ...currentFilters,
      [columnId]: filterValue,
    });
    this.performSearch();
    this.cdr.detectChanges();
  }

  // ============ Sorting Methods ============

  sortColumn(column: Column, emit = false): void {
    if (this.isDragAndDropEnabled()) return;

    const columnKey = column.accessorKey || column.id;
    this.dataService.isAscending =
      this.dataService.currentSortColumn === columnKey ? !this.dataService.isAscending : true;
    this.dataService.currentSortColumn = columnKey;

    this.dataService.filteredItems = this.sortService.sortItems(
      this.dataService.filteredItems,
      column,
      this.dataService.isAscending,
      (obj, path) => this.searchService.getNestedProperty(obj, path)
    );

    if (emit) this.sortChanged.emit({ column, isAscending: this.dataService.isAscending });
    this.cdr.detectChanges();
  }

  // ============ Cell Value Methods ============

  getCellValue(item: any, column: Column): string {
    if (column.accessorFn) {
      return column.accessorFn(item);
    }
    if (column.accessorKey) {
      return this.searchService.getNestedProperty(item, column.accessorKey);
    }
    return '';
  }

  getCellStyle(item: any, column: any): { [key: string]: string } {
    if (column.conditionalStyling) {
      return column.conditionalStyling(item, column);
    }
    return {};
  }

  // ============ Drag and Drop Methods ============

  onMouseDown(event: MouseEvent, item: any): void {
    if (this.isDragAndDropEnabled()) {
      // Ensure item has index property before starting drag
      if (!item.hasOwnProperty('index')) {
        const itemIndex = this.dataService.filteredItems.indexOf(item);
        item.index = itemIndex;
        console.log('Item index updated:', item);
      }
      this.dragService.startDrag(item, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }

  onMouseUp(event: MouseEvent): void {
    console.log('onMouseUp triggered');
    const dragState = this.dragService.getDragState();
    console.log('Drag state:', dragState);
    if (dragState.isDragging && dragState.startIndex !== null) {
      console.log('Item was being dragged. Start index:', dragState.startIndex);
      const hovered = this.clickService.hoveredRow();
      console.log('Hovered item:', hovered);
      if (hovered) {
        const toIndex = this.dataService.filteredItems.findIndex(
          (item) => item === hovered
        );
        // console.log('Calculated toIndex:', toIndex);
        if (toIndex !== -1) {
          // console.log(`Moving item from ${dragState.startIndex} to ${toIndex}`);
          this.moveItem(dragState.startIndex, toIndex);
        } else {
          console.log('Hovered item not found in filteredItems, not moving.');
        }
      } else {
        console.log('No item was hovered, not moving.');
      }
    }
    this.dragService.endDrag();
    // console.log('Drag ended.');
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    requestAnimationFrame(() => {
      // Find the actual item from filteredItems
      const movedItem = this.dataService.filteredItems[fromIndex];

      // Find the original index in the master _items array
      const originalFromIndex = this.dataService.items().findIndex((i) => i === movedItem);

      // Find the target item in filteredItems to determine where to move in _items
      const targetItem = this.dataService.filteredItems[toIndex];
      const originalToIndex = this.dataService.items().findIndex((i) => i === targetItem);

      if (originalFromIndex !== -1 && originalToIndex !== -1) {
        // Perform the move in the master array
        const [itemToMove] = this.dataService.items().splice(originalFromIndex, 1);
        this.dataService.items().splice(originalToIndex, 0, itemToMove);

        // Re-apply filtering and sorting to get the new filteredItems
        this.searchService.updateFilteredItems();

        // Emit the reordered master list
        this.itemsReordered.emit([...this.dataService.items()]);

        this.cdr.detectChanges();
      }
    });
  }

  onDragOver(event: MouseEvent): void {
    event.preventDefault();
  }

  // ============ Selection Methods ============

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  /**
   * Delete selected items
   */
  deleteSelectedItems(deleteItemFn: (ids: any[]) => void): void {
    const selectedItems = this.selectionService.selectedItems();
    if (selectedItems.length > 0) {
      const ids = selectedItems.map((item) => item.id);
      deleteItemFn(ids);
      this.selectionService.clearSelection();
    }
  }

  // ============ Hover Methods ============

  // ============ Resize Methods ============//

  private setupResizeListeners(): void {
    this.resizeMouseMoveListener = (e: MouseEvent) => this.onResizeMouseMove(e);
    this.resizeMouseUpListener = () => this.onResizeMouseUp();

    document.addEventListener('mousemove', this.resizeMouseMoveListener);
    document.addEventListener('mouseup', this.resizeMouseUpListener);

    this.destroyRef.onDestroy(() => {
      if (this.resizeMouseMoveListener) {
        document.removeEventListener('mousemove', this.resizeMouseMoveListener);
      }
      if (this.resizeMouseUpListener) {
        document.removeEventListener('mouseup', this.resizeMouseUpListener);
      }
    });
  }

  onResizeStart(
    event: MouseEvent,
    columnId: string,
    currentWidth: number
  ): void {
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();
    event.stopPropagation();

    this.resizeService.startResize(columnId, event.clientX, currentWidth);
  }

  private onResizeMouseMove(event: MouseEvent): void {
    if (!this.resizeService.isResizing()) return;

    const newWidth = this.resizeService.updateResize(event.clientX);
    const columnId = this.resizeService.getResizingColumnId();

    if (columnId) {
      this.columnWidths.set(columnId, newWidth);
      this.updateColumnWidth(columnId, newWidth);
      // Sync widths immediately during resize
      this.syncService.synchronizeColumnWidths();
      this.cdr.detectChanges();
    }
  }

  private onResizeMouseUp(): void {
    if (this.resizeService.isResizing()) {
      this.resizeService.endResize();
      this.syncService.synchronizeColumnWidths();
      this.cdr.detectChanges();
    }
  }

  private updateColumnWidth(columnId: string, width: number): void {
    const column = this.columns().find((col) => col.id === columnId);
    if (column) {
      column.width = width;
    }
  }

  getColumnWidth(columnId: string): number {
    return (
      this.columnWidths.get(columnId) ||
      this.columns().find((col) => col.id === columnId)?.width ||
      120
    );
  }

  isResizing(): boolean {
    return this.resizeService.isResizing();
  }

  getResizingColumnId(): string | null {
    return this.resizeService.getResizingColumnId();
  }

  // ============ Utility Methods ============

  isItemSelected(item: any): boolean {
    return this.selectedItems().some((i) => i.id === item.id);
  }

  isItemDragged(item: any): boolean {
    const dragState = this.dragService.getDragState();
    return dragState.draggedItem?.id === item.id;
  }

  trackByItemId(index: number, item: any): any {
    return item.id || index;
  }

  ngOnDestroy(): void {
    this.clickService.onDestroy();
  }
}

// import {
//   AfterViewInit,
//   ChangeDetectorRef,
//   Component,
//   computed,
//   DestroyRef,
//   effect,
//   ElementRef,
//   inject,
//   input,
//   OnInit,
//   output,
//   PLATFORM_ID,
//   signal,
//   TemplateRef,
//   ViewChild,
// } from '@angular/core';
// import {
//   CdkVirtualScrollViewport,
//   ScrollingModule,
// } from '@angular/cdk/scrolling';
// import {
//   Subject,
//   debounceTime,
// } from 'rxjs';
// import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
// import { FormsModule } from '@angular/forms';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { Column } from '../../../models/column.model';
// import { SearchCriteria } from '../../../models/api/search-criteria.model';
// import { TableDragService } from './services/table-drag.service';
// import { TableClickService } from './services/table-click.service';
// import { TableSyncService } from './services/table-sync.service';
// import { TableSearchService } from './services/table-search.service';
// import { TableSortService } from './services/table-sort.service';
// import { TableSelectionService } from './services/table-selection.service';
// import { TableResizeService } from './services/table-resize.service';
// import { ColumnFilterInputComponent } from './column-filter-input/column-filter-input.component';
// import {
//   ButtonColor,
//   ButtonConfig,
//   ButtonsComponent,
// } from '../../menu/buttons/buttons.component';

// export interface ClickSetup {
//   applyTo: 'row' | 'cell';
//   actions: ('leftClick' | 'rightClick' | 'middleClick' | 'doubleClick')[];
// }

// export interface FilterOutRules {
//   action: 'highlight' | 'exclude';
//   items: any[];
//   style: { [key: string]: string };
// }

// export type TableMode = 'row' | 'cell';

// @Component({
//   selector: 'app-table',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ScrollingModule,
//     ColumnFilterInputComponent,
//     ButtonsComponent,
//   ],
//   providers: [
//     TableDragService,
//     TableClickService,
//     TableSyncService,
//     TableSelectionService,
//     TableResizeService,
//     TableSearchService,
//     TableSortService,
//     TableSelectionService,
//     TableResizeService,
//   ],
//   templateUrl: './table.component.html',
//   styleUrl: './table.component.css',
// })
// export class TableComponent implements OnInit, AfterViewInit {
//   private platformId = inject(PLATFORM_ID);
//   private destroyRef = inject(DestroyRef);
//   private cdr = inject(ChangeDetectorRef);
//   private dragService = inject(TableDragService);
//   private clickService = inject(TableClickService);
//   private syncService = inject(TableSyncService);
//   private searchService = inject(TableSearchService);
//   private sortService = inject(TableSortService);
//   private selectionService = inject(TableSelectionService);
//   private resizeService = inject(TableResizeService);

//   // Inputs
//   items = input.required<any[]>();
//   columns = input<Column[]>([]);
//   columnUniqueOptions = input<string[]>([]);
//   isLoadingMore = input<boolean>(false);
//   deleteItem = input<string | undefined>();
//   hoverDebounceTime = input<number>(0);
//   isDragAndDropEnabled = input<boolean>(false);
//   filterOutItems = input<FilterOutRules | undefined>();
//   clickSetupInput = input<ClickSetup>({
//     applyTo: 'row',
//     actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
//   });
//   tableMode = signal<'row' | 'cell'>('row');
//   tableControlButtonsInput = input<ButtonConfig[] | undefined>();
//   defaultTableControlsEnabled = input<boolean>(true);

//   // Outputs
//   rowClicked = output<{ item: any; event: MouseEvent }>();
//   rowDoubleClicked = output<any>();
//   rowRightClicked = output<any>();
//   rowMiddleClicked = output<any>();

//   cellDoubleClicked = output<{ item: any; column: Column }>();
//   cellClicked = output<{ item: any; column: Column }>();
//   cellRightClicked = output<{ item: any; column: Column }>();
//   cellMiddleClicked = output<{ item: any; column: Column }>();

//   loadMoreItems = output<SearchCriteria>();
//   search = output<SearchCriteria>();
//   rowHoveredEvent = output<any>();
//   selectedItemsEvent = output<any[]>();
//   itemsReordered = output<any[]>();
//   sortChanged = output<{ column: Column; isAscending: boolean }>();
//   loadMoreOptions = output<{ column: string; filter: string }>();
//   loadInitialOptions = output<{ column: string; filter: string }>();
//   tableModeChange = output<TableMode>();

//   // ViewChild references
//   @ViewChild('tableContainer') tableContainer!: ElementRef;
//   @ViewChild('tableBody') tableBody!: ElementRef;
//   @ViewChild('headerContainer', { read: ElementRef })
//   headerContainer!: ElementRef<HTMLDivElement>;
//   @ViewChild('headerTable', { read: ElementRef })
//   headerTable!: ElementRef<HTMLTableElement>;
//   @ViewChild('bodyTable', { read: ElementRef })
//   bodyTable!: ElementRef<HTMLTableElement>;
//   @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
//   @ViewChild('selectionActions', { read: TemplateRef })
//   selectionActionsTemplate!: TemplateRef<any>;

//   // Component state
//   filteredItems: any[] = [];
//   globalSearchQuery: string = '';
//   columnFilters: { [key: string]: string } = {};
//   currentSortColumn: string | null = null;
//   isAscending: boolean = true;
//   rowHeight = 50;

//   private hoverSubject = new Subject<any>();
//   private resizeObserver?: ResizeObserver;

//   //Resize state
//   resizeState = this.resizeService.resizeState$;
//   private columnWidths = new Map<string, number>();
//   private resizeMouseMoveListener: ((e: MouseEvent) => void) | null = null;
//   private resizeMouseUpListener: (() => void) | null = null;

//   // Signals from services
//   dragState = this.dragService.dragState$;
//   selectedItems = this.selectionService.selectedItems$;
//   lastClickedItem = this.selectionService.lastClickedItem$;

//   protected _items: any[] = [];
//   private lastClickedCell!: { item: any; column: Column };
//   hoveredItem = signal<any>(null);
//   private selectedItems$ = toObservable(this.selectedItems).pipe(
//     takeUntilDestroyed(this.destroyRef)
//   );
//   private excludedItemIds = new Set<any>();
//   private highlightedItemIds = new Set<any>();
//   private highlightStyle: { [key: string]: string } = {};

//   // Move effects to field initializers
//   private itemsEffect = effect(() => {
//     const items = this.items();
//     this.dataService.items() = items;
//     this.updateFilteredItems();
//     this.cdr.detectChanges();
//   });

//   private filterOutEffect = effect(() => {
//     const rules = this.filterOutItems();
//     this.excludedItemIds.clear();
//     this.highlightedItemIds.clear();
//     this.highlightStyle = {};

//     if (rules && rules.items.length > 0) {
//       const itemIds = new Set(rules.items.map((item) => item.id));
//       if (rules.action === 'exclude') {
//         this.excludedItemIds = itemIds;
//       } else if (rules.action === 'highlight') {
//         this.highlightedItemIds = itemIds;
//         this.highlightStyle = rules.style;
//       }
//     }
//     this.updateFilteredItems();
//   });

//   // NEW: Store unique values per column based on ORIGINAL items
//   columnUniqueValuesMap = signal<{ [columnId: string]: string[] }>({});

//   // Effect to calculate unique values whenever items change
//   private calculateUniqueValues = effect(() => {
//     const currentItems = this.items();
//     const currentColumns = this.columns();

//     if (!currentItems || !currentColumns) return;

//     const uniqueValuesMap: { [columnId: string]: string[] } = {};

//     currentColumns.forEach((column) => {
//       if (!column.filterable) return;

//       const uniqueValues = new Set<string>();

//       currentItems.forEach((item) => {
//         const value = this.getCellValue(item, column);
//         if (value !== null && value !== undefined && value !== '') {
//           uniqueValues.add(String(value).toLowerCase());
//         }
//       });

//       uniqueValuesMap[column.id] = Array.from(uniqueValues).sort();
//       console.log('Updating unique values: ', uniqueValues.size);
//     });

//     this.columnUniqueValuesMap.set(uniqueValuesMap);
//   });

//   tableControlButtons = computed(() => {
//     const inputButtons = this.tableControlButtonsInput();
//     const defaultEnabled = this.defaultTableControlsEnabled();

//     // Only input provided and default disabled
//     if (inputButtons && !defaultEnabled) {
//       return inputButtons;
//     }

//     // Only default enabled (no input or input is empty)
//     if (!inputButtons && defaultEnabled) {
//       return this.getDefaultTableControlButtons();
//     }

//     // Both input and default enabled - combine them
//     if (inputButtons && defaultEnabled) {
//       return [...this.getDefaultTableControlButtons(), ...inputButtons];
//     }

//     // Neither enabled
//     return [];
//   });

//   private getDefaultTableControlButtons(): ButtonConfig[] {
//     return [
//       {
//         name: 'Row-Mode',
//         action: () => {
//           this.setTableMode('row');
//         },
//         color: 'primary' as ButtonColor,
//         icon: 'view_agenda',
//       },
//       {
//         name: 'Cell-Mode',
//         action: () => {
//           this.setTableMode('cell');
//         },
//         color: 'warn' as ButtonColor,
//         icon: 'grid_on',
//       },
//       {
//         name: 'Add to Clipboard',
//         action: () => {
//           this.selectionService.addToClipboard();
//         },
//         color: 'primary' as ButtonColor,
//         icon: 'content_copy',
//       },
//     ];
//   }

//   setTableMode(mode: TableMode): void {
//     this.tableMode.set(mode);
//     this.tableModeChange.emit(mode);
//   }

//   constructor() {
//     this.setupHoverHandlers();
//   }

//   ngOnInit(): void {
//     this.setupSelectionEmitter();
//     // this.setupClickHandlers();
//   }

//   ngAfterViewInit(): void {
//     if (!isPlatformBrowser(this.platformId)) return;
//     this.initializeTable();
//     this.setupResizeObserver();
//     this.setupHorizontalScrollSync();
//     this.setupResizeListeners();
//   }

//   get totalTableWidth(): number {
//     return this.columns().reduce((sum, col) => sum + (col.width || 120), 0);
//   }

//   private setupHorizontalScrollSync(): void {
//     if (!this.viewport) return;

//     this.viewport.scrolledIndexChange
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(() => {
//         this.syncHeaderScroll();
//         this.checkForLoadMore();
//       });

//     // Store the handler reference so it can be removed
//     const scrollHandler = () => this.syncHeaderScroll();
//     const viewportElement = this.viewport.elementRef.nativeElement;

//     viewportElement.addEventListener('scroll', scrollHandler);

//     this.destroyRef.onDestroy(() => {
//       viewportElement.removeEventListener('scroll', scrollHandler);
//     });
//   }

//   private syncHeaderScroll(): void {
//     if (!this.viewport || !this.headerContainer?.nativeElement) return;

//     const scrollLeft = this.viewport.elementRef.nativeElement.scrollLeft;
//     this.headerContainer.nativeElement.scrollLeft = scrollLeft;
//   }

//   private checkForLoadMore(): void {
//     if (!this.viewport) return;

//     const end = this.viewport.getRenderedRange().end;
//     const total = this.filteredItems.length;

//     if (end >= total - 5 && total > 0) {
//       // Trigger load more when within 5 items of the end
//       const searchCriteria = this.searchService.buildSearchCriteria(
//         this.globalSearchQuery,
//         this.columnFilters
//       );
//       this.loadMoreItems.emit(searchCriteria);
//     }
//   }

//   // ============ Initialization Methods ============

//   private updateFilteredItems(): void {
//     // Start with all items, but filter out any that are in the exclusion set.
//     const itemsToFilter = this.dataService.items().filter(
//       (item) => !this.excludedItemIds.has(item.id)
//     );

//     // Apply global and column-specific search queries.
//     this.filteredItems = this.searchService.performSearch(
//       itemsToFilter,
//       this.globalSearchQuery,
//       this.columnFilters
//     );

//     // Re-apply the current sort order to the newly filtered list.
//     if (this.currentSortColumn) {
//       const column = this.columns().find(
//         (col) => col.id === this.currentSortColumn
//       );
//       if (column) {
//         // The sortColumn method sorts `this.filteredItems` in place.
//         // this.sortColumn(column);
//       }
//     }

//     // Update the indices for virtual scrolling.
//     this.updateItemIndices();

//     // Use a small timeout to ensure the DOM has updated before syncing widths.
//     // This is crucial for accurate width calculation after filtering/sorting.
//     setTimeout(() => {
//       this.syncService.synchronizeColumnWidths();
//       this.cdr.detectChanges();
//     }, 50);
//   }

//   getRowStyle(item: any): { [key: string]: string } {
//     if (this.highlightedItemIds.has(item.id)) {
//       return this.highlightStyle;
//     }
//     return {};
//   }

//   private setupHoverHandlers(): void {
//     this.hoverSubject
//       .pipe(
//         debounceTime(this.hoverDebounceTime()),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe((item) => {
//         this.rowHoveredEvent.emit(item);
//         this.hoveredItem.set(item);
//       });
//   }

//   private setupSelectionEmitter(): void {
//     this.selectedItems$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe((items) => {
//         this.selectedItemsEvent.emit(items);
//       });
//   }

//   private initializeTable(): void {
//     setTimeout(() => {
//       this.detectRowHeight();
//       this.calculateInitialColumnWidths();
//       this.syncService.setSyncElements(
//         this.headerTable?.nativeElement,
//         this.bodyTable?.nativeElement,
//         this.headerContainer?.nativeElement
//       );
//       this.syncService.synchronizeColumnWidths();
//       this.updateItemIndices();
//     });
//   }

//   private detectRowHeight(): void {
//     if (this.tableBody?.nativeElement) {
//       const sampleRow = this.tableBody.nativeElement.querySelector('tr');
//       if (sampleRow) {
//         this.rowHeight = sampleRow.offsetHeight;
//         if (this.viewport) {
//           this.viewport.checkViewportSize();
//         }
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   private setupResizeObserver(): void {
//     if (!isPlatformBrowser(this.platformId)) return;
//     this.resizeObserver = new ResizeObserver(() => {
//       if (this.viewport) {
//         this.viewport.checkViewportSize();
//       }
//       this.syncService.synchronizeColumnWidths();
//     });

//     if (this.viewport?.elementRef.nativeElement) {
//       this.resizeObserver.observe(this.viewport.elementRef.nativeElement);
//     }

//     this.destroyRef.onDestroy(() => {
//       this.resizeObserver?.disconnect();
//     });
//   }

//   private calculateInitialColumnWidths(): void {
//     if (!this.columns || this.columns.length === 0) return;

//     this.columns().forEach((column) => {
//       if (!column.width || column.width === 0) {
//         // Estimate width: ~8px per character + padding
//         const estimatedWidth = Math.max(
//           120, // minimum width
//           (column.header?.length || 10) * 8 + 24
//         );
//         column.width = estimatedWidth; // ← This sets the width property
//       }
//     });
//   }
//   // ============ Search and Filter Methods ============

//   onGlobalSearchChange(): void {
//     this.performSearch();
//   }

//   onColumnSearchChange(): void {
//     this.performSearch();
//   }

//   private performSearch(): void {
//     const searchCriteria = this.searchService.buildSearchCriteria(
//       this.globalSearchQuery,
//       this.columnFilters
//     );

//     this.updateFilteredItems();
//     this.search.emit(searchCriteria);
//   }

//   /**
//    * Handle column filter change
//    */
//   onColumnFilterChange(columnId: string, filterValue: string): void {
//     this.columnFilters[columnId] = filterValue;
//     this.performSearch();
//     this.cdr.detectChanges();
//   }

//   // ============ Sorting Methods ============

//   sortColumn(column: Column, emit = false): void {
//     if (this.isDragAndDropEnabled()) return;

//     const columnKey = column.accessorKey || column.id;
//     this.isAscending =
//       this.currentSortColumn === columnKey ? !this.isAscending : true;
//     this.currentSortColumn = columnKey;

//     this.filteredItems = this.sortService.sortItems(
//       this.filteredItems,
//       column,
//       this.isAscending,
//       (obj, path) => this.searchService.getNestedProperty(obj, path)
//     );

//     if (emit) this.sortChanged.emit({ column, isAscending: this.isAscending });
//     this.cdr.detectChanges();
//     // Remove this line - sync is now called in updateFilteredItems()
//     // setTimeout(() => this.syncService.synchronizeColumnWidths(), 100);
//   }

//   // ============ Cell Value Methods ============

//   getCellValue(item: any, column: Column): string {
//     if (column.accessorFn) {
//       return column.accessorFn(item);
//     }
//     if (column.accessorKey) {
//       return this.searchService.getNestedProperty(item, column.accessorKey);
//     }
//     return '';
//   }

//   getCellStyle(item: any, column: any): { [key: string]: string } {
//     if (column.conditionalStyling) {
//       return column.conditionalStyling(item, column);
//     }
//     return {};
//   }

//   // ============ Drag and Drop Methods ============

//   onMouseDown(event: MouseEvent, item: any): void {
//     if (this.isDragAndDropEnabled()) {
//       // Ensure item has index property before starting drag
//       if (!item.hasOwnProperty('index')) {
//         const itemIndex = this.filteredItems.indexOf(item);
//         item.index = itemIndex;
//       }
//       this.dragService.startDrag(item, { x: event.clientX, y: event.clientY });
//       event.preventDefault();
//     }
//   }

//   onMouseUp(event: MouseEvent): void {
//     // console.log('onMouseUp triggered');
//     const dragState = this.dragService.getDragState();
//     // console.log('Drag state:', dragState);
//     if (dragState.isDragging && dragState.startIndex !== null) {
//       // console.log('Item was being dragged. Start index:', dragState.startIndex);
//       const hovered = this.hoveredItem();
//       // console.log('Hovered item:', hovered);
//       if (hovered) {
//         const toIndex = this.filteredItems.findIndex(
//           (item) => item === hovered
//         );
//         // console.log('Calculated toIndex:', toIndex);
//         if (toIndex !== -1) {
//           // console.log(`Moving item from ${dragState.startIndex} to ${toIndex}`);
//           this.moveItem(dragState.startIndex, toIndex);
//         } else {
//           console.log('Hovered item not found in filteredItems, not moving.');
//         }
//       } else {
//         console.log('No item was hovered, not moving.');
//       }
//     }
//     this.dragService.endDrag();
//     // console.log('Drag ended.');
//   }

//   private moveItem(fromIndex: number, toIndex: number): void {
//     requestAnimationFrame(() => {
//       // Find the actual item from filteredItems
//       const movedItem = this.filteredItems[fromIndex];

//       // Find the original index in the master _items array
//       const originalFromIndex = this.dataService.items().findIndex((i) => i === movedItem);

//       // Find the target item in filteredItems to determine where to move in _items
//       const targetItem = this.filteredItems[toIndex];
//       const originalToIndex = this.dataService.items().findIndex((i) => i === targetItem);

//       if (originalFromIndex !== -1 && originalToIndex !== -1) {
//         // Perform the move in the master array
//         const [itemToMove] = this.dataService.items().splice(originalFromIndex, 1);
//         this.dataService.items().splice(originalToIndex, 0, itemToMove);

//         // Re-apply filtering and sorting to get the new filteredItems
//         this.updateFilteredItems();

//         // Emit the reordered master list
//         this.itemsReordered.emit([...this.dataService.items()]);

//         this.cdr.detectChanges();
//       }
//     });
//   }

//   private updateItemIndices(): void {
//     this.filteredItems.forEach((item, index) => {
//       item.index = index;
//     });
//     this.cdr.markForCheck();
//   }

//   onDragOver(event: MouseEvent): void {
//     event.preventDefault();
//   }

//   // ============ Selection Methods ============

//   private singleClickTimeout: any = null;
//   private doubleClickWindow = 300; // ms
//   private isProcessingDoubleClick = false;

//   onRowClick(item: any, event: MouseEvent): void {
//     event.preventDefault();

//     // Cancel any pending single click
//     if (this.singleClickTimeout) {
//       clearTimeout(this.singleClickTimeout);
//       this.singleClickTimeout = null;
//       console.log('Single click cancelled - double click detected');
//       this.onRowDoubleClick(item);
//       return;
//     }

//     // Schedule single click
//     this.singleClickTimeout = setTimeout(() => {
//       this.singleClickTimeout = null;
//       console.log('Single click executed');
//       this.handleSingleClick(item, event);
//     }, this.doubleClickWindow);
//   }

//   private handleSingleClick(item: any, event: MouseEvent) {
//     const normalizedItem = this.dataService.items().find((i) => i.id === item.id) || item;

//     if (event.ctrlKey) {
//       this.onRowCtrlClick(normalizedItem);
//     } else if (event.shiftKey) {
//       this.onRowShiftClick(normalizedItem);
//     } else {
//       this.selectionService.clearSelection();
//       if (this.tableMode() === 'cell' && this.lastClickedCell) {
//         this.cellClicked.emit({
//           item: normalizedItem,
//           column: this.lastClickedCell.column,
//         });
//       } else {
//         this.rowClicked.emit({ item: normalizedItem, event });
//       }
//     }
//   }

//   handleMiddleClick(item: any, event: MouseEvent) {
//     event.preventDefault();
//     event.stopPropagation();

//     const normalizedItem = this.dataService.items().find((i) => i.id === item.id) || item;
//     console.log('Middle click detected');

//     // Handle cell mode vs row mode
//     if (this.tableMode() === 'cell') {
//       if (this.lastClickedCell) {
//         this.cellMiddleClicked.emit({
//           item: normalizedItem,
//           column: this.lastClickedCell.column,
//         });
//       }
//     } else {
//       this.rowMiddleClicked.emit(normalizedItem);
//     }
//   }

//   onRowDoubleClick(item: any): void {
//     if (this.isProcessingDoubleClick) {
//       return;
//     }

//     this.isProcessingDoubleClick = true;

//     // Reset flag after a short delay to allow for rapid double-clicks
//     setTimeout(() => {
//       this.isProcessingDoubleClick = false;
//     }, 600);
//     const normalizedItem = this.dataService.items().find((i) => i.id === item.id) || item;

//     if (this.tableMode() === 'cell') {
//       if (!this.lastClickedCell) {
//         console.warn('Cell mode active but no cell was clicked');
//       }
//       this.cellDoubleClicked.emit({
//         item: normalizedItem,
//         column: this.lastClickedCell?.column || ({ id: 'unknown' } as Column),
//       });
//     } else {
//       this.rowDoubleClicked.emit(normalizedItem);
//     }
//   }

//   onRowRightClick(item: any, event: MouseEvent): void {
//     event.preventDefault();
//     const normalizedItem = this.dataService.items().find((i) => i.id === item.id) || item;

//     if (this.tableMode() === 'cell') {
//       if (this.lastClickedCell) {
//         this.cellRightClicked.emit({
//           item: normalizedItem,
//           column: this.lastClickedCell.column,
//         });
//       } else {
//         console.warn('Cell mode active but no cell was clicked');
//         this.rowRightClicked.emit(normalizedItem);
//       }
//     } else {
//       this.rowRightClicked.emit({ item: normalizedItem, event });
//     }
//   }

//   private onRowCtrlClick(item: any): void {
//     this.selectionService.toggleItem(item);
//     console.log("Selected items in control mode: ", this.selectionService.selectedItems());
//   }

//   private onRowShiftClick(item: any): void {
//     const lastItem = this.lastClickedItem();
//     if (!lastItem) {
//       this.selectionService.selectItem(item);
//       return;
//     }

//     this.selectionService.selectRange(this.dataService.items(), lastItem, item);
//   }

//   clearSelection(): void {
//     this.selectionService.clearSelection();
//   }

//   onDeleteSelectedItems(): void {
//     if (this.deleteItem) {
//       this.selectionService.deleteSelected(this.deleteItem);
//       const deletedIds = new Set(this.selectedItems().map((item) => item.id));
//       this.dataService.items() = this.dataService.items().filter((item) => !deletedIds.has(item.id));
//       this.updateFilteredItems();
//       this.cdr.detectChanges();
//     }
//   }

//   // ============ Hover Methods ============

//   hoveredCell = signal<{ item: any; column: Column } | null>(null);

//   // Add method to handle cell hover
//   onCellHover(item: any, column: Column): void {
//     if (this.tableMode() !== 'cell') return;
//     this.hoveredCell.set({ item, column });
//   }

//   // Add method to handle cell leave
//   onCellLeave(): void {
//     this.hoveredCell.set(null);
//   }

//   // Add method to check if cell should be highlighted
//   isCellHighlighted(item: any, column: Column): boolean {
//     const hovered = this.hoveredCell();
//     return (
//       hovered !== null &&
//       hovered.item.id === item.id &&
//       hovered.column.id === column.id
//     );
//   }

//   // Add method to get cell style with hover highlight
//   getCellStyleWithHover(item: any, column: Column): { [key: string]: string } {
//     // Get base conditional styling
//     let style: { [key: string]: string } = {};

//     if (column.conditionalStyling) {
//       style = column.conditionalStyling(item, column);
//     }

//     // Add hover styling on top
//     if (this.isCellHighlighted(item, column)) {
//       return {
//         ...style,
//         'box-shadow': 'inset 0 0 4px rgba(33, 150, 243, 0.3)',
//         outline: '2px solid rgba(33, 150, 243, 0.5)',
//       };
//     }

//     return style;
//   }

//   onRowHover(item: any): void {
//     this.hoverSubject.next(item);
//   }

//   // ============ Resize Methods ============//

//   private setupResizeListeners(): void {
//     this.resizeMouseMoveListener = (e: MouseEvent) => this.onResizeMouseMove(e);
//     this.resizeMouseUpListener = () => this.onResizeMouseUp();

//     document.addEventListener('mousemove', this.resizeMouseMoveListener);
//     document.addEventListener('mouseup', this.resizeMouseUpListener);

//     this.destroyRef.onDestroy(() => {
//       if (this.resizeMouseMoveListener) {
//         document.removeEventListener('mousemove', this.resizeMouseMoveListener);
//       }
//       if (this.resizeMouseUpListener) {
//         document.removeEventListener('mouseup', this.resizeMouseUpListener);
//       }
//     });
//   }

//   onResizeStart(
//     event: MouseEvent,
//     columnId: string,
//     currentWidth: number
//   ): void {
//     if (!isPlatformBrowser(this.platformId)) return;

//     event.preventDefault();
//     event.stopPropagation();

//     this.resizeService.startResize(columnId, event.clientX, currentWidth);
//   }

//   private onResizeMouseMove(event: MouseEvent): void {
//     if (!this.resizeService.isResizing()) return;

//     const newWidth = this.resizeService.updateResize(event.clientX);
//     const columnId = this.resizeService.getResizingColumnId();

//     if (columnId) {
//       this.columnWidths.set(columnId, newWidth);
//       this.updateColumnWidth(columnId, newWidth);
//       // Sync widths immediately during resize
//       this.syncService.synchronizeColumnWidths();
//       this.cdr.detectChanges();
//     }
//   }

//   private onResizeMouseUp(): void {
//     if (this.resizeService.isResizing()) {
//       this.resizeService.endResize();
//       this.syncService.synchronizeColumnWidths();
//       this.cdr.detectChanges();
//     }
//   }

//   private updateColumnWidth(columnId: string, width: number): void {
//     const column = this.columns().find((col) => col.id === columnId);
//     if (column) {
//       column.width = width;
//     }
//   }

//   getColumnWidth(columnId: string): number {
//     return (
//       this.columnWidths.get(columnId) ||
//       this.columns().find((col) => col.id === columnId)?.width ||
//       120
//     );
//   }

//   isResizing(): boolean {
//     return this.resizeService.isResizing();
//   }

//   getResizingColumnId(): string | null {
//     return this.resizeService.getResizingColumnId();
//   }

//   // ============ Utility Methods ============

//   registerLastClickedCell(item: any, column: Column, event: MouseEvent): void {
//     this.lastClickedCell = { item, column };
//   }

//   private syncHorizontalScroll(): void {
//     if (!this.viewport || !this.headerContainer?.nativeElement) return;
//     const scrollLeft = this.viewport.measureScrollOffset('left');
//     this.headerContainer.nativeElement.scrollLeft = scrollLeft;
//   }

//   isItemSelected(item: any): boolean {
//     return this.selectedItems().some((i) => i.id === item.id);
//   }

//   isItemDragged(item: any): boolean {
//     const dragState = this.dragService.getDragState();
//     return dragState.draggedItem?.id === item.id;
//   }

//   trackByItemId(index: number, item: any): any {
//     return item.id || index;
//   }

//   ngOnDestroy(): void {
//     this.clickService.reset();
//     this.hoverSubject.complete();
//     // Clean up any pending timeouts
//     if (this.singleClickTimeout) {
//       clearTimeout(this.singleClickTimeout);
//     }
//   }
// }
