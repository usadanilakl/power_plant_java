import { Injectable, inject, DestroyRef, signal, NgZone } from '@angular/core';
import {
  LotoStandardDto,
  LotoStandardFieldName,
} from '../../../../models/loto/loto-standard.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { RfLotoStandardApiService } from './rf-loto-standard-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LotoStandardLocalStorageService } from './rf-loto-standard-local-storage.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { SyncUpdateService, EntityUpdateEvent } from '../../../../services/sync/sync-update.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardStateService {
  private apiService = inject(RfLotoStandardApiService);
  private localStorage = inject(LotoStandardLocalStorageService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private syncUpdateService = inject(SyncUpdateService);
  private ngZone = inject(NgZone);

  private pageSize = 50;
  private currentPage = 1;

  private allLoadedLotoStandardsSubject = new BehaviorSubject<LotoStandardDto[]>([]);
  allLoadedLotoStandards$ = this.allLoadedLotoStandardsSubject.asObservable();

  filterOutItems = signal<LotoStandardDto[]>([]);
  selectedItems = signal<LotoStandardDto[]>([]);
  selectedItem = signal<LotoStandardDto | null>(null);

  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  currentSortColumn$ = this.currentSortColumnSubject.asObservable();

  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>('ASC');
  currentSortDirection$ = this.currentSortDirectionSubject.asObservable();

  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  currentSearchCriteria$ = this.currentSearchCriteriaSubject.asObservable();

  // Unique items cache for column filters
  private uniqueItemsCache = new Map<string, BehaviorSubject<any[]>>();

  // Unique values cache with pagination metadata
  private uniqueValuesCache = new Map<
    string,
    { values: string[]; page: number; hasMore: boolean }
  >();
  currentColumnUniqueItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);

  // Form state
  formFields = signal<LotoStandardFieldName[]>([]);
  isLotoStandardFormOpen = signal<boolean>(false);

  constructor() {
    // Don't auto-load drafts on service initialization
    // Drafts will be loaded by the form component's effect when appropriate

    // Subscribe to SSE sync updates for real-time reactivity
    this.syncUpdateService.getEntityTypeUpdates$('LotoStandard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.handleSyncUpdate(event);
      });
  }

  /**
   * Handle sync update from SSE - reload the entity from server
   * This is called when a LotoStandard is updated by server sync
   */
  private handleSyncUpdate(event: EntityUpdateEvent): void {
    const entityId = event.entityId;

    // Reload the entity from server to get fresh data
    this.apiService.getLotoStandardById(entityId + '')
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedItem = LotoStandardDto.fromJson(response.responseData);
            this.updateLotoStandardInList(updatedItem);

            // Show a notification if the currently selected item was updated
            const selectedItem = this.selectedItem();
            if (selectedItem?.id === entityId) {
              this.messageService.showInfo('This LOTO standard was updated from another machine');
            }
          }
        }),
        catchError((error) => {
          console.error('Error reloading synced LOTO standard:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Update a LOTO standard in the local list or add it if not present.
   * Called automatically when an update event is received.
   */
  updateLotoStandardInList(updatedItem: LotoStandardDto): void {
    if (!updatedItem.id) {
      return;
    }

    // Ensure we run inside Angular zone for proper change detection
    this.ngZone.run(() => {
      const current = this.allLoadedLotoStandardsSubject.value;
      const index = current.findIndex(ls => ls.id === updatedItem.id);

      if (index >= 0) {
        // Update existing item in the list - create new array with new object
        const updated = [...current];
        // Add a version marker to force cdkVirtualFor to re-render
        (updatedItem as any)._version = Date.now();
        updated[index] = updatedItem;
        this.allLoadedLotoStandardsSubject.next(updated);
      } else {
        // Item not in current list - add it at the beginning
        (updatedItem as any)._version = Date.now();
        this.allLoadedLotoStandardsSubject.next([updatedItem, ...current]);
      }

      // Also update selectedItem if it's the same one being edited
      const selectedItem = this.selectedItem();
      if (selectedItem?.id === updatedItem.id) {
        this.selectedItem.set(updatedItem);
      }

      // Also update in selectedItems array if present
      const selectedItems = this.selectedItems();
      const selectedIndex = selectedItems.findIndex(item => item.id === updatedItem.id);
      if (selectedIndex >= 0) {
        const updatedSelected = [...selectedItems];
        updatedSelected[selectedIndex] = updatedItem;
        this.selectedItems.set(updatedSelected);
      }
    });
  }

  /**
   * Remove a LOTO standard from the local list by ID.
   * Called automatically when a deletion event is received.
   */
  removeLotoStandardById(id: number): void {
    const current = this.allLoadedLotoStandardsSubject.value;
    const filtered = current.filter(ls => ls.id !== id);

    // Only update if something was actually removed
    if (filtered.length !== current.length) {
      this.allLoadedLotoStandardsSubject.next(filtered);

      // Also clear selected item if it was the deleted one
      const selectedItem = this.selectedItem();
      if (selectedItem?.id === id) {
        this.selectedItem.set(null);
      }

      // Also remove from selectedItems array
      const selectedItems = this.selectedItems();
      if (selectedItems.some(item => item.id === id)) {
        this.selectedItems.set(selectedItems.filter(item => item.id !== id));
      }
    }
  }

  addLotoStandards(items: LotoStandardDto[]): void {
    const current = this.allLoadedLotoStandardsSubject.value;
    this.allLoadedLotoStandardsSubject.next([...current, ...items]);
  }

  clearLotoStandards(): void {
    this.allLoadedLotoStandardsSubject.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }

  setSelectedLotoStandards(items: LotoStandardDto[]) {
    this.selectedItems.set(items);
  }

  setSelectedItem(item: LotoStandardDto | null): void {
    this.selectedItem.set(item);
  }

  /**
   * Load full entity from server by ID
   * This is used when clicking on table items to get complete data
   */
  loadItemById(id: number): void {
    this.apiService
      .getLotoStandardById(id + '')
      .pipe(
        tap((response) => {
          this.setSelectedItem(LotoStandardDto.fromJson(response.responseData));
          // Open form after loading the item
          this.openForm();
        }),
        catchError((error) => {
          console.error('Error loading LOTO Standard:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  submitForm(item: LotoStandardDto) {
    const lotoStandardId = item.id;
    const isNew = !lotoStandardId;

    this.apiService
      .saveLotoStandard(item)
      .pipe(
        tap((response) => {
          // Clear the draft after successful save
          this.clearDraftForItem(lotoStandardId);
          // Update the selected item with the saved data
          this.setSelectedItem(LotoStandardDto.fromJson(response.responseData));
          // Show success message
          const action = isNew ? 'created' : 'updated';
          this.messageService.showSuccess(`LOTO Standard ${action} successfully`);
          // Close the form
          this.closeForm();
        }),
        catchError((error) => {
          console.error('Error saving LOTO Standard:', error);
          console.error('Error details:', error.error);
          console.error('Error message:', error.message);
          // Show error message
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save LOTO Standard: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  openNewLotoStandardForm() {
    // Set a new blank item - the form component's effect will check for drafts
    this.setSelectedItem(new LotoStandardDto());
  }

  saveDraft(item: LotoStandardDto) {
    this.localStorage.saveDraft(item);
  }

  /**
   * Load draft for a specific loto standard or new item
   * Returns the draft metadata if found
   */
  loadDraftForItem(lotoStandardId: number | null = null) {
    return this.localStorage.loadDraft(lotoStandardId);
  }

  /**
   * Check if draft exists for specific loto standard
   */
  hasDraftForItem(lotoStandardId: number | null = null): boolean {
    return this.localStorage.hasDraft(lotoStandardId);
  }

  /**
   * Clear draft for specific loto standard
   */
  clearDraftForItem(lotoStandardId: number | null = null): void {
    this.localStorage.clearDraft(lotoStandardId);
  }

  resetPage() {
    this.currentPage = 1;
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
    this.currentSortDirectionSubject.next('ASC');
    this.currentSearchCriteriaSubject.next(null);
  }

  /**
   * Set unique items for a specific column
   */
  setUniqueItems(columnKey: string, values: any[]): void {
    if (!this.uniqueItemsCache.has(columnKey)) {
      this.uniqueItemsCache.set(columnKey, new BehaviorSubject<any[]>(values));
    } else {
      const subject = this.uniqueItemsCache.get(columnKey)!;
      subject.next(values);
    }
  }

  /**
   * Get unique items observable for a specific column
   */
  getUniqueItems$(columnKey: string): Observable<any[]> {
    if (!this.uniqueItemsCache.has(columnKey)) {
      this.uniqueItemsCache.set(columnKey, new BehaviorSubject<any[]>([]));
    }
    return this.uniqueItemsCache.get(columnKey)!.asObservable();
  }

  /**
   * Get unique items value for a specific column
   */
  getUniqueItemsValue(columnKey: string): any[] {
    if (!this.uniqueItemsCache.has(columnKey)) {
      return [];
    }
    return this.uniqueItemsCache.get(columnKey)!.value;
  }

  /**
   * Clear unique items cache for a specific column
   */
  clearUniqueItemsForColumn(columnKey: string): void {
    if (this.uniqueItemsCache.has(columnKey)) {
      this.uniqueItemsCache.get(columnKey)!.next([]);
    }
  }

  /**
   * Clear all unique items cache
   */
  clearAllUniqueItems(): void {
    this.uniqueItemsCache.forEach((subject) => subject.next([]));
    this.uniqueItemsCache.clear();
  }

  /**
   * Load unique items for a column with server-side filtering and pagination
   */
  loadUniqueItems(columnKey: keyof LotoStandardDto, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    this.loadingUniqueItems.set(true);

    const filters = this.getCurrentSearchCriteria() ?? {
      type: 'column',
      filters: {},
    };

    // Fetch from server with pagination
    this.apiService
      .getFilteredUniqueValuesOfColumn(String(columnKey), filters, 1, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            const uniqueValues = response.responseData.content;
            this.setUniqueItems(String(columnKey), uniqueValues);
            this.currentColumnUniqueItems.set(uniqueValues);
            this.loadingUniqueItems.set(false);

            // Cache the results
            this.uniqueValuesCache.set(cacheKey, {
              values: uniqueValues,
              page: 1,
              hasMore: !response.responseData.last,
            });
          }
        }),
        catchError((error) => {
          console.error(
            `Error loading unique items for column ${columnKey}:`,
            error
          );
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Load more unique items for a column (pagination)
   */
  loadMoreUniqueItems(
    columnKey: keyof LotoStandardDto,
    searchString: string
  ): void {
    const cacheKey = `${columnKey}:${searchString}`;
    const cached = this.uniqueValuesCache.get(cacheKey);
    this.loadingUniqueItems.set(true);

    if (!cached || !cached.hasMore) {
      this.loadingUniqueItems.set(false);
      return; // No more items to load
    }

    const nextPage = cached.page + 1;
    const filters = this.getCurrentSearchCriteria() ?? {
      type: 'column',
      filters: {},
    };

    this.apiService
      .getFilteredUniqueValuesOfColumn(String(columnKey), filters, nextPage, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            const currentValues = cached.values;
            const uniqueValues = response.responseData.content;
            const newValues = [...currentValues, ...uniqueValues];

            this.setUniqueItems(String(columnKey), newValues);
            this.currentColumnUniqueItems.update((existing) => [
              ...existing,
              ...newValues,
            ]);
            this.loadingUniqueItems.set(false);

            // Update cache with new values and page
            this.uniqueValuesCache.set(cacheKey, {
              values: newValues,
              page: nextPage,
              hasMore: !response.responseData.last,
            });
          }
        }),
        catchError((error) => {
          console.error(
            `Error loading more unique items for column ${columnKey}:`,
            error
          );
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Clear unique values cache (useful when data changes)
   */
  clearUniqueValuesCache(): void {
    this.uniqueValuesCache.clear();
  }

  /**
   * Open form with specified fields
   */
  openForm(fields: LotoStandardFieldName[] = []): void {
    this.formFields.set(fields);
    this.isLotoStandardFormOpen.set(true);
  }

  /**
   * Close form and clear selected item
   */
  closeForm(): void {
    this.isLotoStandardFormOpen.set(false);
    this.selectedItem.set(null);
  }
}
