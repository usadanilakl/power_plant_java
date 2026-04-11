import { Component, DestroyRef, inject, OnInit, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { EtaProApiService } from '../services/etapro-api.service';
import { EtaProMapperService } from '../services/etapro-mapper.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

/**
 * Server-side paginated point picker table — follows the exact same pattern as
 * rf-loto-point-table. Provides table services, handles (search), (sortChanged),
 * (loadMoreItems), (loadInitialOptions), (loadMoreOptions) events via API calls.
 */
@Component({
  selector: 'app-etapro-point-picker',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    TableDataService,
  ],
  template: `
    <div class="table-wrapper">
      <app-table
        [tableId]="'etapro-point-picker'"
        [items]="items()"
        [columns]="columns()"
        [columnUniqueOptions]="currentColumnUniqueItems()"
        [isLoadingMore]="isLoading()"

        (search)="onSearch($event)"
        (sortChanged)="onSortChanged($event)"
        (loadMoreItems)="onLoadMore($event)"
        (loadInitialOptions)="onLoadInitialOptions($event.column, $event.filter)"
        (loadMoreOptions)="onLoadMoreOptions($event.column, $event.filter)"
        (selectedItemsEvent)="onSelected($event)"
        (rowDoubleClicked)="rowDoubleClicked.emit($event)">
      </app-table>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; width: 100%; height: 100%; }
    .table-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden; }
    app-table { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
  `]
})
export class EtaProPointPickerComponent implements OnInit {
  private apiService = inject(EtaProApiService);
  private mapperService = inject(EtaProMapperService);
  private destroyRef = inject(DestroyRef);

  selectedItemsEvent = output<EtaProPointDto[]>();
  rowDoubleClicked = output<any>();

  // State
  private allLoadedItems: EtaProPointDto[] = [];
  items = signal<EtaProPointDto[]>([]);
  columns = signal<Column[]>(this.mapperService.toPointTableColumns());
  isLoading = signal(false);
  currentColumnUniqueItems = signal<string[]>([]);

  private pageSize = 50;
  private currentPage = 1;
  private currentSearchCriteria: SearchCriteria | null = null;
  private currentSortColumn = 'pointId';
  private currentSortDirection: 'ASC' | 'DESC' = 'ASC';

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ── Data loading ─────────────────────────────────────────

  private loadInitialData(): void {
    this.isLoading.set(true);
    this.apiService.getPointsPaginated(1, this.pageSize).pipe(
      tap(res => {
        if (res.responseData?.content?.length > 0) {
          this.allLoadedItems = res.responseData.content.map((p: any) => EtaProPointDto.fromJson(p));
          this.items.set([...this.allLoadedItems]);
          this.currentPage = 2;
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('[EtaPro PointPicker] Load failed:', err);
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // ── Table event handlers ──────────────────────────────────

  onSearch(criteria: SearchCriteria): void {
    this.currentSearchCriteria = criteria;
    this.allLoadedItems = [];
    this.currentPage = 1;

    if (criteria.sortColumn) this.currentSortColumn = criteria.sortColumn;
    if (criteria.sortDirection) this.currentSortDirection = criteria.sortDirection;

    const hasFilters = (criteria.filters && Object.values(criteria.filters).some(v => v && v.trim()))
                    || (criteria.query && criteria.query.trim());

    if (!hasFilters) {
      // No search — load fresh paginated
      this.loadInitialData();
      return;
    }

    this.isLoading.set(true);
    criteria.page = 1;
    this.apiService.searchPoints(criteria, this.pageSize).pipe(
      tap(res => {
        if (res.responseData?.content) {
          this.allLoadedItems = res.responseData.content.map((p: any) => EtaProPointDto.fromJson(p));
          this.items.set([...this.allLoadedItems]);
          this.currentPage = 2;
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('[EtaPro PointPicker] Search failed:', err);
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onSortChanged(event: { column: Column; isAscending: boolean }): void {
    this.currentSortColumn = event.column.accessorKey || event.column.id;
    this.currentSortDirection = event.isAscending ? 'ASC' : 'DESC';

    const criteria: SearchCriteria = this.currentSearchCriteria || {} as SearchCriteria;
    criteria.type = 'sort' as any;
    criteria.sortColumn = this.currentSortColumn;
    criteria.sortDirection = this.currentSortDirection;
    criteria.page = 1;

    this.allLoadedItems = [];
    this.currentPage = 1;
    this.isLoading.set(true);

    this.apiService.searchPoints(criteria, this.pageSize).pipe(
      tap(res => {
        if (res.responseData?.content) {
          this.allLoadedItems = res.responseData.content.map((p: any) => EtaProPointDto.fromJson(p));
          this.items.set([...this.allLoadedItems]);
          this.currentPage = 2;
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onLoadMore(criteria: SearchCriteria): void {
    this.isLoading.set(true);

    const searchCriteria = this.currentSearchCriteria || {} as SearchCriteria;
    searchCriteria.page = this.currentPage;
    searchCriteria.sortColumn = this.currentSortColumn;
    searchCriteria.sortDirection = this.currentSortDirection;

    const hasFilters = searchCriteria.filters && Object.values(searchCriteria.filters).some(v => v && v.trim());
    const hasQuery = searchCriteria.query && searchCriteria.query.trim();

    const obs = (hasFilters || hasQuery)
      ? this.apiService.searchPoints(searchCriteria, this.pageSize)
      : this.apiService.getPointsPaginated(this.currentPage, this.pageSize);

    obs.pipe(
      tap(res => {
        if (res.responseData?.content?.length > 0) {
          const newItems = res.responseData.content.map((p: any) => EtaProPointDto.fromJson(p));
          this.allLoadedItems = [...this.allLoadedItems, ...newItems];
          this.items.set([...this.allLoadedItems]);
          this.currentPage++;
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onLoadInitialOptions(column: string, filter: string): void {
    const criteria = this.currentSearchCriteria || {} as SearchCriteria;
    this.apiService.getPointUniqueValues(column, criteria, 1, 50).pipe(
      tap(res => {
        if (res.responseData?.content) {
          this.currentColumnUniqueItems.set(res.responseData.content);
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onLoadMoreOptions(column: string, filter: string): void {
    // For now, load the same — could add pagination later
    this.onLoadInitialOptions(column, filter);
  }

  onSelected(items: any[]): void {
    const dtos = items.map((i: any) => EtaProPointDto.fromJson(i));
    this.selectedItemsEvent.emit(dtos);
  }
}
