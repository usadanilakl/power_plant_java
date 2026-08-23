import { Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { Column } from '../../../../models/column.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { filterLogic } from './table-search.service';

@Injectable({
  providedIn: 'root',
})
export class TableUtilService {
  buildSearchCriteria(
    globalQuery: string,
    columnFilters: { [key: string]: string },
    columnFilterLogic: { [key: string]: filterLogic } = {},
    globalFilterLogic: filterLogic = 'AND',
  ): SearchCriteria {
    const filters = Object.entries(columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return {
      type: globalQuery ? 'global' : 'column',
      query: globalQuery,
      filters: filters,
      columnFilterLogic: columnFilterLogic,
      globalFilterLogic: globalFilterLogic,
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
    // Return the item's id combined with a version marker (if available).
    // This ensures cdkVirtualFor re-renders the row when the item is updated,
    // not just when it's added/removed/moved.
    if (!item) return index;

    // Use _version (internal marker), updatedAt, or modifiedAt if available
    const version = item._version || item.updatedAt || item.modifiedAt || item.lastModified || '';
    return version ? `${item.id}-${version}` : item.id;
  }

  getUniqueColumnOptionsMap(
    items: any[],
    columns: Column[]
  ): Map<string, string[]> {
    const uniqueValuesMap = new Map<string, string[]>();

    columns.forEach((column) => {
      if (!column.filterable) return;

      // Dedupe case-insensitively but KEEP the original casing — these strings are
      // shown to the user and are compared against real column values.
      const uniqueValues = new Map<string, string>();

      items.forEach((item) => {
        const value = this.getCellValue(item, column);
        if (value !== null && value !== undefined && value !== '') {
          const text = String(value);
          const key = text.toLowerCase();
          if (!uniqueValues.has(key)) uniqueValues.set(key, text);
        }
      });

      // Key by the SAME identifier the table emits when it asks for a column's options
      // (table.component.html sends `column.accessorKey || column.id`). Keying by id
      // alone meant every column whose accessorKey differs — any nested path such as
      // `location.name` — looked itself up under a key that was never stored, so
      // isolated tables showed an empty dropdown for exactly those columns.
      uniqueValuesMap.set(
        column.accessorKey || column.id,
        Array.from(uniqueValues.values()).sort((a, b) => a.localeCompare(b))
      );
    });

    return uniqueValuesMap;
  }
}
