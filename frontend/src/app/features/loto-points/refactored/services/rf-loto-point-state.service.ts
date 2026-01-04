import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import {
  LotoPointDto,
  LotoPointFieldName,
} from '../../../../models/loto/loto-point.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LotoPointLocalStorageService } from './rf-loto-point-local-storage.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoPointStateService {
  private apiService = inject(RfLotoPointApiService);
  private localStorage = inject(LotoPointLocalStorageService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);

  private pageSize = 50;
  private currentPage = 1;

  private allLoadedLotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  allLoadedLotoPoints$ = this.allLoadedLotoPointsSubject.asObservable();

  filterOutItems = signal<LotoPointDto[]>([]);
  selectedItems = signal<LotoPointDto[]>([]);
  selectedItem = signal<LotoPointDto | null>(null);

  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  currentSortColumn$ = this.currentSortColumnSubject.asObservable();

  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>(
    'ASC'
  );
  currentSortDirection$ = this.currentSortDirectionSubject.asObservable();

  private currentSearchCriteriaSubject =
    new BehaviorSubject<SearchCriteria | null>(null);
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

  constructor() {
    // Don't auto-load drafts on service initialization
    // Drafts will be loaded by the form component's effect when appropriate
  }

  addLotoPoints(items: LotoPointDto[]): void {
    const current = this.allLoadedLotoPointsSubject.value;
    this.allLoadedLotoPointsSubject.next([...current, ...items]);
  }

  clearLotoPoints(): void {
    this.allLoadedLotoPointsSubject.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }

  setSelectedLotoPoints(items: LotoPointDto[]) {
    this.selectedItems.set(items);
  }

  setSelectedItem(item: LotoPointDto | null): void {
    // if(item && !item.equipmentList){
    //   this.fetchEquipmentList(item);
    // }
    this.selectedItem.set(item);
  }

  /**
   * Load full entity from server by ID
   * This is used when clicking on table items to get complete data
   */
  loadItemById(id: number): void {
    this.apiService
      .getLotoPointById(id+'')
      .pipe(
        tap((response) => {
          console.log('Loaded full LOTO Point from server:', response.responseData);
          this.setSelectedItem(LotoPointDto.fromJson(response.responseData));
          console.log('Converted from Json:', LotoPointDto.fromJson(response.responseData));
        }),
        catchError((error) => {
          console.error('Error loading LOTO Point:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  submitForm(item: LotoPointDto) {

    const lotoPointId = item.id;
    const isNew = !lotoPointId;

    this.apiService
      .saveLotoPoint(item)
      .pipe(
        tap((response) => {
          console.log('LOTO Point saved successfully:', response.responseData);
          // Clear the draft after successful save
          this.clearDraftForItem(lotoPointId);
          // Update the selected item with the saved data
          this.setSelectedItem(LotoPointDto.fromJson(response.responseData));
          // Show success message
          const action = isNew ? 'created' : 'updated';
          this.messageService.showSuccess(`LOTO Point ${action} successfully`);
          // Close the form
          this.closeForm();
        }),
        catchError((error) => {
          console.error('Error saving LOTO Point:', error);
          console.error('Error details:', error.error);
          console.error('Error message:', error.message);
          // Show error message
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save LOTO Point: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  openNewLotoForm() {
    // Set a new blank item - the form component's effect will check for drafts
    console.log('openNewLotoForm: Setting new blank LotoPointDto');
    this.setSelectedItem(new LotoPointDto());
  }

  saveDraft(item: LotoPointDto) {
    this.localStorage.saveDraft(item);
  }

  /**
   * Load draft for a specific loto point or new item
   * Returns the draft metadata if found
   */
  loadDraftForItem(lotoPointId: number | null = null) {
    return this.localStorage.loadDraft(lotoPointId);
  }

  /**
   * Check if draft exists for specific loto point
   */
  hasDraftForItem(lotoPointId: number | null = null): boolean {
    return this.localStorage.hasDraft(lotoPointId);
  }

  /**
   * Clear draft for specific loto point
   */
  clearDraftForItem(lotoPointId: number | null = null): void {
    this.localStorage.clearDraft(lotoPointId);
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
  loadUniqueItems(columnKey: keyof LotoPointDto, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    this.loadingUniqueItems.set(true);

    // Check if we have cached results for this column and search term
    const cached = this.uniqueValuesCache.get(cacheKey);
    // if (cached) {
    //   this.setUniqueItems(String(columnKey), cached.values);
    //   return;
    // }

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
    columnKey: keyof LotoPointDto,
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
   * Handle form
   */

  formFields = signal<LotoPointFieldName[]>([]);
  isLotoPointFormOpen = signal<boolean>(false);
  openForm(fields: LotoPointFieldName[] = []): void {
    this.formFields.set(fields);
    this.isLotoPointFormOpen.set(true);
  }

  closeForm(): void {
    this.isLotoPointFormOpen.set(false);
    this.selectedItem.set(null);
  }
}
