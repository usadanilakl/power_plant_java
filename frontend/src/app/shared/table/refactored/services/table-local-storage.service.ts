import { inject, Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class TableLocalStorageService {
  private localStorageService = inject(LocalStorageService);
  private readonly LOCAL_STORAGE_PREFIX = 'table-filters-';

  /**
   * Save table filters with column filter logic
   */
  saveTableFilters(filters: SearchCriteria, tableId: string): void {
    const key = this.getStorageKey(tableId);
    this.localStorageService.setItem<SearchCriteria>(key, filters);
  }

  /**
   * Retrieve table filters for a specific table
   */
  getTableFilters(tableId: string): SearchCriteria | null {
    const key = this.getStorageKey(tableId);
    return this.localStorageService.getItem<SearchCriteria>(key);
  }

  /**
   * Clear filters for a specific table
   */
  clearTableFilters(tableId: string): void {
    const key = this.getStorageKey(tableId);
    this.localStorageService.removeItem(key);
  }

  /**
   * Clear all table filters
   */
  clearAllTableFilters(): void {
    const allKeys = this.localStorageService.getAllKeys();
    const tableKeys = allKeys.filter((key) =>
      key.startsWith(this.LOCAL_STORAGE_PREFIX)
    );
    tableKeys.forEach((key) => this.localStorageService.removeItem(key));
  }

  /**
   * Check if table filters exist
   */
  hasTableFilters(tableId: string): boolean {
    const key = this.getStorageKey(tableId);
    return this.localStorageService.hasItem(key);
  }

  /**
   * Generate storage key for a table
   */
  private getStorageKey(tableId: string): string {
    return `${this.LOCAL_STORAGE_PREFIX}${tableId}`;
  }
}
