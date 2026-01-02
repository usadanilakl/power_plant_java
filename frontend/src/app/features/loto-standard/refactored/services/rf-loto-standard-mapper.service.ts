import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { Column } from '../../../../models/column.model';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Injectable({
  providedIn: 'root',
})
export class LotoStandardMapperService {
  /**
   * Maps LotoStandardDto fields to table columns
   * @param fields - Array of field names to include in columns
   * @returns Array of Column objects configured for LotoStandard display
   */
  toTableColumns(
    fields: (keyof LotoStandardDto)[] = [
      'name',
      'description',
      'lotoPoints',
      'isVerified',
    ]
  ): Column[] {
    const allColumns: { [key in keyof LotoStandardDto]?: Column } = {
      id: {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        width: 80,
        filterable: true,
        sortable: true,
      },
      name: {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        width: 200,
        filterable: true,
        sortable: true,
      },
      description: {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        width: 300,
        filterable: true,
        sortable: true,
      },
      lotoPoints: {
        id: 'lotoPoints',
        header: 'LOTO Points Count',
        accessorFn: (item: LotoStandardDto) =>
          item.lotoPoints?.length.toString() || '0',
        width: 150,
        filterable: false,
        sortable: true,
      },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: LotoStandardDto) => (item.isVerified ? 'Yes' : 'No'),
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isVerified
            ? { 'background-color': 'var(--success-background, #c8e6c9)' }
            : { 'background-color': 'var(--error-background, #ffcdd2)' },
      },
      objectType: {
        id: 'objectType',
        header: 'Type',
        accessorKey: 'objectType',
        width: 120,
        filterable: true,
        sortable: true,
      },
    };

    return fields.map((field) => allColumns[field]).filter(Boolean) as Column[];
  }

  /**
   * Maps LotoStandardDto to form fields
   * @param lotoStandard - The loto standard entity to map
   * @param fields - Array of field names to include in form
   * @returns Array of RfFormField objects configured for form display
   */
  toFormFields(
    lotoStandard: LotoStandardDto | null,
    fields: (keyof LotoStandardDto)[] = ['name', 'description', 'isVerified']
  ): RfFormField[] {
    const allFields: { [key in keyof LotoStandardDto]?: RfFormField} = {
      id: {
        name: 'id',
        label: 'ID',
        type: 'text',
        initialValue: lotoStandard?.id || null,
        readonly: true,
      },
      name: {
        name: 'name',
        label: 'Name',
        type: 'text',
        initialValue: lotoStandard?.name || '',
        validators: [Validators.required],
      },
      description: {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        initialValue: lotoStandard?.description || '',
        validators: [Validators.required],
      },
      isVerified: {
        name: 'isVerified',
        label: 'Verified',
        type: 'checkbox',
        initialValue: lotoStandard?.isVerified || false,
      },
    };

    return fields.map((field) => allFields[field]).filter(Boolean) as RfFormField[];
  }

  /**
   * Validates a loto standard entity
   * @param lotoStandard - The loto standard to validate
   * @returns True if valid, false otherwise
   */
  isValid(lotoStandard: Partial<LotoStandardDto>): boolean {
    if (!lotoStandard.name || lotoStandard.name.trim() === '') {
      return false;
    }
    if (!lotoStandard.description || lotoStandard.description.trim() === '') {
      return false;
    }
    return true;
  }

  /**
   * Gets validation error messages for a loto standard
   * @param lotoStandard - The loto standard to validate
   * @returns Array of error messages
   */
  getValidationErrors(lotoStandard: Partial<LotoStandardDto>): string[] {
    const errors: string[] = [];

    if (!lotoStandard.name || lotoStandard.name.trim() === '') {
      errors.push('Name is required');
    }
    if (!lotoStandard.description || lotoStandard.description.trim() === '') {
      errors.push('Description is required');
    }

    return errors;
  }

  /**
   * Converts form data back to API model format
   * @param formData - The form data to convert
   * @returns LotoStandardDto ready for API submission
   */
  toApiModel(formData: any): LotoStandardDto {
    return new LotoStandardDto({
      id: formData.id,
      name: formData.name,
      description: formData.description,
      lotoPoints: formData.lotoPoints,
      isVerified: formData.isVerified || false,
    });
  }
}
