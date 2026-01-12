import { Injectable, Signal, signal, computed } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Field definition for bulk editing
 */
export interface BulkEditFieldDefinition {
  name: string;
  label: string;
  type: string;
  category?: string; // UI grouping category (for field selector organization)
  categoryAlias?: string; // Value category alias (for value-select fields)
  readonly?: boolean;
}

/**
 * Result of a bulk update operation
 */
export interface BulkUpdateResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: string }>;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

/**
 * Abstract base service for table bulk edit functionality
 * Provides common patterns for bulk editing table items
 *
 * @template T The type of items being bulk edited
 */
@Injectable()
export abstract class TableBulkEditService<T> {
  // Bulk edit state
  private isBulkEditOpenSubject = signal<boolean>(false);
  private selectedFieldNamesSubject = signal<string[]>([]);
  private templateValuesSubject = signal<Partial<T>>({});
  private isUpdatingSubject = signal<boolean>(false);
  private errorMessageSubject = signal<string | null>(null);
  private progressSubject = signal<number>(0);

  // Public read-only signals
  isBulkEditOpen = this.isBulkEditOpenSubject.asReadonly();
  selectedFieldNames = this.selectedFieldNamesSubject.asReadonly();
  templateValues = this.templateValuesSubject.asReadonly();
  isUpdating = this.isUpdatingSubject.asReadonly();
  errorMessage = this.errorMessageSubject.asReadonly();
  progress = this.progressSubject.asReadonly();

  // Computed: Are there any fields selected for editing?
  hasSelectedFields = computed(() => this.selectedFieldNames().length > 0);

  // Computed: Is the form valid for submission?
  canApply = computed(() =>
    this.hasSelectedFields() &&
    !this.isUpdating() &&
    Object.keys(this.templateValues()).length > 0
  );

  /**
   * Abstract method: Get the list of fields available for bulk editing
   * Implement in subclass to provide domain-specific fields
   */
  abstract getAvailableFields(): BulkEditFieldDefinition[];

  /**
   * Abstract method: Update a single item
   * Implement in subclass to call your API
   *
   * @param item The item to update
   * @param changes The changes to apply
   */
  abstract updateItem(item: T, changes: Partial<T>): Observable<T>;

  /**
   * Optional: Update items in batch (override for better performance)
   * Default implementation uses forkJoin with individual updates
   *
   * @param items The items to update
   * @param changes The changes to apply to all items
   */
  updateBatch(items: T[], changes: Partial<T>): Observable<T[]> {
    const updates = items.map(item =>
      this.updateItem(item, changes).pipe(
        catchError(error => {
          console.error('Error updating item:', error);
          return of(null as any);
        })
      )
    );

    return forkJoin(updates).pipe(
      map(results => results.filter(r => r !== null))
    );
  }

  /**
   * Open the bulk edit menu
   */
  openBulkEdit(): void {
    this.isBulkEditOpenSubject.set(true);
    this.clearError();
  }

  /**
   * Close the bulk edit menu
   * Note: Does NOT reset state - this preserves field selection and values
   * for the next time the dialog opens (supports persistent workflow)
   */
  closeBulkEdit(): void {
    this.isBulkEditOpenSubject.set(false);
    // Clear error and progress, but keep field selection and template values
    this.errorMessageSubject.set(null);
    this.progressSubject.set(0);
  }

  /**
   * Set which fields are selected for bulk editing
   *
   * @param fieldNames Array of field names to edit
   */
  setFieldSelection(fieldNames: string[]): void {
    this.selectedFieldNamesSubject.set(fieldNames);

    // Remove template values for unselected fields
    const currentValues = this.templateValuesSubject();
    const filteredValues = Object.keys(currentValues)
      .filter(key => fieldNames.includes(key))
      .reduce((acc, key) => {
        acc[key as keyof T] = currentValues[key as keyof T];
        return acc;
      }, {} as Partial<T>);

    this.templateValuesSubject.set(filteredValues);
  }

  /**
   * Update the template value for a specific field
   *
   * @param fieldName The field name
   * @param value The new value
   */
  updateTemplateValue(fieldName: string, value: any): void {
    const currentValues = this.templateValuesSubject();
    this.templateValuesSubject.set({
      ...currentValues,
      [fieldName]: value
    } as Partial<T>);
  }

  /**
   * Update all template values at once
   *
   * @param values The new template values
   */
  setTemplateValues(values: Partial<T>): void {
    this.templateValuesSubject.set(values);
  }

  /**
   * Apply template values to the selected items
   *
   * @param items The items to update
   * @returns Observable of the update result
   */
  applyToItems(items: T[]): Observable<BulkUpdateResult<T>> {
    if (items.length === 0) {
      return of({
        successful: [],
        failed: [],
        totalCount: 0,
        successCount: 0,
        failureCount: 0
      });
    }

    this.isUpdatingSubject.set(true);
    this.progressSubject.set(0);
    this.clearError();

    const changes = this.getSelectedFieldValues();

    return this.updateBatch(items, changes).pipe(
      map(updatedItems => {
        const result: BulkUpdateResult<T> = {
          successful: updatedItems,
          failed: [],
          totalCount: items.length,
          successCount: updatedItems.length,
          failureCount: items.length - updatedItems.length
        };

        this.isUpdatingSubject.set(false);
        this.progressSubject.set(100);

        if (result.failureCount > 0) {
          this.setError(`${result.failureCount} of ${result.totalCount} items failed to update`);
        }

        return result;
      }),
      catchError(error => {
        this.isUpdatingSubject.set(false);
        this.setError(error.message || 'Failed to update items');

        return of({
          successful: [],
          failed: items.map(item => ({ item, error: error.message })),
          totalCount: items.length,
          successCount: 0,
          failureCount: items.length
        });
      })
    );
  }

  /**
   * Get the template values for only the selected fields
   */
  protected getSelectedFieldValues(): Partial<T> {
    const allValues = this.templateValuesSubject();
    const selectedFields = this.selectedFieldNamesSubject();

    return Object.keys(allValues)
      .filter(key => selectedFields.includes(key))
      .reduce((acc, key) => {
        acc[key as keyof T] = allValues[key as keyof T];
        return acc;
      }, {} as Partial<T>);
  }

  /**
   * Set an error message
   */
  protected setError(message: string): void {
    this.errorMessageSubject.set(message);
  }

  /**
   * Clear the error message
   */
  protected clearError(): void {
    this.errorMessageSubject.set(null);
  }

  /**
   * Update progress (0-100)
   */
  protected updateProgress(progress: number): void {
    this.progressSubject.set(Math.min(100, Math.max(0, progress)));
  }

  /**
   * Reset the service to initial state
   */
  reset(): void {
    this.selectedFieldNamesSubject.set([]);
    this.templateValuesSubject.set({});
    this.errorMessageSubject.set(null);
    this.progressSubject.set(0);
  }
}
