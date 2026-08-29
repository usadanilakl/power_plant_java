import { inject, Injectable } from '@angular/core';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';

/**
 * Per-table column preferences the USER chose, as opposed to the column set the host
 * passes in. Stored per tableId so two tables of the same entity keep their own layout.
 * <p>
 * Every field is optional and additive: absent means "whatever the host declared". A
 * column id that no longer exists is ignored on load rather than resurrected, so changing
 * a host's field list can't be broken by a stale preference.
 */
export interface TableColumnPrefs {
  /** Column ids in display order. Columns missing from this list keep their declared order, after the listed ones. */
  order?: string[];
  /** Column ids the user hid. */
  hidden?: string[];
  /** Column ids pinned to the left edge, in pin order. */
  pinned?: string[];
  /** Column id -> pixel width, so a resize survives a reload. */
  widths?: { [columnId: string]: number };
}

@Injectable({
  providedIn: 'root',
})
export class TableLocalStorageService {
  private localStorageService = inject(LocalStorageService);
  private readonly LOCAL_STORAGE_PREFIX = 'table-filters-';
  private readonly COLUMN_PREFS_PREFIX = 'table-columns-';

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

  //====================== Column preferences ======================

  /**
   * Read this table's saved column layout.
   * <p>
   * An EMPTY tableId returns nothing and saves nothing. The input defaults to '' and only
   * some hosts set it, so persisting under that key would silently merge the layouts of
   * every table that forgot to name itself.
   */
  getColumnPrefs(tableId: string): TableColumnPrefs | null {
    if (!tableId) return null;
    return this.localStorageService.getItem<TableColumnPrefs>(this.getColumnPrefsKey(tableId));
  }

  saveColumnPrefs(prefs: TableColumnPrefs, tableId: string): void {
    if (!tableId) return;
    this.localStorageService.setItem<TableColumnPrefs>(this.getColumnPrefsKey(tableId), prefs);
  }

  clearColumnPrefs(tableId: string): void {
    if (!tableId) return;
    this.localStorageService.removeItem(this.getColumnPrefsKey(tableId));
  }

  /**
   * Generate storage key for a table
   */
  private getStorageKey(tableId: string): string {
    return `${this.LOCAL_STORAGE_PREFIX}${tableId}`;
  }

  private getColumnPrefsKey(tableId: string): string {
    return `${this.COLUMN_PREFS_PREFIX}${tableId}`;
  }
}
