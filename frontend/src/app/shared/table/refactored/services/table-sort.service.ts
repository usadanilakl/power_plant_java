
import { inject, Injectable } from '@angular/core';
import { Column } from '../../../../models/column.model';
import { TableDataService } from './table-data.service';
import { TableSearchService } from './table-search.service';
import { TableUtilService } from './table-util.service';

@Injectable({
  providedIn: 'root',
})
export class TableSortService {
  dataService = inject(TableDataService);
  searchService = inject(TableSearchService);
  utilService = inject(TableUtilService);
  
  sortItems(
    items: any[],
    column: Column,
    isAscending: boolean,
    getNestedProperty: (obj: any, path: string) => any
  ): any[] {
    return [...items].sort((a, b) => {
      const aValue = this.getCellValue(a, column, getNestedProperty);
      const bValue = this.getCellValue(b, column, getNestedProperty);

      return this.compareValues(aValue, bValue, isAscending);
    });
  }

  private getCellValue(
    item: any,
    column: Column,
    getNestedProperty: (obj: any, path: string) => any
  ): any {
    if (column.accessorFn) {
      return column.accessorFn(item);
    }
    if (column.accessorKey) {
      return getNestedProperty(item, column.accessorKey);
    }
    return '';
  }

  private compareValues(
    aValue: any,
    bValue: any,
    isAscending: boolean
  ): number {
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return isAscending ? aValue - bValue : bValue - aValue;
    }
    const comparison = String(aValue).localeCompare(String(bValue));
    return isAscending ? comparison : -comparison;
  }

  // ============ Sorting Methods ============

  sortColumn(column: Column, emit = false): void {
    if (this.dataService.isDragAndDropEnabled()) return;

    const columnKey = column.accessorKey || column.id;
    this.dataService.isAscending =
      this.dataService.currentSortColumn === columnKey
        ? !this.dataService.isAscending
        : true;
    this.dataService.currentSortColumn = columnKey;

    this.dataService.filteredItems = this.sortItems(
      this.dataService.filteredItems,
      column,
      this.dataService.isAscending,
      (obj, path) => this.utilService.getNestedProperty(obj, path)
    );

    if (emit)
      this.dataService.sortChanged.set({
        column,
        isAscending: this.dataService.isAscending,
      });
  }
}
