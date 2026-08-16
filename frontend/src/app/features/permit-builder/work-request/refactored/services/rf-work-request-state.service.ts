import { Injectable, inject, DestroyRef, signal, NgZone } from '@angular/core';
import { WorkRequestDto, WorkRequestFieldName } from '../../../../../models/permits/work-request.model';
import { WorkAreaDto } from '../../../../../models/permits/work-area.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
import { RfWorkRequestApiService } from './rf-work-request-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { SyncUpdateService, EntityUpdateEvent } from '../../../../../services/sync/sync-update.service';
import { ProcessWrDialogService } from '../../../../../shared/process-wr-dialog/process-wr-dialog.service';

@Injectable({
  providedIn: 'root',
})
export class RfWorkRequestStateService {
  private apiService = inject(RfWorkRequestApiService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private syncUpdateService = inject(SyncUpdateService);
  private processWrDialogService = inject(ProcessWrDialogService);
  private ngZone = inject(NgZone);

  private pageSize = 50;
  private currentPage = 1;

  private allLoadedWorkRequestsSubject = new BehaviorSubject<WorkRequestDto[]>([]);
  allLoadedWorkRequests$ = this.allLoadedWorkRequestsSubject.asObservable();

  selectedItems = signal<WorkRequestDto[]>([]);
  selectedItem = signal<WorkRequestDto | null>(null);

  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  currentSortColumn$ = this.currentSortColumnSubject.asObservable();

  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>('DESC');
  currentSortDirection$ = this.currentSortDirectionSubject.asObservable();

  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  currentSearchCriteria$ = this.currentSearchCriteriaSubject.asObservable();

  // Unique items cache for column filters
  private uniqueItemsCache = new Map<string, BehaviorSubject<any[]>>();
  private uniqueValuesCache = new Map<string, { values: string[]; page: number; hasMore: boolean }>();
  currentColumnUniqueItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);

