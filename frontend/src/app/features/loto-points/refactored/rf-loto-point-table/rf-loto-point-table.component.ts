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
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  FilterOutRules,
  TableComponent,
} from '../../../../shared/table/refactored/table.component';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { LotoPointContextMenuService } from '../services/loto-point-context-menu.service';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { LotoPointBulkEditFormComponent } from '../loto-point-bulk-edit-form/loto-point-bulk-edit-form.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfLotoPointClickService } from './rf-loto-point-click.service';

@Component({
  selector: 'app-rf-loto-point-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LotoPointBulkEditFormComponent],
  // providers: [
  //   { provide: TableClickService, useClass: RfLotoPointClickService }
  // ],
  templateUrl: './rf-loto-point-table.component.html',
  styleUrl: './rf-loto-point-table.component.css',
})
export class RfLotoPointTableComponent implements OnInit {
  private apiService = inject(RfLotoPointApiService);
  protected stateService = inject(RfLotoPointStateService);
  private mapperService = inject(LotoPointMapperService);
  protected contextMenuService = inject(LotoPointContextMenuService);
  private tableUtilService = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-loto-point-table');
  inputItems = input<LotoPointDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  hoveredItemId = input<number | null>(null);
  fieldsToDisplay = input<(keyof LotoPointDto)[]>();
  /** Initial search criteria to apply when the table loads */
  initialSearchCriteria = input<SearchCriteria | null>(null);

  // Outputs
  selectedItemsEvent = output<LotoPointDto[]>();
  itemsReorderedEvent = output<LotoPointDto[]>();
  rowHoveredEvent = output<LotoPointDto | null>();

  // State
  items$ = toSignal(this.stateService.allLoadedLotoPoints$, {
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
    if(this.uniqueOptionsMap() && this.columnInFocus()) return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    else{
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
    // Check if we have initial search criteria - if so, load with that criteria
    // Otherwise, load initial data without filters
    const initialCriteria = this.initialSearchCriteria();
    if (initialCriteria && (initialCriteria.query || (initialCriteria.filters && Object.keys(initialCriteria.filters).length > 0))) {
      this.loadInitialDataWithCriteria(initialCriteria);
    } else {
      this.loadInitialData();
    }
  }

  /**
   * Load initial batch of LOTO points with search criteria applied
   */
  private loadInitialDataWithCriteria(criteria: SearchCriteria): void {
    if (this.inputItems()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const searchCriteria: SearchCriteria = {
      ...criteria,
      page: 1,
      pageSize: 50,
    };

    this.stateService.setSearchCriteria(searchCriteria);

    this.apiService
      .searchLotoPoints(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading LOTO points with criteria:', error);
          this.errorMessage.set('Failed to load LOTO points');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Load initial batch of LOTO points
   */
  private loadInitialData(): void {
    if (this.inputItems()) return; // If items are provided, no need to load initial data.

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getLotoPoints(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading LOTO points:', error);
          this.errorMessage.set('Failed to load LOTO points');
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
    const key = columnKey as keyof LotoPointDto;
    this.columnInFocus.set(key);
    if(!this.isTableIsolated())this.stateService.loadUniqueItems(key, searchString);
  }

  /**
   * Load more unique items for a column (delegates to state service)
   */
  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoPointDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated())
      this.stateService.loadMoreUniqueItems(key, searchString);
    // this.onLoadMore()
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
    this.stateService.clearLotoPoints();

    this.apiService
      .searchLotoPoints(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            // Replace current items with search results
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching LOTO points:', error);
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

    this.stateService.clearLotoPoints();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchLotoPoints(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted LOTO points:', error);
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
      .searchLotoPoints(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more LOTO points:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Handle bulk edit applied event
   * Refresh the table to show updated items
   */
  onBulkEditApplied(updatedItems: LotoPointDto[]): void {
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
        this.stateService.clearLotoPoints();
        this.stateService.resetPage();
        this.loadInitialData();
      }
    }

    // Clear selection after bulk edit
    // The selection service should be available through the table
  }
}
