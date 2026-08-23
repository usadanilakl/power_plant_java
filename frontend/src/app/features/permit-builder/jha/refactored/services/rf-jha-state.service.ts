import { Injectable, inject, DestroyRef, signal, NgZone } from '@angular/core';
import { JhaDto, JhaFieldName } from '../../../../../models/permits/jha.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
import { RfJhaApiService } from './rf-jha-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { SyncUpdateService, EntityUpdateEvent } from '../../../../../services/sync/sync-update.service';
import { PrintableFormDto } from '../../../../../models/forms/printable-form.model';
import { PrintableFormService } from '../../../../../services/forms/printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { COLUMN_OPTION_FETCH_SIZE } from '../../../../../shared/table/refactored/models/table.types';

@Injectable({
  providedIn: 'root',
})
export class RfJhaStateService {
  private apiService = inject(RfJhaApiService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private syncUpdateService = inject(SyncUpdateService);
  private ngZone = inject(NgZone);
  private printableFormService = inject(PrintableFormService);

  private pageSize = 50;
  private currentPage = 1;

  private allLoadedJhasSubject = new BehaviorSubject<JhaDto[]>([]);
  allLoadedJhas$ = this.allLoadedJhasSubject.asObservable();

  selectedItems = signal<JhaDto[]>([]);
  selectedItem = signal<JhaDto | null>(null);

  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>('DESC');
  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);

