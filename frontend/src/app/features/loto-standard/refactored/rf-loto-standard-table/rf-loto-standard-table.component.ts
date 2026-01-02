import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoStandardApiService } from '../services/rf-loto-standard-api.service';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  FilterOutRules,
  TableComponent,
} from '../../../../shared/table/refactored/table.component';
import { LotoStandardMapperService } from '../services/rf-loto-standard-mapper.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { LotoStandardContextMenuService } from '../services/loto-standard-context-menu.service';
import { ContextMenuComponent } from '../../../../shared/menu/context-menu/context-menu.component';
import { LotoStandardBulkEditFormComponent } from '../loto-standard-bulk-edit-form/loto-standard-bulk-edit-form.component';

@Component({
  selector: 'app-rf-loto-standard-table',
  standalone: true,
  imports: [CommonModule, TableComponent, ContextMenuComponent, LotoStandardBulkEditFormComponent],
  providers: [ContextMenuComponent],
  templateUrl: './rf-loto-standard-table.component.html',
  styleUrl: './rf-loto-standard-table.component.css',
})
export class RfLotoStandardTableComponent implements OnInit {
  private apiService = inject(RfLotoStandardApiService);
  protected stateService = inject(RfLotoStandardStateService);
  private mapperService = inject(LotoStandardMapperService);
  protected contextMenuService = inject(LotoStandardContextMenuService);
  private tableUtilService = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-loto-standard-table');
  inputItems = input<LotoStandardDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  hoveredItemId = input<number | null>(null);
  fieldsToDisplay = input<(keyof LotoStandardDto)[]>();

  // Outputs
  selectedItemsEvent = output<LotoStandardDto[]>();
  itemsReorderedEvent = output<LotoStandardDto[]>();
  rowHoveredEvent = output<LotoStandardDto | null>();

  // State
  items$ = toSignal(this.stateService.allLoadedLotoStandards$, {
    initialValue: [],
  });
  columnInFocus = signal<string | null>(null);

  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  uniqueOptionsMap = computed(() => {
    if (this.isTableIsolated() && this.inputItems() && this.columns()) {
      return this.tableUtilService.getUniqueColumnOptionsMap(
        this.inputItems()!,
        this.columns()
      );
    }
    return null;
  });

  items = computed(() => {
    return this.inputItems() ?? this.items$();
  });

  currentColumnUniqueItems = computed(() => {
    if (this.uniqueOptionsMap() && this.columnInFocus()) {
      return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    } else {
      return this.stateService.currentColumnUniqueItems();
    }
  });

  constructor() {
    // Initialize columns whenever fieldsToDisplay changes
    effect(() => {
      const fields = this.fieldsToDisplay();
      this.columns.set(this.mapperService.toTableColumns(fields));
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Load initial batch of LOTO standards
   */
  private loadInitialData(): void {
    if (this.inputItems()) return; // If items are provided, no need to load initial data.

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getLotoStandards(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoStandards(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading LOTO standards:', error);
          this.errorMessage.set('Failed to load LOTO standards');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Load unique items for a column (delegates to state service)
   */
  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoStandardDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) {
      this.stateService.loadUniqueItems(key, searchString);
    }
  }

  /**
   * Load more unique items for a column (delegates to state service)
   */
  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoStandardDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) {
      this.stateService.loadMoreUniqueItems(key, searchString);
    }
  }

  /**
   * Clear unique values cache (delegates to state service)
   */
  clearUniqueValuesCache(): void {
    this.stateService.clearUniqueValuesCache();
  }

  /**
   * Handle search/filter from table component
   */
  onSearch(criteria: SearchCriteria): void {
    const isUsingInputItems = this.inputItems();

    if (isUsingInputItems) {
      // Search within provided items only
      this.searchWithinInputItems(criteria);
    } else {
      // Search in database
      this.searchInDatabase(criteria);
    }
  }

  /**
   * Search within the provided input items
   */
  private searchWithinInputItems(criteria: SearchCriteria): void {
    const inputItems = this.inputItems();
    if (!inputItems || inputItems.length === 0) return;

    let filtered = inputItems;

    if (criteria.type === 'global' && criteria.query) {
      // Global search across all properties
      filtered = inputItems.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(criteria.query!.toLowerCase())
        )
      );
    } else if (criteria.type === 'column' && criteria.filters) {
      // Column-specific search
      filtered = inputItems.filter((item) =>
        Object.entries(criteria.filters!).every(([key, value]) => {
          if (!value) return true;
          const itemValue = (item as any)[key];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        })
      );
    }
  }

