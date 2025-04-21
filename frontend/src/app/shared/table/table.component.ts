import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { SearchCriteria } from '../../models/api/search-criteria.model';

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
  @Input() columns: Column[] = [];
  @Input() clickCallback!: (item: any) => void;
  @Input() doubleClickCallback?: (item: any) => void;
  @Input() rightClickCallback?: (item: any) => void;
  @Input() middleClickCallback?: (item: any) => void;

  @ViewChild('tableContainer') tableContainer!: ElementRef;

  @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
  @Output() search = new EventEmitter<SearchCriteria>();

  private _items = new BehaviorSubject<any[]>([]);
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  private clickTimer: any;
  private clickDelay = 250; // milliseconds

  constructor(private cdr: ChangeDetectorRef) {}

  @Input() set items(value: any[] | Observable<any[]>) {
    if (Array.isArray(value)) {
      this._items.next(value);
    } else if (value instanceof Observable) {
      value.subscribe(items => this._items.next(items));
    }
  }

  ngOnInit() {
    this._items.pipe(
      debounceTime(0),
      distinctUntilChanged()
    ).subscribe(() => {
      this.updateFilteredItems();
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
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

  handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = this.tableContainer.nativeElement;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      this.loadMoreItems.emit();
    }
  }

  sortColumn(column: Column) {
    const columnKey = column.accessorKey || column.id;
    this.isAscending = this.currentSortColumn === columnKey ? !this.isAscending : true;
    this.currentSortColumn = columnKey;

    this.filteredItems.sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);
      return this.isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }

  getCellValue(item: any, column: Column): string {
    return column.accessorFn ? column.accessorFn(item) : 
           column.accessorKey ? this.getNestedProperty(item, column.accessorKey) : '';
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
            this.clickCallback(item);
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
  }
  
  onRowRightClick(item: any, event: MouseEvent) {
    if (this.rightClickCallback) {
      event.preventDefault(); // Prevent the default context menu
      this.rightClickCallback(item);
    }
  }
}

// import { Component, Input, OnInit, ViewChild, ElementRef, inject, DestroyRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Column } from '../../models/column.model';
// import { BehaviorSubject, debounceTime, distinctUntilChanged, isObservable, Observable, Subject, Subscription, switchMap } from 'rxjs';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { SearchCriteria } from '../../models/api/search-criteria.model';

// @Component({
//   selector: 'app-shared-table',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './table.component.html',
//   styleUrls: ['./table.component.css']
// })
// export class TableComponent implements OnInit {
//   @Input() columns: Column[] = [];
//   @Input() searchCallback!: (criteria: any) => Promise<any[]>;
//   @Input() clickCallback!: (item: any) => void;
//   @Input() doubleClickCallback?: (item: any) => void;
//   @Input() rightClickCallback?: (item: any) => void;
//   @Input() middleClickCallback?: (item: any) => void;

//   @ViewChild('tableContainer') tableContainer!: ElementRef;

//   private globalSearchSubject = new Subject<string>();
//   private columnSearchSubjects: { [key: string]: Subject<string> } = {};

//   private _initialItems = new BehaviorSubject<any[]>([]);
//   private initialItemsSubscription: Subscription | null = null;
//   @Input() set initialItems(value: any[] | Observable<any[]>) {
//     if (Array.isArray(value)) {
//       this.items = value;
//       this.updateFilteredItems();
//     } else if (isObservable(value)) {
//       value.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
//         this.items = items;
//         this.updateFilteredItems();
//       });
//     }
//   }
  
//   get initialItems(): any[] {
//     return this._initialItems.value;
//   }

//   @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
//   @Output() search = new EventEmitter<SearchCriteria>();

//   currentSearchCriteria: SearchCriteria | null = null;
//   currentPage: number = 1;

//   items: any[] = [];
//   filteredItems: any[] = [];
//   globalSearchQuery: string = '';
//   columnFilters: { [key: string]: string } = {};

//   currentSortColumn: string | null = null;
//   isAscending: boolean = true;

//   constructor() {}

//   private destroyRef = inject(DestroyRef);
//   private cdr = inject(ChangeDetectorRef);

//   ngOnInit() {
    
//     this.globalSearchSubject.pipe(
//       debounceTime(300),
//       distinctUntilChanged(),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(() => this.performGlobalSearch());
  
//     this.columns.forEach(column => {
//       this.columnSearchSubjects[column.id] = new Subject<string>();
//       this.columnSearchSubjects[column.id].pipe(
//         debounceTime(300),
//         distinctUntilChanged(),
//         takeUntilDestroyed(this.destroyRef)
//       ).subscribe(() => this.performColumnSearch());
//     });

//     this._initialItems.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(items => {
//       this.items = items;
//       this.updateFilteredItems();
//       this.cdr.detectChanges();
//     });
//   }

//   updateItems(newItems: any[]) {
//     this._initialItems.next(newItems);
//   }


//   onGlobalSearchChange(query: string) {
//     this.globalSearchSubject.next(query);
//   }

//   onColumnSearchChange(column: string, value: string) {
//     this.columnFilters[column] = value;
//     if (this.columnSearchSubjects[column]) {
//       this.columnSearchSubjects[column].next(value);
//     }
//   }

//   ngAfterViewInit() {
//     this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
//   }

//   refreshView() {
//     this.updateFilteredItems();
//     this.cdr.detectChanges();
//   }

