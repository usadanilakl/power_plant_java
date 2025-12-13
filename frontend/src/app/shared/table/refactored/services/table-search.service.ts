
import { Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class TableSearchService {
  performSearch(
    items: any[],
    globalQuery: string,
    columnFilters: { [key: string]: string }
  ): any[] {
    return items.filter(item => this.matchesGlobalSearch(item, globalQuery))
      .filter(item => this.matchesColumnFilters(item, columnFilters));
  }

  private matchesGlobalSearch(item: any, query: string): boolean {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(lowerQuery)
    );
  }

  private matchesColumnFilters(
    item: any,
    filters: { [key: string]: string }
  ): boolean {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const itemValue = this.getNestedProperty(item, key);
      return String(itemValue).toLowerCase().includes(value.toLowerCase());
    });
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
      page: 1
    };
  }
}
