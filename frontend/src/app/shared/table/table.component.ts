import { Component, Input, OnInit, ViewChild, ElementRef, inject, DestroyRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  @Input() searchCallback!: (criteria: any) => Promise<any[]>;
  @Input() clickCallback!: (item: any) => void;

  @ViewChild('tableContainer') tableContainer!: ElementRef;

  private globalSearchSubject = new Subject<string>();
  private columnSearchSubjects: { [key: string]: Subject<string> } = {};
  private _initialItems: Observable<any[]> = new Observable<any[]>();
  
  @Input() set initialItems(value: Observable<any[]>) {
    this._initialItems = value;
    this.setupInitialItemsSubscription();
  }
  
  get initialItems(): Observable<any[]> {
    return this._initialItems;
  }

  @Output() loadMoreItems = new EventEmitter<SearchCriteria>();
  @Output() search = new EventEmitter<SearchCriteria>();

  currentSearchCriteria: SearchCriteria | null = null;
  currentPage: number = 1;

  items: any[] = [];
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  constructor() {}

  private destroyRef = inject(DestroyRef);

  // ngOnInit() {
  //   this.setupInitialItemsSubscription();
    
  //   this.globalSearchSubject.pipe(
  //     debounceTime(300),
  //     distinctUntilChanged(),
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(() => this.performGlobalSearch());

  //   this.columnSearchSubject.pipe(
  //     debounceTime(300),
  //     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(() => this.performColumnSearch());
  // }

  ngOnInit() {
    this.setupInitialItemsSubscription();
    
    this.globalSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.performGlobalSearch());
  
    this.columns.forEach(column => {
      this.columnSearchSubjects[column.id] = new Subject<string>();
      this.columnSearchSubjects[column.id].pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => this.performColumnSearch());
    });
  }

  onGlobalSearchChange(query: string) {
    this.globalSearchSubject.next(query);
  }

  onColumnSearchChange(column: string, value: string) {
    this.columnFilters[column] = value;
    if (this.columnSearchSubjects[column]) {
      this.columnSearchSubjects[column].next(value);
    }
  }

  ngOnDestroy() {
    this.globalSearchSubject.complete();
    Object.values(this.columnSearchSubjects).forEach(subject => subject.complete());
  }

  ngAfterViewInit() {
    this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private setupInitialItemsSubscription() {
    if (this._initialItems) {
      this._initialItems.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((items: any[]) => {
        // console.log('Initializing table with initial items:', items);
        this.items = items;
        this.filteredItems = [...this.items];
      });
    }
  }

  performGlobalSearch() {
    this.currentSearchCriteria = {
      type: 'global',
      query: this.globalSearchQuery,
      filters: {},
      page: 1
    };
    this.currentPage = 1;
    this.search.emit(this.currentSearchCriteria);
  }

  performColumnSearch() {
    const filters = Object.entries(this.columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
    // console.log('Performing column search with filters:', filters);
  
    this.currentSearchCriteria = {
      type: 'column',
      query: '',
      filters: filters,
      page: 1
    };
    this.currentPage = 1;
    this.search.emit(this.currentSearchCriteria);
  }
  
  // performColumnSearch() {
  //   const filters = Object.entries(this.columnFilters)
  //     .filter(([_, value]) => value !== '')
  //     .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
  //   this.currentSearchCriteria = {
  //     type: 'column',
  //     query: '',
  //     filters: filters,
  //     page: 1
  //   };
  //   this.currentPage = 1;
  //   this.search.emit(this.currentSearchCriteria);
  // }

  async handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = this.tableContainer.nativeElement;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (this.currentSearchCriteria) {
        this.currentPage++;
        this.loadMoreItems.emit({
          ...this.currentSearchCriteria,
          page: this.currentPage
        });
      } else {
        this.loadMoreItems.emit();
      }
    }
  }

  sortColumn(column: Column) {
    const columnKey = column.accessorKey || column.header;

    // Check if we're sorting the same column
    if (this.currentSortColumn === columnKey) {
      // If it's the same column, reverse the sort order
      this.isAscending = !this.isAscending;
    } else {
      // If it's a new column, set it to ascending
      this.currentSortColumn = columnKey;
      this.isAscending = true;
    }

    this.filteredItems.sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);
      
      // Compare the values
      const comparison = aValue.localeCompare(bValue);
      
      // Return the comparison result based on sort direction
      return this.isAscending ? comparison : -comparison;
    });
  }

  getCellValue(item: any, column: Column): string {
    if (column.accessorFn) {
      return column.accessorFn(item);
    } else if (column.accessorKey) {
      return this.getNestedProperty(item, column.accessorKey);
    }
    return '';
  }

  getNestedProperty(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => {
      if (current == null) return '';
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0];
        const index = parseInt(key.split('[')[1].split(']')[0]);
        return current[arrayKey] && current[arrayKey][index] ? current[arrayKey][index] : '';
      }
      return current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  onRowClick(item: any) {
    if (this.clickCallback) {
      this.clickCallback(item);
    }
  }
}