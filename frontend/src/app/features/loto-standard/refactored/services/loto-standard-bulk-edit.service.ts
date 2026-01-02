import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableBulkEditService, BulkEditFieldDefinition } from '../../../../shared/table/refactored/services/table-bulk-edit.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { RfLotoStandardApiService } from './rf-loto-standard-api.service';
import { LotoStandardMapperService } from './rf-loto-standard-mapper.service';

/**
 * Bulk edit service for LOTO standards
 * Provides field definitions and batch update logic specific to LOTO standards
 */
@Injectable()
export class LotoStandardBulkEditService extends TableBulkEditService<LotoStandardDto> {
  private apiService = inject(RfLotoStandardApiService);
  private mapperService = inject(LotoStandardMapperService);

  /**
   * Get available fields for bulk editing LOTO standards
   * Filters out readonly fields and complex nested structures
   */
  getAvailableFields(): BulkEditFieldDefinition[] {
    // Get form fields from mapper
    const formFields = this.mapperService.toFormFields(new LotoStandardDto());

    // Define fields that should NOT be bulk editable
    const excludedFields = [
      'id',
      'lotoPoints', // Managed via double table, not bulk edit
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
          category: this.getFieldCategory(field.name),
          readonly: field.readonly || false
        };

        return bulkField;
      });
  }

  /**
   * Update a single LOTO standard
   */
  updateItem(item: LotoStandardDto, changes: Partial<LotoStandardDto>): Observable<LotoStandardDto> {
    const updated = new LotoStandardDto({
      ...item,
      ...changes,
      id: item.id // Preserve original id
    });

    return this.apiService.saveLotoStandard(updated).pipe(
      map(response => response.responseData)
    );
  }

  /**
   * Update multiple LOTO standards in batch
   * Uses forkJoin for parallel updates
   */
  override updateBatch(items: LotoStandardDto[], changes: Partial<LotoStandardDto>): Observable<LotoStandardDto[]> {
    const updates = items.map(item => {
      const updated = new LotoStandardDto({
        ...item,
        ...changes,
        id: item.id // Preserve original id
      });

      return this.apiService.saveLotoStandard(updated).pipe(
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
    if (['name', 'description'].includes(fieldName)) {
      return 'Identification';
    }

    // Status/Verification fields
    if (['isVerified', 'status', 'verifiedBy', 'verifiedDate'].includes(fieldName)) {
      return 'Status';
    }

    // Notes/Comments
    if (['notes', 'comments', 'remarks'].includes(fieldName)) {
      return 'Notes';
    }

    // Default category
    return 'General';
  }
}
