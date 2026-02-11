import { Component, DestroyRef, inject, input, OnInit, signal, computed, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError, switchMap, exhaustMap, debounceTime, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { TableComponent, FilterOutRules } from '../../../../shared/table/refactored/table.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableUtilService } from '../../../../shared/table/refactored/services/table-util.service';
import { FileTableControlService } from '../rf-file-table/rf-file-table-control.service';
import { RfFileApiService } from '../services/rf-file-api.service';
import { RfFileStateService } from '../services/rf-file-state.service';
import { FileMapperService } from '../services/rf-file-mapper.service';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { RfFileNavClickService } from './rf-file-nav-click.service';

/**
 * Compact file navigation table for left panels.
 * Uses reactive pipelines (switchMap/exhaustMap) for search and load-more.
 * Default click service sets the current file — override at parent level for custom behavior.
 */
@Component({
  selector: 'app-rf-file-nav-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    { provide: TableClickService, useClass: RfFileNavClickService },
    { provide: TableControlsService, useClass: FileTableControlService },
  ],
  template: `
    <div class="file-table-container">
      @if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      }

      @if (isLoading()) {
        <div class="loading-indicator">
          Loading files...
        </div>
      }

      <app-table
        [tableId]="tableId()"
        [items]="items()"
        [columns]="columns()"
        [isTableIsolated]="isTableIsolated()"
        [columnUniqueOptions]="currentColumnUniqueItems()!"
        [isLoadingMore]="stateService.loadingUniqueItems()"
        [isDragAndDropEnabled]="enableDragDrop()"
        [hoverDebounceTime]="0"
        [hoveredItemId]="null"
        [filterOutItems]="filterOutItems()"

        (search)="onSearch($event)"
        (sortChanged)="onTableSortChanged($event)"
        (loadMoreItems)="onLoadMore($event)"
        (loadInitialOptions)="loadUniqueItems($event.column, $event.filter)"
        (loadMoreOptions)="loadMoreUniqueItems($event.column, $event.filter)"
        (selectedItemsEvent)="selectedItemsEvent.emit($event)"
        (itemsReordered)="itemsReorderedEvent.emit($event)"
        (rowHoveredEvent)="rowHoveredEvent.emit($event)"
      ></app-table>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .file-table-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .file-table-container app-table {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .error-message {
      padding: 8px 12px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin: 8px;
      flex-shrink: 0;
    }

    .loading-indicator {
      padding: 8px 12px;
      background-color: #e3f2fd;
      color: #1565c0;
      border-radius: 4px;
      margin: 8px;
      flex-shrink: 0;
    }
  `],
})
export class RfFileNavTableComponent implements OnInit {
  private apiService = inject(RfFileApiService);
  protected stateService = inject(RfFileStateService);
  private mapperService = inject(FileMapperService);
  private tableUtilService = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  tableId = input<string>('rf-file-nav-table');
  inputItems = input<FileDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  fieldsToDisplay = input<(keyof FileDto)[]>();

  // Outputs
  selectedItemsEvent = output<FileDto[]>();
  itemsReorderedEvent = output<FileDto[]>();
  rowHoveredEvent = output<FileDto | null>();

  // Reactive pipeline triggers
  private searchTrigger$ = new Subject<SearchCriteria>();
  private loadMoreTrigger$ = new Subject<SearchCriteria>();

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
    if (this.uniqueOptionsMap() && this.columnInFocus()) {
      return this.uniqueOptionsMap()!.get(this.columnInFocus()!);
    }
    return this.stateService.currentColumnUniqueItems();
  });

  constructor() {
    effect(() => {
      const fields = this.fieldsToDisplay();
      this.columns.set(this.mapperService.toTableColumns(fields));
    });

    // Search pipeline: debounce 300ms + switchMap (cancels stale requests)
    this.searchTrigger$.pipe(
      debounceTime(300),
      tap(() => {
        this.isLoading.set(true);
        this.errorMessage.set(null);
      }),
      switchMap(criteria =>
        this.apiService.searchFiles(criteria, 50).pipe(
          catchError(error => {
            console.error('Error searching files:', error);
            this.errorMessage.set('Search failed');
            this.isLoading.set(false);
            return of(null);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.stateService.clearFiles();
      this.stateService.resetPage();
      if (response?.responseData?.content) {
        this.stateService.addFiles(response.responseData.content);
        this.stateService.incrementPage();
      }
      this.isLoading.set(false);
    });

    // Load-more pipeline: exhaustMap (ignores triggers while loading)
    this.loadMoreTrigger$.pipe(
      filter(() => !this.isLoading()),
      exhaustMap(criteria => {
        this.isLoading.set(true);
        return this.apiService.searchFiles(criteria, 50).pipe(
          catchError(error => {
            console.error('Error loading more files:', error);
            this.isLoading.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response && response.responseData?.content && response.responseData.content.length > 0) {
        this.stateService.addFiles(response.responseData.content);
        this.stateService.incrementPage();
      }
      this.isLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    if (this.inputItems()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getFiles(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
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

  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadUniqueItems(key, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof FileDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadMoreUniqueItems(key, searchString);
  }

  clearUniqueValuesCache(): void {
    this.stateService.clearUniqueValuesCache();
  }

  onSearch(criteria: SearchCriteria): void {
    if (this.inputItems()) return;
    this.searchInDatabase(criteria);
  }

  private searchInDatabase(criteria: SearchCriteria): void {
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
    const mergedCriteria: SearchCriteria = {
      ...existingCriteria,
      ...criteria,
      page: 1,
      pageSize: 50,
    };
    this.stateService.setSearchCriteria(mergedCriteria);
    this.searchTrigger$.next(mergedCriteria);
  }

  onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    if (this.inputItems()) return;
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
    const searchCriteria: SearchCriteria = {
      ...existingCriteria,
      sortColumn: event.column.accessorKey || event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: 50,
      type: existingCriteria.type ?? 'sort',
    };
    this.stateService.setSearchCriteria(searchCriteria);
    this.searchTrigger$.next(searchCriteria);
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (!this.loadMoreEnabled() || this.isLoading()) return;
    const existingCriteria = this.stateService.getCurrentSearchCriteria();
    const incomingCriteria = criteria || {};
    const loadMoreCriteria: SearchCriteria = {
      ...(existingCriteria || { type: 'column', filters: {} }),
      ...incomingCriteria,
      sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
      sortDirection: incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };
    this.loadMoreTrigger$.next(loadMoreCriteria);
  }
}
