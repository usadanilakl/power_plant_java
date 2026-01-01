import { Injectable, inject, DestroyRef, signal } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardStateService {
  private apiService = inject(RfLotoStandardApiService);
  private localStorage = inject(LotoStandardLocalStorageService);
  private destroyRef = inject(DestroyRef);

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
    console.log('Setting selected items:', items);
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
          console.log('Loaded full LOTO Standard from server:', response.responseData);
          this.setSelectedItem(LotoStandardDto.fromJson(response.responseData));
          console.log('Converted from Json:', LotoStandardDto.fromJson(response.responseData));
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
    console.log('Submitting LOTO Standard:', item);
    console.log('Item has toIdDto?', typeof (item as any).toIdDto === 'function');
    if (typeof (item as any).toIdDto === 'function') {
      console.log('Converted to IdDto:', item.toIdDto());
    }

    const lotoStandardId = item.id;

    this.apiService
      .saveLotoStandard(item)
      .pipe(
        tap((response) => {
          console.log('LOTO Standard saved successfully:', response.responseData);
          // Clear the draft after successful save
          this.clearDraftForItem(lotoStandardId);
          // Update the selected item with the saved data
          this.setSelectedItem(LotoStandardDto.fromJson(response.responseData));
          // Optionally close the form
          // this.closeForm();
        }),
        catchError((error) => {
          console.error('Error saving LOTO Standard:', error);
          console.error('Error details:', error.error);
          console.error('Error message:', error.message);
          // Handle error (could emit to a global error service)
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  openNewLotoStandardForm() {
    // Set a new blank item - the form component's effect will check for drafts
    console.log('openNewLotoStandardForm: Setting new blank LotoStandardDto');
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
