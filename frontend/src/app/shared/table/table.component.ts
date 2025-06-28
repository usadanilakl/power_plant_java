import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef, output, input, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, Subject, Subscription } from 'rxjs';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  private destroyRef = inject(DestroyRef);

  @Input() columns: Column[] = [];
  @Input() clickCallback!: (item: any, event: MouseEvent) => void;
  @Input() doubleClickCallback?: (item: any) => void;
  @Input() rightClickCallback?: (item: any) => void;
  @Input() middleClickCallback?: (item: any) => void;
  @Input() cellDoubleClickCallback?: (item: any, column: Column) => void;
  @Input() deleteItem?: (item: string) => void;
  hoverDebounceTime = input<number>(0);

  @ViewChild('tableContainer') tableContainer!: ElementRef;

  @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
  @Output() search = new EventEmitter<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();

  selectedItems: any[] = [];
  lastClickedItem: any = null;

  private _items = new BehaviorSubject<any[]>([]);
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  private clickTimer: any;
  private clickDelay = 250; // milliseconds
  private hoverSubject = new Subject<any>();

  constructor(private cdr: ChangeDetectorRef) {}

  private itemsSubscription: Subscription | null = null;
  
  @Input() set items(value: any[] | Observable<any[]>) {
    if (Array.isArray(value)) {
      this._items.next(value);
    } else if (value instanceof Observable) {
      this.itemsSubscription?.unsubscribe();
      this.itemsSubscription = value.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(items => this._items.next(items));
    }
  }

ngOnInit() {
  this._items.pipe(
    debounceTime(0),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => {
    this.updateFilteredItems();
    this.cdr.detectChanges();
  });

  this.hoverSubject.pipe(
    debounceTime(this.hoverDebounceTime()),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(item => {
    this.rowHoveredEvent.emit(item);
  });
}

  // ngAfterViewInit() {
  //   this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
  // }

  updateItems(newItems: any[]) {
    this._items.next(newItems);
  }

  onGlobalSearchChange() {
    this.performSearch();
  }

  onColumnSearchChange() {
    this.performSearch();
  }

  private performSearch() {
    const filters = Object.entries(this.columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const searchCriteria: SearchCriteria = {
      type: this.globalSearchQuery ? 'global' : 'column',
      query: this.globalSearchQuery,
      filters: filters,
      page: 1
    };

    this.search.emit(searchCriteria);
  }

  private updateFilteredItems() {
    this.filteredItems = this._items.value.filter(item => {
      if (this.globalSearchQuery) {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(this.globalSearchQuery.toLowerCase())
        );
      }
      return true;
    }).filter(item => {
      return Object.entries(this.columnFilters).every(([key, value]) => 
        !value || String(this.getNestedProperty(item, key)).toLowerCase().includes(value.toLowerCase())
      );
    });

    if (this.currentSortColumn) {
      this.sortColumn(this.columns.find(col => col.id === this.currentSortColumn) || this.columns[0]);
    }
  }

  handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      this.loadMoreItems.emit();
    }
  }

  sortColumn(column: Column) {
    console.log(column)
    const columnKey = column.accessorKey || column.id;
    this.isAscending = this.currentSortColumn === columnKey ? !this.isAscending : true;
    this.currentSortColumn = columnKey;

    this.filteredItems.sort((a, b) => {
      const aValue = this.getCellValue(a, column).toString();
      const bValue = this.getCellValue(b, column).toString();
      console.log(aValue, bValue, this.isAscending);
      return this.isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }

  getCellValue(item: any, column: Column): string {
    return column.accessorFn ? column.accessorFn(item) : column.accessorKey ? this.getNestedProperty(item, column.accessorKey) : '';
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

  onRowClick(item: any, event: MouseEvent) {
    if (event.button === 0) { // Left click
      if (this.clickTimer) {
        // Double click detected
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        this.onRowDoubleClick(item);
      } else {
        // Set a timer for potential double click
        this.clickTimer = setTimeout(() => {
          this.clickTimer = null;
          if (this.clickCallback) {
          if (event.ctrlKey) {
            this.onRowCtrlClick(item, event);
          } else if (event.shiftKey) {
            this.onRowShiftClick(item, event);
          } else {
            this.clearSelection();
            this.clickCallback(item, event);
          }
          }
        }, this.clickDelay);
      }
    } else if (event.button === 1 && this.middleClickCallback) { // Middle click
      this.middleClickCallback(item);
    }
  }

  onRowDoubleClick(item: any) {
    if (this.doubleClickCallback) {
      this.doubleClickCallback(item);
    }
    if (this.cellDoubleClickCallback) {
      // console.log('Cell double click:', this.lastClickedCell);
      // console.log('Callback function:', this.cellDoubleClickCallback);
      try {
        this.cellDoubleClickCallback(item, this.lastClickedCell.column);
        console.log('Callback executed successfully in table component');
      } catch (error) {
        console.error('Error executing callback:', error);
      }
    }
  }
  
  onRowRightClick(item: any, event: MouseEvent) {
    if (this.rightClickCallback) {
      event.preventDefault(); // Prevent the default context menu
      this.rightClickCallback(item);
    }
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
  
    const allItems = this._items.value;
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

  clearSelection() {
    this.selectedItems = [];
    this.lastClickedItem = null;
  }

  lastClickedCell!: { item: any, column: Column };

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
      const updatedItems = this._items.value.filter(item => !deletedIds.has(item.id));
      this._items.next(updatedItems);
  
      // Clear selected items
      this.selectedItems = [];
  
      // Update filtered items
      this.updateFilteredItems();
  
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

}