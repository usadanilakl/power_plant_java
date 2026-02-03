import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { CommentDto } from '../../../models/base/comment.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { LogApiService } from './log-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogStateService {
  private apiService = inject(LogApiService);
  private destroyRef = inject(DestroyRef);

  private pageSize = 50;
  private currentPage = 1;

  private allLoadedItemsSubject = new BehaviorSubject<CommentDto[]>([]);
  allLoadedItems$ = this.allLoadedItemsSubject.asObservable();

  private currentSearchCriteriaSubject =
    new BehaviorSubject<SearchCriteria | null>(null);

  // Unique values cache with pagination metadata
  private uniqueValuesCache = new Map<
    string,
    { values: string[]; page: number; hasMore: boolean }
  >();
  currentColumnUniqueItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);

  addItems(items: CommentDto[]): void {
    const current = this.allLoadedItemsSubject.value;
    this.allLoadedItemsSubject.next([...current, ...items]);
  }

  clearItems(): void {
    this.allLoadedItemsSubject.next([]);
    this.currentPage = 1;
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

  setSearchCriteria(criteria: SearchCriteria): void {
    this.currentSearchCriteriaSubject.next(criteria);
  }

  getCurrentSearchCriteria(): SearchCriteria | null {
    return this.currentSearchCriteriaSubject.value;
  }

  clearSearchCriteria(): void {
    this.currentSearchCriteriaSubject.next(null);
  }

  /**
   * Load unique items for a column with server-side filtering and pagination
   */
  loadUniqueItems(columnKey: string, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    this.loadingUniqueItems.set(true);

    const filters = this.getCurrentSearchCriteria() ?? {
      type: 'column',
      filters: {},
    };

    this.apiService
      .getFilteredUniqueValuesOfColumn(columnKey, filters, 1, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            const uniqueValues = response.responseData.content;
            this.currentColumnUniqueItems.set(uniqueValues);
            this.loadingUniqueItems.set(false);

            this.uniqueValuesCache.set(cacheKey, {
              values: uniqueValues,
              page: 1,
              hasMore: !response.responseData.last,
            });
          } else {
            this.currentColumnUniqueItems.set([]);
            this.loadingUniqueItems.set(false);
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
    columnKey: string,
    searchString: string
  ): void {
    const cacheKey = `${columnKey}:${searchString}`;
    const cached = this.uniqueValuesCache.get(cacheKey);
    this.loadingUniqueItems.set(true);

    if (!cached || !cached.hasMore) {
      this.loadingUniqueItems.set(false);
      return;
    }

    const nextPage = cached.page + 1;
    const filters = this.getCurrentSearchCriteria() ?? {
      type: 'column',
      filters: {},
    };

    this.apiService
      .getFilteredUniqueValuesOfColumn(columnKey, filters, nextPage, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            const currentValues = cached.values;
            const uniqueValues = response.responseData.content;
            const newValues = [...currentValues, ...uniqueValues];

            this.currentColumnUniqueItems.update((existing) => [
              ...existing,
              ...newValues,
            ]);
            this.loadingUniqueItems.set(false);

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

  clearUniqueValuesCache(): void {
    this.uniqueValuesCache.clear();
  }
}
