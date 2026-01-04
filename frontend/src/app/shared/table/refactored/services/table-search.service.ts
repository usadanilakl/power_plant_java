import { computed, effect, inject, Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { TableDataService } from './table-data.service';
import { TableSyncService } from './table-sync.service';
import { TableUtilService } from './table-util.service';
import { TableLocalStorageService } from './table-local-storage.service';

export type filterLogic = 'AND' | 'OR';

@Injectable()
export class TableSearchService {
  private dataService = inject(TableDataService);
  private syncService = inject(TableSyncService);
  private utilService = inject(TableUtilService);
  private localStorageService = inject(TableLocalStorageService);
  private searchDebounceTimer: any;
  performSearch(
    items: any[],
    globalQuery: string,
    columnFilters: { [key: string]: string }
  ): any[] {
    return items
      .filter((item) => this.matchesGlobalSearch(item, globalQuery))
      .filter((item) => this.matchesColumnFilters(item, columnFilters));
  }

  //============EXACT MATCHING SEARCH============================
  // private matchesGlobalSearch(item: any, query: string): boolean {
  //   if (!query) return true;
  //   const lowerQuery = query.toLowerCase();
  //   return Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(lowerQuery)
  //   );
  // }

  // private matchesColumnFilters(
  //   item: any,
  //   filters: { [key: string]: string }
  // ): boolean {
  //   return Object.entries(filters).every(([key, value]) => {
  //     if (!value) return true;
  //     const itemValue = this.utilService.getNestedProperty(item, key);
  //     return String(itemValue).toLowerCase().includes(value.toLowerCase());
  //   });
  // }

  //============FUZZY MATCHING SEARCH============================
  private matchesGlobalSearch(item: any, query: string): boolean {
    if (!query) return true;

    const tokens = query.toLowerCase().trim().split(/\s+/);
    const useAndLogic = this.dataService.globalFilterLogic === 'AND';

    if (useAndLogic) {
      // AND logic: at least one column must contain ALL tokens
      return Object.values(item).some((value) => {
        const strValue = String(value).toLowerCase();
        return tokens.every((token) => strValue.includes(token));
      });
    } else {
      // OR logic: all tokens must be found somewhere in the row (can be in different columns)
      return tokens.every((token) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(token)
        )
      );
    }
  }

  private matchesColumnFilters(
    item: any,
    filters: { [key: string]: string }
  ): boolean {
    const useAndLogic = false; // Toggle this to switch between AND/OR logic

    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;

      const tokens = value.toLowerCase().trim().split(/\s+/);
      const itemValue = this.utilService.getNestedProperty(item, key);
      const fieldValue = String(itemValue).toLowerCase();

      // Word-bucket: ALL tokens must be present in field (AND logic)
      // OR: At least ONE token must be present in field (OR logic)
      return useAndLogic
        ? tokens.every((token) => fieldValue.includes(token))
        : tokens.some((token) => fieldValue.includes(token));
    });
  }

  // private matchesColumnFilters(
  //   item: any,
  //   filters: { [key: string]: string }
  // ): boolean {
  //   return Object.entries(filters).every(([key, value]) => {
  //     if (!value) return true;

  //     const tokens = value.toLowerCase().trim().split(/\s+/);
  //     const itemValue = this.utilService.getNestedProperty(item, key);

  //     // Word-bucket: ALL tokens must be present in field
  //     return tokens.every((token) =>
  //       String(itemValue).toLowerCase().includes(token)
  //     );
  //   });
  // }

  //============FUZZY MATCHING SEARCH (using fuzzy-search library)============================
  // private matchesGlobalSearch(item: any, query: string): boolean {
  //   if (!query) return true;

  //   const tokens = query.toLowerCase().trim().split(/\s+/);
  //   return tokens.every((token) =>
  //     this.fuzzyMatchTokenAcrossFields(item, token)
  //   );
  // }

  // private fuzzyMatchTokenAcrossFields(item: any, token: string): boolean {
  //   return Object.values(item).some((value) => {
  //     const fieldValue = String(value).toLowerCase();
  //     return this.fuzzyIncludes(fieldValue, token);
  //   });
  // }

  // private matchesColumnFilters(
  //   item: any,
  //   filters: { [key: string]: string }
  // ): boolean {
  //   return Object.entries(filters).every(([key, value]) => {
  //     if (!value) return true;

  //     const tokens = value.toLowerCase().trim().split(/\s+/);
  //     const itemValue = this.utilService.getNestedProperty(item, key);
  //     const fieldValue = String(itemValue).toLowerCase();

  //     // Word-bucket: ALL tokens must fuzzy-match field
  //     return tokens.every((token) => this.fuzzyIncludes(fieldValue, token));
  //   });
  // }

  // private fuzzyIncludes(fieldValue: string, token: string): boolean {
  //   const t = token.toLowerCase();

  //   return [
  //     fieldValue.includes(t), // exact: "pmp"
  //     fieldValue.startsWith(t), // prefix: "pmp-station"
  //     fieldValue.endsWith(t), // suffix: "superpmp"
  //     fieldValue.includes(t), // contains: "power-pmp"
  //     fieldValue.startsWith(t + 's'), // plural: "pmps"
  //     fieldValue.startsWith(t + 'es'), // plural: "pmpes"
  //     fieldValue.startsWith(t + 'ed'), // past: "pumped"
  //     fieldValue.startsWith(t + 'ing'), // gerund: "pumping"
  //   ].some((match) => match);
  // }
  //======================================================================
  updateFilteredItems(): void {
    // Start with all items, but filter out any that are in the exclusion set.
    const itemsToFilter = this.dataService
      .items()
      .filter((item) => !this.dataService.excludedItemIds.has(item.id));

    // Apply global and column-specific search queries.
    if (this.dataService.isTableIsolated()) {
      this.dataService.filteredItems = this.performSearch(
        itemsToFilter,
        this.dataService.globalSearchQuery,
        this.dataService.columnFilters()
      );
    } else {
      this.dataService.filteredItems = itemsToFilter;
    }

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
    this.utilService.updateItemIndices(this.dataService.filteredItems);

    // Use a small timeout to ensure the DOM has updated before syncing widths.
    // This is crucial for accurate width calculation after filtering/sorting.
    setTimeout(() => {
      this.syncService.synchronizeColumnWidths();
      // this.cdr.detectChanges();
    }, 50);
  }

  onGlobalSearchChange(): void {
    this.search();
  }

  onColumnSearchChange(): void {
    this.search();
  }

  // search(): void {
  //   clearTimeout(this.searchDebounceTimer);

  //   this.searchDebounceTimer = setTimeout(() => {
  //     const searchCriteria = this.utilService.buildSearchCriteria(
  //       this.dataService.globalSearchQuery,
  //       this.dataService.columnFilters(),
  //       this.dataService.columnFilterLogic
  //     );

  //     this.dataService.currentSearchCriteria = searchCriteria;
  //     this.localStorageService.saveTableFilters(
  //       this.dataService.currentSearchCriteria,
  //       this.dataService.tableId
  //     );
  //     this.updateFilteredItems();
  //     this.dataService.search.set({ ...searchCriteria });
  //   }, 600);
  // }

  search(): void {
    const searchCriteria = this.utilService.buildSearchCriteria(
      this.dataService.globalSearchQuery,
      this.dataService.columnFilters(),
      this.dataService.columnFilterLogic,
      this.dataService.globalFilterLogic
    );

    this.dataService.currentSearchCriteria = searchCriteria;
    this.localStorageService.saveTableFilters(
      this.dataService.currentSearchCriteria,
      this.dataService.tableId
    );
    this.updateFilteredItems();
    this.dataService.search.set({ ...searchCriteria });
  }

  /**
   * Handle column filter change
   */

  onColumnFilterChange(columnId: string, filterValue: string): void {
    const currentFilters = this.dataService.columnFilters();
    this.dataService.columnFilters.set({
      ...currentFilters,
      [columnId]: filterValue,
    });
    this.search();
  }

  private columnFilterLogic = this.dataService.columnFilterLogic

  onFilterLogicChange():void{
    this.search();
  }

  getColumnFilterLogic(columnId: string): filterLogic {
    return this.columnFilterLogic[columnId] || 'AND';
  }

  toggleColumnFilterLogic(columnId: string): void {
    const currentLogic = this.getColumnFilterLogic(columnId);
    const newLogic = currentLogic === 'AND' ? 'OR' : 'AND';
    this.columnFilterLogic[columnId] = newLogic;

    //Trigger a search to apply the new logic
    this.search();
  }

  getGlobalFilterLogic(): filterLogic {
    return this.dataService.globalFilterLogic;
  }

  toggleGlobalFilterLogic(): void {
    const currentLogic = this.dataService.globalFilterLogic;
    this.dataService.globalFilterLogic = currentLogic === 'AND' ? 'OR' : 'AND';

    //Trigger a search to apply the new logic
    this.search();
  }

  onLoadMoreColumnFilterOptions(column: string, filter: string): void {
    const obj = { column, filter, logic: this.dataService.columnFilterLogic[column] };
    this.dataService.loadMoreOptions.set(obj);
  }

  onLoadColumnFilterOptions(column: string, filter: string): void {
    const obj = { column, filter, logic: this.dataService.columnFilterLogic[column] };
    this.dataService.loadInitialOptions.set(obj);
  }
}
