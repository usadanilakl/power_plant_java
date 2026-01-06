
import { Injectable, inject, DestroyRef, signal } from "@angular/core";
import { FileDto } from "../../../../models/file/file.model";
import { BehaviorSubject, Observable } from "rxjs";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { tap, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { RfFormField } from "../../../../models/ui/form-field.model";
import { RfFileApiService } from "./rf-file-api.service";
import { FileLocalStorageService } from "./rf-file-local-storage.service";
import { GlobalMessageService } from "../../../../shared/global-message/global-message.service";
import { CurrentFileService } from "../../../../services/current-file.service";

@Injectable({
  providedIn: 'root'
})
export class RfFileStateService {
  private apiService = inject(RfFileApiService);
  private localStorage = inject(FileLocalStorageService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private currentFileService = inject(CurrentFileService);

  private pageSize = 50;
  private currentPage = 1;
  
  allLoadedFilesSubject = new BehaviorSubject<FileDto[]>([]);
  allLoadedFiles$ = this.allLoadedFilesSubject.asObservable();

  filterOutItems = signal<FileDto[]>([]);
  selectedItems = signal<FileDto[]>([]);
  selectedItem = signal<FileDto | null>(null);
  
  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  currentSortColumn$ = this.currentSortColumnSubject.asObservable();

  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>('ASC');
  currentSortDirection$ = this.currentSortDirectionSubject.asObservable();

  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  currentSearchCriteria$ = this.currentSearchCriteriaSubject.asObservable();

  // Unique items cache for column filters
  private uniqueItemsCache = new Map<string, BehaviorSubject<any[]>>();
  
  // Unique values cache with pagination metadata
  private uniqueValuesCache = new Map<string, { values: string[]; page: number; hasMore: boolean }>();
  currentColumnUniqueItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);

  constructor() {
    this.loadFromLocalStorage();
  }

  addFiles(items: FileDto[]): void {
    const current = this.allLoadedFilesSubject.value;
    this.allLoadedFilesSubject.next([...current, ...items]);
  }

  /**
   * Update or add a file in the loaded files list
   * If the file exists (by id), it will be updated; otherwise, it will be added to the beginning
   * Also notifies CurrentFileService to update the left menu
   */
  updateOrAddFile(file: FileDto): void {
    const current = this.allLoadedFilesSubject.value;
    const existingIndex = current.findIndex(f => f.id === file.id);

    if (existingIndex !== -1) {
      // Update existing file
      const updated = [...current];
      updated[existingIndex] = file;
      this.allLoadedFilesSubject.next(updated);
    } else {
      // Add new file to the beginning
      this.allLoadedFilesSubject.next([file, ...current]);
    }

    // Notify CurrentFileService to update the left menu
    // Use saveFile method which handles updating the file map and triggering filesUpdated$
    this.notifyFileUpdate(file);
  }

  /**
   * Notify CurrentFileService about file updates so the left menu refreshes
   */
  private notifyFileUpdate(file: FileDto): void {
    // Update the file map in CurrentFileService
    // This triggers filesUpdated$ which the left menu listens to
    const fileTypeName = file.fileType?.name ?? '';
    if (fileTypeName) {
      this.currentFileService.updateMapByType(fileTypeName, file);
    }
  }

  clearFiles(): void {
    this.allLoadedFilesSubject.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }

  setSelectedFiles(items: FileDto[]): void {
    this.selectedItems.set(items);
  }

  setSelectedItem(item: FileDto | null): void {
    this.selectedItem.set(item);
  }

  submitForm(item: FileDto): void {
    const fileId = item.id;
    const isNew = !fileId;

    // Set processing state
    this.isProcessing.set(true);
    this.processingMessage.set(isNew ? 'Creating file...' : 'Updating file...');

    const saveObs = isNew
      ? this.apiService.createFile(item)
      : this.apiService.updateFile(item);

    saveObs
      .pipe(
        tap((response) => {
          // Clear the draft after successful save
          this.clearDraftForItem(fileId || null);
          // Create the updated file DTO
          const savedFile = new FileDto(response.responseData);
          // Update the selected item with the saved data
          this.setSelectedItem(savedFile);
          // Update the files list so the left menu reflects the changes
          this.updateOrAddFile(savedFile);
          // Show success message
          const action = isNew ? 'created' : 'updated';
          this.messageService.showSuccess(`File ${action} successfully`);
          // Close the form (this also clears processing state)
          this.closeForm();
        }),
        catchError((error) => {
          console.error('Error saving File:', error);
          // Clear processing state on error
          this.isProcessing.set(false);
          this.processingMessage.set('');
          // Show error message
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save File: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  submitFormWithFile(item: Partial<FileDto>, file: File, overrideFile: string): void {
    const fileId = item.id || null;
    const isNew = !fileId;

    // Set processing state
    this.isProcessing.set(true);
    this.processingMessage.set(isNew ? 'Uploading file...' : 'Updating file...');

    const formData = new FormData();

    // Append the file
    formData.append('file', file);

    // Append the FileDto as JSON blob
    const fileDto = new FileDto(item);
    formData.append('fileDto', new Blob([JSON.stringify(fileDto.toIdModel())], {
      type: 'application/json'
    }));

    // Append the override/revision flag
    formData.append('overrideFile', overrideFile);

    this.apiService.uploadFile(formData)
      .pipe(
        tap((response) => {
          // Clear the draft after successful save
          this.clearDraftForItem(fileId);
          // Create the saved file DTO
          const savedFile = new FileDto(response.responseData);
          this.setSelectedItem(savedFile);
          // Update the files list so the left menu reflects the changes
          this.updateOrAddFile(savedFile);
          this.messageService.showSuccess('File uploaded successfully');
          // Close the form (this also clears processing state)
          this.closeForm();
        }),
        catchError((error) => {
          console.error('Error uploading file:', error);
          // Clear processing state on error
          this.isProcessing.set(false);
          this.processingMessage.set('');
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to upload file: ${errorMsg}`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  saveDraft(item: FileDto): void {
    this.localStorage.saveDraft(item);
  }

  /**
   * Load draft for a specific file or new item
   * Returns the draft metadata if found
   */
  loadDraftForItem(fileId: number | null = null) {
    return this.localStorage.loadDraft(fileId);
  }

  /**
   * Check if draft exists for specific file
   */
  hasDraftForItem(fileId: number | null = null): boolean {
    return this.localStorage.hasDraft(fileId);
  }

  /**
   * Clear draft for specific file
   */
  clearDraftForItem(fileId: number | null = null): void {
    this.localStorage.clearDraft(fileId);
  }

  loadFromLocalStorage(): void {
    // This is now handled by the form component's effect
    // that checks for drafts when entity changes
  }

  resetPage(): void {
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
    this.uniqueItemsCache.forEach(subject => subject.next([]));
    this.uniqueItemsCache.clear();
  }

  /**
   * Load unique items for a column with server-side filtering and pagination
   */
  loadUniqueItems(columnKey: keyof FileDto, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    this.loadingUniqueItems.set(true);
    
    // Check if we have cached results for this column and search term
    const cached = this.uniqueValuesCache.get(cacheKey);
    // if (cached) {
    //   this.setUniqueItems(String(columnKey), cached.values);
    //   return;
    // }

    const filters = this.getCurrentSearchCriteria() ?? { type: 'column', filters: {} };

    // Fetch from server with pagination
    this.apiService
      .getFilteredUniqueValuesOfColumn(
        String(columnKey),
        filters,
        1,
        50
      )
      .pipe(
        tap(response => {
          if (response.responseData?.content && response.responseData.content.length > 0) {
            const uniqueValues = response.responseData.content;
            this.setUniqueItems(String(columnKey), uniqueValues);
            this.currentColumnUniqueItems.set(uniqueValues);
            this.loadingUniqueItems.set(false);
            
            // Cache the results
            this.uniqueValuesCache.set(cacheKey, {
              values: uniqueValues,
              page: 1,
              hasMore: !response.responseData.last
            });
          }
        }),
        catchError(error => {
          console.error(`Error loading unique items for column ${columnKey}:`, error);
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
  loadMoreUniqueItems(columnKey: keyof FileDto, searchString: string): void {
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
      .getFilteredUniqueValuesOfColumn(
        String(columnKey),
        filters,
        nextPage,
        50
      )
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
  formFields = signal<RfFormField[]>([]);
  isFileFormOpen = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  processingMessage = signal<string>('');

  openForm(fields: RfFormField[] = []): void {
    this.formFields.set(fields);
    this.isFileFormOpen.set(true);
  }

  closeForm(): void {
    this.isFileFormOpen.set(false);
    this.selectedItem.set(null);
    this.isProcessing.set(false);
    this.processingMessage.set('');
  }

  /**
   * Handle multi-upload dialog
   */
  isMultiUploadOpen = signal<boolean>(false);

  openMultiUpload(): void {
    this.isMultiUploadOpen.set(true);
  }

  closeMultiUpload(): void {
    this.isMultiUploadOpen.set(false);
  }
}
