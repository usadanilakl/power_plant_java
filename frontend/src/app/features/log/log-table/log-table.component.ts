import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogApiService } from '../services/log-api.service';
import { LogStateService } from '../services/log-state.service';
import { LogMapperService } from '../services/log-mapper.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-log-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './log-table.component.html',
  styleUrl: './log-table.component.css',
})
export class LogTableComponent implements OnInit {
  private apiService = inject(LogApiService);
  protected stateService = inject(LogStateService);
  private mapperService = inject(LogMapperService);
  private destroyRef = inject(DestroyRef);

  tableId = input<string>('log-table');

  items$ = toSignal(this.stateService.allLoadedItems$, {
    initialValue: [],
  });
  columnInFocus = signal<string | null>(null);
  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  items = computed(() => this.items$());

  currentColumnUniqueItems = computed(() => {
    return this.stateService.currentColumnUniqueItems();
  });

  constructor() {
    this.columns.set(this.mapperService.toTableColumns());
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getPaginated(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addItems(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading comments:', error);
          this.errorMessage.set('Failed to load comments');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadUniqueItems(columnKey: string, searchString: string): void {
    this.columnInFocus.set(columnKey);
    this.stateService.loadUniqueItems(columnKey, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    this.columnInFocus.set(columnKey);
    this.stateService.loadMoreUniqueItems(columnKey, searchString);
  }

  onSearch(criteria: SearchCriteria): void {
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
    this.stateService.clearItems();

    this.apiService
      .search(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            this.stateService.addItems(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error searching comments:', error);
          this.errorMessage.set('Search failed');
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

    const searchCriteria: SearchCriteria = {
      ...existingCriteria,
      sortColumn: event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: 50,
      type: existingCriteria.type ?? 'sort',
    };

    this.stateService.clearItems();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .search(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addItems(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading sorted comments:', error);
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
      sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
      sortDirection:
        incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };

    this.apiService
      .search(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addItems(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more comments:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
