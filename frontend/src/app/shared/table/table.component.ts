import { Component, Input, OnInit, ViewChild, ElementRef, inject, DestroyRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
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

  private _initialItems: Observable<any[]> = new Observable<any[]>();
  
  @Input() set initialItems(value: Observable<any[]>) {
    this._initialItems = value;
    this.setupInitialItemsSubscription();
  }
  
  get initialItems(): Observable<any[]> {
    return this._initialItems;
  }

  @Output() loadMoreItems = new EventEmitter<void>();
  @Output() search = new EventEmitter<SearchCriteria>();

  items: any[] = [];
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  constructor() {}

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.setupInitialItemsSubscription();
  }

  ngAfterViewInit() {
    this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private setupInitialItemsSubscription() {
    if (this._initialItems) {
      this._initialItems.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((items: any[]) => {
        console.log('Initializing table with initial items:', items);
        this.items = items;
        this.filteredItems = [...this.items];
      });
    }
  }

  performGlobalSearch() {
    const searchCriteria: SearchCriteria = {
      type: 'global',
      query: this.globalSearchQuery,
      filters: {}
    };
    this.search.emit(searchCriteria);
  }
  
  performColumnSearch() {
    const filters = Object.entries(this.columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
    const searchCriteria: SearchCriteria = {
      type: 'column',
      query: '',
      filters: filters
    };
    this.search.emit(searchCriteria);
  }

  async handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = this.tableContainer.nativeElement;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      this.loadMoreItems.emit();
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