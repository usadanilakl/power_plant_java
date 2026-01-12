import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { Observable, forkJoin, of, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableBulkEditService, BulkEditFieldDefinition, BulkUpdateResult } from '../../../../shared/table/refactored/services/table-bulk-edit.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { LotoPointMapperService } from './rf-loto-point-mapper.service';
import { LotoPointCounterpartService, SyncableField, SYNCABLE_FIELDS } from './loto-point-counterpart.service';
import { ConfirmationService } from '../../../../services/ui/confirmation.service';

/**
 * Bulk edit service for LOTO points
 * Provides field definitions and batch update logic specific to LOTO points
 * Includes counterpart handling for unit-specific LOTO points
 */
@Injectable()
export class LotoPointBulkEditService extends TableBulkEditService<LotoPointDto> {
  private apiService = inject(RfLotoPointApiService);
  private mapperService = inject(LotoPointMapperService);
  private counterpartService = inject(LotoPointCounterpartService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Counterpart handling state
  private applyToCounterpartsSubject = signal<boolean | null>(null); // null = not asked, true/false = user choice
  applyToCounterparts = this.applyToCounterpartsSubject.asReadonly();

  // Track items with counterparts for UI
  private itemsWithCounterpartsSubject = signal<LotoPointDto[]>([]);
  itemsWithCounterparts = this.itemsWithCounterpartsSubject.asReadonly();

  /**
   * Get available fields for bulk editing LOTO points
   * Filters out readonly fields and complex nested structures
   */
  getAvailableFields(): BulkEditFieldDefinition[] {
    // Get form fields from mapper
    const formFields = this.mapperService.toFormFields(new LotoPointDto());

    // Define fields that should NOT be bulk editable
    const excludedFields = [
      'id',
      'equipmentList', // Too complex for bulk edit
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy'
    ];

    // Convert to BulkEditFieldDefinition and filter
    return formFields
      .filter(field => !excludedFields.includes(field.name))
      .map(field => {
        const bulkField: any = {
          name: field.name,
          label: field.label,
          type: field.type,
          category: this.getFieldCategory(field.name), // UI grouping category
          categoryAlias: field.categoryAlias, // Value category alias for value-select fields
          readonly: field.readonly || false
        };

        // Preserve nested fields for group types (e.g., zeroEnergy)
        if ((field as any).fields) {
          bulkField.fields = (field as any).fields;
        }

        return bulkField;
      });
  }

  /**
   * Update a single LOTO point
   */
  updateItem(item: LotoPointDto, changes: Partial<LotoPointDto>): Observable<LotoPointDto> {
    const updated = new LotoPointDto({
      ...item,
      ...changes,
      id: item.id // Preserve original id
    });

    return this.apiService.updateLotoPoint(updated).pipe(
      map(response => response.responseData)
    );
  }

  /**
   * Update multiple LOTO points in batch
   * Uses forkJoin for parallel updates
   */
  override updateBatch(items: LotoPointDto[], changes: Partial<LotoPointDto>): Observable<LotoPointDto[]> {
    const updates = items.map(item => {
      const updated = new LotoPointDto({
        ...item,
        ...changes,
        id: item.id // Preserve original id
      });

      return this.apiService.updateLotoPoint(updated).pipe(
        map(response => response.responseData)
      );
    });

    // Execute all updates in parallel
    return forkJoin(updates);
  }

  /**
   * Check if any items have counterparts
   */
  hasItemsWithCounterparts(items: LotoPointDto[]): boolean {
    return items.some(item => item.counterpartId != null);
  }

  /**
   * Get items that have counterparts
   */
  getItemsWithCounterparts(items: LotoPointDto[]): LotoPointDto[] {
    return items.filter(item => item.counterpartId != null);
  }

  /**
   * Set user's choice for counterpart handling
   */
  setApplyToCounterparts(value: boolean): void {
    this.applyToCounterpartsSubject.set(value);
  }

  /**
   * Reset counterpart state
   */
  resetCounterpartState(): void {
    this.applyToCounterpartsSubject.set(null);
    this.itemsWithCounterpartsSubject.set([]);
  }

  /**
   * Override close to reset counterpart state
   */
  override closeBulkEdit(): void {
    super.closeBulkEdit();
    this.resetCounterpartState();
  }

  /**
   * Apply changes to counterpart using the counterpart service
   * Transforms fields appropriately for the target unit
   */
  private applyChangesToCounterpart(
    sourceItem: LotoPointDto,
    counterpartId: number,
    changes: Partial<LotoPointDto>
  ): Observable<LotoPointDto> {
    // First fetch the counterpart
    return this.apiService.getLotoPointById(String(counterpartId)).pipe(
      switchMap(response => {
        const counterpart = response.responseData;
        if (!counterpart) {
          console.warn(`Counterpart ${counterpartId} not found`);
          return of(null as any);
        }

        // Determine source and target units
        const sourceUnit = this.counterpartService.getSourceUnit(sourceItem);
        const targetUnit = this.counterpartService.getTargetUnit(sourceUnit);

        // Transform changes for counterpart
        const transformedChanges: Record<string, any> = {};

        for (const [key, value] of Object.entries(changes)) {
          if (SYNCABLE_FIELDS.includes(key as SyncableField)) {
            // Use counterpart service to transform the field
            const tempSource = new LotoPointDto({ ...sourceItem, [key]: value });
            transformedChanges[key] =
              this.counterpartService.transformFieldValue(
                tempSource,
                key as SyncableField,
                sourceUnit,
                targetUnit
              );
          } else {
            // Non-syncable fields are copied as-is
            transformedChanges[key] = value;
          }
        }

        // Apply transformed changes to counterpart
        const updatedCounterpart = new LotoPointDto({
          ...counterpart,
          ...transformedChanges,
          id: counterpart.id // Preserve counterpart's id
        });

        return this.apiService.updateLotoPoint(updatedCounterpart).pipe(
          map(res => res.responseData),
          catchError(error => {
            console.error(`Error updating counterpart ${counterpartId}:`, error);
            return of(null as any);
          })
        );
      }),
      catchError(error => {
        console.error(`Error fetching counterpart ${counterpartId}:`, error);
        return of(null as any);
      })
    );
  }

  /**
   * Update batch with counterpart handling
   * If user chooses to apply to counterparts, also updates counterpart LOTO points
   */
  updateBatchWithCounterparts(
    items: LotoPointDto[],
    changes: Partial<LotoPointDto>,
    applyToCounterparts: boolean
  ): Observable<LotoPointDto[]> {
    // First update the selected items
    const primaryUpdates = items.map(item => {
      const updated = new LotoPointDto({
        ...item,
        ...changes,
        id: item.id
      });

      return this.apiService.updateLotoPoint(updated).pipe(
        map(response => response.responseData),
        catchError(error => {
          console.error(`Error updating item ${item.id}:`, error);
          return of(null as any);
        })
      );
    });

    if (!applyToCounterparts) {
      // Just update primary items
      return forkJoin(primaryUpdates).pipe(
        map(results => results.filter(r => r !== null))
      );
    }

    // Update primary items first, then counterparts
    return forkJoin(primaryUpdates).pipe(
      switchMap(primaryResults => {
        const successfulPrimary = primaryResults.filter(r => r !== null);

        // Find items that have counterparts
        const itemsWithCounterparts = items.filter(item => item.counterpartId != null);

        if (itemsWithCounterparts.length === 0) {
          return of(successfulPrimary);
        }

        // Update counterparts
        const counterpartUpdates = itemsWithCounterparts.map(item =>
          this.applyChangesToCounterpart(item, item.counterpartId!, changes)
        );

        return forkJoin(counterpartUpdates).pipe(
          map(counterpartResults => {
            const successfulCounterparts = counterpartResults.filter(r => r !== null);
            console.log(`Updated ${successfulPrimary.length} items and ${successfulCounterparts.length} counterparts`);
            return successfulPrimary;
          })
        );
      })
    );
  }

  /**
   * Categorize fields for better organization in the field selector
   */
  private getFieldCategory(fieldName: string): string {
    // Identification fields
    if (['tagNumber', 'description', 'lotoPointNumber'].includes(fieldName)) {
      return 'Identification';
    }

    // Location fields
    if (['location', 'system', 'unit', 'area'].includes(fieldName)) {
      return 'Location';
    }

    // Status/Verification fields
    if (['isVerified', 'status', 'verifiedBy', 'verifiedDate'].includes(fieldName)) {
      return 'Status';
    }

    // Technical fields
    if (['voltage', 'amperage', 'pressure', 'temperature'].includes(fieldName)) {
      return 'Technical Details';
    }

    // Notes/Comments
    if (['notes', 'comments', 'remarks'].includes(fieldName)) {
      return 'Notes';
    }

    // Zero Energy
    if (['zeroEnergy'].includes(fieldName)) {
      return 'Zero Energy';
    }

    // Default category
    return 'General';
  }
}
