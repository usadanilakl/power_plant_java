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
import { RfFileApiService } from '../services/rf-file-api.service';
import { RfFileStateService } from '../services/rf-file-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  FilterOutRules,
  TableComponent,
} from '../../../../shared/table/refactored/table.component';
import { FileMapperService } from '../services/rf-file-mapper.service';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { FileContextMenuService } from '../services/file-context-menu.service';
import { ContextMenuComponent } from '../../../../shared/menu/context-menu/context-menu.component';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfFileClickService } from './rf-file-click.service';

@Component({
  selector: 'app-rf-file-table',
  standalone: true,
  imports: [CommonModule, TableComponent, ContextMenuComponent],
  providers: [
    { provide: TableClickService, useClass: RfFileClickService }
  ],
  templateUrl: './rf-file-table.component.html',
  styleUrl: './rf-file-table.component.css',
})
export class RfFileTableComponent implements OnInit {
  private apiService = inject(RfFileApiService);
  protected stateService = inject(RfFileStateService);
  private mapperService = inject(FileMapperService);
  protected contextMenuService = inject(FileContextMenuService);
  private tableUtilService = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-file-table');
  inputItems = input<FileDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  hoveredItemId = input<number | null>(null);
  fieldsToDisplay = input<(keyof FileDto)[]>();

  // Outputs
  selectedItemsEvent = output<FileDto[]>();
  itemsReorderedEvent = output<FileDto[]>();
  rowHoveredEvent = output<FileDto | null>();

  // State
  items$ = toSignal(this.stateService.allLoadedFiles$, {
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
    if (this.uniqueOptionsMap() && this.columnInFocus()) return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    else {
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
   * Load initial batch of files
   */
  private loadInitialData(): void {
    if (this.inputItems()) return; // If items are provided, no need to load initial data.

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getFiles(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addFiles(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading files:', error);
          this.errorMessage.set('Failed to load files');
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
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadUniqueItems(key, searchString);
  }

  /**
   * Load more unique items for a column (delegates to state service)
   */
  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated())
      this.stateService.loadMoreUniqueItems(key, searchString);
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
    this.stateService.clearFiles();

    this.apiService
      .searchFiles(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            // Replace current items with search results
            this.stateService.addFiles(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching files:', error);
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

    this.stateService.clearFiles();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchFiles(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addFiles(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted files:', error);
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
      .searchFiles(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addFiles(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more files:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
