import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  output,
  input,
  inject,
  DestroyRef,
  HostListener,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  Observable,
  Subject,
  Subscription,
} from 'rxjs';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CopyPasteDirective } from '../../directives/copy-paste.directive';
import {
  ScrollingModule,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule, CopyPasteDirective, ScrollingModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  @Input() columns: Column[] = [];
  @Input() clickCallback!: (item: any, event: MouseEvent) => void;
  @Input() doubleClickCallback?: (item: any) => void;
  @Input() rightClickCallback?: (item: any) => void;
  @Input() middleClickCallback?: (item: any) => void;
  @Input() cellDoubleClickCallback?: (item: any, column: Column) => void;
  @Input() deleteItem?: (item: string) => void;
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);

  @ViewChild('tableContainer') tableContainer!: ElementRef;
  @ViewChild('tableBody') tableBody!: ElementRef;
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  private resizeObserver?: ResizeObserver;

  @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
  @Output() search = new EventEmitter<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();

  selectedItems: any[] = [];
  lastClickedItem: any = null;
  private lastClickTime: number = 0;
  private isDoubleClickHandled: boolean = false;
  lastClickedCell!: { item: any; column: Column };
  rowHeight = 50;

  isDraggingAndDropping = false;
  draggedItem: any = null;
  private startDragPosition: { x: number; y: number } = { x: 0, y: 0 };
  ghostRowIndex: number | null = null;

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
    // console.log('Items input received:', value);
    if (Array.isArray(value)) {
      // console.log('Array received:', value);
      this._items.next(value);
    } else if (value instanceof Observable) {
      // console.log('Observable received');
      this.itemsSubscription?.unsubscribe();
      this.itemsSubscription = value
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((items) => {
          // console.log('Items from Observable:', items);
          this._items.next(items);
        });
    }
  }

  // ngAfterViewInit() {
  //   setTimeout(() => {
  //     if (this.tableBody && this.tableBody.nativeElement) {
  //       const sampleRow = this.tableBody.nativeElement.querySelector('tr');
  //       if (sampleRow) {
  //         this.rowHeight = sampleRow.offsetHeight;
  //         if (this.viewport) {
  //           this.viewport.checkViewportSize();
  //         }
  //         this.cdr.detectChanges();
  //       }
  //     }

  //     this.resizeObserver = new ResizeObserver(() => {
  //       this.viewport.checkViewportSize();
  //     });
  //     this.resizeObserver.observe(this.viewport.elementRef.nativeElement);

  //     // Use destroyRef for cleanup
  //     this.destroyRef.onDestroy(() => {
  //       if (this.resizeObserver) {
  //         this.resizeObserver.disconnect();
  //       }
  //     });
  //   });

  //   console.log('isDragAndDropEnabled:', this.isDragAndDropEnabled());
  // }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
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

        this.resizeObserver = new ResizeObserver(() => {
          if (this.viewport) {
            this.viewport.checkViewportSize();
          }
        });
        this.resizeObserver.observe(this.viewport.elementRef.nativeElement);

        // Use destroyRef for cleanup
        this.destroyRef.onDestroy(() => {
          if (this.resizeObserver) {
            this.resizeObserver.disconnect();
          }
        });
      });
    }

    console.log('isDragAndDropEnabled:', this.isDragAndDropEnabled());
  }

  ngOnInit() {
    // console.log('TableComponent initialized');
    this._items
      .pipe(
        debounceTime(0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        // console.log('Items updated:', items);
        this.updateFilteredItems();
        this.cdr.detectChanges();
      });

    this.hoverSubject
      .pipe(
        debounceTime(this.hoverDebounceTime()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((item) => {
        this.rowHoveredEvent.emit(item);
      });

    this.updateItemIndices();
  }

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
      page: 1,
    };

    this.columnFilters = { ...filters };

    this.search.emit(searchCriteria);
  }

  private updateFilteredItems() {
    // console.log('Updating filtered items: ', this._items.value.length);
    this.filteredItems = this._items.value
      .filter((item) => {
        if (this.globalSearchQuery) {
          return Object.values(item).some((value) =>
            String(value)
              .toLowerCase()
              .includes(this.globalSearchQuery.toLowerCase())
          );
        }
        return true;
      })
      .filter((item) => {
        // console.log('Filter conditions:', this.columnFilters);
        // console.log('Item:', item);
        return Object.entries(this.columnFilters).every(
          ([key, value]) =>
            !value ||
            String(this.getNestedProperty(item, key))
              .toLowerCase()
              .includes(value.toLowerCase())
        );
      });

    if (this.currentSortColumn) {
      this.sortColumn(
        this.columns.find((col) => col.id === this.currentSortColumn) ||
          this.columns[0]
      );
    }

    // Maintain the current order of items
    const orderedItems = this._items.value.filter((item) =>
      this.filteredItems.some((filteredItem) => filteredItem.id === item.id)
    );

    this.filteredItems = orderedItems;
    this.updateItemIndices();
    // console.log('Filtered items updated:', this.filteredItems.length);
  }

  handleScroll() {
    const end = this.viewport.getRenderedRange().end;
    const total = this.filteredItems.length;
    const searchCriteria: SearchCriteria = {
      type: this.globalSearchQuery !== '' ? 'global' : 'column',
      query: this.globalSearchQuery,
      filters: this.columnFilters,
    };
    if (end === total) {
      if (
        this.globalSearchQuery !== '' ||
        Object.values(this.columnFilters).some((filter) => filter !== '')
      )
        this.loadMoreItems.emit(searchCriteria);
      else this.loadMoreItems.emit();
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id; // Assuming each item has a unique 'id' property
  }

  sortColumn(column: Column) {
    if (this.isDragAndDropEnabled()) return;
    const columnKey = column.accessorKey || column.id;
    this.isAscending =
      this.currentSortColumn === columnKey ? !this.isAscending : true;
    this.currentSortColumn = columnKey;

    this.filteredItems = [...this.filteredItems].sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.isAscending ? aValue - bValue : bValue - aValue;
      } else {
        return this.isAscending
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
    });

    this.cdr.detectChanges();
  }

  getCellValue(item: any, column: Column): string {
    return column.accessorFn
      ? column.accessorFn(item)
      : column.accessorKey
      ? this.getNestedProperty(item, column.accessorKey)
      : '';
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
        return current[arrayKey] && current[arrayKey][index]
          ? current[arrayKey][index]
          : '';
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
    if (
      this.isDraggingAndDropping &&
      this.draggedItem &&
      this.ghostRowIndex !== null
    ) {
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

  // @HostListener('document:mousemove', ['$event'])
  // onDocumentMouseMove(event: MouseEvent) {
  //   // console.log('document:mousemove', { clientY: event.clientY, isDraggingAndDropping: this.isDraggingAndDropping });
  //   // this.onMouseMove(event);
  // }

  // @HostListener('document:mouseup', ['$event'])
  // onDocumentMouseUp(event: MouseEvent) {
  //   // console.log('document:mouseup');
  //   // this.onMouseUp(event);
  // }

  onRowClick(item: any, event: MouseEvent) {
    if (event.button === 0) {
      // Left click
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
          if (!this.isDoubleClickHandled && this.clickCallback) {
            if (event.ctrlKey) {
              this.onRowCtrlClick(item, event);
            } else if (event.shiftKey) {
              this.onRowShiftClick(item, event);
            } else {
              this.clearSelection();
              this.clickCallback(item, event);
            }
          }
        }, 300);
      }
    } else if (event.button === 1 && this.middleClickCallback) {
      // Middle click
      this.middleClickCallback(item);
    }
  }

  onRowDoubleClick(item: any) {
    if (this.isDoubleClickHandled) {
      return; // Exit if we've already handled a double-click
    }
    this.isDoubleClickHandled = true;

    if (typeof this.doubleClickCallback === 'function') {
      try {
        this.doubleClickCallback(item);
      } catch (error) {
        console.error('Error executing doubleClickCallback:', error);
      }
    }

    if (typeof this.cellDoubleClickCallback === 'function') {
      try {
        if (this.lastClickedCell && this.lastClickedCell.column) {
          this.cellDoubleClickCallback(item, this.lastClickedCell.column);
        } else {
          console.warn('lastClickedCell or its column is undefined');
        }
      } catch (error) {
        console.error('Error executing cellDoubleClickCallback:', error);
      }
    }
  }

  onRowRightClick(item: any, event: MouseEvent) {
    if (typeof this.rightClickCallback === 'function') {
      event.preventDefault(); // Prevent the default context menu
      try {
        this.rightClickCallback(item);
      } catch (error) {
        console.error('Error executing rightClickCallback:', error);
      }
    }
  }

  onRowCtrlClick(item: any, event: MouseEvent) {
    const index = this.selectedItems.findIndex((i) => i.id === item.id);
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
    const lastIndex = allItems.findIndex(
      (i) => i.id === this.lastClickedItem.id
    );
    const currentIndex = allItems.findIndex((i) => i.id === item.id);

    if (lastIndex === -1 || currentIndex === -1) return;

    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);

    const itemsToToggle = allItems.slice(start, end + 1);

    // Determine if we're selecting or unselecting based on the state of the current item
    const isSelecting = !this.selectedItems.some((i) => i.id === item.id);

    if (isSelecting) {
      // Add items that are not already selected
      this.selectedItems = [
        ...new Set([...this.selectedItems, ...itemsToToggle]),
      ];
    } else {
      // Remove the toggled items from selection
      this.selectedItems = this.selectedItems.filter(
        (i) => !itemsToToggle.some((ti) => ti.id === i.id)
      );
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
      const updatedItems = this._items.value.filter(
        (item) => !deletedIds.has(item.id)
      );
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

// import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef, output, input, inject, DestroyRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Column } from '../../models/column.model';
// import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, Subject, Subscription } from 'rxjs';
// import { SearchCriteria } from '../../models/api/search-criteria.model';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CopyPasteDirective } from '../../directives/copy-paste.directive';

// @Component({
//   selector: 'app-shared-table',
//   standalone: true,
//   imports: [CommonModule, FormsModule, CopyPasteDirective],
//   templateUrl: './table.component.html',
//   styleUrls: ['./table.component.css']
// })
// export class TableComponent implements OnInit {

//   private destroyRef = inject(DestroyRef);

//   @Input() columns: Column[] = [];
//   @Input() clickCallback!: (item: any, event: MouseEvent) => void;
//   @Input() doubleClickCallback?: (item: any) => void;
//   @Input() rightClickCallback?: (item: any) => void;
//   @Input() middleClickCallback?: (item: any) => void;
//   @Input() cellDoubleClickCallback?: (item: any, column: Column) => void;
//   @Input() deleteItem?: (item: string) => void;
//   hoverDebounceTime = input<number>(0);

//   @ViewChild('tableContainer') tableContainer!: ElementRef;
//   @ViewChild('tableBody') tableBody!: ElementRef;

//   @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
//   @Output() search = new EventEmitter<SearchCriteria>();
//   rowHoveredEvent = output<any>();
//   selectedItemsEvent = output<any[]>();

//   selectedItems: any[] = [];
//   lastClickedItem: any = null;

//   private _items = new BehaviorSubject<any[]>([]);
//   filteredItems: any[] = [];
//   globalSearchQuery: string = '';
//   columnFilters: { [key: string]: string } = {};

//   currentSortColumn: string | null = null;
//   isAscending: boolean = true;

//   private clickTimer: any;
//   private clickDelay = 250; // milliseconds
//   private hoverSubject = new Subject<any>();

//   constructor(private cdr: ChangeDetectorRef) {}

//   private itemsSubscription: Subscription | null = null;

//   // @Input() set items(value: any[] | Observable<any[]>) {
//   //   if (Array.isArray(value)) {
//   //     this._items.next(value);
//   //   } else if (value instanceof Observable) {
//   //     this.itemsSubscription?.unsubscribe();
//   //     this.itemsSubscription = value.pipe(
//   //       takeUntilDestroyed(this.destroyRef)
//   //     ).subscribe(items => this._items.next(items));
//   //   }
//   // }

//   @Input() set items(value: any[] | Observable<any[]>) {
//     // console.log('Items input received:', value);
//     if (Array.isArray(value)) {
//       // console.log('Array received:', value);
//       this._items.next(value);
//     } else if (value instanceof Observable) {
//       // console.log('Observable received');
//       this.itemsSubscription?.unsubscribe();
//       this.itemsSubscription = value.pipe(
//         takeUntilDestroyed(this.destroyRef)
//       ).subscribe(items => {
//         // console.log('Items from Observable:', items);
//         this._items.next(items);
//       });
//     }
//   }

// ngOnInit() {
//   // console.log('TableComponent initialized');
//   this._items.pipe(
//     debounceTime(0),
//     distinctUntilChanged(),
//     takeUntilDestroyed(this.destroyRef)
//   ).subscribe((items) => {
//     // console.log('Items updated:', items);
//     this.updateFilteredItems();
//     this.cdr.detectChanges();
//   });

//   this.hoverSubject.pipe(
//     debounceTime(this.hoverDebounceTime()),
//     takeUntilDestroyed(this.destroyRef)
//   ).subscribe(item => {
//     this.rowHoveredEvent.emit(item);
//   });
// }

//   // ngAfterViewInit() {
//   //   this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
//   // }

//   updateItems(newItems: any[]) {
//     this._items.next(newItems);
//   }

//   onGlobalSearchChange() {
//     this.performSearch();
//   }

//   onColumnSearchChange() {
//     this.performSearch();
//   }

//   private performSearch() {
//     const filters = Object.entries(this.columnFilters)
//       .filter(([_, value]) => value !== '')
//       .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

//     const searchCriteria: SearchCriteria = {
//       type: this.globalSearchQuery ? 'global' : 'column',
//       query: this.globalSearchQuery,
//       filters: filters,
//       page: 1
//     };

//     this.search.emit(searchCriteria);
//   }

//   private updateFilteredItems() {
//     this.filteredItems = this._items.value.filter(item => {
//       if (this.globalSearchQuery) {
//         return Object.values(item).some(value =>
//           String(value).toLowerCase().includes(this.globalSearchQuery.toLowerCase())
//         );
//       }
//       return true;
//     }).filter(item => {
//       return Object.entries(this.columnFilters).every(([key, value]) =>
//         !value || String(this.getNestedProperty(item, key)).toLowerCase().includes(value.toLowerCase())
//       );
//     });

//     if (this.currentSortColumn) {
//       this.sortColumn(this.columns.find(col => col.id === this.currentSortColumn) || this.columns[0]);
//     }
//   }

//   handleScroll(event: Event) {
//     const target = event.target as HTMLElement;
//     const { scrollTop, scrollHeight, clientHeight } = target;
//     if (scrollHeight - scrollTop - clientHeight < 50) {
//       this.loadMoreItems.emit();
//     }
//   }

//   sortColumn(column: Column) {
//     const columnKey = column.accessorKey || column.id;
//     this.isAscending = this.currentSortColumn === columnKey ? !this.isAscending : true;
//     this.currentSortColumn = columnKey;

//     this.filteredItems.sort((a, b) => {
//       const aValue = this.getCellValue(a, column).toString();
//       const bValue = this.getCellValue(b, column).toString();
//       return this.isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
//     });
//   }

//   getCellValue(item: any, column: Column): string {
//     return column.accessorFn ? column.accessorFn(item) : column.accessorKey ? this.getNestedProperty(item, column.accessorKey) : '';
//   }

//   getCellStyle(item: any, column: any): { [key: string]: string } {
//     if (column.conditionalStyling) {
//       return column.conditionalStyling(item, column);
//     }
//     return {};
//   }

//   getNestedProperty(obj: any, path: string): string {
//     return path.split('.').reduce((current, key) => {
//       if (current == null) return '';
//       if (key.includes('[') && key.includes(']')) {
//         const [arrayKey, indexStr] = key.split(/[\[\]]/);
//         const index = parseInt(indexStr);
//         return current[arrayKey] && current[arrayKey][index] ? current[arrayKey][index] : '';
//       }
//       return current[key] !== undefined ? current[key] : '';
//     }, obj);
//   }

//   private lastClickTime: number = 0;
//   private isDoubleClickHandled: boolean = false;

//   onRowClick(item: any, event: MouseEvent) {
//     if (event.button === 0) { // Left click
//       event.preventDefault(); // Prevent default click behavior
//       const currentTime = new Date().getTime();
//       const timeSinceLastClick = currentTime - this.lastClickTime;

//       if (timeSinceLastClick < 300 && !this.isDoubleClickHandled) {
//         // Double click
//         this.onRowDoubleClick(item);
//         setTimeout(() => {
//           this.isDoubleClickHandled = false;
//         }, 300); // Reset the flag after a short delay
//       } else {
//         // Single click
//         this.lastClickTime = currentTime;
//         setTimeout(() => {
//           if (!this.isDoubleClickHandled && this.clickCallback) {
//             if (event.ctrlKey) {
//               this.onRowCtrlClick(item, event);
//             } else if (event.shiftKey) {
//               this.onRowShiftClick(item, event);
//             } else {
//               this.clearSelection();
//               this.clickCallback(item, event);
//             }
//           }
//         }, 300);
//       }
//     } else if (event.button === 1 && this.middleClickCallback) { // Middle click
//       this.middleClickCallback(item);
//     }
//   }

//   onRowDoubleClick(item: any) {
//     if (this.isDoubleClickHandled) {
//       return; // Exit if we've already handled a double-click
//     }
//     this.isDoubleClickHandled = true;

//     if (typeof this.doubleClickCallback === 'function') {
//       try {
//         this.doubleClickCallback(item);
//       } catch (error) {
//         console.error('Error executing doubleClickCallback:', error);
//       }
//     }

//     if (typeof this.cellDoubleClickCallback === 'function') {
//       try {
//         if (this.lastClickedCell && this.lastClickedCell.column) {
//           this.cellDoubleClickCallback(item, this.lastClickedCell.column);
//         } else {
//           console.warn('lastClickedCell or its column is undefined');
//         }
//       } catch (error) {
//         console.error('Error executing cellDoubleClickCallback:', error);
//       }
//     }
//   }

//   onRowRightClick(item: any, event: MouseEvent) {
//     if (typeof this.rightClickCallback === 'function') {
//       event.preventDefault(); // Prevent the default context menu
//       try {
//         this.rightClickCallback(item);
//       } catch (error) {
//         console.error('Error executing rightClickCallback:', error);
//       }
//     }
//   }

//   onRowCtrlClick(item: any, event: MouseEvent) {
//     const index = this.selectedItems.findIndex(i => i.id === item.id);
//     if (index > -1) {
//       this.selectedItems.splice(index, 1);
//     } else {
//       this.selectedItems.push(item);
//     }
//     this.lastClickedItem = item;
//     this.selectedItemsEvent.emit(this.selectedItems);
//   }

//   onRowShiftClick(item: any, event: MouseEvent) {
//     if (!this.lastClickedItem) {
//       this.lastClickedItem = item;
//       this.selectedItems = [item];
//       return;
//     }

//     const allItems = this._items.value;
//     const lastIndex = allItems.findIndex(i => i.id === this.lastClickedItem.id);
//     const currentIndex = allItems.findIndex(i => i.id === item.id);

//     if (lastIndex === -1 || currentIndex === -1) return;

//     const start = Math.min(lastIndex, currentIndex);
//     const end = Math.max(lastIndex, currentIndex);

//     const itemsToToggle = allItems.slice(start, end + 1);

//     // Determine if we're selecting or unselecting based on the state of the current item
//     const isSelecting = !this.selectedItems.some(i => i.id === item.id);

//     if (isSelecting) {
//       // Add items that are not already selected
//       this.selectedItems = [...new Set([...this.selectedItems, ...itemsToToggle])];
//     } else {
//       // Remove the toggled items from selection
//       this.selectedItems = this.selectedItems.filter(i => !itemsToToggle.some(ti => ti.id === i.id));
//     }

//     this.lastClickedItem = item;
//     this.selectedItemsEvent.emit(this.selectedItems);
//   }

//   onRowHover(item: any) {
//     this.hoverSubject.next(item);
//   }

//   clearSelection() {
//     this.selectedItems = [];
//     this.lastClickedItem = null;
//   }

//   lastClickedCell!: { item: any, column: Column };

//   registerLastClickedCell(item: any, column: Column, event: MouseEvent) {
//     this.lastClickedCell = { item, column };
//   }

//   onDeleteSelectedItems() {
//     if (this.deleteItem && this.selectedItems.length > 0) {
//       const deletedIds = new Set();

//       // Delete items and collect their IDs
//       for (let item of this.selectedItems) {
//         this.deleteItem(item.id);
//         deletedIds.add(item.id);
//       }

//       // Remove deleted items from _items
//       const updatedItems = this._items.value.filter(item => !deletedIds.has(item.id));
//       this._items.next(updatedItems);

//       // Clear selected items
//       this.selectedItems = [];

//       // Update filtered items
//       this.updateFilteredItems();

//       // Trigger change detection
//       this.cdr.detectChanges();
//     }
//   }

//   scrollToIndex(index: number) {
//     if (this.tableBody && this.tableBody.nativeElement) {
//       const rows = this.tableBody.nativeElement.querySelectorAll('tr');
//       if (rows[index]) {
//         rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
//         // console.log('Scrolled to row:', index);
//         // Optionally, highlight the row
//         rows[index].classList.add('highlighted');
//         setTimeout(() => {
//           rows[index].classList.remove('highlighted');
//         }, 2000); // Remove highlight after 2 seconds
//       }
//     }
//   }

//   // Method to get the index of an item
//   // getItemIndex(item: any): number {
//   //   console.log('filteredItems: ', this.filteredItems)
//   //   return this.filteredItems.findIndex(i => i.id === item.id);
//   // }
//   getItemIndex(item: any): number {
//     if (!this.tableBody) {
//       console.warn('Table body not available');
//       return -1;
//     }

//     const rows = this.tableBody.nativeElement.querySelectorAll('tr');
//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       if (row.dataset.itemId === item.id.toString()) {
//         // console.log(`Item found at visual index ${i}`);
//         return i;
//       }
//     }

//     // console.warn('Item not found in table body');
//     return -1;
//   }

// }