  constructor() {
    this.apiService.workRequestDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedId) => {
        this.removeWorkRequestById(deletedId);
      });

    this.apiService.workRequestUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedItem) => {
        this.updateWorkRequestInList(updatedItem);
      });

    // Refetch on SSE reconnect. SSE is at-most-once — any WorkRequest
    // broadcast that landed during the abort window is dropped. reloadData()
    // rebuilds the currently-visible page and preserves the open item.
    this.syncUpdateService.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadData());

    this.syncUpdateService.getEntityTypeUpdates$('WorkRequest')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.handleSyncUpdate(event);
      });

    this.processWrDialogService.onComplete$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wrId) => {
        if (wrId) {
          this.refreshWorkRequest(wrId);
        } else {
          this.reloadData();
        }
      });
  }

  private handleSyncUpdate(event: EntityUpdateEvent): void {
    const entityId = event.entityId;

    this.apiService.getWorkRequestById(entityId)
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedItem = WorkRequestDto.fromJson(response.responseData);
            this.updateWorkRequestInList(updatedItem);

            const selectedItem = this.selectedItem();
            if (selectedItem?.id === entityId) {
              this.messageService.showInfo('This work request was updated from another machine');
            }
          }
        }),
        catchError((error) => {
          console.error('Error reloading synced work request:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  addWorkRequests(items: WorkRequestDto[]): void {
    const current = this.allLoadedWorkRequestsSubject.value;
    // Dedup by id: a re-requested page (overlapping load-more, retry, reconnect
    // refetch) would otherwise append the same rows again, and each append grows
    // the list, which re-triggers load-more — the table never settles.
    const seen = new Set(current.map(wr => wr.id));
    const fresh = items.filter(wr => wr.id == null || !seen.has(wr.id));
    if (fresh.length === 0) return;
    this.allLoadedWorkRequestsSubject.next([...current, ...fresh]);
  }

  clearWorkRequests(): void {
    this.allLoadedWorkRequestsSubject.next([]);
    this.currentPage = 1;
  }

  /** Hard ceiling on a single refresh fetch, so a very long scrollback can't turn
   *  a routine SSE reconnect into a multi-thousand-row request. */
  private static readonly MAX_RELOAD_SIZE = 500;

  /**
   * Refresh what is currently on screen, in place.
   * <p>
   * Runs on every SSE reconnect (routine — the stream drops and backs off) and
   * after the process dialog. It used to {@code clearWorkRequests()} and refetch
   * page 1 only, so a user who had scrolled through several pages watched the
   * table empty out and come back as a different, shorter list — read as "it
   * suddenly re-renders, rows jump and reorder, like a pile of rows arrived"
   * while nothing had actually changed. Now it refetches the SAME window and
   * swaps it in as one emission: no empty frame, no lost pages, and rows that
   * did not change keep their identity (and their scroll position).
   */
  reloadData(): void {
    const loadedCount = this.allLoadedWorkRequestsSubject.value.length;
    const size = Math.min(
      Math.max(this.pageSize, loadedCount),
      RfWorkRequestStateService.MAX_RELOAD_SIZE
    );

    const criteria = this.getCurrentSearchCriteria();
    const hasActiveState = criteria && (
      criteria.query ||
      criteria.sortColumn ||
      (criteria.filters && Object.keys(criteria.filters).length > 0)
    );

    const request$ = hasActiveState
      ? this.apiService.searchWorkRequests({ ...criteria, page: 1, pageSize: size }, size)
      : this.apiService.getWorkRequests(1, size);

    request$.pipe(
      tap(response => {
        const content = response.responseData?.content;
        // A failed/empty refresh must not wipe the table — keep what we have.
        if (!content?.length) return;
        this.setWorkRequests(content);
      }),
      catchError(error => {
        console.error('Error reloading work requests:', error);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /**
   * Place a work request the loaded window doesn't contain yet.
   * <p>
   * The window is a SORTED, server-ordered slice. Dropping every unknown row at
   * the head — which is what this used to do — meant each background sync update
   * (the hub polls SharePoint every 30s and broadcasts what it finds) yanked an
   * unrelated row to the top of the user's table, out of sort order. That reads
   * as "rows reorder and jump for no reason".
   *
   * @returns the new list, or {@code null} when the row sorts past the end of
   *          the loaded window — it belongs to a page that isn't loaded, so
   *          showing it here would misstate the order.
   */
  private insertRespectingOrder(current: WorkRequestDto[], item: WorkRequestDto): WorkRequestDto[] | null {
    if (current.length === 0) return [item];

    const criteria = this.currentSearchCriteriaSubject.value;
    const column = criteria?.sortColumn;
    const direction = criteria?.sortDirection === 'ASC' ? 1 : -1;
    const read = (o: any) => column?.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), o);

    // No sort to honour (or a value we can't read) — keep the old behaviour so a
    // freshly created request still shows up immediately.
    if (!column || read(item) == null || read(current[0]) == null) {
      return [item, ...current];
    }

    const compare = (a: any, b: any): number => {
      const x = read(a);
      const y = read(b);
      if (x === y) return 0;
      return (x < y ? -1 : 1) * direction;
    };

    const at = current.findIndex((row) => compare(item, row) < 0);
    return at === -1
      ? null
      : [...current.slice(0, at), item, ...current.slice(at)];
  }

  /**
   * Replace the loaded window in a single emission and re-derive how many pages
   * that represents, so the next load-more continues from the right offset.
   */
  private setWorkRequests(items: WorkRequestDto[]): void {
    this.allLoadedWorkRequestsSubject.next([...items]);
    this.currentPage = Math.max(1, Math.ceil(items.length / this.pageSize)) + 1;
  }

  updateWorkRequestInList(updatedItem: WorkRequestDto): void {
    if (!updatedItem.id) return;

    this.ngZone.run(() => {
      const current = this.allLoadedWorkRequestsSubject.value;
      const index = current.findIndex(wr => wr.id === updatedItem.id);

      if (index >= 0) {
        const updated = [...current];
        (updatedItem as any)._version = Date.now();
        updated[index] = updatedItem;
        this.allLoadedWorkRequestsSubject.next(updated);
      } else {
        // Don't add new items when filters are active — they may not match
        const criteria = this.currentSearchCriteriaSubject.value;
        const hasActiveFilters = criteria && (
          (criteria.filters && Object.keys(criteria.filters).length > 0) ||
          criteria.query
        );
        if (!hasActiveFilters) {
          const placed = this.insertRespectingOrder(current, updatedItem);
          if (placed) {
            (updatedItem as any)._version = Date.now();
            this.allLoadedWorkRequestsSubject.next(placed);
          }
        }
      }

      const selectedItem = this.selectedItem();
      if (selectedItem?.id === updatedItem.id) {
        this.selectedItem.set(updatedItem);
      }

      const selectedItems = this.selectedItems();
      const selectedIndex = selectedItems.findIndex(item => item.id === updatedItem.id);
      if (selectedIndex >= 0) {
        const updatedSelected = [...selectedItems];
        updatedSelected[selectedIndex] = updatedItem;
        this.selectedItems.set(updatedSelected);
      }
    });
  }

  removeWorkRequestById(id: number): void {
    const current = this.allLoadedWorkRequestsSubject.value;
    const filtered = current.filter(wr => wr.id !== id);

    if (filtered.length !== current.length) {
      this.allLoadedWorkRequestsSubject.next(filtered);

      const selectedItem = this.selectedItem();
      if (selectedItem?.id === id) {
        this.selectedItem.set(null);
      }

      const selectedItems = this.selectedItems();
      if (selectedItems.some(item => item.id === id)) {
        this.selectedItems.set(selectedItems.filter(item => item.id !== id));
      }
    }
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }

  resetPage(): void {
    this.currentPage = 1;
  }

  setSelectedItem(item: WorkRequestDto | null): void {
    this.selectedItem.set(item);
  }

  loadItemById(id: number): void {
    this.apiService
      .getWorkRequestById(id)
      .pipe(
        tap((response) => {
          this.setSelectedItem(WorkRequestDto.fromJson(response.responseData));
        }),
        catchError((error) => {
          console.error('Error loading Work Request:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  submitForm(item: WorkRequestDto): void {
    const isNew = !item.id;

    this.apiService
      .saveWorkRequest(item)
      .pipe(
        tap((response) => {
          this.setSelectedItem(WorkRequestDto.fromJson(response.responseData));
          const action = isNew ? 'created' : 'updated';
          this.messageService.showSuccess(`Work Request ${action} successfully`);
          this.closeForm();
        }),
        catchError((error) => {
          console.error('Error saving Work Request:', error);
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save Work Request: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /** Open a blank new work request, optionally pre-seeded with a work area (e.g. started from a plant node). */
  openNewWorkRequestForm(workArea?: WorkAreaDto): void {
    const wr = new WorkRequestDto();
    if (workArea) wr.workArea = workArea;
    this.setSelectedItem(wr);
  }

  setSortState(sortColumn: string, sortDirection: 'ASC' | 'DESC'): void {
    this.currentSortColumnSubject.next(sortColumn);
    this.currentSortDirectionSubject.next(sortDirection);
  }

  setSearchCriteria(criteria: SearchCriteria): void {
    this.currentSearchCriteriaSubject.next(criteria);
  }

  getCurrentSearchCriteria(): SearchCriteria | null {
    return this.currentSearchCriteriaSubject.value;
  }

  clearSortState(): void {
    this.currentSortColumnSubject.next(null);
    this.currentSortDirectionSubject.next('DESC');
    this.currentSearchCriteriaSubject.next(null);
  }

  setUniqueItems(columnKey: string, values: any[]): void {
    if (!this.uniqueItemsCache.has(columnKey)) {
      this.uniqueItemsCache.set(columnKey, new BehaviorSubject<any[]>(values));
    } else {
      this.uniqueItemsCache.get(columnKey)!.next(values);
    }
  }

  getUniqueItems$(columnKey: string): Observable<any[]> {
    if (!this.uniqueItemsCache.has(columnKey)) {
      this.uniqueItemsCache.set(columnKey, new BehaviorSubject<any[]>([]));
    }
    return this.uniqueItemsCache.get(columnKey)!.asObservable();
  }

  getUniqueItemsValue(columnKey: string): any[] {
    if (!this.uniqueItemsCache.has(columnKey)) {
      return [];
    }
    return this.uniqueItemsCache.get(columnKey)!.value;
  }

  loadUniqueItems(columnKey: keyof WorkRequestDto, searchString: string): void {
    this.loadingUniqueItems.set(true);

    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };

    this.apiService
      .getFilteredUniqueValuesOfColumn(String(columnKey), filters, 1, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            const uniqueValues = response.responseData.content;
            this.setUniqueItems(String(columnKey), uniqueValues);
            this.currentColumnUniqueItems.set(uniqueValues);
            this.loadingUniqueItems.set(false);

            const cacheKey = `${String(columnKey)}:${searchString}`;
            this.uniqueValuesCache.set(cacheKey, {
              values: uniqueValues,
              page: 1,
              hasMore: !response.responseData.last,
            });
          }
        }),
        catchError((error) => {
          console.error(`Error loading unique items for column ${String(columnKey)}:`, error);
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadMoreUniqueItems(columnKey: keyof WorkRequestDto, searchString: string): void {
    const cacheKey = `${String(columnKey)}:${searchString}`;
    const cached = this.uniqueValuesCache.get(cacheKey);
    this.loadingUniqueItems.set(true);

    if (!cached || !cached.hasMore) {
      this.loadingUniqueItems.set(false);
      return;
    }

    const nextPage = cached.page + 1;
    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };

    this.apiService
      .getFilteredUniqueValuesOfColumn(String(columnKey), filters, nextPage, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            const newValues = [...cached.values, ...response.responseData.content];
            this.setUniqueItems(String(columnKey), newValues);
            this.currentColumnUniqueItems.update(existing => [...existing, ...response.responseData.content]);
            this.loadingUniqueItems.set(false);

            this.uniqueValuesCache.set(cacheKey, {
              values: newValues,
              page: nextPage,
              hasMore: !response.responseData.last,
            });
          }
        }),
        catchError((error) => {
          console.error(`Error loading more unique items for column ${String(columnKey)}:`, error);
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  clearUniqueValuesCache(): void {
    this.uniqueValuesCache.clear();
  }

  // Form state
  formFields = signal<WorkRequestFieldName[]>([]);
  isFormOpen = signal<boolean>(false);

  openForm(fields: WorkRequestFieldName[] = []): void {
    this.formFields.set(fields);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedItem.set(null);
  }

  // ====================== Action Methods ======================

  requestMoreDetails(id: number, message?: string): void {
    this.apiService.requestMoreDetails(id, message).pipe(
      tap((response) => {
        if (response.responseData) {
          this.messageService.showSuccess('Email sent requesting more details');
          // Item will be updated via workRequestUpdated$ subscription
        }
      }),
      catchError((error) => {
        console.error('[WR State] Request more details failed:', error);
        const errorMsg = error?.error?.message || 'Failed to send request';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  cancelWorkRequest(id: number): void {
    this.apiService.cancelWorkRequest(id).pipe(
      tap((response) => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.updateWorkRequestInList(updated);
          this.messageService.showSuccess('Work request cancelled successfully');
        }
      }),
      catchError((error) => {
        console.error('[WR State] Cancel failed:', error);
        const errorMsg = error?.error?.message || 'Failed to cancel work request';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  revokeWorkRequest(id: number): void {
    this.apiService.revokeWorkRequest(id).pipe(
      tap((response) => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.updateWorkRequestInList(updated);
          this.messageService.showSuccess('Work request revoked successfully');
        }
      }),
      catchError((error) => {
        console.error('[WR State] Revoke failed:', error);
        const errorMsg = error?.error?.message || 'Failed to revoke work request';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  refreshWorkRequest(id: number, successMessage?: string): void {
    this.apiService.getWorkRequestById(id).pipe(
      tap((response) => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.updateWorkRequestInList(updated);
          if (successMessage) {
            this.messageService.showSuccess(successMessage);
          }
        }
      }),
      catchError((error) => {
        console.error('[WR State] Refresh failed:', error);
        const errorMsg = error?.error?.message || 'Failed to refresh work request';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  markAsProcessed(id: number): void {
    this.apiService.changeStatus(id, 'Processed').pipe(
      tap((response) => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.updateWorkRequestInList(updated);
          this.messageService.showSuccess('Work request marked as Processed');
        }
      }),
      catchError((error) => {
        console.error('[WR State] Mark as Processed failed:', error);
        const errorMsg = error?.error?.message || 'Failed to mark as processed';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  markAsActive(id: number): void {
    this.apiService.changeStatus(id, 'Active').pipe(
      tap((response) => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.updateWorkRequestInList(updated);
          this.messageService.showSuccess('Work request marked as Active');
        }
      }),
      catchError((error) => {
        console.error('[WR State] Mark as Active failed:', error);
        const errorMsg = error?.error?.message || 'Failed to mark as active';
        this.messageService.showError(errorMsg);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
