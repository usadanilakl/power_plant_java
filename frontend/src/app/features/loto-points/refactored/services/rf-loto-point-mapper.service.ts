import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { Option } from '../../../../models/option.model';
import { CurrentValueService } from '../../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class LotoPointMapperService {
  valueService = inject(CurrentValueService);
  destroyRef = inject(DestroyRef);

  isoPosOptions = signal<Option[]>([]);
  normPosOptions = signal<Option[]>([]);
  locationOptions = signal<Option[]>([]);
  eqTypeOptions = signal<Option[]>([]);

  constructor() {
    this.loadAllOptions();
  }

  private loadAllOptions() {
    this.loadOptions('isoPos', this.isoPosOptions);
    this.loadOptions('normPos', this.normPosOptions);
    this.loadOptions('location', this.locationOptions);
    this.loadOptions('eqType', this.eqTypeOptions);
  }

  private loadOptions(
    category: string,
    optionsSignal: ReturnType<typeof signal<Option[]>>
  ) {
    this.valueService
      .getOptionsByCategory(category)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => {
        optionsSignal.set(options);
      });
  }

  /**
   * Maps LotoPointDto fields to table columns
   * @param fields - Array of field names to include in columns
   * @returns Array of Column objects configured for LotoPoint display
   */
  toTableColumns(
    fields: (keyof LotoPointDto)[] = [
      'processingStatus',
      'tagNumber',
      'description',
      'specificLocation',
      'location',
      'eqType',
      'isoPos',
      'normPos',
      'isLabeled',
      'isLockable',
      'zeroEnergy',
      'equipmentList',
      'comment' as any,
    ]
  ): Column[] {
    const allColumns: { [key in keyof LotoPointDto]?: Column } = {
      id: {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        width: 80,
        filterable: true,
        sortable: true,
      },
      processingStatus: {
        id: 'processingStatus',
        header: 'Status',
        accessorKey: 'processingStatus.name',
        formFieldKey: 'processingStatus',
        accessorFn: (item: LotoPointDto) => item.processingStatus?.name || 'N/A',
        width: 120,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) => {
          const alias = item.processingStatus?.alias;
          if (alias === 'VRF') return { 'background-color': 'var(--status-complete)' };
          if (alias === 'IP') return { 'background-color': 'var(--status-in-progress)' };
          return { 'background-color': 'var(--status-not-processed)' };
        },
      },
      tagNumber: {
        id: 'tagNumber',
        header: 'Tag Number',
        accessorKey: 'tagNumber',
        width: 200,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.tagNumber
            ? { 'background-color': 'var(--status-incomplete)' }
            : { 'background-color': '' },
      },
      description: {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        width: 250,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.description
            ? { 'background-color': 'var(--status-incomplete)' }
            : { 'background-color': '' },
      },
      specificLocation: {
        id: 'specificLocation',
        header: 'Specific Location',
        accessorKey: 'specificLocation',
        width: 180,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.specificLocation
            ? { 'background-color': 'var(--status-incomplete)' }
            : { 'background-color': '' },
      },
      unit: {
        id: 'unit',
        header: 'Unit',
        accessorKey: 'unit',
        width: 100,
        filterable: true,
        sortable: true,
      },
      tagged: {
        id: 'tagged',
        header: 'Tagging Status',
        accessorKey: 'tagged',
        width: 130,
        filterable: true,
        sortable: true,
      },
      lotos: {
        id: 'lotos',
        header: 'LOTOs',
        accessorFn: (item: LotoPointDto) => this.formatLotosList(item.lotos),
        width: 200,
        filterable: false,
        sortable: false,
      },
      isoPos: {
        id: 'isoPos',
        header: 'ISO Position',
        accessorKey: 'isoPos.name',
        formFieldKey: 'isoPos',
        accessorFn: (item: LotoPointDto) => item.isoPos?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.isoPos?.id
            ? { 'background-color': 'var(--status-incomplete)' }
            : { 'background-color': '' },
      },
      normPos: {
        id: 'normPos',
        header: 'Normal Position',
        accessorKey: 'normPos.name',
        formFieldKey: 'normPos',
        accessorFn: (item: LotoPointDto) => item.normPos?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          !item.normPos?.id
            ? { 'background-color': 'var(--status-incomplete)' }
            : { 'background-color': '' },
      },
      zeroEnergyMethod: {
        id: 'zeroEnergyMethod',
        header: 'Zero Energy Method',
        accessorKey: 'zeroEnergyMethod',
        width: 180,
        filterable: true,
        sortable: true,
      },
      standard: {
        id: 'standard',
        header: 'Standard',
        accessorKey: 'standard',
        width: 120,
        filterable: true,
        sortable: true,
      },
      generalLocation: {
        id: 'generalLocation',
        header: 'General Location',
        accessorKey: 'generalLocation',
        width: 180,
        filterable: true,
        sortable: true,
      },
      equipmentIdList: {
        id: 'equipmentIdList',
        header: 'Equipment IDs',
        accessorFn: (item: LotoPointDto) =>
          this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false,
      },
      equipmentList: {
        id: 'equipmentList',
        header: 'Equipment',
        accessorFn: (item: LotoPointDto) =>
          this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false,
      },
      normalPosition: {
        id: 'normalPosition',
        header: 'Normal Position',
        accessorKey: 'normalPosition',
        width: 150,
        filterable: true,
        sortable: true,
      },
      isolatedPosition: {
        id: 'isolatedPosition',
        header: 'Isolated Position',
        accessorKey: 'isolatedPosition',
        width: 150,
        filterable: true,
        sortable: true,
      },
      oldId: {
        id: 'oldId',
        header: 'Old ID',
        accessorKey: 'oldId',
        width: 100,
        filterable: true,
        sortable: true,
      },
      objectType: {
        id: 'objectType',
        header: 'Object Type',
        accessorKey: 'objectType',
        width: 130,
        filterable: true,
        sortable: true,
      },
      isUpdated: {
        id: 'isUpdated',
        header: 'Updated',
        accessorFn: (item: LotoPointDto) => (item.isUpdated ? 'Yes' : 'No'),
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isUpdated
            ? { 'background-color': '#fff3cd' }
            : { 'background-color': '' },
      },
      conflictStatus: {
        id: 'conflictStatus',
        header: 'Conflict Status',
        accessorKey: 'conflictStatus',
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.conflictStatus
            ? { 'background-color': '#ffcccc' }
            : { 'background-color': '' },
      },
      fileIds: {
        id: 'fileIds',
        header: 'Files',
        accessorFn: (item: LotoPointDto) => this.formatFileIds(item.fileIds),
        width: 100,
        filterable: false,
        sortable: false,
      },
      name: {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        width: 150,
        filterable: true,
        sortable: true,
      },

      zeroEnergy: {
        id: 'zeroEnergy',
        header: 'Zero Energy',
        accessorKey: 'zeroEnergy.method',
        formFieldKey: 'zeroEnergy',
        filterable: true,
        sortable: true,
      },
      relatedLotoPointIds: {
        id: 'relatedLotoPointIds',
        header: 'Related LOTO Point IDs',
        accessorKey: 'relatedLotoPointIds',
        filterable: true,
        sortable: true,
      },
      location: {
        id: 'location',
        header: 'Location',
        accessorKey: 'location.name',
        formFieldKey: 'location',
        filterable: true,
        sortable: true,
      },
      eqType: {
        id: 'eqType',
        header: 'Equipment Type',
        accessorKey: 'eqType.name',
        formFieldKey: 'eqType',
        filterable: true,
        sortable: true,
      },
      isLabeled: {
        id: 'isLabeled',
        header: 'Labeled',
        accessorFn: (item: LotoPointDto) => (item.isLabeled ? 'Yes' : 'No'),
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isLabeled
            ? { 'background-color': 'var(--status-complete)' }
            : { 'background-color': 'var(--status-incomplete)' },
      },
      isLockable: {
        id: 'isLockable',
        header: 'Lockable',
        accessorFn: (item: LotoPointDto) => (item.isLockable ? 'Yes' : 'No'),
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isLockable
            ? { 'background-color': 'var(--status-complete)' }
            : { 'background-color': 'var(--status-incomplete)' },
      },
    };

    const result = fields
      .map((fieldName) => allColumns[fieldName])
      .filter((column): column is Column => column !== undefined);

    // Add comment column if requested (not a LotoPointDto key, so handled separately)
    if (fields.includes('comment' as any)) {
      const commentColumn: Column = {
        id: 'comment',
        header: 'Comments',
        accessorFn: () => '',
        width: 120,
        filterable: false,
        sortable: false,
      };
      const commentIndex = fields.indexOf('comment' as any);
      result.splice(commentIndex, 0, commentColumn);
    }

    return result;
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
      'eqType',
      'isoPos',
      'normPos',
      'specificLocation',
      'location',
      'generalLocation',
      'equipmentList',
      'zeroEnergy',
      'characteristicsJson' as any,
      'isLabeled',
      'isLockable',
      'processingStatus',
      'comment' as any,
    ]
  ): RfFormField[] {
    const allFields: { [key in keyof LotoPointDto]?: RfFormField} = {
      tagNumber: {
        name: 'tagNumber',
        label: 'Tag Number',
        type: 'text',
        validators: [Validators.required],
        initialValue: lotoPoint.tagNumber || '',
        guideId: 'create-loto-point:field-tag-number',
        guideMessage: 'Enter a unique tag number for this LOTO point',
      },
      description: {
        name: 'description',
        label: 'Description',
        type: 'text',
        validators: [Validators.required],
        initialValue: lotoPoint.description || '',
        guideId: 'create-loto-point:field-description',
        guideMessage: 'Provide a clear description of the LOTO point',
      },
      unit: {
        name: 'unit',
        label: 'Unit',
        type: 'text',
        initialValue: lotoPoint.unit || '',
        guideId: 'create-loto-point:field-unit',
        guideMessage: 'Specify the unit where this LOTO point is located',
      },
      tagged: {
        name: 'tagged',
        label: 'Tagged',
        type: 'text',
        initialValue: lotoPoint.tagged || '',
        guideId: 'create-loto-point:field-tagged',
        guideMessage: 'Indicate the tagging status',
      },
      isoPos: {
        name: 'isoPos',
        label: 'Isolated Position',
        type: 'value-select',
        categoryAlias: 'isoPos',
        canManageValues: true,
        validators: [Validators.required],
        initialValue: lotoPoint.isoPos?.id || null,
        guideId: 'create-loto-point:field-isoPos',
        guideMessage: 'Select the isolated position for this LOTO point (required)',
      },
      normPos: {
        name: 'normPos',
        label: 'Normal Position',
        type: 'value-select',
        categoryAlias: 'normPos',
        canManageValues: true,
        validators: [Validators.required],
        initialValue: lotoPoint.normPos?.id || null,
        guideId: 'create-loto-point:field-normPos',
        guideMessage: 'Select the normal operating position (required)',
      },
      specificLocation: {
        name: 'specificLocation',
        label: 'Specific Location',
        type: 'text',
        validators: [Validators.required],
        initialValue: lotoPoint.specificLocation || '',
        guideId: 'create-loto-point:field-specificLocation',
        guideMessage: 'Enter the specific location of this LOTO point (required)',
      },
      standard: {
        name: 'standard',
        label: 'Standard',
        type: 'text',
        initialValue: lotoPoint.standard || '',
        guideId: 'create-loto-point:field-standard',
        guideMessage: 'Reference to any applicable standard',
      },
      generalLocation: {
        name: 'generalLocation',
        label: 'General Location',
        type: 'text',
        initialValue: lotoPoint.generalLocation || '',
        guideId: 'create-loto-point:field-generalLocation',
        guideMessage: 'Enter the general area or building location',
      },
      equipmentIdList: {
        name: 'equipmentIdList',
        label: 'Equipment IDs',
        type: 'multi-select',
        initialValue: lotoPoint.equipmentIdList || [],
        guideId: 'create-loto-point:field-equipmentIdList',
        guideMessage: 'Select equipment IDs associated with this LOTO point',
      },
      normalPosition: {
        name: 'normalPosition',
        label: 'Normal Position',
        type: 'text',
        initialValue: lotoPoint.normalPosition || '',
        guideId: 'create-loto-point:field-normalPosition',
        guideMessage: 'Enter the normal position value',
      },
      isolatedPosition: {
        name: 'isolatedPosition',
        label: 'Isolated Position',
        type: 'text',
        initialValue: lotoPoint.isolatedPosition || '',
        guideId: 'create-loto-point:field-isolatedPosition',
        guideMessage: 'Enter the isolated position value',
      },
      oldId: {
        name: 'oldId',
        label: 'Old ID',
        type: 'text',
        initialValue: lotoPoint.oldId || '',
        guideId: 'create-loto-point:field-oldId',
        guideMessage: 'Legacy ID from previous system (if applicable)',
      },
      isUpdated: {
        name: 'isUpdated',
        label: 'Is Updated',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: lotoPoint.isUpdated?.toString() || 'false',
        guideId: 'create-loto-point:field-isUpdated',
        guideMessage: 'Indicates if this LOTO point has been updated',
      },
      fileIds: {
        name: 'fileIds',
        label: 'File IDs',
        type: 'text',
        initialValue: lotoPoint.fileIds || '',
        guideId: 'create-loto-point:field-fileIds',
        guideMessage: 'Associated file IDs for documentation',
      },
      conflictStatus: {
        name: 'conflictStatus',
        label: 'Conflict Status',
        type: 'text',
        initialValue: lotoPoint.conflictStatus || '',
        guideId: 'create-loto-point:field-conflictStatus',
        guideMessage: 'Current conflict status of the LOTO point',
      },
      zeroEnergyMethod: {
        name: 'zeroEnergyMethod',
        label: 'Zero Energy Method',
        type: 'textarea',
        validators: [Validators.required],
        initialValue: lotoPoint.zeroEnergyMethod || '',
        guideId: 'create-loto-point:field-zeroEnergyMethod',
        guideMessage: 'Describe the zero energy verification method (required)',
      },

      // zeroEnergy: {
      //   name: 'zeroEnergy',
      //   label: 'Zero Energy',
      //   type: 'textarea',
      //   initialValue: lotoPoint.zeroEnergy,
      // },

    zeroEnergy: {
      name: 'zeroEnergy',
      label: 'Zero Energy',
      type: 'group',
      guideId: 'create-loto-point:field-zeroEnergy',
      guideMessage: 'Configure zero energy verification settings',
      context: {
        zeroEnergyId: lotoPoint.zeroEnergy?.id || null,
      },
      fields: [
        {
          name: 'zeroEnergyTemplate',
          label: 'Zero Energy Verification Phrase',
          type: 'zero-energy-phrase-builder',
          categoryAlias: 'zeroEnergyTemplate',
          canManageValues: true,
          initialValue: (() => {
            const templateId = lotoPoint.zeroEnergy?.zeroEnergyTemplate?.id || null;
            return templateId;
          })(),
        },
        {
          name: 'templateEquipment',
          label: 'Equipment (select on P&ID)',
          type: 'equipment-list-manager',
          initialValue: lotoPoint.zeroEnergy?.templateEquipment || [],
          context: {
            conflictMode: 'no-association',
            useUnifiedDialog: true,  // Use unified dialog (single button for browse + draw)
            requireLotoPointForDrawn: true,  // Require LOTO point creation when drawing new equipment
            requireLotoPointForUnassociated: true,  // Require LOTO point creation for equipment without association
          },
        },
        {
          name: 'editShared',
          label: '',
          type: 'hidden',
          initialValue: false,
        },
      ],
    },
      relatedLotoPointIds: {
        name: 'relatedLotoPointIds',
        label: 'Related LOTO Point IDs',
        type: 'multi-select',
        initialValue: lotoPoint.relatedLotoPointIds,
        guideId: 'create-loto-point:field-relatedLotoPointIds',
        guideMessage: 'Select any related LOTO point IDs',
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'value-select',
        categoryAlias: 'location',
        canManageValues: true,
        initialValue: lotoPoint.location?.id || null,
        guideId: 'create-loto-point:field-location',
        guideMessage: 'Select the location category for this LOTO point',
      },
      eqType: {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'value-select',
        categoryAlias: 'eqType',
        canManageValues: true,
        initialValue: lotoPoint.eqType?.id || null,
        guideId: 'create-loto-point:field-eqType',
        guideMessage: 'Select the equipment type for this LOTO point',
      },
      equipmentList: {
        name: 'equipmentList',
        label: 'Equipment List',
        type: 'equipment-list-manager',
        initialValue: lotoPoint.equipmentList || [],
        context: {
          currentLotoPointId: lotoPoint.id,
          currentLotoPointTagNumber: lotoPoint.tagNumber || undefined,
          useUnifiedDialog: true,
        },
        guideId: 'create-loto-point:field-equipmentList',
        guideMessage: 'Manage the equipment associated with this LOTO point',
      },
      isLabeled: {
        name: 'isLabeled',
        label: 'Labeled',
        type: 'checkbox',
        initialValue: lotoPoint.isLabeled ?? false,
        guideId: 'create-loto-point:field-isLabeled',
        guideMessage: 'Indicates if this LOTO point has been labeled',
      },
      isLockable: {
        name: 'isLockable',
        label: 'Lockable',
        type: 'checkbox',
        initialValue: lotoPoint.isLockable ?? false,
        guideId: 'create-loto-point:field-isLockable',
        guideMessage: 'Indicates if this LOTO point is lockable',
      },
      processingStatus: {
        name: 'processingStatus',
        label: 'Processing Status',
        type: 'value-select',
        categoryAlias: 'processingStatus',
        canManageValues: true,
        initialValue: lotoPoint.processingStatus?.id || null,
        guideId: 'create-loto-point:field-processingStatus',
        guideMessage: 'Select the processing status for this LOTO point',
      },
      characteristicsJson: {
        name: 'characteristicsJson',
        label: 'Characteristics',
        type: 'characteristics-editor',
        categoryAlias: 'equipmentCharacteristic',
        initialValue: lotoPoint.characteristicsJson || '[]',
      },

    };

    // Add comment field (not a LotoPointDto key, so added separately)
    if (fields.includes('comment' as any)) {
      const commentField: RfFormField = {
        name: 'comment',
        label: 'Comments',
        type: 'comment',
        commentContext: {
          entityType: 'LotoPoint',
          entityId: lotoPoint.id || 0,
        },
        guideId: 'create-loto-point:field-comment',
        guideMessage: 'Add or view comments for this LOTO point',
      };
      const result = fields
        .map((fieldName) => allFields[fieldName])
        .filter((field): field is RfFormField => field !== undefined);
      // Insert comment field at the position where 'comment' appears in fields
      const commentIndex = fields.indexOf('comment' as any);
      result.splice(commentIndex, 0, commentField);
      return result;
    }

    return fields
      .map((fieldName) => allFields[fieldName])
      .filter((field): field is RfFormField => field !== undefined);
  }

  /**
   * Formats LOTO list for display
   */
  private formatLotosList(lotos: any[] | null | undefined): string {
    if (!Array.isArray(lotos) || lotos.length === 0) {
      return 'None';
    }
    return lotos
      .map((loto) => loto.workScope || loto.docNum || 'Unknown')
      .join(', ');
  }

  /**
   * Formats equipment list for display
   */
  private formatEquipmentList(equipment: any[] | null | undefined): string {
    if (!Array.isArray(equipment) || equipment.length === 0) {
      return 'None';
    }
    return equipment.map((eq) => eq.name || eq.id || 'Unknown').join(', ');
  }

  /**
   * Formats file IDs for display
   */
  private formatFileIds(fileIds: any[] | string | null | undefined): string {
    if (!fileIds) {
      return '0';
    }

    if (typeof fileIds === 'string') {
      const ids = fileIds.split(',').filter((id) => id.trim());
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
    const apiModel: any = {
      id: lotoPoint.id,
      unit: lotoPoint.unit,
      tagNumber: lotoPoint.tagNumber,
      description: lotoPoint.description,
      specificLocation: lotoPoint.specificLocation,
      standard: lotoPoint.standard,
      generalLocation: lotoPoint.generalLocation,
      equipmentIdList: lotoPoint.equipmentList?.map((eq) => eq.id) || [],
      normalPosition: lotoPoint.normalPosition,
      isolatedPosition: lotoPoint.isolatedPosition,
      characteristicsJson: lotoPoint.characteristicsJson,
      isoPos: lotoPoint.isoPos?.id,
      normPos: lotoPoint.normPos?.id,
      zeroEnergyMethod: lotoPoint.zeroEnergyMethod,
      isVerified: lotoPoint.isVerified,
      isLabeled: lotoPoint.isLabeled,
      isLockable: lotoPoint.isLockable,
      isProcessed: lotoPoint.isProcessed,
      fileIds: this.parseFileIds(lotoPoint.fileIds),
    };

    // Add zeroEnergy if it exists
    if (lotoPoint.zeroEnergy) {
      // Get template ID - handle both object and direct ID cases
      // Form field stores ID as number, but clipboard/API stores as ValueDto object
      let templateId: number | null = null;
      const template = lotoPoint.zeroEnergy.zeroEnergyTemplate as any;
      if (typeof template === 'number') {
        // Direct ID from form field
        templateId = template;
      } else if (template?.id) {
        // ValueDto object from API/clipboard
        templateId = template.id;
      }

      // Filter out 0 and null
      const validTemplateId = (templateId && templateId !== 0) ? templateId : null;

      // Extract equipment IDs from templateEquipment array
      const equipmentIds: number[] = [];
      if (lotoPoint.zeroEnergy.templateEquipment && Array.isArray(lotoPoint.zeroEnergy.templateEquipment)) {
        equipmentIds.push(
          ...lotoPoint.zeroEnergy.templateEquipment
            .map(eq => eq.id)
            .filter(id => id != null && id !== 0) as number[]
        );
      }

      // Get zero energy record ID
      const zeroEnergyId = lotoPoint.zeroEnergy.id;
      const validZeroEnergyId = (zeroEnergyId && zeroEnergyId !== 0) ? zeroEnergyId : null;

      // Build and send the zeroEnergy object
      apiModel.zeroEnergy = {
        id: validZeroEnergyId,
        zeroEnergyTemplateId: validTemplateId,
        templateEquipmentIds: equipmentIds.length > 0 ? equipmentIds : null,
        editShared: (lotoPoint.zeroEnergy as any).editShared || false,
      };
    }

    return apiModel;
  }

  /**
   * Transforms multiple LotoPointDtos for bulk API submission
   */
  toApiModels(lotoPoints: LotoPointDto[]): any[] {
    return lotoPoints.map((lotoPoint) => this.toApiModel(lotoPoint));
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
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
    }

    if (Array.isArray(fileIds)) {
      return fileIds
        .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
        .filter((id) => !isNaN(id));
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
