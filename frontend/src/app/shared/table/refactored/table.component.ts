import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  Input,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, of, Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
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
import { ColumnFilterInputComponent } from "./column-filter-input/column-filter-input.component";

export interface ClickSetup{
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
  ],
  providers: [
    TableDragService,
    TableClickService,
    TableSyncService,
    TableSelectionService,
    TableResizeService,
    TableSearchService,
    TableSortService,
    TableSelectionService,
    TableResizeService,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dragService = inject(TableDragService);
  private clickService = inject(TableClickService);
  private syncService = inject(TableSyncService);
  private searchService = inject(TableSearchService);
  private sortService = inject(TableSortService);
  private selectionService = inject(TableSelectionService);
  private resizeService = inject(TableResizeService);

  // Inputs
  items = input.required<any[]>();
  columns = input<Column[]>([]);
  columnUniqueOptions = input<string[]>([]); //this will be passed to filter input component instead of current item.
  deleteItem = input<string | undefined>();
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  clickSetupInput = input<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });

  // Outputs
  rowClicked = output<{ item: any; event: MouseEvent }>();
  rowDoubleClicked = output<any>();
  rowRightClicked = output<any>();
  rowMiddleClicked = output<any>();
  cellDoubleClicked = output<{ item: any; column: Column }>();
  loadMoreItems = output<SearchCriteria>();
  search = output<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();
  sortChanged = output<{ column: Column; isAscending: boolean }>();
  loadMoreOptions = output<{ column: string; filter: string }>();
  loadInitialOptions = output<{ column: string; filter: string }>();

  // ViewChild references
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  @ViewChild('tableBody') tableBody!: ElementRef;
  @ViewChild('headerContainer', { read: ElementRef })
  headerContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('headerTable', { read: ElementRef })
  headerTable!: ElementRef<HTMLTableElement>;
  @ViewChild('bodyTable', { read: ElementRef })
  bodyTable!: ElementRef<HTMLTableElement>;
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @ViewChild('selectionActions', { read: TemplateRef })
  selectionActionsTemplate!: TemplateRef<any>;

  // Component state
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};
  currentSortColumn: string | null = null;
  isAscending: boolean = true;
  rowHeight = 50;

  private hoverSubject = new Subject<any>();
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

  protected _items: any[] = [];
  private lastClickedCell!: { item: any; column: Column };
  hoveredItem = signal<any>(null);
  private selectedItems$ = toObservable(this.selectedItems).pipe(
    takeUntilDestroyed(this.destroyRef)
  );
  private excludedItemIds = new Set<any>();
  private highlightedItemIds = new Set<any>();
  private highlightStyle: { [key: string]: string } = {};

  // Move effects to field initializers
  private itemsEffect = effect(() => {
    const items = this.items();
    this._items = items;
    this.updateFilteredItems();
    this.cdr.detectChanges();
  });

  private filterOutEffect = effect(() => {
    const rules = this.filterOutItems();
    this.excludedItemIds.clear();
    this.highlightedItemIds.clear();
    this.highlightStyle = {};

    if (rules && rules.items.length > 0) {
      const itemIds = new Set(rules.items.map((item) => item.id));
      if (rules.action === 'exclude') {
        this.excludedItemIds = itemIds;
      } else if (rules.action === 'highlight') {
        this.highlightedItemIds = itemIds;
        this.highlightStyle = rules.style;
      }
    }
    this.updateFilteredItems();
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
    });

    this.columnUniqueValuesMap.set(uniqueValuesMap);
  });

  constructor() {
    this.setupHoverHandlers();
  }

  ngOnInit(): void {
    this.setupSelectionEmitter();
    // this.setupClickHandlers();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initializeTable();
    this.setupResizeObserver();
    this.setupHorizontalScrollSync();
    this.setupResizeListeners();
  }

  get totalTableWidth(): number {
    return this.columns().reduce((sum, col) => sum + (col.width || 120), 0);
  }

  private setupHorizontalScrollSync(): void {
    if (!this.viewport) return;

    this.viewport.scrolledIndexChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncHeaderScroll();
        this.checkForLoadMore();
      });

    // Store the handler reference so it can be removed
    const scrollHandler = () => this.syncHeaderScroll();
    const viewportElement = this.viewport.elementRef.nativeElement;

    viewportElement.addEventListener('scroll', scrollHandler);

    this.destroyRef.onDestroy(() => {
      viewportElement.removeEventListener('scroll', scrollHandler);
    });
  }

  private syncHeaderScroll(): void {
    if (!this.viewport || !this.headerContainer?.nativeElement) return;

    const scrollLeft = this.viewport.elementRef.nativeElement.scrollLeft;
    this.headerContainer.nativeElement.scrollLeft = scrollLeft;
  }

  private checkForLoadMore(): void {
    if (!this.viewport) return;

    const end = this.viewport.getRenderedRange().end;
    const total = this.filteredItems.length;

    if (end >= total - 5 && total > 0) {
      // Trigger load more when within 5 items of the end
      const searchCriteria = this.searchService.buildSearchCriteria(
        this.globalSearchQuery,
        this.columnFilters
      );
      this.loadMoreItems.emit(searchCriteria);
    }
  }

  // ============ Initialization Methods ============

  // private updateFilteredItems(): void {
  //   const itemsToFilter = this._items.filter(item => !this.excludedItemIds.has(item.id));
  //   this.filteredItems = this.searchService.performSearch(
  //     itemsToFilter,
  //     this.globalSearchQuery,
  //     this.columnFilters
  //   );

  //   if (this.currentSortColumn) {
  //     const column = this.columns().find(col => col.id === this.currentSortColumn);
  //     if (column) {
  //       this.sortColumn(column);
  //     }
  //   }

  //   this.updateItemIndices();

  //   // ← Sync AFTER sort completes and DOM updates
  //   setTimeout(() => {
  //     this.syncService.synchronizeColumnWidths();
  //     this.cdr.detectChanges();
  //   }, 50);
  // }
  private updateFilteredItems(): void {
    // Start with all items, but filter out any that are in the exclusion set.
    const itemsToFilter = this._items.filter(
      (item) => !this.excludedItemIds.has(item.id)
    );

    // Apply global and column-specific search queries.
    this.filteredItems = this.searchService.performSearch(
      itemsToFilter,
      this.globalSearchQuery,
      this.columnFilters
    );

    // Re-apply the current sort order to the newly filtered list.
    if (this.currentSortColumn) {
      const column = this.columns().find(
        (col) => col.id === this.currentSortColumn
      );
      if (column) {
        // The sortColumn method sorts `this.filteredItems` in place.
        // this.sortColumn(column);
      }
    }

    // Update the indices for virtual scrolling.
    this.updateItemIndices();

    // Use a small timeout to ensure the DOM has updated before syncing widths.
    // This is crucial for accurate width calculation after filtering/sorting.
    setTimeout(() => {
      this.syncService.synchronizeColumnWidths();
      this.cdr.detectChanges();
    }, 50);
  }

  getRowStyle(item: any): { [key: string]: string } {
    if (this.highlightedItemIds.has(item.id)) {
      return this.highlightStyle;
    }
    return {};
  }

  private setupHoverHandlers(): void {
    this.hoverSubject
      .pipe(
        debounceTime(this.hoverDebounceTime()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((item) => {
        this.rowHoveredEvent.emit(item);
        this.hoveredItem.set(item);
      });
  }

  private setupSelectionEmitter(): void {
    this.selectedItems$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        this.selectedItemsEvent.emit(items);
      });
  }

  private initializeTable(): void {
    setTimeout(() => {
      this.detectRowHeight();
      this.calculateInitialColumnWidths();
      this.syncService.setSyncElements(
        this.headerTable?.nativeElement,
        this.bodyTable?.nativeElement,
        this.headerContainer?.nativeElement
      );
      this.syncService.synchronizeColumnWidths();
      this.updateItemIndices();
    });
  }

  private detectRowHeight(): void {
    if (this.tableBody?.nativeElement) {
      const sampleRow = this.tableBody.nativeElement.querySelector('tr');
      if (sampleRow) {
        this.rowHeight = sampleRow.offsetHeight;
        if (this.viewport) {
          this.viewport.checkViewportSize();
        }
        this.cdr.detectChanges();
      }
    }
  }

  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.viewport) {
        this.viewport.checkViewportSize();
      }
      this.syncService.synchronizeColumnWidths();
    });

    if (this.viewport?.elementRef.nativeElement) {
      this.resizeObserver.observe(this.viewport.elementRef.nativeElement);
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
        column.width = estimatedWidth; // ← This sets the width property
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
    const searchCriteria = this.searchService.buildSearchCriteria(
      this.globalSearchQuery,
      this.columnFilters
    );

    this.updateFilteredItems();
    this.search.emit(searchCriteria);
  }

  /**
   * Handle column filter change
   */
  onColumnFilterChange(columnId: string, filterValue: string): void {
    this.columnFilters[columnId] = filterValue;
    this.performSearch();
    this.cdr.detectChanges();
  }

  // ============ Sorting Methods ============

  sortColumn(column: Column, emit = false): void {
    if (this.isDragAndDropEnabled()) return;

    const columnKey = column.accessorKey || column.id;
    this.isAscending =
      this.currentSortColumn === columnKey ? !this.isAscending : true;
    this.currentSortColumn = columnKey;

    this.filteredItems = this.sortService.sortItems(
      this.filteredItems,
      column,
      this.isAscending,
      (obj, path) => this.searchService.getNestedProperty(obj, path)
    );

    if (emit) this.sortChanged.emit({ column, isAscending: this.isAscending });
    this.cdr.detectChanges();
    // Remove this line - sync is now called in updateFilteredItems()
    // setTimeout(() => this.syncService.synchronizeColumnWidths(), 100);
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
        const itemIndex = this.filteredItems.indexOf(item);
        item.index = itemIndex;
      }
      this.dragService.startDrag(item, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }

  onMouseUp(event: MouseEvent): void {
    // console.log('onMouseUp triggered');
    const dragState = this.dragService.getDragState();
    // console.log('Drag state:', dragState);
    if (dragState.isDragging && dragState.startIndex !== null) {
      // console.log('Item was being dragged. Start index:', dragState.startIndex);
      const hovered = this.hoveredItem();
      // console.log('Hovered item:', hovered);
      if (hovered) {
        const toIndex = this.filteredItems.findIndex(
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
      const movedItem = this.filteredItems[fromIndex];

      // Find the original index in the master _items array
      const originalFromIndex = this._items.findIndex((i) => i === movedItem);

      // Find the target item in filteredItems to determine where to move in _items
      const targetItem = this.filteredItems[toIndex];
      const originalToIndex = this._items.findIndex((i) => i === targetItem);

      if (originalFromIndex !== -1 && originalToIndex !== -1) {
        // Perform the move in the master array
        const [itemToMove] = this._items.splice(originalFromIndex, 1);
        this._items.splice(originalToIndex, 0, itemToMove);

        // Re-apply filtering and sorting to get the new filteredItems
        this.updateFilteredItems();

        // Emit the reordered master list
        this.itemsReordered.emit([...this._items]);

        this.cdr.detectChanges();
      }
    });
  }

  private updateItemIndices(): void {
    this.filteredItems.forEach((item, index) => {
      item.index = index;
    });
    this.cdr.markForCheck();
  }

  onDragOver(event: MouseEvent): void {
    event.preventDefault();
  }

  // ============ Selection Methods ============

  private isProcessingDoubleClick = false;
  onRowClick(item: any, event: MouseEvent): void {
    if (this.isProcessingDoubleClick) {
      return;
    }

    this.isProcessingDoubleClick = true;

    // Reset flag after a short delay to allow for rapid double-clicks
    setTimeout(() => {
      this.isProcessingDoubleClick = false;
    }, 500);

    if (event.button === 0) {
      // Left click
      event.preventDefault();
      this.clickService.handleClick(event);

      // Determine click type and handle accordingly
      const dragState = this.dragService.getDragState();
      if (dragState.isDragging) return;

      if (this.clickService['clickState']?.isDoubleClickHandled) {
        this.onRowDoubleClick(item);
      } else {
        setTimeout(() => {
          if (!this.clickService['clickState']?.isDoubleClickHandled) {
            if (event.ctrlKey) {
              this.onRowCtrlClick(item);
            } else if (event.shiftKey) {
              this.onRowShiftClick(item);
            } else {
              this.selectionService.clearSelection();
              this.rowClicked.emit({ item, event });
            }
          }
        }, 300);
      }
    } else if (event.button === 1) {
      // Middle click
      this.rowMiddleClicked.emit(item);
    }
  }

  onRowDoubleClick(item: any): void {
    // Normalize the item to ensure consistency after sorting/filtering
    const normalizedItem = this._items.find((i) => i.id === item.id) || item;

    this.rowDoubleClicked.emit(normalizedItem);
    console.log('Row double-clicked:', normalizedItem);

    if (this.lastClickedCell) {
      this.cellDoubleClicked.emit({
        item: normalizedItem,
        column: this.lastClickedCell.column,
      });
    }
  }

  onRowRightClick(item: any, event: MouseEvent): void {
    event.preventDefault();
    this.rowRightClicked.emit(item);
  }

  private onRowCtrlClick(item: any): void {
    this.selectionService.toggleItem(item);
  }

  private onRowShiftClick(item: any): void {
    const lastItem = this.lastClickedItem();
    if (!lastItem) {
      this.selectionService.selectItem(item);
      return;
    }

    this.selectionService.selectRange(this._items, lastItem, item);
  }

  // private setupClickHandlers(): void {
  //   this.clickService.doubleClick$
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(event => {
  //       const item = this.getItemFromEvent(event);
  //       if (item) {
  //         this.onRowDoubleClick(item);
  //       }
  //     });

  //   this.clickService.singleClick$
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(event => {
  //       const item = this.getItemFromEvent(event);
  //       if (item) {
  //         this.handleSingleClick(item, event);
  //       }
  //     });
  // }

  // private getItemFromEvent(event: MouseEvent): any {
  //   const target = event.target as HTMLElement;
  //   const row = target.closest('tr');
  //   if (!row) return null;

  //   const itemId = row.getAttribute('data-item-id');
  //   if (!itemId) return null;

  //   return this.filteredItems.find(item => item.id.toString() === itemId);
  // }

  // onRowClick(item: any, event: MouseEvent): void {
  //   if (event.button === 0) {
  //     // Left click
  //     event.preventDefault();
  //     this.clickService.handleClick(event);
  //   } else if (event.button === 1) {
  //     // Middle click
  //     this.rowMiddleClicked.emit(item);
  //   }
  // }

  // private handleSingleClick(item: any, event: MouseEvent): void {
  //   const dragState = this.dragService.getDragState();
  //   if (dragState.isDragging) return;

  //   this.selectionService.setLastClickedItem(item);
  //   console.log('handleSingleClick ', item);
  //   console.log('handleSingleClickEvent ', event);

  //   if (event.ctrlKey) {
  //     this.onRowCtrlClick(item);
  //   } else if (event.shiftKey) {
  //     this.onRowShiftClick(item);
  //   } else {
  //     this.selectionService.clearSelection();
  //     this.selectionService.setLastClickedItem(item);
  //     this.rowClicked.emit({ item, event });
  //   }
  // }

  // private onRowCtrlClick(item: any): void {
  //   this.selectionService.toggleItem(item);
  // }

  // private onRowShiftClick(item: any): void {
  //   const lastItem = this.lastClickedItem();
  //   console.log('onRowShiftClick', lastItem);
  //   if (!lastItem) {
  //     this.selectionService.selectItem(item);
  //     return;
  //   }

  //   this.selectionService.selectRange(this.filteredItems, lastItem, item);
  // }

  // onRowDoubleClick(item: any): void {
  //   this.rowDoubleClicked.emit(item);
  //   if (this.lastClickedCell) {
  //     this.cellDoubleClicked.emit({
  //       item,
  //       column: this.lastClickedCell.column
  //     });
  //   }
  // }

  // onRowRightClick(item: any, event: MouseEvent): void {
  //   event.preventDefault();
  //   this.rowRightClicked.emit(item);
  // }

  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  onDeleteSelectedItems(): void {
    if (this.deleteItem) {
      this.selectionService.deleteSelected(this.deleteItem);
      const deletedIds = new Set(this.selectedItems().map((item) => item.id));
      this._items = this._items.filter((item) => !deletedIds.has(item.id));
      this.updateFilteredItems();
      this.cdr.detectChanges();
    }
  }

  // ============ Hover Methods ============

  onRowHover(item: any): void {
    this.hoverSubject.next(item);
  }

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

  registerLastClickedCell(item: any, column: Column, event: MouseEvent): void {
    this.lastClickedCell = { item, column };
  }

  private syncHorizontalScroll(): void {
    if (!this.viewport || !this.headerContainer?.nativeElement) return;
    const scrollLeft = this.viewport.measureScrollOffset('left');
    this.headerContainer.nativeElement.scrollLeft = scrollLeft;
  }

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
    this.clickService.reset();
    this.hoverSubject.complete();
  }
}















//   import {
//   AfterViewInit,
//   ChangeDetectorRef,
//   Component,
//   DestroyRef,
//   ElementRef,
//   inject,
//   input,
//   Input,
//   OnInit,
//   output,
//   signal,
//   ViewChild
// } from '@angular/core';
// import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
// import { Observable, of, Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
// import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Column } from '../../../models/column.model';
// import { SearchCriteria } from '../../../models/api/search-criteria.model';
// import { TableDragService } from './services/table-drag.service';
// import { TableClickService } from './services/table-click.service';
// import { TableSyncService } from './services/table-sync.service';
// import { TableSearchService } from './services/table-search.service';
// import { TableSortService } from './services/table-sort.service';
// import { TableSelectionService } from './services/table-selection.service';

// @Component({
//   selector: 'app-table',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ScrollingModule],
//   templateUrl: './table.component.html',
//   styleUrl: './table.component.css'
// })
// export class TableComponent implements OnInit, AfterViewInit {
//   private destroyRef = inject(DestroyRef);
//   private cdr = inject(ChangeDetectorRef);
//   private dragService = inject(TableDragService);
//   private clickService = inject(TableClickService);
//   private syncService = inject(TableSyncService);
//   private searchService = inject(TableSearchService);
//   private sortService = inject(TableSortService);
//   private selectionService = inject(TableSelectionService);

//   // Inputs
//   @Input() columns: Column[] = [];
//   @Input() deleteItem?: (item: string) => void;
//   columns = input<Column[]>([]);
//   deleteItem = input<string | undefined>();
//   hoverDebounceTime = input<number>(0);
//   isDragAndDropEnabled = input<boolean>(false);

//   // Outputs
//   rowClicked = output<{ item: any; event: MouseEvent }>();
//   rowDoubleClicked = output<any>();
//   rowRightClicked = output<any>();
//   rowMiddleClicked = output<any>();
//   cellDoubleClicked = output<{ item: any; column: Column }>();
//   loadMoreItems = output<SearchCriteria>();
//   search = output<SearchCriteria>();
//   rowHoveredEvent = output<any>();
//   selectedItemsEvent = output<any[]>();
//   itemsReordered = output<any[]>();

//   // ViewChild references
//   @ViewChild('tableContainer') tableContainer!: ElementRef;
//   @ViewChild('tableBody') tableBody!: ElementRef;
//   @ViewChild('headerContainer', { read: ElementRef }) headerContainer!: ElementRef<HTMLDivElement>;
//   @ViewChild('headerTable', { read: ElementRef }) headerTable!: ElementRef<HTMLTableElement>;
//   @ViewChild('bodyTable', { read: ElementRef }) bodyTable!: ElementRef<HTMLTableElement>;
//   @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

//   // Component state
//   items = input.required<any[] | Observable<any[]>>({ alias: 'items' });
//   filteredItems: any[] = [];
//   globalSearchQuery: string = '';
//   columnFilters: { [key: string]: string } = {};
//   currentSortColumn: string | null = null;
//   isAscending: boolean = true;
//   rowHeight = 50;

//   // Observables
//   private items$ = toObservable(this.items).pipe(
//     switchMap(value => (Array.isArray(value) ? of(value) : value))
//   );
//   private hoverSubject = new Subject<any>();
//   private resizeObserver?: ResizeObserver;

  
//   // Signals from services
//   dragState = this.dragService.dragState$;
//   selectedItems = this.selectionService.selectedItems$;
//   lastClickedItem = this.selectionService.lastClickedItem$;
  

//   private _items: any[] = [];
//   private lastClickedCell!: { item: any; column: Column };
//   private selectedItems$ = toObservable(this.selectedItems).pipe(
//     takeUntilDestroyed(this.destroyRef)
//   );

//   constructor() {
//     this.setupHoverHandlers();
//   }

//   ngOnInit(): void {
//     this.setupItemsSubscription();
//     this.setupSelectionEmitter();
//   }

//   ngAfterViewInit(): void {
//     this.initializeTable();
//     this.setupResizeObserver();
//     this.setupHorizontalScrollSync();
//   }

  
//   get totalTableWidth(): number {
//     return this.columns.reduce((sum, col) => sum + (col.width || 120), 0);
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

  
//   private setupItemsSubscription(): void {
//     this.items$
//       .pipe(
//         debounceTime(100),  // ← Increase debounce time
//         distinctUntilChanged(),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe(items => {
//         this._items = items;
//         this.updateFilteredItems();
//         this.cdr.detectChanges();
//         // Remove or reduce sync calls
//       });
//   }
  
  
//   private updateFilteredItems(): void {
//     this.filteredItems = this.searchService.performSearch(
//       this._items,
//       this.globalSearchQuery,
//       this.columnFilters
//     );
  
//     if (this.currentSortColumn) {
//       const column = this.columns.find(col => col.id === this.currentSortColumn);
//       if (column) {
//         this.sortColumn(column);
//       }
//     }
  
//     this.updateItemIndices();
    
//     // ← Sync AFTER sort completes and DOM updates
//     setTimeout(() => {
//       this.syncService.synchronizeColumnWidths();
//       this.cdr.detectChanges();
//     }, 50);
//   }

//   private setupHoverHandlers(): void {
//     this.hoverSubject
//       .pipe(
//         debounceTime(this.hoverDebounceTime()),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe(item => {
//         this.rowHoveredEvent.emit(item);
//       });
//   }

  
//   private setupSelectionEmitter(): void {
//     this.selectedItems$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(items => {
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
  
//     this.columns.forEach(column => {
//       if (!column.width || column.width === 0) {
//         // Estimate width: ~8px per character + padding
//         const estimatedWidth = Math.max(
//           120,  // minimum width
//           (column.header?.length || 10) * 8 + 24
//         );
//         column.width = estimatedWidth;  // ← This sets the width property
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

//   // ============ Sorting Methods ============

  
//   sortColumn(column: Column): void {
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
//       this.dragService.startDrag(item, { x: event.clientX, y: event.clientY });
//       event.preventDefault();
//     }
//   }

//   onMouseMove(event: MouseEvent): void {
//     const dragState = this.dragService.getDragState();
//     if (!dragState.isDragging || !dragState.draggedItem) return;

//     const currentY = event.clientY;
//     const rows = this.tableBody?.nativeElement?.querySelectorAll('tr');

//     if (!rows) return;

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       const rect = row.getBoundingClientRect();

//       if (currentY > rect.top && currentY < rect.bottom) {
//         if (i !== dragState.draggedItem.index) {
//           this.dragService.updateGhostRow(i);
//           this.cdr.detectChanges();
//           break;
//         }
//       }
//     }
//   }

//   onMouseUp(event: MouseEvent): void {
//     const dragState = this.dragService.getDragState();

//     if (
//       dragState.isDragging &&
//       dragState.draggedItem &&
//       dragState.ghostRowIndex !== null
//     ) {
//       this.moveItem(dragState.draggedItem.index, dragState.ghostRowIndex);
//       this.dragService.endDrag();
//       this.cdr.detectChanges();

//       setTimeout(() => {
//         this.itemsReordered.emit(this.filteredItems);
//       });
//     }
//   }

//   onDragOver(event: MouseEvent): void {
//     event.preventDefault();
//   }

//   private moveItem(fromIndex: number, toIndex: number): void {
//     requestAnimationFrame(() => {
//       const item = this.filteredItems[fromIndex];
//       this.filteredItems.splice(fromIndex, 1);
//       this.filteredItems.splice(toIndex, 0, item);
//       this.updateItemIndices();
//       this.cdr.detectChanges();
//     });
//   }

//   // ============ Selection Methods ============

//   onRowClick(item: any, event: MouseEvent): void {
//     if (event.button === 0) {
//       // Left click
//       event.preventDefault();
//       this.clickService.handleClick(event);

//       // Determine click type and handle accordingly
//       const dragState = this.dragService.getDragState();
//       if (dragState.isDragging) return;

//       if (this.clickService['clickState']?.isDoubleClickHandled) {
//         this.onRowDoubleClick(item);
//       } else {
//         setTimeout(() => {
//           if (!this.clickService['clickState']?.isDoubleClickHandled) {
//             if (event.ctrlKey) {
//               this.onRowCtrlClick(item);
//             } else if (event.shiftKey) {
//               this.onRowShiftClick(item);
//             } else {
//               this.selectionService.clearSelection();
//               this.rowClicked.emit({ item, event });
//             }
//           }
//         }, 300);
//       }
//     } else if (event.button === 1) {
//       // Middle click
//       this.rowMiddleClicked.emit(item);
//     }
//   }

//   onRowDoubleClick(item: any): void {
//     this.rowDoubleClicked.emit(item);
//     if (this.lastClickedCell) {
//       this.cellDoubleClicked.emit({
//         item,
//         column: this.lastClickedCell.column
//       });
//     }
//   }

//   onRowRightClick(item: any, event: MouseEvent): void {
//     event.preventDefault();
//     this.rowRightClicked.emit(item);
//   }

//   private onRowCtrlClick(item: any): void {
//     this.selectionService.toggleItem(item);
//   }

//   private onRowShiftClick(item: any): void {
//     const lastItem = this.lastClickedItem();
//     if (!lastItem) {
//       this.selectionService.selectItem(item);
//       return;
//     }

//     this.selectionService.selectRange(this._items, lastItem, item);
//   }

//   clearSelection(): void {
//     this.selectionService.clearSelection();
//   }

//   onDeleteSelectedItems(): void {
//     if (this.deleteItem) {
//       this.selectionService.deleteSelected(this.deleteItem);
//       const deletedIds = new Set(
//         this.selectedItems().map(item => item.id)
//       );
//       this._items = this._items.filter(item => !deletedIds.has(item.id));
//       this.updateFilteredItems();
//       this.cdr.detectChanges();
//     }
//   }

//   // ============ Hover Methods ============

//   onRowHover(item: any): void {
//     this.hoverSubject.next(item);
//   }

//   // ============ Utility Methods ============

//   registerLastClickedCell(item: any, column: Column, event: MouseEvent): void {
//     this.lastClickedCell = { item, column };
//   }
    
//     private syncHorizontalScroll(): void {
//       if (!this.viewport || !this.headerContainer?.nativeElement) return;
//       const scrollLeft = this.viewport.measureScrollOffset('left');
//       this.headerContainer.nativeElement.scrollLeft = scrollLeft;
//     }
    
//     private updateItemIndices(): void {
//       this.filteredItems.forEach((item, index) => {
//         item.index = index;
//       });
//     }
  
//     isItemSelected(item: any): boolean {
//       return this.selectedItems().some(i => i.id === item.id);
//     }
  
//     isItemDragged(item: any): boolean {
//       const dragState = this.dragService.getDragState();
//       return dragState.draggedItem?.id === item.id;
//     }
  
//     trackByItemId(index: number, item: any): any {
//       return item.id || index;
//     }
  
//     ngOnDestroy(): void {
//       this.clickService.reset();
//       this.hoverSubject.complete();
//     }
//   }