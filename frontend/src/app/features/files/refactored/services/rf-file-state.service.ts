
import { Injectable, inject, DestroyRef, signal, NgZone } from "@angular/core";
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
import { SyncUpdateService, EntityUpdateEvent } from "../../../../services/sync/sync-update.service";

@Injectable({
  providedIn: 'root'
})
export class RfFileStateService {
  private apiService = inject(RfFileApiService);
  private localStorage = inject(FileLocalStorageService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private currentFileService = inject(CurrentFileService);
  private syncUpdateService = inject(SyncUpdateService);
  private ngZone = inject(NgZone);

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

    // Subscribe to SSE sync updates for real-time reactivity
    // Entity type is 'FileObject' as that's the Java entity class name
    this.syncUpdateService.getEntityTypeUpdates$('FileObject')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.handleSyncUpdate(event);
      });
  }

  /**
   * Handle sync update from SSE - reload the entity from server.
   * Called when a FileObject is updated by server sync from another machine.
   */
  private handleSyncUpdate(event: EntityUpdateEvent): void {
    const entityId = event.entityId;

    // Reload the entity from server to get fresh data
    this.apiService.getFileById(entityId + '')
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedItem = new FileDto(response.responseData);
            this.updateFileInList(updatedItem);

            // Show a notification if the currently selected item was updated
            const selectedItem = this.selectedItem();
            if (selectedItem?.id === entityId) {
              this.messageService.showInfo('This file was updated from another machine');
            }
          }
        }),
        catchError((error) => {
          console.error('Error reloading synced file:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Update a file in the local list or add it if not present.
   * Called when an SSE sync update is received.
   * Uses NgZone to ensure proper Angular change detection.
   */
  updateFileInList(updatedItem: FileDto): void {
    if (!updatedItem.id) {
      return;
    }

    // Ensure we run inside Angular zone for proper change detection
    this.ngZone.run(() => {
      const current = this.allLoadedFilesSubject.value;
      const index = current.findIndex(f => f.id === updatedItem.id);

      if (index >= 0) {
        // Update existing item in the list - create new array with new object
        const updated = [...current];
        // Add a version marker to force cdkVirtualFor to re-render
        (updatedItem as any)._version = Date.now();
        updated[index] = updatedItem;
        this.allLoadedFilesSubject.next(updated);
      } else {
        // Item not in current list - add it at the beginning
        (updatedItem as any)._version = Date.now();
        this.allLoadedFilesSubject.next([updatedItem, ...current]);
      }

      // Also update selectedItem if it's the same one being viewed/edited
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

      // Notify CurrentFileService to update the left menu
      this.notifyFileUpdate(updatedItem);
    });
  }

  /**
   * Remove a file from the local list by ID.
   * Called when a deletion sync event is received.
   */
  removeFileById(id: number): void {
    const current = this.allLoadedFilesSubject.value;
    const filtered = current.filter(f => f.id !== id);

    // Only update if something was actually removed
    if (filtered.length !== current.length) {
      this.allLoadedFilesSubject.next(filtered);

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
    // Always call updateMapByType - it will trigger filesUpdated$ even if
    // the file type doesn't match the predefined list
    this.currentFileService.updateMapByType(fileTypeName, file);
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
          // Handle response - processPidFile returns List<FileDto> (array), updateFileObject returns single FileDto
          const responseData = response.responseData;
          const fileDtos: FileDto[] = Array.isArray(responseData)
            ? responseData.map((f: any) => new FileDto(f))
            : [new FileDto(responseData)];

          // Update the files list so the left menu reflects the changes
          fileDtos.forEach(savedFile => this.updateOrAddFile(savedFile));

          // Set the first file as the selected item
          if (fileDtos.length > 0) {
            this.setSelectedItem(fileDtos[0]);
          }

          this.messageService.showSuccess(fileDtos.length > 1
            ? `${fileDtos.length} files uploaded successfully`
            : 'File uploaded successfully');
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

    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };

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
    const currentCriteria = this.getCurrentSearchCriteria();
    const filters: SearchCriteria = currentCriteria
      ? { ...currentCriteria, filters: currentCriteria.filters ?? {} }
      : { type: 'column', filters: {} };

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
