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
  viewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrespondenceCellComponent } from '../../../../../shared/correspondence-dialog/correspondence-cell.component';
import { AttachmentDialogComponent } from '../../../../../shared/attachment-dialog/attachment-dialog.component';
import { RfWorkRequestApiService } from '../services/rf-work-request-api.service';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TableComponent } from '../../../../../shared/table/refactored/table.component';
import { RfWorkRequestMapperService } from '../services/rf-work-request-mapper.service';
import { WorkRequestDto, WorkRequestFieldName } from '../../../../../models/permits/work-request.model';
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
import { WorkRequestTableControlService } from './rf-work-request-table-control.service';
import { WorkRequestTableClickService } from './rf-work-request-table-click.service';
import { WorkRequestContextMenuService } from '../services/work-request-context-menu.service';

@Component({
  selector: 'app-rf-work-request-table',
  standalone: true,
  imports: [CommonModule, TableComponent, CorrespondenceCellComponent, AttachmentDialogComponent],
  templateUrl: './rf-work-request-table.component.html',
  styleUrl: './rf-work-request-table.component.css',
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    { provide: TableClickService, useClass: WorkRequestTableClickService },
    { provide: TableControlsService, useClass: WorkRequestTableControlService },
    TableDataService,
  ],
})
export class RfWorkRequestTableComponent implements OnInit {
  private apiService = inject(RfWorkRequestApiService);
  protected stateService = inject(RfWorkRequestStateService);
  private mapperService = inject(RfWorkRequestMapperService);
  private destroyRef = inject(DestroyRef);
  protected contextMenuService = inject(WorkRequestContextMenuService);

  // Inputs
  tableId = input<string>('rf-work-request-table');
  inputItems = input<WorkRequestDto[] | null>(null);
  isTableIsolated = input<boolean>(false);
  fieldsToDisplay = input<WorkRequestFieldName[]>();
  initialSearchCriteria = input<SearchCriteria | null>(null);

  // Outputs
  selectedItemsEvent = output<WorkRequestDto[]>();
  rowDoubleClickedEvent = output<WorkRequestDto>();

  correspondenceCellTemplate = viewChild<TemplateRef<any>>('correspondenceCellTemplate');

  // State
  items$ = toSignal(this.stateService.allLoadedWorkRequests$, { initialValue: [] });
  columnInFocus = signal<string | null>(null);

  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  items = computed(() => this.inputItems() ?? this.items$());

  currentColumnUniqueItems = computed(() => {
    return this.stateService.currentColumnUniqueItems();
  });

  constructor() {
    effect(() => {
      const fields = this.fieldsToDisplay();
      const cols = this.mapperService.toTableColumns(fields);
      const tmpl = this.correspondenceCellTemplate();
      if (tmpl) {
        cols.push({ id: 'correspondence', header: 'Responses', width: 110, template: tmpl });
      }
      this.columns.set(cols);
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

    this.apiService
      .searchWorkRequests(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addWorkRequests(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading work requests with criteria:', error);
          this.errorMessage.set('Failed to load work requests');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadInitialData(): void {
    if (this.inputItems()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getWorkRequests(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            this.stateService.addWorkRequests(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading work requests:', error);
          this.errorMessage.set('Failed to load work requests');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof WorkRequestDto;
    this.columnInFocus.set(key);
    if (!this.isTableIsolated()) this.stateService.loadUniqueItems(key, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof WorkRequestDto;
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
    this.stateService.clearWorkRequests();

    this.apiService
      .searchWorkRequests(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addWorkRequests(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching work requests:', error);
          this.errorMessage.set('Search failed');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
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

    this.stateService.clearWorkRequests();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchWorkRequests(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            this.stateService.addWorkRequests(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted work requests:', error);
          this.errorMessage.set('Failed to load sorted data');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
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

    this.apiService
      .searchWorkRequests(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            this.stateService.addWorkRequests(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more work requests:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

}
