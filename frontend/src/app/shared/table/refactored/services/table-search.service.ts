import { inject, Injectable } from '@angular/core';
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

  /**
   * A column filter box can hold several picked values separated by "|"
   * (multi-select). Values are OR-ed — the row matches if it matches ANY pick —
   * while the words INSIDE one value follow that column's AND/OR toggle, so
   * "Dan Schomig" stays one name rather than "dan" or "schomig".
   * <p>
   * The token rule now reads the same toggle the server reads. It used to be
   * hard-coded to OR here while the server defaulted to AND, so an isolated
   * (client-filtered) table and a server-backed one answered the same filter
   * differently.
   */
  private matchesColumnFilters(
    item: any,
    filters: { [key: string]: string }
  ): boolean {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;

      const values = value
        .split('|')
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.length > 0);
      if (values.length === 0) return true; // separators only => no constraint

      const itemValue = this.utilService.getNestedProperty(item, key);
      const fieldValue = String(itemValue).toLowerCase();
      const useAndLogic = this.dataService.columnFilterLogic[key] !== 'OR';

      return values.some((single) => {
        const tokens = single.split(/\s+/).filter((t) => t.length > 0);
        return useAndLogic
          ? tokens.every((token) => fieldValue.includes(token))
          : tokens.some((token) => fieldValue.includes(token));
      });
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
    const allItems = this.dataService.items();

    // Start with all items, but filter out any that are in the exclusion set.
    const itemsToFilter = allItems
      .filter((item) => !this.dataService.excludedItemIds.has(item.id));

    // Apply global and column-specific search queries.
    let filteredResult: any[];
    if (this.dataService.isTableIsolated()) {
      filteredResult = this.performSearch(
        itemsToFilter,
        this.dataService.globalSearchQuery,
        this.dataService.columnFilters()
      );
    } else {
      filteredResult = itemsToFilter;
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
    this.utilService.updateItemIndices(filteredResult);

    // An emptied list means the data was replaced (fresh search / clear), so
    // pagination starts over — release the load-more guard.
    if (filteredResult.length === 0) this.dataService.lastLoadMoreLength = -1;

    // Set the filtered items signal
    this.dataService.filteredItems.set(filteredResult);

    // Use a small timeout to ensure the DOM has updated before syncing widths.
    // This is crucial for accurate width calculation after filtering/sorting.
    setTimeout(() => {
      this.syncService.synchronizeColumnWidths();
      this.clampViewportScroll(filteredResult.length);
    }, 50);
  }

  /**
   * Keep the virtual viewport's scroll offset inside the new content.
   * <p>
   * A filter/search that shrinks the list leaves the viewport scrolled to an
   * offset that no longer exists — cdk-virtual-scroll then renders an empty
   * range and the table looks like it found nothing, even when rows matched.
   * (Reproduces as: scroll a long list, filter down to a handful, get a blank
   * table.) Runs after the DOM has the new rows so the spacer height is real.
   */
  private clampViewportScroll(newLength: number): void {
    const viewport = this.dataService.viewport();
    if (!viewport) return;
    try {
      const contentHeight = newLength * this.dataService.rowHeight;
      const maxOffset = Math.max(0, contentHeight - viewport.getViewportSize());
      if (viewport.measureScrollOffset() > maxOffset) {
        viewport.scrollToOffset(maxOffset);
        viewport.checkViewportSize();
      }
    } catch {
      // Viewport detached mid-flight (table closed while a search was in
      // progress) — nothing to correct.
    }
  }

  /**
   * Apply a criteria pushed in from OUTSIDE the table (the
   * {@code [initialSearchCriteria]} input) as if the user had typed it: mirror
   * it into the filter state, re-run the client-side filter, and publish it on
   * the `search` output so a server-backed host fetches.
   * <p>
   * This used to update the filter state and stop there, so a programmatic
   * search (LOTO builder OCR term, a query param, a dialog pre-filter) left the
   * search box showing the new term while the rows stayed on the previous one —
   * no search was ever triggered. Debounce is deliberately skipped: the caller
   * has already decided the criteria, there is nothing to wait for.
   */
  applyExternalCriteria(criteria: SearchCriteria): void {
    clearTimeout(this.searchDebounceTimer); // a pending keystroke must not undo this

    this.dataService.globalSearchQuery = criteria.query ?? '';
    this.dataService.columnFilters.set({ ...(criteria.filters ?? {}) });
    if (criteria.globalFilterLogic) {
      this.dataService.globalFilterLogic = criteria.globalFilterLogic;
    }
    if (criteria.columnFilterLogic) {
      this.dataService.columnFilterLogic = criteria.columnFilterLogic;
    }

    // Publish the same SHAPE a typed search publishes — `query` and `filters`
    // both always present. Hosts merge the emitted criteria over the one they
    // already hold, so a caller that simply omits `filters` would otherwise
    // leave the previous column filter silently in force.
    const normalized: SearchCriteria = {
      ...this.utilService.buildSearchCriteria(
        this.dataService.globalSearchQuery,
        this.dataService.columnFilters(),
        this.dataService.columnFilterLogic,
        this.dataService.globalFilterLogic
      ),
      ...(criteria.sortColumn
        ? { sortColumn: criteria.sortColumn, sortDirection: criteria.sortDirection }
        : {}),
      page: 1,
      ...(criteria.pageSize ? { pageSize: criteria.pageSize } : {}),
    };

    this.dataService.currentSearchCriteria = normalized;
    // New query => pagination restarts.
    this.dataService.lastLoadMoreLength = -1;
    this.updateFilteredItems();
    this.dataService.search.set(normalized);
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
    clearTimeout(this.searchDebounceTimer);

    this.searchDebounceTimer = setTimeout(() => {
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
      // New query => pagination restarts, so the previous load-more guard is stale.
      this.dataService.lastLoadMoreLength = -1;
      this.updateFilteredItems();
      this.dataService.search.set({ ...searchCriteria });
    }, 400);
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
