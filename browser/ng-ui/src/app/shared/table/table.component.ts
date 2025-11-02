import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, input, Input, OnInit, output, ViewChild } from '@angular/core';
import { Column } from '../../models/inputs/column.model';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { SearchCriteria, SearchCriteriaDto } from '../../models/api/search-criteria.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, of, Subject, Subscription, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnInit, AfterViewInit {

  private destroyRef = inject(DestroyRef);

  @Input() columns: Column[] = [];
  @Input() deleteItem?: (item: string) => void;
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);

  rowClicked = output<{item: any, event: MouseEvent}>();
  rowDoubleClicked = output<any>();
  rowRightClicked = output<any>();
  rowMiddleClicked = output<any>();
  cellDoubleClicked = output<{item: any, column: Column}>();

  @ViewChild('tableContainer') tableContainer!: ElementRef;
  @ViewChild('tableBody') tableBody!: ElementRef;
  @ViewChild('headerContainer', { read: ElementRef }) headerContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('headerTable', { read: ElementRef }) headerTable!: ElementRef<HTMLTableElement>;
  @ViewChild('bodyTable', { read: ElementRef }) bodyTable!: ElementRef<HTMLTableElement>;
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  private resizeObserver?: ResizeObserver;

  loadMoreItems = output<SearchCriteria>();
  search = output<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();

  selectedItems: any[] = [];
  lastClickedItem: any = null;
  private lastClickTime: number = 0;
  private isDoubleClickHandled: boolean = false;
  lastClickedCell!: { item: any, column: Column };
  rowHeight = 50;

  isDraggingAndDropping = false;
  draggedItem: any = null;
  private startDragPosition: { x: number, y: number } = { x: 0, y: 0 };
  ghostRowIndex: number | null = null;

  items = input.required<any[] | Observable<any[]>>({ alias: 'items' });
  private items$ = toObservable(this.items).pipe(
    switchMap(value => Array.isArray(value) ? of(value) : value)
  );
  private _items: any[] = [];
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  private clickTimer: any;
  private clickDelay = 250; // milliseconds
  private hoverSubject = new Subject<any>();

  constructor(private cdr: ChangeDetectorRef) {

  }

  
  ngAfterViewInit() {
      setTimeout(() => {
        if (this.tableBody && this.tableBody.nativeElement) {
          const sampleRow = this.tableBody.nativeElement.querySelector('tr');
          if (sampleRow) {
            this.rowHeight = sampleRow.offsetHeight;
            if (this.viewport) {
              this.viewport.checkViewportSize();
            }
            this.cdr.detectChanges();
          }
        }

        // Synchronize column widths after view is initialized
        this.synchronizeColumnWidths();

        // Listen to viewport scroll events to sync header scroll
        this.viewport.elementScrolled().pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
          this.syncHorizontalScroll();
        });

        this.resizeObserver = new ResizeObserver(() => {
          if (this.viewport) {
            this.viewport.checkViewportSize();
          }
          this.synchronizeColumnWidths();
        });
        this.resizeObserver.observe(this.viewport.elementRef.nativeElement);

        // Use destroyRef for cleanup
        this.destroyRef.onDestroy(() => {
          if (this.resizeObserver) {
            this.resizeObserver.disconnect();
          }
        });
      });
    console.log('isDragAndDropEnabled:', this.isDragAndDropEnabled());
  }


  ngOnInit() {
    // console.log('TableComponent initialized');
    this.items$.pipe(
      debounceTime(0),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((items) => {
      // console.log('Items updated:', items);
      this._items = items;
      this.updateFilteredItems();
      this.cdr.detectChanges();
      setTimeout(() => this.synchronizeColumnWidths(), 100);
    });

    this.hoverSubject.pipe(
      debounceTime(this.hoverDebounceTime()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(item => {
      this.rowHoveredEvent.emit(item);
    });

    this.updateItemIndices();
  }




  
  private synchronizeColumnWidths() {
    if (!this.headerTable?.nativeElement || !this.bodyTable?.nativeElement) return;
    
    setTimeout(() => {
      const headerCells = this.headerTable.nativeElement.querySelectorAll('thead tr:first-child th');
      const bodyCells = this.bodyTable.nativeElement.querySelectorAll('tbody tr:first-child td');
  
      if (bodyCells.length === 0) return;
  
      // First, reset any fixed widths to get natural widths
      headerCells.forEach((cell: Element) => {
        (cell as HTMLElement).style.width = '';
        (cell as HTMLElement).style.minWidth = '';
        (cell as HTMLElement).style.maxWidth = '';
      });
  
      bodyCells.forEach((cell: Element) => {
        (cell as HTMLElement).style.width = '';
        (cell as HTMLElement).style.minWidth = '';
        (cell as HTMLElement).style.maxWidth = '';
      });
  
      // Force a reflow
      this.bodyTable.nativeElement.offsetHeight;
  
      // Get the natural widths from body cells
      const widths: string[] = [];
      bodyCells.forEach((cell: Element) => {
        const width = Math.max((cell as HTMLElement).offsetWidth, 100); // Minimum 100px
        widths.push(`${width}px`);
      });
  
      // Apply these widths to both header and body cells
      headerCells.forEach((cell: Element, index: number) => {
        (cell as HTMLElement).style.width = widths[index];
        (cell as HTMLElement).style.minWidth = widths[index];
        (cell as HTMLElement).style.maxWidth = widths[index];
      });
  
      bodyCells.forEach((cell: Element, index: number) => {
        (cell as HTMLElement).style.width = widths[index];
        (cell as HTMLElement).style.minWidth = widths[index];
        (cell as HTMLElement).style.maxWidth = widths[index];
      });
    }, 0);
  }

  private syncHorizontalScroll() {
    if (!this.viewport || !this.headerContainer?.nativeElement) return;
    
    const scrollLeft = this.viewport.measureScrollOffset('left');
    this.headerContainer.nativeElement.scrollLeft = scrollLeft;
  }





  updateItems(newItems: any[]) {
    this._items = newItems;
  }

  onGlobalSearchChange() {
    this.performSearch();
  }

  onColumnSearchChange() {
    this.performSearch();
  }

  private performSearch() {
    console.log('Performing search with query:', this.globalSearchQuery);
    const filters = Object.entries(this.columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const searchCriteria: SearchCriteria = {
      type: this.globalSearchQuery ? 'global' : 'column',
      query: this.globalSearchQuery,
      filters: filters,
      page: 1
    };

    this.columnFilters = {...filters}

    this.updateFilteredItems();
    this.search.emit(searchCriteria);
  }

  private updateFilteredItems() {
    // console.log('Updating filtered items: ', this._items.value.length);
    this.filteredItems = this._items.filter(item => {
      if (this.globalSearchQuery) {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(this.globalSearchQuery.toLowerCase())
        );
      }
      return true;
    }).filter(item => {
      // console.log('Filter conditions:', this.columnFilters);
      // console.log('Item:', item);
      return Object.entries(this.columnFilters).every(([key, value]) => 
        !value || String(this.getNestedProperty(item, key)).toLowerCase().includes(value.toLowerCase())
      );
    });

    if (this.currentSortColumn) {
      this.sortColumn(this.columns.find(col => col.id === this.currentSortColumn) || this.columns[0]);
    }

      // Maintain the current order of items
      const orderedItems = this._items.filter(item => 
        this.filteredItems.some(filteredItem => filteredItem.id === item.id)
      );

      this.filteredItems = orderedItems;
      this.updateItemIndices();
      setTimeout(() => this.synchronizeColumnWidths(), 100);
      // console.log('Filtered items updated:', this.filteredItems.length);
  }

  handleScroll() {
    this.syncHorizontalScroll();
  }

  trackByFn(index: number, item: any): any {
    return item.id; // Assuming each item has a unique 'id' property
  }

  sortColumn(column: Column) {
    if(this.isDragAndDropEnabled()) return;
    const columnKey = column.accessorKey || column.id;
    this.isAscending = this.currentSortColumn === columnKey ? !this.isAscending : true;
    this.currentSortColumn = columnKey;
  
    this.filteredItems = [...this.filteredItems].sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);
  
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.isAscending ? aValue - bValue : bValue - aValue;
      } else {
        return this.isAscending ? 
          String(aValue).localeCompare(String(bValue)) : 
          String(bValue).localeCompare(String(aValue));
      }
    });
  
    this.cdr.detectChanges();
    setTimeout(() => this.synchronizeColumnWidths(), 100);
  }

  getCellValue(item: any, column: Column): string {
    return column.accessorFn ? column.accessorFn(item) : column.accessorKey ? this.getNestedProperty(item, column.accessorKey) : '';
  }

  getCellStyle(item: any, column: any): { [key: string]: string } {
    if (column.conditionalStyling) {
      return column.conditionalStyling(item, column);
    }
    return {};
  }

  getNestedProperty(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => {
      if (current == null) return '';
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split(/[\[\]]/);
        const index = parseInt(indexStr);
        return current[arrayKey] && current[arrayKey][index] ? current[arrayKey][index] : '';
      }
      return current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  onMouseDown(event: MouseEvent, item: any) {
    // console.log('onMouseDown called', { isDragAndDropEnabled: this.isDragAndDropEnabled(), item });
    if (this.isDragAndDropEnabled()) {
      this.isDraggingAndDropping = true;
      this.draggedItem = item;
      this.startDragPosition = { x: event.clientX, y: event.clientY };
      event.preventDefault(); // Prevent text selection
      // console.log('Drag started', { draggedItem: this.draggedItem, startPosition: this.startDragPosition });
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDraggingAndDropping && this.draggedItem) {
      // console.log('onMouseMove - dragging', { clientY: event.clientY, draggedItem: this.draggedItem });
      const currentY = event.clientY;
      const rows = this.tableBody.nativeElement.querySelectorAll('tr');
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rect = row.getBoundingClientRect();
        
        if (currentY > rect.top && currentY < rect.bottom) {
          if (i !== this.draggedItem.index) {
            this.ghostRowIndex = i;
            this.cdr.detectChanges(); // Trigger change detection
            break;
          }
        }
      }
    } else {
      // console.log('onMouseMove - not dragging');
    }
  }

  onMouseUp(event: MouseEvent) {
    // console.log('onMouseUp called', { isDraggingAndDropping: this.isDraggingAndDropping });
    if (this.isDraggingAndDropping && this.draggedItem && this.ghostRowIndex !== null) {
      this.moveItem(this.draggedItem.index, this.ghostRowIndex);
      this.isDraggingAndDropping = false;
      this.draggedItem = null;
      this.ghostRowIndex = null;
      this.cdr.detectChanges(); // Trigger change detection
      setTimeout(() => {
        // console.log('Emitting reordered items', this.filteredItems);
        this.itemsReordered.emit(this.filteredItems);
      });
    }
  }

  

  onDragOver(event: MouseEvent) {
    event.preventDefault(); // Necessary to allow dropping
  }
  
  moveItem(fromIndex: number, toIndex: number) {
    // console.log('moveItem called', { fromIndex, toIndex });
    requestAnimationFrame(() => {
      const item = this.filteredItems[fromIndex];
      this.filteredItems.splice(fromIndex, 1);
      this.filteredItems.splice(toIndex, 0, item);
      this.updateItemIndices();
      this.cdr.detectChanges();
      // console.log('Item moved', { newFilteredItems: this.filteredItems });
    });
  }
  
  updateItemIndices() {
    // console.log('updateItemIndices called');
    this.filteredItems.forEach((item, index) => {
      item.index = index;
    });
    this.cdr.markForCheck();
    // console.log('Item indices updated', { filteredItems: this.filteredItems });
  }
  





  clearSelection() {
    this.selectedItems = [];
    this.lastClickedItem = null;
  }

  registerLastClickedCell(item: any, column: Column, event: MouseEvent) {
    this.lastClickedCell = { item, column };
  }

  onDeleteSelectedItems() {
    if (this.deleteItem && this.selectedItems.length > 0) {
      const deletedIds = new Set();
  
      // Delete items and collect their IDs
      for (let item of this.selectedItems) {
        this.deleteItem(item.id);
        deletedIds.add(item.id);
      }
  
      // Remove deleted items from _items
      const updatedItems = this._items.filter(item => !deletedIds.has(item.id));
      this._items = updatedItems;
  
      // Clear selected items
      this.selectedItems = [];
  
      // Update filtered items
      this.updateFilteredItems();
  
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }


  //Click event handlers for the table
  
  onRowClick(item: any, event: MouseEvent) {
    if (event.button === 0) { // Left click
      event.preventDefault(); // Prevent default click behavior
      const currentTime = new Date().getTime();
      const timeSinceLastClick = currentTime - this.lastClickTime;
  
      if (timeSinceLastClick < 300 && !this.isDoubleClickHandled) {
        // Double click
        this.onRowDoubleClick(item);
        setTimeout(() => {
          this.isDoubleClickHandled = false;
        }, 300); // Reset the flag after a short delay
      } else {
        // Single click
        this.lastClickTime = currentTime;
        setTimeout(() => {
          if (!this.isDoubleClickHandled) {
            if (event.ctrlKey) {
              this.onRowCtrlClick(item, event);
            } else if (event.shiftKey) {
              this.onRowShiftClick(item, event);
            } else {
              this.clearSelection();
              this.rowClicked.emit({item:item, event:event});
            }
          }
        }, 300);
      }
    } else if (event.button === 1) { // Middle click
      this.rowMiddleClicked.emit(item);
    }
  }
  
  onRowDoubleClick(item: any) {
    if (this.isDoubleClickHandled) {
      return; // Exit if we've already handled a double-click
    }
    this.isDoubleClickHandled = true;
  
    this.rowDoubleClicked.emit(item);
    this.cellDoubleClicked.emit({item:item, column: this.lastClickedCell.column});
  }
  
  onRowRightClick(item: any, event: MouseEvent) {
    event.preventDefault(); // Prevent the default context menu
    this.rowRightClicked.emit(item);
  }

  onRowCtrlClick(item: any, event: MouseEvent) {
    const index = this.selectedItems.findIndex(i => i.id === item.id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }
    this.lastClickedItem = item;
    this.selectedItemsEvent.emit(this.selectedItems);
  }

  onRowShiftClick(item: any, event: MouseEvent) {
    if (!this.lastClickedItem) {
      this.lastClickedItem = item;
      this.selectedItems = [item];
      return;
    }
  
    const allItems = this._items;
    const lastIndex = allItems.findIndex(i => i.id === this.lastClickedItem.id);
    const currentIndex = allItems.findIndex(i => i.id === item.id);
  
    if (lastIndex === -1 || currentIndex === -1) return;
  
    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
  
    const itemsToToggle = allItems.slice(start, end + 1);
  
    // Determine if we're selecting or unselecting based on the state of the current item
    const isSelecting = !this.selectedItems.some(i => i.id === item.id);
  
    if (isSelecting) {
      // Add items that are not already selected
      this.selectedItems = [...new Set([...this.selectedItems, ...itemsToToggle])];
    } else {
      // Remove the toggled items from selection
      this.selectedItems = this.selectedItems.filter(i => !itemsToToggle.some(ti => ti.id === i.id));
    }
  
    this.lastClickedItem = item;
    this.selectedItemsEvent.emit(this.selectedItems);
  }

  onRowHover(item: any) {
    this.hoverSubject.next(item);
  }


}
