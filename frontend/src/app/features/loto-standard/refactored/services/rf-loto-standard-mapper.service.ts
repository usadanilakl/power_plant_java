import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoStandardIdDto } from '../../../../models/loto/loto-standard-id.model';
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
      'groups'
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
      groups: {
        id: 'groups',
        header: 'Groups',
        accessorFn: (item: LotoStandardDto) =>
          item.groups?.map(g => g.name).join(', ') || '',
        width: 200,
        filterable: true,
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
    fields: (keyof LotoStandardDto)[] = ['name', 'description', 'isVerified', 'groups']
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
      groups: {
        name: 'groups',
        label: 'Groups',
        type: 'multi-value-select',
        initialValue: lotoStandard?.groups || [],
        categoryAlias: 'group',
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
      groups: formData.groups,
      isVerified: formData.isVerified || false,
    });
  }

  /**
   * Converts any standard object (ID DTO, full DTO, or plain JSON) to LotoStandardIdDto
   * @param lotoStandard - The loto standard object to convert (can be LotoStandardDto, LotoStandardIdDto, or plain object)
   * @param excludeLotoPoints - If true, excludes lotoPoints from the result (for updates where lotoPoints are managed separately)
   * @returns LotoStandardIdDto ready for API submission
   */
  toIdDto(lotoStandard: Partial<LotoStandardIdDto | LotoStandardDto>, excludeLotoPoints: boolean = false): LotoStandardIdDto {
    // If it's already a LotoStandardDto instance with toIdDto method
    if (typeof (lotoStandard as any).toIdDto === 'function') {
      const idDto = (lotoStandard as LotoStandardDto).toIdDto();
      if (excludeLotoPoints) {
        idDto.lotoPoints = null;
      }
      return idDto;
    }

    // If it's already a LotoStandardIdDto (check if lotoPoints/groups are arrays of numbers)
    if (this.isLotoStandardIdDto(lotoStandard)) {
      const idDto = new LotoStandardIdDto(lotoStandard);
      if (excludeLotoPoints) {
        idDto.lotoPoints = null;
      }
      return idDto;
    }

    // Handle mixed format or plain objects - manually extract IDs
    const idDto = new LotoStandardIdDto({
      id: lotoStandard.id,
      name: lotoStandard.name,
      description: lotoStandard.description,
      objectType: lotoStandard.objectType,
      isVerified: lotoStandard.isVerified,
      lotoPoints: excludeLotoPoints ? null : this.extractIds((lotoStandard as any).lotoPoints),
      groups: this.extractIds((lotoStandard as any).groups)
    });

    return idDto;
  }

  /**
   * Extracts IDs from an array that might contain objects or numbers
   * @param array - Array of objects with id property or numbers
   * @returns Array of numbers or null
   */
  private extractIds(array: any[] | null | undefined): number[] | null {
    if (!array || !Array.isArray(array)) {
      return null;
    }

    return array.map(item => {
      // If it's already a number, use it
      if (typeof item === 'number') {
        return item;
      }
      // If it's an object with an id property, extract it
      if (item && typeof item === 'object' && 'id' in item) {
        return item.id;
      }
      // Fallback to 0 if we can't determine the ID
      return 0;
    });
  }

  /**
   * Type guard to check if object is LotoStandardIdDto
   * @param object - The object to check
   * @returns True if object appears to be a LotoStandardIdDto
   */
  private isLotoStandardIdDto(object: any): object is LotoStandardIdDto {
    // Check if lotoPoints and groups are arrays of numbers (not objects)
    if (object.lotoPoints && Array.isArray(object.lotoPoints)) {
      if (object.lotoPoints.length > 0 && typeof object.lotoPoints[0] !== 'number') {
        return false; // Has nested objects, not an IdDto
      }
    }

    if (object.groups && Array.isArray(object.groups)) {
      if (object.groups.length > 0 && typeof object.groups[0] !== 'number') {
        return false; // Has nested objects, not an IdDto
      }
    }

    return true; // Appears to be an IdDto
  }
}
