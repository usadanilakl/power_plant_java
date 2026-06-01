import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
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
import { RfUserStateService } from '../services/rf-user-state.service';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user.model';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  // The shared TableComponent expects each of these to be provided at component
  // scope (so multiple table instances don't share UI state). Per-table copies
  // of selection/sort/etc. are required by the design.
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
      @if (errorMessage()) {
        <div class="error-message">{{ errorMessage() }}</div>
      }
      <app-table
        [tableId]="'users'"
        [items]="items()"
        [columns]="columns()"
        [columnUniqueOptions]="stateService.currentColumnUniqueItems()"
        [isLoadingMore]="stateService.loadingUniqueItems()"
        (search)="onSearch($event)"
        (sortChanged)="onSortChanged($event)"
        (loadMoreItems)="onLoadMore($event)"
        (loadInitialOptions)="loadUniqueItems($event.column, $event.filter)"
        (loadMoreOptions)="loadMoreUniqueItems($event.column, $event.filter)"
        (selectedItemsEvent)="selectedItemsEvent.emit($event)"
        (rowDoubleClicked)="onRowDoubleClick($event)">
      </app-table>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .table-wrapper { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden; }
    .error-message { padding: 8px 12px; background: var(--status-incomplete, #ffe0e0); color: #c00; font-size: 13px; }
  `]
})
export class UserTableComponent implements OnInit {
  protected stateService = inject(RfUserStateService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  selectedItemsEvent = output<UserDto[]>();

  private items$ = toSignal(this.stateService.loadedUsers$, { initialValue: [] as UserDto[] });
  items = computed(() => this.items$());

  columns = signal<Column[]>(UserDto.toTableColumns());
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // The page component owns the initial load via stateService.loadInitialPaginated().
    // No-op here so a re-mounted table doesn't double-load.
  }

  onRowDoubleClick(item: any): void {
    const user = UserDto.fromJson(item);
    this.stateService.openForm(user);
  }

  /** Filter or global-search change from the table. */
  onSearch(criteria: SearchCriteria): void {
    const existing = this.stateService.getCurrentSearchCriteria() ?? {};
    const merged: SearchCriteria = {
      ...existing,
      ...criteria,
      page: 1,
      pageSize: this.stateService.getPageSize(),
    };
    this.stateService.setSearchCriteria(merged);
    this.stateService.clearLoaded();
    this.fetchPage(merged, /* append */ false);
  }

  onSortChanged(event: { column: Column; isAscending: boolean }): void {
    const existing = this.stateService.getCurrentSearchCriteria() ?? {};
    const criteria: SearchCriteria = {
      ...existing,
      sortColumn: event.column.accessorKey || event.column.id,
      sortDirection: event.isAscending ? 'ASC' : 'DESC',
      page: 1,
      pageSize: this.stateService.getPageSize(),
      type: existing.type ?? ('sort' as any),
    };
    this.stateService.setSearchCriteria(criteria);
    this.stateService.clearLoaded();
    this.fetchPage(criteria, /* append */ false);
  }

  onLoadMore(criteria: SearchCriteria | void): void {
    if (this.items().length === 0) return; // guard against early-trigger before initial load
    const existing = this.stateService.getCurrentSearchCriteria();
    const incoming = (criteria || {}) as SearchCriteria;
    const next: SearchCriteria = {
      ...(existing || { type: 'column' as any, filters: {} }),
      ...incoming,
      // preserve sort across load-more
      sortColumn: incoming.sortColumn || existing?.sortColumn,
      sortDirection: incoming.sortDirection || existing?.sortDirection,
      page: this.stateService.getCurrentPage(),
      pageSize: this.stateService.getPageSize(),
    };
    this.fetchPage(next, /* append */ true);
  }

  loadUniqueItems(columnKey: string, searchString: string): void {
    this.stateService.loadUniqueItems(columnKey, searchString);
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    this.stateService.loadMoreUniqueItems(columnKey, searchString);
  }

  private fetchPage(criteria: SearchCriteria, append: boolean): void {
    this.errorMessage.set(null);
    const hasFilters = criteria.type === 'global'
      ? !!criteria.query
      : (criteria.filters && Object.keys(criteria.filters).length > 0) || !!criteria.sortColumn;

    const obs = hasFilters
      ? this.userService.searchUsers(criteria, this.stateService.getPageSize())
      : this.userService.getUsers(criteria.page ?? 1, this.stateService.getPageSize());

    obs.pipe(
      tap(res => {
        const rows = ((res.responseData?.content as any[]) ?? []).map(u => UserDto.fromJson(u));
        if (append) this.stateService.addLoadedUsers(rows);
        else this.stateService.addLoadedUsers(rows); // already cleared; addLoadedUsers appends to [] which is fine
        if (rows.length > 0) this.stateService.incrementPage();
      }),
      catchError(err => {
        console.error('[Users] table fetch failed:', err);
        this.errorMessage.set('Failed to load users');
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