  /**
   * Search in database
   */
  private searchInDatabase(criteria: SearchCriteria): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Get existing criteria and merge with new search
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

    const mergedCriteria: SearchCriteria = {
      ...existingCriteria,
      ...criteria,
      page: 1,
      pageSize: 50,
    };

    // Save the merged search criteria to state for later use (e.g., when sorting)
    this.stateService.setSearchCriteria(mergedCriteria);
    this.stateService.resetPage();
    this.stateService.clearLotoStandards();

    this.apiService
      .searchLotoStandards(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            // Replace current items with search results
            this.stateService.addLotoStandards(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching LOTO standards:', error);
          this.errorMessage.set('Search failed');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    const isUsingInputItems = this.inputItems();

    if (isUsingInputItems) {
      return;
    }

    // Get the existing search criteria and merge with new sort
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

    const searchCriteria: SearchCriteria = {
      ...existingCriteria,
      sortColumn: event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: 50,
      type: existingCriteria.type ?? 'sort',
    };

    this.stateService.clearLotoStandards();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchLotoStandards(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoStandards(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted LOTO standards:', error);
          this.errorMessage.set('Failed to load sorted data');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (!this.loadMoreEnabled()) return;
    if (this.isLoading()) return;

    this.isLoading.set(true);

    // Combine incoming criteria with existing state, preserving sort
    const existingCriteria = this.stateService.getCurrentSearchCriteria();
    const incomingCriteria = criteria || {};

    const loadMoreCriteria: SearchCriteria = {
      ...(existingCriteria || { type: 'column', filters: {} }),
      ...incomingCriteria,
      // Explicitly preserve sort state - don't let incoming criteria override it
      sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
      sortDirection:
        incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };

    this.apiService
      .searchLotoStandards(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoStandards(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more LOTO standards:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Handle selection change from table
   */
  onSelectionChanged(selectedItems: LotoStandardDto[]): void {
    this.stateService.setSelectedLotoStandards(selectedItems);
    this.selectedItemsEvent.emit(selectedItems);
  }

  /**
   * Handle items reordered from drag-drop
   */
  onItemsReordered(reorderedItems: LotoStandardDto[]): void {
    this.itemsReorderedEvent.emit(reorderedItems);
  }

  /**
   * Handle row hover
   */
  onRowHovered(item: LotoStandardDto | null): void {
    this.rowHoveredEvent.emit(item);
  }

  /**
   * Handle bulk edit applied event
   * Refresh the table to show updated items
   */
  onBulkEditApplied(updatedItems: LotoStandardDto[]): void {
    console.log(`Bulk edit applied to ${updatedItems.length} items`);

    // If using input items, we can't refresh from API
    // The parent component should handle the update
    const isUsingInputItems = this.inputItems();

    if (!isUsingInputItems) {
      // Refresh from database to get updated data
      const currentCriteria = this.stateService.getCurrentSearchCriteria();

      if (currentCriteria) {
        // Re-run the current search to refresh data
        this.onSearch(currentCriteria);
      } else {
        // No active search, just reload all items
        this.stateService.clearLotoStandards();
        this.stateService.resetPage();
        this.loadInitialData();
      }
    }

    // Clear selection after bulk edit
    // The selection service should be available through the table
  }
}
