import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableBulkEditService, BulkEditFieldDefinition } from '../../../../shared/table/refactored/services/table-bulk-edit.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { LotoPointMapperService } from './rf-loto-point-mapper.service';

/**
 * Bulk edit service for LOTO points
 * Provides field definitions and batch update logic specific to LOTO points
 */
@Injectable()
export class LotoPointBulkEditService extends TableBulkEditService<LotoPointDto> {
  private apiService = inject(RfLotoPointApiService);
  private mapperService = inject(LotoPointMapperService);

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
