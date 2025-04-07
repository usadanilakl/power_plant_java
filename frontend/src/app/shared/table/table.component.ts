import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../models/column.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
  @Input() columns: Column[] = [];
  @Input() initialItems: any[] = [];
  @Input() loadMoreCallback!: () => Promise<any[]>;
  @Input() searchCallback!: (criteria: any) => Promise<any[]>;

  @ViewChild('tableContainer') tableContainer!: ElementRef;

  items: any[] = [];
  filteredItems: any[] = [];
  globalSearch$ = new BehaviorSubject<string>('');
  columnFilters: { [key: string]: string } = {};

  constructor() {}

  ngOnInit() {
    this.items = [...this.initialItems];
    this.filteredItems = [...this.items];

    this.globalSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => this.performGlobalSearch(query));
  }

  ngAfterViewInit() {
    this.tableContainer.nativeElement.addEventListener('scroll', this.handleScroll.bind(this));
  }

  async performGlobalSearch(query: string) {
    if (query === '') {
      this.filteredItems = [...this.items];
      return;
    }

    this.filteredItems = await this.searchCallback({ global: query });
  }

  async performColumnSearch() {
    const filterCriteria = Object.entries(this.columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (Object.keys(filterCriteria).length === 0) {
      this.filteredItems = [...this.items];
      return;
    }

    this.filteredItems = await this.searchCallback({ columns: filterCriteria });
  }

  async handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = this.tableContainer.nativeElement;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      const newItems = await this.loadMoreCallback();
      if (newItems && newItems.length > 0) {
        this.items = [...this.items, ...newItems];
        this.filteredItems = [...this.filteredItems, ...newItems];
      }
    }
  }

  sortColumn(column: Column) {
    this.filteredItems.sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);
      return aValue.localeCompare(bValue);
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
}