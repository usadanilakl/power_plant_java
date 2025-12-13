
import { Injectable } from '@angular/core';
import { Column } from '../../../../models/column.model';

@Injectable({
  providedIn: 'root'
})
export class TableSortService {
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

  private compareValues(aValue: any, bValue: any, isAscending: boolean): number {
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return isAscending ? aValue - bValue : bValue - aValue;
    }
    const comparison = String(aValue).localeCompare(String(bValue));
    return isAscending ? comparison : -comparison;
  }
}
