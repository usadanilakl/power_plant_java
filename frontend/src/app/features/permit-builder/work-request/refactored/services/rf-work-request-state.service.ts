import { Injectable, inject, DestroyRef, signal, NgZone } from '@angular/core';
import { WorkRequestDto, WorkRequestFieldName } from '../../../../../models/permits/work-request.model';
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
    this.allLoadedWorkRequestsSubject.next([...current, ...items]);
  }

  clearWorkRequests(): void {
    this.allLoadedWorkRequestsSubject.next([]);
    this.currentPage = 1;
  }

  reloadData(): void {
    this.clearWorkRequests();
    const criteria = this.getCurrentSearchCriteria();
    const hasActiveState = criteria && (
      criteria.query ||
      criteria.sortColumn ||
      (criteria.filters && Object.keys(criteria.filters).length > 0)
    );
    if (hasActiveState) {
      this.apiService.searchWorkRequests({ ...criteria, page: 1, pageSize: this.pageSize }, this.pageSize).pipe(
        tap(response => {
          if (response.responseData?.content?.length) {
            this.addWorkRequests(response.responseData.content);
            this.incrementPage();
          }
        }),
        catchError(error => {
          console.error('Error reloading work requests:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    } else {
      this.apiService.getWorkRequests(1, this.pageSize).pipe(
        tap(response => {
          if (response.responseData?.content?.length) {
            this.addWorkRequests(response.responseData.content);
            this.incrementPage();
          }
        }),
        catchError(error => {
          console.error('Error reloading work requests:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    }
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
          (updatedItem as any)._version = Date.now();
          this.allLoadedWorkRequestsSubject.next([updatedItem, ...current]);
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

  openNewWorkRequestForm(): void {
    this.setSelectedItem(new WorkRequestDto());
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
