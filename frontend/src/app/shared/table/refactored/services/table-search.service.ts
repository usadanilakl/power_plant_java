
import { inject, Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { TableDataService } from './table-data.service';
import { TableSyncService } from './table-sync.service';

@Injectable({
  providedIn: 'root',
})
export class TableSearchService {
  private dataService = inject(TableDataService);
  private syncService = inject(TableSyncService);
  performSearch(
    items: any[],
    globalQuery: string,
    columnFilters: { [key: string]: string }
  ): any[] {
    return items
      .filter((item) => this.matchesGlobalSearch(item, globalQuery))
      .filter((item) => this.matchesColumnFilters(item, columnFilters));
  }

  private matchesGlobalSearch(item: any, query: string): boolean {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return Object.values(item).some((value) =>
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

  updateFilteredItems(): void {
    // Start with all items, but filter out any that are in the exclusion set.
    const itemsToFilter = this.dataService
      .items()
      .filter((item) => !this.dataService.excludedItemIds.has(item.id));

    // Apply global and column-specific search queries.
    this.dataService.filteredItems = this.performSearch(
      itemsToFilter,
      this.dataService.globalSearchQuery,
      this.dataService.columnFilters()
    );

    // Re-apply the current sort order to the newly filtered list.
    if (this.dataService.currentSortColumn) {
      const column = this.dataService
        .columns()
        .find((col) => col.id === this.dataService.currentSortColumn);
      if (column) {
        // The sortColumn method sorts `this.filteredItems` in place.
        // this.sortColumn(column);
      }
    }

    // Update the indices for virtual scrolling.
    this.updateItemIndices();

    // Use a small timeout to ensure the DOM has updated before syncing widths.
    // This is crucial for accurate width calculation after filtering/sorting.
    setTimeout(() => {
      this.syncService.synchronizeColumnWidths();
      // this.cdr.detectChanges();
    }, 50);
  }

  updateItemIndices(): void {
    this.dataService.filteredItems.forEach((item, index) => {
      item.index = index;
    });
    // this.cdr.markForCheck();
  }
}
