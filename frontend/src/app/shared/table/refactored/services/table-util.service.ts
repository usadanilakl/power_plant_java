import { Injectable } from "@angular/core";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";
import { Column } from "../../../../models/column.model";

@Injectable({
  providedIn: 'root',
})
export class TableUtilService {
  buildSearchCriteria(
    globalQuery: string,
    columnFilters: { [key: string]: string }
  ): SearchCriteria {
    const filters = Object.entries(columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return {
      type: globalQuery ? 'global' : 'column',
      query: globalQuery,
      filters: filters,
      page: 1,
    };
  }

  updateItemIndices(items: any[]): void {
    items.forEach((item, index) => {
      item.index = index;
    });
    // this.cdr.markForCheck();
  }

  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current == null) return '';
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split(/[\[\]]/);
        const index = parseInt(indexStr);
        return current[arrayKey]?.[index] ?? '';
      }
      return current[key] ?? '';
    }, obj);
  }

  getCellValue(item: any, column: Column): string {
    if (column.accessorFn) {
      return column.accessorFn(item);
    }
    if (column.accessorKey) {
      return this.getNestedProperty(item, column.accessorKey);
    }
    return '';
  }

  getCellStyle(item: any, column: any): { [key: string]: string } {
    if (column.conditionalStyling) {
      return column.conditionalStyling(item, column);
    }
    return {};
  }

  trackByItemId(index: number, item: any): any {
    return item.id || index;
  }
}