  private uniqueItemsCache = new Map<string, BehaviorSubject<any[]>>();
  private uniqueValuesCache = new Map<string, { values: string[]; page: number; hasMore: boolean }>();
  currentColumnUniqueItems = signal<string[]>([]);
  /**
   * Every value the focused column has, IGNORING the active filters. Feeds the
   * dropdown's "not in current view" section, so each column's list splits the
   * same way no matter what is filtered.
   */
  currentColumnAllItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);

  isPaperViewActive = signal<boolean>(false);
  private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
  paperForm$ = this.paperFormSubject.asObservable();

  constructor() {
    this.apiService.jhaDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedId) => this.removeJhaById(deletedId));

    this.apiService.jhaUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedItem) => this.updateJhaInList(updatedItem));

    this.syncUpdateService.getEntityTypeUpdates$('Jha')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.handleSyncUpdate(event));

    // Refetch on SSE reconnect. SSE is at-most-once — any Jha broadcast
    // that landed during the abort window is dropped. reloadData() is
    // already the "re-fetch page 1 of JHAs" path used elsewhere, and
    // updateJhaInList (which it calls under the hood) preserves the
    // currently open item.
    this.syncUpdateService.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadData());

    this.loadPaperForm();
  }

  private loadPaperForm(): void {
    this.printableFormService.getPrimaryFormByType('Jha').pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        console.error('Error loading JHA paper form:', err);
        return of(null);
      })
    ).subscribe(response => {
      if (response && response.responseData) {
        this.paperFormSubject.next(response.responseData);
      }
    });
  }

  private handleSyncUpdate(event: EntityUpdateEvent): void {
    this.apiService.getJhaById(event.entityId)
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedItem = JhaDto.fromJson(response.responseData);
            this.updateJhaInList(updatedItem);
            if (this.selectedItem()?.id === event.entityId) {
              this.messageService.showInfo('This JHA was updated from another machine');
            }
          }
        }),
        catchError((error) => { console.error('Error reloading synced JHA:', error); return of(null); }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  addJhas(items: JhaDto[]): void {
    const current = this.allLoadedJhasSubject.value;
    this.allLoadedJhasSubject.next([...current, ...items]);
  }

  clearJhas(): void {
    this.allLoadedJhasSubject.next([]);
    this.currentPage = 1;
  }

  reloadData(): void {
    this.clearJhas();
    const criteria = this.getCurrentSearchCriteria();
    if (criteria && (criteria.query || (criteria.filters && Object.keys(criteria.filters).length > 0))) {
      this.apiService.searchJhas({ ...criteria, page: 1, pageSize: this.pageSize }, this.pageSize).pipe(
        tap(response => {
          if (response.responseData?.content?.length) {
            this.addJhas(response.responseData.content);
            this.incrementPage();
          }
        }),
        catchError(error => {
          console.error('Error reloading JHAs:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    } else {
      this.apiService.getJhas(1, this.pageSize).pipe(
        tap(response => {
          if (response.responseData?.content?.length) {
            this.addJhas(response.responseData.content);
            this.incrementPage();
          }
        }),
        catchError(error => {
          console.error('Error reloading JHAs:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    }
  }

  updateJhaInList(updatedItem: JhaDto): void {
    if (!updatedItem.id) return;
    this.ngZone.run(() => {
      const current = this.allLoadedJhasSubject.value;
      const index = current.findIndex(j => j.id === updatedItem.id);
      (updatedItem as any)._version = Date.now();
      if (index >= 0) {
        const updated = [...current];
        updated[index] = updatedItem;
        this.allLoadedJhasSubject.next(updated);
      } else {
        this.allLoadedJhasSubject.next([updatedItem, ...current]);
      }
      if (this.selectedItem()?.id === updatedItem.id) this.selectedItem.set(updatedItem);
      const selectedItems = this.selectedItems();
      const si = selectedItems.findIndex(item => item.id === updatedItem.id);
      if (si >= 0) {
        const us = [...selectedItems];
        us[si] = updatedItem;
        this.selectedItems.set(us);
      }
    });
  }

  removeJhaById(id: number): void {
    const current = this.allLoadedJhasSubject.value;
    const filtered = current.filter(j => j.id !== id);
    if (filtered.length !== current.length) {
      this.allLoadedJhasSubject.next(filtered);
      if (this.selectedItem()?.id === id) this.selectedItem.set(null);
      const selectedItems = this.selectedItems();
      if (selectedItems.some(item => item.id === id)) {
        this.selectedItems.set(selectedItems.filter(item => item.id !== id));
      }
    }
  }

  getCurrentPage(): number { return this.currentPage; }
  incrementPage(): void { this.currentPage++; }
  resetPage(): void { this.currentPage = 1; }

  setSelectedItem(item: JhaDto | null): void { this.selectedItem.set(item); }

  loadItemById(id: number): void {
    this.apiService.getJhaById(id)
      .pipe(
        tap((response) => this.setSelectedItem(JhaDto.fromJson(response.responseData))),
        catchError((error) => { console.error('Error loading JHA:', error); return of(null); }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  submitForm(item: JhaDto): void {
    const isNew = !item.id;
    this.apiService.saveJha(item)
      .pipe(
        tap((response) => {
          this.setSelectedItem(JhaDto.fromJson(response.responseData));
          this.messageService.showSuccess(`JHA ${isNew ? 'created' : 'updated'} successfully`);
          this.closeForm();
        }),
        catchError((error) => {
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save JHA: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  openNewJhaForm(): void { this.setSelectedItem(new JhaDto()); }

  setSearchCriteria(criteria: SearchCriteria): void { this.currentSearchCriteriaSubject.next(criteria); }
  getCurrentSearchCriteria(): SearchCriteria | null { return this.currentSearchCriteriaSubject.value; }

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

  loadUniqueItems(columnKey: keyof JhaDto, searchString: string): void {
    this.loadingUniqueItems.set(true);
    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };
    this.loadAllUniqueItems(columnKey, searchString);

    this.apiService.getFilteredUniqueValuesOfColumn(String(columnKey), filters, 1, COLUMN_OPTION_FETCH_SIZE)
      .pipe(
        tap((response) => {
          // An EMPTY result is a valid answer: publish it. Holding the previous column's
          // values left them mislabelled "In current view" and, because the second
          // section is (all - inView), swallowed the entries it exists to show. It also
          // left loadingUniqueItems stuck true, which permanently blocks option paging.
          const uniqueValues = response.responseData?.content ?? [];
          this.setUniqueItems(String(columnKey), uniqueValues);
          this.currentColumnUniqueItems.set(uniqueValues);
          this.loadingUniqueItems.set(false);
          this.uniqueValuesCache.set(`${String(columnKey)}:${searchString}`, {
            values: uniqueValues, page: 1, hasMore: !response.responseData?.last,
          });
        }),
        catchError((error) => { this.loadingUniqueItems.set(false); return of(null); }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  /**
   * The same lookup with NO column filters applied — the column's full value set.
   * Subtracting the filtered list from this gives the values the current filters
   * are hiding, which is what the dropdown's "not in current view" section shows,
   * so every column splits the same way. Paged like the filtered call, so a huge
   * column stays cheap; the typed term still narrows it server-side.
   */
  private loadAllUniqueItems(columnKey: keyof JhaDto, searchString: string): void {
    const criteria: SearchCriteria = {
      type: 'column',
      filters: searchString && searchString.trim() !== ''
        ? { [String(columnKey)]: searchString }
        : {},
    };

    this.apiService.getFilteredUniqueValuesOfColumn(String(columnKey), criteria, 1, COLUMN_OPTION_FETCH_SIZE)
      .pipe(
        tap((response) => {
          this.currentColumnAllItems.set(response.responseData?.content ?? []);
        }),
        catchError((error) => {
          console.error(`Error loading all unique items for ${String(columnKey)}:`, error);
          this.currentColumnAllItems.set([]);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  loadMoreUniqueItems(columnKey: keyof JhaDto, searchString: string): void {
    const cacheKey = `${String(columnKey)}:${searchString}`;
    const cached = this.uniqueValuesCache.get(cacheKey);
    this.loadingUniqueItems.set(true);
    if (!cached || !cached.hasMore) { this.loadingUniqueItems.set(false); return; }

    const nextPage = cached.page + 1;
    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };

    this.apiService.getFilteredUniqueValuesOfColumn(String(columnKey), filters, nextPage, COLUMN_OPTION_FETCH_SIZE)
      .pipe(
        tap((response) => {
          if (response.responseData?.content?.length > 0) {
            const newValues = [...cached.values, ...response.responseData.content];
            this.setUniqueItems(String(columnKey), newValues);
            this.currentColumnUniqueItems.update(existing => [...existing, ...response.responseData.content]);
            this.loadingUniqueItems.set(false);
            this.uniqueValuesCache.set(cacheKey, { values: newValues, page: nextPage, hasMore: !response.responseData.last });
          }
        }),
        catchError((error) => { this.loadingUniqueItems.set(false); return of(null); }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
  }

  clearUniqueValuesCache(): void { this.uniqueValuesCache.clear(); }

  formFields = signal<JhaFieldName[]>([]);
  isFormOpen = signal<boolean>(false);

  openForm(fields: JhaFieldName[] = []): void {
    this.formFields.set(fields);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedItem.set(null);
  }

  switchFormView(): void {
    this.isPaperViewActive.set(!this.isPaperViewActive());
  }
}