//   private setupInitialItemsSubscription() {
//     // Unsubscribe from the previous subscription if it exists
//     if (this.initialItemsSubscription) {
//       this.initialItemsSubscription.unsubscribe();
//     }
  
//     // Create a new subscription
//     this.initialItemsSubscription = this._initialItems.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe((items: any[]) => {
//       // console.log('Received new items:', items);
//       this.items = items;
//       this.updateFilteredItems();
//       // Trigger change detection
//       this.cdr.detectChanges();
//     });
//   }

//   performGlobalSearch() {
//     this.currentSearchCriteria = {
//       type: 'global',
//       query: this.globalSearchQuery,
//       filters: {},
//       page: 1
//     };
//     this.currentPage = 1;
//     this.updateFilteredItems();
//     this.search.emit(this.currentSearchCriteria);
//   }
  
//   performColumnSearch() {
//     const filters = Object.entries(this.columnFilters)
//       .filter(([_, value]) => value !== '')
//       .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
//     this.currentSearchCriteria = {
//       type: 'column',
//       query: '',
//       filters: filters,
//       page: 1
//     };
//     this.currentPage = 1;
//     this.updateFilteredItems();
//     this.search.emit(this.currentSearchCriteria);
//   }

//   private updateFilteredItems() {
//     if (!Array.isArray(this.items)) {
//       console.warn('this.items is not an array:', this.items);
//       this.filteredItems = [];
//       return;
//     }
//     this.filteredItems = this.items.filter(item => {
//       // Apply global search
//       if (this.globalSearchQuery) {
//         const matchesGlobal = Object.values(item).some(value => 
//           String(value).toLowerCase().includes(this.globalSearchQuery.toLowerCase())
//         );
//         if (!matchesGlobal) return false;
//       }
  
//       // Apply column filters
//       for (const [key, value] of Object.entries(this.columnFilters)) {
//         if (value && !String(this.getNestedProperty(item, key)).toLowerCase().includes(value.toLowerCase())) {
//           return false;
//         }
//       }
  
//       return true;
//     });
  
//     // Apply sorting if necessary
//     if (this.currentSortColumn) {
//       this.sortColumn(this.columns.find(col => col.id === this.currentSortColumn) || this.columns[0]);
//     }
//   }
  

//   async handleScroll() {
//     const { scrollTop, scrollHeight, clientHeight } = this.tableContainer.nativeElement;
//     if (scrollHeight - scrollTop - clientHeight < 50) {
//       if (this.currentSearchCriteria) {
//         this.currentPage++;
//         this.loadMoreItems.emit({
//           ...this.currentSearchCriteria,
//           page: this.currentPage
//         });
//       } else {
//         this.loadMoreItems.emit();
//       }
//     }
//   }

//   sortColumn(column: Column) {
//     const columnKey = column.accessorKey || column.header;

//     // Check if we're sorting the same column
//     if (this.currentSortColumn === columnKey) {
//       // If it's the same column, reverse the sort order
//       this.isAscending = !this.isAscending;
//     } else {
//       // If it's a new column, set it to ascending
//       this.currentSortColumn = columnKey;
//       this.isAscending = true;
//     }

//     this.filteredItems.sort((a, b) => {
//       const aValue = this.getCellValue(a, column);
//       const bValue = this.getCellValue(b, column);
      
//       // Compare the values
//       const comparison = aValue.localeCompare(bValue);
      
//       // Return the comparison result based on sort direction
//       return this.isAscending ? comparison : -comparison;
//     });
//   }

//   getCellValue(item: any, column: Column): string {
//     if (column.accessorFn) {
//       return column.accessorFn(item);
//     } else if (column.accessorKey) {
//       return this.getNestedProperty(item, column.accessorKey);
//     }
//     return '';
//   }

//   getNestedProperty(obj: any, path: string): string {
//     return path.split('.').reduce((current, key) => {
//       if (current == null) return '';
//       if (key.includes('[') && key.includes(']')) {
//         const arrayKey = key.split('[')[0];
//         const index = parseInt(key.split('[')[1].split(']')[0]);
//         return current[arrayKey] && current[arrayKey][index] ? current[arrayKey][index] : '';
//       }
//       return current[key] !== undefined ? current[key] : '';
//     }, obj);
//   }

//   // onRowClick(item: any) {
//   //   if (this.clickCallback) {
//   //     this.clickCallback(item);
//   //   }
//   // }

//   private clickTimer: any;
//   private clickDelay = 250; // milliseconds

//   onRowClick(item: any, event: MouseEvent) {
//     if (event.button === 0) { // Left click
//       if (this.clickTimer) {
//         // Double click detected
//         clearTimeout(this.clickTimer);
//         this.clickTimer = null;
//         this.onRowDoubleClick(item);
//       } else {
//         // Set a timer for potential double click
//         this.clickTimer = setTimeout(() => {
//           this.clickTimer = null;
//           if (this.clickCallback) {
//             this.clickCallback(item);
//           }
//         }, this.clickDelay);
//       }
//     } else if (event.button === 1 && this.middleClickCallback) { // Middle click
//       this.middleClickCallback(item);
//     }
//   }

//   onRowDoubleClick(item: any) {
//     if (this.doubleClickCallback) {
//       this.doubleClickCallback(item);
//     }
//   }
  
//   onRowRightClick(item: any, event: MouseEvent) {
//     if (this.rightClickCallback) {
//       event.preventDefault(); // Prevent the default context menu
//       this.rightClickCallback(item);
//     }
//   }
// }