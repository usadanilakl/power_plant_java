
import { Injectable, signal } from '@angular/core';  
import { Validators } from '@angular/forms';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { Option } from '../../../../models/option.model';

@Injectable({
  providedIn: 'root'
})
export class LotoPointMapperService {

  isoPosOptions = signal<Option[]> ([]);
  normPosOptions = signal<Option[]> ([]);

  /**
   * Maps LotoPointDto fields to table columns
   * @param fields - Array of field names to include in columns
   * @returns Array of Column objects configured for LotoPoint display
   */
  toTableColumns(fields: (keyof LotoPointDto)[] = [
    'isVerified',
    'tagNumber',
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'zeroEnergyMethod'
  ]): Column[] {
    const allColumns: { [key in keyof LotoPointDto]?: Column } = {
      id: {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        width: 80,
        filterable: true,
        sortable: true
      },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: LotoPointDto) => item.isVerified ? 'Yes' : 'No',
        width: 40,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      },
      tagNumber: {
        id: 'tagNumber',
        header: 'Tag Number',
        accessorKey: 'tagNumber',
        width: 200,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.tagNumber ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
      },
      description: {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        width: 250,
        filterable: true,
        sortable: true
      },
      specificLocation: {
        id: 'specificLocation',
        header: 'Specific Location',
        accessorKey: 'specificLocation',
        width: 180,
        filterable: true,
        sortable: true
      },
      unit: {
        id: 'unit',
        header: 'Unit',
        accessorKey: 'unit',
        width: 100,
        filterable: true,
        sortable: true
      },
      tagged: {
        id: 'tagged',
        header: 'Tagging Status',
        accessorKey: 'tagged',
        width: 130,
        filterable: true,
        sortable: true
      },
      lotos: {
        id: 'lotos',
        header: 'LOTOs',
        accessorFn: (item: LotoPointDto) => this.formatLotosList(item.lotos),
        width: 200,
        filterable: false,
        sortable: false
      },
      isoPos: {
        id: 'isoPos',
        header: 'ISO Position',
        accessorKey: 'isoPos.name',
        accessorFn: (item: LotoPointDto) => item.isoPos?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true
      },
      normPos: {
        id: 'normPos',
        header: 'Normal Position',
        accessorKey: 'normPos.name',
        accessorFn: (item: LotoPointDto) => item.normPos?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true
      },
      zeroEnergyMethod: {
        id: 'zeroEnergyMethod',
        header: 'Zero Energy Method',
        accessorKey: 'zeroEnergyMethod',
        width: 180,
        filterable: true,
        sortable: true
      },
      standard: {
        id: 'standard',
        header: 'Standard',
        accessorKey: 'standard',
        width: 120,
        filterable: true,
        sortable: true
      },
      generalLocation: {
        id: 'generalLocation',
        header: 'General Location',
        accessorKey: 'generalLocation',
        width: 180,
        filterable: true,
        sortable: true
      },
      equipmentIdList: {
        id: 'equipmentIdList',
        header: 'Equipment IDs',
        accessorFn: (item: LotoPointDto) => this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false
      },
      equipmentList: {
        id: 'equipmentList',
        header: 'Equipment',
        accessorFn: (item: LotoPointDto) => this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false
      },
      normalPosition: {
        id: 'normalPosition',
        header: 'Normal Position',
        accessorKey: 'normalPosition',
        width: 150,
        filterable: true,
        sortable: true
      },
      isolatedPosition: {
        id: 'isolatedPosition',
        header: 'Isolated Position',
        accessorKey: 'isolatedPosition',
        width: 150,
        filterable: true,
        sortable: true
      },
      oldId: {
        id: 'oldId',
        header: 'Old ID',
        accessorKey: 'oldId',
        width: 100,
        filterable: true,
        sortable: true
      },
      objectType: {
        id: 'objectType',
        header: 'Object Type',
        accessorKey: 'objectType',
        width: 130,
        filterable: true,
        sortable: true
      },
      isUpdated: {
        id: 'isUpdated',
        header: 'Updated',
        accessorFn: (item: LotoPointDto) => item.isUpdated ? 'Yes' : 'No',
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isUpdated ? { 'background-color': '#fff3cd' } : { 'background-color': '' }
      },
      conflictStatus: {
        id: 'conflictStatus',
        header: 'Conflict Status',
        accessorKey: 'conflictStatus',
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.conflictStatus ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
      },
      fileIds: {
        id: 'fileIds',
        header: 'Files',
        accessorFn: (item: LotoPointDto) => this.formatFileIds(item.fileIds),
        width: 100,
        filterable: false,
        sortable: false
      },
      name: {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        width: 150,
        filterable: true,
        sortable: true
      }
    };

    return fields
      .map(fieldName => allColumns[fieldName])
      .filter((column): column is Column => column !== undefined);
  }

  
    
      /**
       * Maps LotoPoint to form fields
       * @param lotoPoint - The LotoPointDto to map
       * @param isoPosOptions - Options for ISO Position select
       * @param normPosOptions - Options for Normal Position select
       * @param fields - Array of field names to include (defaults to all fields)
       * @returns Array of FormField objects
       */
      toFormFields(
        lotoPoint: LotoPointDto,
        fields: (keyof LotoPointDto)[] = [
          'unit',
          'tagNumber',
          'description',
          'tagged',
          'isoPos',
          'normPos',
          'specificLocation',
          'standard',
          'generalLocation',
          'zeroEnergyMethod'
        ]
      ): FormField[] {
        const allFields: { [key in keyof LotoPointDto]?: FormField } = {
          tagNumber: {
            name: 'tagNumber',
            label: 'Tag Number',
            type: 'text',
            validators: [Validators.required],
            initialValue: lotoPoint.tagNumber || ''
          },
          description: {
            name: 'description',
            label: 'Description',
            type: 'text',
            validators: [Validators.required],
            initialValue: lotoPoint.description || ''
          },
          unit: {
            name: 'unit',
            label: 'Unit',
            type: 'text',
            initialValue: lotoPoint.unit || ''
          },
          tagged: {
            name: 'tagged',
            label: 'Tagged',
            type: 'text',
            initialValue: lotoPoint.tagged || ''
          },
          isoPos: {
            name: 'isoPos',
            label: 'Isolated Position',
            type: 'select',
            options: this.isoPosOptions(),
            validators: [Validators.required],
            initialValue: lotoPoint.isoPos?.id || null
          },
          normPos: {
            name: 'normPos',
            label: 'Normal Position',
            type: 'select',
            options: this.normPosOptions(),
            validators: [Validators.required],
            initialValue: lotoPoint.normPos?.id || null
          },
          specificLocation: {
            name: 'specificLocation',
            label: 'Specific Location',
            type: 'text',
            validators: [Validators.required],
            initialValue: lotoPoint.specificLocation || ''
          },
          standard: {
            name: 'standard',
            label: 'Standard',
            type: 'text',
            initialValue: lotoPoint.standard || ''
          },
          generalLocation: {
            name: 'generalLocation',
            label: 'General Location',
            type: 'text',
            initialValue: lotoPoint.generalLocation || ''
          },
          equipmentIdList: {
            name: 'equipmentIdList',
            label: 'Equipment IDs',
            type: 'multi-select',
            initialValue: lotoPoint.equipmentIdList || []
          },
          normalPosition: {
            name: 'normalPosition',
            label: 'Normal Position',
            type: 'text',
            initialValue: lotoPoint.normalPosition || ''
          },
          isolatedPosition: {
            name: 'isolatedPosition',
            label: 'Isolated Position',
            type: 'text',
            initialValue: lotoPoint.isolatedPosition || ''
          },
          oldId: {
            name: 'oldId',
            label: 'Old ID',
            type: 'text',
            initialValue: lotoPoint.oldId || ''
          },
          isUpdated: {
            name: 'isUpdated',
            label: 'Is Updated',
            type: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ],
            initialValue: lotoPoint.isUpdated?.toString() || 'false'
          },
          fileIds: {
            name: 'fileIds',
            label: 'File IDs',
            type: 'text',
            initialValue: lotoPoint.fileIds || ''
          },
          conflictStatus: {
            name: 'conflictStatus',
            label: 'Conflict Status',
            type: 'text',
            initialValue: lotoPoint.conflictStatus || ''
          },
          zeroEnergyMethod: {
            name: 'zeroEnergyMethod',
            label: 'Zero Energy Method',
            type: 'text',
            validators: [Validators.required],
            initialValue: lotoPoint.zeroEnergyMethod || ''
          }
        };
    
        return fields
          .map(fieldName => allFields[fieldName])
          .filter((field): field is FormField => field !== undefined);
      }
    

  
    /**
     * Formats LOTO list for display
     */
    private formatLotosList(lotos: any[] | null | undefined): string {
      if (!Array.isArray(lotos) || lotos.length === 0) {
        return 'None';
      }
      return lotos.map(loto => loto.workScope || loto.docNum || 'Unknown').join(', ');
    }

  
    /**
     * Formats equipment list for display
     */
    private formatEquipmentList(equipment: any[] | null | undefined): string {
      if (!Array.isArray(equipment) || equipment.length === 0) {
        return 'None';
      }
      return equipment.map(eq => eq.name || eq.id || 'Unknown').join(', ');
    }

  
    /**
     * Formats file IDs for display
     */
    private formatFileIds(fileIds: any[] | string | null | undefined): string {
      if (!fileIds) {
        return '0';
      }
  
      if (typeof fileIds === 'string') {
        const ids = fileIds.split(',').filter(id => id.trim());
        return ids.length.toString();
      }
  
      if (Array.isArray(fileIds)) {
        return fileIds.length.toString();
      }
  
      return '0';
    }

  /**
   * Transforms a single LotoPointDto for API submission
   */
  toApiModel(lotoPoint: LotoPointDto): any {
    return {
      id: lotoPoint.id,
      unit: lotoPoint.unit,
      tagNumber: lotoPoint.tagNumber,
      description: lotoPoint.description,
      specificLocation: lotoPoint.specificLocation,
      standard: lotoPoint.standard,
      generalLocation: lotoPoint.generalLocation,
      equipmentIdList: lotoPoint.equipmentList?.map(eq => eq.id) || [],
      normalPosition: lotoPoint.normalPosition,
      isolatedPosition: lotoPoint.isolatedPosition,
      isoPos: lotoPoint.isoPos?.id,
      normPos: lotoPoint.normPos?.id,
      zeroEnergyMethod: lotoPoint.zeroEnergyMethod,
      isVerified: lotoPoint.isVerified,
      fileIds: this.parseFileIds(lotoPoint.fileIds)
    };
  }

  /**
   * Transforms multiple LotoPointDtos for bulk API submission
   */
  toApiModels(lotoPoints: LotoPointDto[]): any[] {
    return lotoPoints.map(lotoPoint => this.toApiModel(lotoPoint));
  }

  
    /**
     * Parses file IDs from various formats
     */
    private parseFileIds(fileIds: any[] | string | null | undefined): number[] {
      if (!fileIds) {
        return [];
      }
  
      if (typeof fileIds === 'string') {
        return fileIds
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => !isNaN(id));
      }
  
      if (Array.isArray(fileIds)) {
        return fileIds
          .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
          .filter(id => !isNaN(id));
      }
  
      return [];
    }

  /**
   * Checks if a LotoPoint has all required fields for submission
   */
  isValid(lotoPoint: LotoPointDto): boolean {
    return !!(
      lotoPoint.tagNumber &&
      lotoPoint.description &&
      lotoPoint.isoPos?.id &&
      lotoPoint.normPos?.id
    );
  }

  /**
   * Gets validation errors for a LotoPoint
   */
  getValidationErrors(lotoPoint: LotoPointDto): string[] {
    const errors: string[] = [];

    if (!lotoPoint.tagNumber) {
      errors.push('Tag Number is required');
    }
    if (!lotoPoint.description) {
      errors.push('Description is required');
    }
    if (!lotoPoint.isoPos?.id) {
      errors.push('ISO Position is required');
    }
    if (!lotoPoint.normPos?.id) {
      errors.push('Normal Position is required');
    }

    return errors;
  }
}