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
import { RfJhaApiService } from '../services/rf-jha-api.service';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TableComponent } from '../../../../../shared/table/refactored/table.component';
import { RfJhaMapperService } from '../services/rf-jha-mapper.service';
import { JhaDto, JhaFieldName } from '../../../../../models/permits/jha.model';
import { Column } from '../../../../../models/column.model';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { JhaTableControlService } from './rf-jha-table-control.service';

@Component({
  selector: 'app-rf-jha-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './rf-jha-table.component.html',
  styleUrl: './rf-jha-table.component.css',
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    { provide: TableControlsService, useClass: JhaTableControlService },
    TableDataService,
  ],
})
export class RfJhaTableComponent implements OnInit {
  private apiService = inject(RfJhaApiService);
  protected stateService = inject(RfJhaStateService);
  private mapperService = inject(RfJhaMapperService);
  private destroyRef = inject(DestroyRef);

  tableId = input<string>('rf-jha-table');
  inputItems = input<JhaDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  fieldsToDisplay = input<JhaFieldName[]>();
  initialSearchCriteria = input<SearchCriteria | null>(null);

  selectedItemsEvent = output<JhaDto[]>();
  rowDoubleClickedEvent = output<JhaDto>();

  items$ = toSignal(this.stateService.allLoadedJhas$, { initialValue: [] });
  columnInFocus = signal<string | null>(null);

  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  items = computed(() => this.inputItems() ?? this.items$());

  currentColumnUniqueItems = computed(() => this.stateService.currentColumnUniqueItems());

  constructor() {
    effect(() => {
      const fields = this.fieldsToDisplay();
      this.columns.set(this.mapperService.toTableColumns(fields));
    });
  }

  ngOnInit(): void {
    const initialCriteria = this.initialSearchCriteria();
    if (initialCriteria && (initialCriteria.query || (initialCriteria.filters && Object.keys(initialCriteria.filters).length > 0))) {
      this.loadInitialDataWithCriteria(initialCriteria);
    } else {
      this.loadInitialData();
    }
  }

  private loadInitialDataWithCriteria(criteria: SearchCriteria): void {
    if (this.inputItems()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const searchCriteria: SearchCriteria = { ...criteria, page: 1, pageSize: 50 };
    this.stateService.setSearchCriteria(searchCriteria);

    this.apiService.searchJhas(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addJhas(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.errorMessage.set('Failed to load JHAs');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  private loadInitialData(): void {
    if (this.inputItems()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getJhas(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
            this.stateService.addJhas(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.errorMessage.set('Failed to load JHAs');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof JhaDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadUniqueItems(key, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof JhaDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadMoreUniqueItems(key, searchString);
  }

  onSearch(criteria: SearchCriteria): void {
    if (this.inputItems()) return;
    this.searchInDatabase(criteria);
  }

  private searchInDatabase(criteria: SearchCriteria): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
    const mergedCriteria: SearchCriteria = {
      ...existingCriteria,
      ...criteria,
      page: 1,
      pageSize: 50,
    };

    this.stateService.setSearchCriteria(mergedCriteria);
    this.stateService.resetPage();
    this.stateService.clearJhas();

    this.apiService.searchJhas(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addJhas(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.errorMessage.set('Search failed');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
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

    this.stateService.clearJhas();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.searchJhas(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
            this.stateService.addJhas(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.errorMessage.set('Failed to load sorted data');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    const existingCriteria = this.stateService.getCurrentSearchCriteria();
    const incomingCriteria = criteria || {};

    const loadMoreCriteria: SearchCriteria = {
      ...(existingCriteria || { type: 'column', filters: {} }),
      ...incomingCriteria,
      sortColumn: (incomingCriteria as any).sortColumn || existingCriteria?.sortColumn,
      sortDirection: (incomingCriteria as any).sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };

    this.apiService.searchJhas(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
            this.stateService.addJhas(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }
}
