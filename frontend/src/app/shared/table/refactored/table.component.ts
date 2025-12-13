import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  Input,
  OnInit,
  output,
  ViewChild
} from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, of, Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { TableDragService } from './services/table-drag.service';
import { TableClickService } from './services/table-click.service';
import { TableSyncService } from './services/table-sync.service';
import { TableSearchService } from './services/table-search.service';
import { TableSortService } from './services/table-sort.service';
import { TableSelectionService } from './services/table-selection.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dragService = inject(TableDragService);
  private clickService = inject(TableClickService);
  private syncService = inject(TableSyncService);
  private searchService = inject(TableSearchService);
  private sortService = inject(TableSortService);
  private selectionService = inject(TableSelectionService);

  // Inputs
  @Input() columns: Column[] = [];
  @Input() deleteItem?: (item: string) => void;
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);

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

  // ViewChild references
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  @ViewChild('tableBody') tableBody!: ElementRef;
  @ViewChild('headerContainer', { read: ElementRef }) headerContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('headerTable', { read: ElementRef }) headerTable!: ElementRef<HTMLTableElement>;
  @ViewChild('bodyTable', { read: ElementRef }) bodyTable!: ElementRef<HTMLTableElement>;
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  // Component state
  items = input.required<any[] | Observable<any[]>>({ alias: 'items' });
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};
  currentSortColumn: string | null = null;
  isAscending: boolean = true;
  rowHeight = 50;

  // Observables
  private items$ = toObservable(this.items).pipe(
    switchMap(value => (Array.isArray(value) ? of(value) : value))
  );
  private hoverSubject = new Subject<any>();
  private resizeObserver?: ResizeObserver;

  
  // Signals from services
  dragState = this.dragService.dragState$;
  selectedItems = this.selectionService.selectedItems$;
  lastClickedItem = this.selectionService.lastClickedItem$;

  private _items: any[] = [];
  private lastClickedCell!: { item: any; column: Column };

  constructor() {
    this.setupClickHandlers();
    this.setupHoverHandlers();
  }

  ngOnInit(): void {
    this.setupItemsSubscription();
    this.setupSelectionEmitter();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    this.setupResizeObserver();
    this.setupScrollSync();
  }

  // ============ Initialization Methods ============

  private setupItemsSubscription(): void {
    this.items$
      .pipe(
        debounceTime(0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(items => {
        this._items = items;
        this.updateFilteredItems();
        this.cdr.detectChanges();
        setTimeout(() => this.syncService.synchronizeColumnWidths(), 100);
      });
  }

  private setupClickHandlers(): void {
    this.clickService.doubleClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        // Double click is handled in onRowClick
      });

    this.clickService.singleClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        // Single click is handled in onRowClick
      });
  }

  private setupHoverHandlers(): void {
    this.hoverSubject
      .pipe(
        debounceTime(this.hoverDebounceTime()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(item => {
        this.rowHoveredEvent.emit(item);
      });
  }

  
    private setupSelectionEmitter(): void {
      toObservable(this.selectedItems)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(items => {
          this.selectedItemsEvent.emit(items);
        });
    }

  private initializeTable(): void {
    setTimeout(() => {
      this.detectRowHeight();
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

  
    private setupScrollSync(): void {
      if (!this.viewport) return;
      
      this.viewport
        .elementScrolled()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.syncHorizontalScroll();
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

  private updateFilteredItems(): void {
    this.filteredItems = this.searchService.performSearch(
      this._items,
      this.globalSearchQuery,
      this.columnFilters
    );

    if (this.currentSortColumn) {
      const column = this.columns.find(col => col.id === this.currentSortColumn);
      if (column) {
        this.sortColumn(column);
      }
    }

    this.updateItemIndices();
    setTimeout(() => this.syncService.synchronizeColumnWidths(), 100);
  }

  // ============ Sorting Methods ============

  sortColumn(column: Column): void {
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

    this.cdr.detectChanges();
    setTimeout(() => this.syncService.synchronizeColumnWidths(), 100);
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
      this.dragService.startDrag(item, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const dragState = this.dragService.getDragState();
    if (!dragState.isDragging || !dragState.draggedItem) return;

    const currentY = event.clientY;
    const rows = this.tableBody?.nativeElement?.querySelectorAll('tr');

    if (!rows) return;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rect = row.getBoundingClientRect();

      if (currentY > rect.top && currentY < rect.bottom) {
        if (i !== dragState.draggedItem.index) {
          this.dragService.updateGhostRow(i);
          this.cdr.detectChanges();
          break;
        }
      }
    }
  }

  onMouseUp(event: MouseEvent): void {
    const dragState = this.dragService.getDragState();

    if (
      dragState.isDragging &&
      dragState.draggedItem &&
      dragState.ghostRowIndex !== null
    ) {
      this.moveItem(dragState.draggedItem.index, dragState.ghostRowIndex);
      this.dragService.endDrag();
      this.cdr.detectChanges();

      setTimeout(() => {
        this.itemsReordered.emit(this.filteredItems);
      });
    }
  }

  onDragOver(event: MouseEvent): void {
    event.preventDefault();
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    requestAnimationFrame(() => {
      const item = this.filteredItems[fromIndex];
      this.filteredItems.splice(fromIndex, 1);
      this.filteredItems.splice(toIndex, 0, item);
      this.updateItemIndices();
      this.cdr.detectChanges();
    });
  }

  // ============ Selection Methods ============

  onRowClick(item: any, event: MouseEvent): void {
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
    this.rowDoubleClicked.emit(item);
    if (this.lastClickedCell) {
      this.cellDoubleClicked.emit({
        item,
        column: this.lastClickedCell.column
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

  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  onDeleteSelectedItems(): void {
    if (this.deleteItem) {
      this.selectionService.deleteSelected(this.deleteItem);
      const deletedIds = new Set(
        this.selectedItems().map(item => item.id)
      );
      this._items = this._items.filter(item => !deletedIds.has(item.id));
      this.updateFilteredItems();
      this.cdr.detectChanges();
    }
  }

  // ============ Hover Methods ============

  onRowHover(item: any): void {
    this.hoverSubject.next(item);
  }

  // ============ Utility Methods ============

  registerLastClickedCell(item: any, column: Column, event: MouseEvent): void {
    this.lastClickedCell = { item, column };
  }

  
    private syncHorizontalScroll(): void {
      if (!this.viewport) return;
      const scrollLeft = this.viewport.measureScrollOffset('left');
      this.syncService.syncHorizontalScroll(scrollLeft);
    }
  
    private updateItemIndices(): void {
      this.filteredItems.forEach((item, index) => {
        item.index = index;
      });
    }
  
    isItemSelected(item: any): boolean {
      return this.selectedItems().some(i => i.id === item.id);
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