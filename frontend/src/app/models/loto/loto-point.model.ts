import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { LotoDto } from './loto.model';
import { ValidatorFn, Validators } from '@angular/forms';
import { Option } from '../option.model';
import { LotoPointIdDto } from './loto-point-id.model';
import { Column } from '../column.model';
import { BaseDto, BaseModel } from '../base/base.model';
import { ZeroEnergyDto, ZeroEnergyModel } from './zero-energy.model';

export type LotoPointFieldName = keyof LotoPointModel;

export interface LotoPointModel extends BaseModel {
  unit: string | null;
  tagged: string | null;
  tagNumber: string | null;
  description: string | null;
  isoPos: ValueDto | null;
  normPos: ValueDto | null;
  specificLocation: string | null;
  standard: string | null;
  generalLocation: string | null;
  equipmentIdList: number[] | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  equipmentList: EquipmentDto[] | null;
  oldId: string | null;
  isUpdated: number | null;
  fileIds: string | null;
  conflictStatus: string | null;
  lotos: LotoDto[] | null;
  zeroEnergyMethod: string | null;

  zeroEnergy: ZeroEnergyModel | null;
  relatedLotoPointIds: number[] | null;
  location: ValueDto | null;
  eqType: ValueDto | null;
  counterpartId: number | null;
}

export interface LotoPointFormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multi-select';
  validators?: ValidatorFn[];
  options?: { value: string; label: string }[];
  initialValue?: any;
}

export class LotoPointDto extends BaseDto implements LotoPointModel {
  unit: string | null;
  tagged: string | null;
  tagNumber: string | null;
  description: string | null;
  isoPos: ValueDto | null;
  normPos: ValueDto | null;
  specificLocation: string | null;
  standard: string | null;
  generalLocation: string | null;
  equipmentIdList: number[] | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  equipmentList: EquipmentDto[] | null;
  oldId: string | null;
  isUpdated: number | null;
  fileIds: string | null;
  conflictStatus: string | null;
  lotos: LotoDto[] | null;
  zeroEnergyMethod: string | null;

  zeroEnergy: ZeroEnergyModel | null;
  relatedLotoPointIds: number[] | null;
  location: ValueDto | null;
  eqType: ValueDto | null;
  counterpartId: number | null;

  constructor(data: Partial<LotoPointModel> = {}) {
    super(data); // This should handle id, name, objectType, and isVerified

    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    // this.isoPos = data.isoPos ? new ValueDto(data.isoPos) : null;
    // this.normPos = data.normPos ? new ValueDto(data.normPos) : null;
    this.isoPos = super.setNestedObjectById(data.isoPos, new ValueDto());
    this.normPos = super.setNestedObjectById(data.normPos, new ValueDto());
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;

    // Deserialize zeroEnergy with its nested objects
    if (data.zeroEnergy) {
      this.zeroEnergy = new ZeroEnergyDto(data.zeroEnergy);
    } else {
      this.zeroEnergy = null;
    }
    this.relatedLotoPointIds = data.relatedLotoPointIds ?? null;
    this.location = super.setNestedObjectById(data.location, new ValueDto());
    this.eqType = super.setNestedObjectById(data.eqType, new ValueDto());
    this.counterpartId = data.counterpartId ?? null;
  }

  // Serialization method
  override toJson(): any {
    return {
      id: this.id || 0,
      unit: this.unit || '',
      isVerified: this.isVerified || false,
      tagged: this.tagged || '',
      tagNumber: this.tagNumber || '',
      description: this.description || '',
      isoPos: this.isoPos?.toJson() || null,
      normPos: this.normPos?.toJson() || null,
      specificLocation: this.specificLocation || '',
      standard: this.standard || '',
      generalLocation: this.generalLocation || '',
      equipmentIdList: this.equipmentIdList || [],
      normalPosition: this.normalPosition || '',
      isolatedPosition: this.isolatedPosition || '',
      equipmentList: this.equipmentList
        ? Array.from(this.equipmentList)
            .filter((equipment) => equipment != null)
            .map((equipment) => equipment.toJson())
        : [],
      oldId: this.oldId || '',
      objectType: this.objectType || '',
      isUpdated: this.isUpdated || 0,
      fileIds: this.fileIds || '',
      conflictStatus: this.conflictStatus || '',
      lotos: this.lotos?.map((loto) => loto.toJson()),
      zeroEnergyMethod: this.zeroEnergyMethod || null,

      zeroEnergy: this.zeroEnergy || null,
      relatedLotoPointIds: this.relatedLotoPointIds || [],
      location: this.location?.toJson() || null,
      eqType: this.eqType?.toJson() || null,
      counterpartId: this.counterpartId || null,
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoPointDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoPointDto.fromJson');
      return new LotoPointDto();
    }

    return new LotoPointDto({
      id: json.id || 0,
      unit: json.unit || '',
      isVerified: json.isVerified || false,
      tagged: json.tagged || '',
      tagNumber: json.tagNumber || '',
      description: json.description || '',
      isoPos: json.isoPos ? ValueDto.fromJson(json.isoPos) : new ValueDto(),
      normPos: json.normPos ? ValueDto.fromJson(json.normPos) : new ValueDto(),
      specificLocation: json.specificLocation || '',
      standard: json.standard || '',
      generalLocation: json.generalLocation || '',
      equipmentIdList: Array.isArray(json.equipmentIdList)
        ? json.equipmentIdList
        : [],
      normalPosition: json.normalPosition || '',
      isolatedPosition: json.isolatedPosition || '',
      equipmentList: json.equipmentList
        ? json.equipmentList
            .filter((equipment: any) => equipment != null)
            .map((equipment: any) => {
              try {
                return EquipmentDto.fromJson(equipment);
              } catch (error) {
                console.warn('Error parsing EquipmentDto:', error);
                return null;
              }
            })
            .filter((equipment: EquipmentDto | null) => equipment !== null)
        : [],
      oldId: json.oldId || '',
      objectType: json.objectType || '',
      isUpdated: json.isUpdated || 0,
      fileIds: json.fileIds || '',
      conflictStatus: json.conflictStatus || '',
      lotos: Array.isArray(json.lotos)
        ? json.lotos.map((lotoJson: any) => LotoDto.fromJson(lotoJson))
        : [],
      zeroEnergyMethod: json.zeroEnergyMethod || null,

      zeroEnergy: json.zeroEnergy ? {
        id: json.zeroEnergy.id || 0,
        name: json.zeroEnergy.name || '',
        objectType: json.zeroEnergy.objectType || '',
        isVerified: json.zeroEnergy.isVerified || false,
        method: json.zeroEnergy.method || '',
        zeroEnergyTemplate: json.zeroEnergy.zeroEnergyTemplate
          ? ValueDto.fromJson(json.zeroEnergy.zeroEnergyTemplate)
          : new ValueDto(),
        templateEquipment: Array.isArray(json.zeroEnergy.templateEquipment)
          ? json.zeroEnergy.templateEquipment
              .filter((equipment: any) => equipment != null)
              .map((equipment: any) => {
                try {
                  return EquipmentDto.fromJson(equipment);
                } catch (error) {
                  console.warn('Error parsing ZeroEnergy EquipmentDto:', error);
                  return null;
                }
              })
              .filter((equipment: EquipmentDto | null) => equipment !== null)
          : [],
        templateEquipmentIds: Array.isArray(json.zeroEnergy.templateEquipmentIds)
          ? json.zeroEnergy.templateEquipmentIds
          : [],
      } : null,
      relatedLotoPointIds: Array.isArray(json.relatedLotoPointIds)
        ? json.relatedLotoPointIds
        : [],
      location: json.location
        ? ValueDto.fromJson(json.location)
        : new ValueDto(),
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : new ValueDto(),
      counterpartId: json.counterpartId || null,
    });
  }

  static toFormFields(
    dto: LotoPointDto,
    isoPosOptions: Option[],
    normPosOptions: Option[],
    fields: LotoPointFieldName[] = [
      'tagNumber',
      'description',
      'unit',
      'tagged',
      'isoPos',
      'normPos',
      'specificLocation',
      'standard',
      'generalLocation',
      'isVerified',
      'zeroEnergyMethod',
    ]
  ): LotoPointFormField[] {
    const allFields: { [key in LotoPointFieldName]: LotoPointFormField } = {
      tagNumber: {
        name: 'tagNumber',
        label: 'Tag Number',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.tagNumber,
      },
      description: {
        name: 'description',
        label: 'Description',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.description,
      },
      unit: {
        name: 'unit',
        label: 'Unit',
        type: 'text',
        initialValue: dto.unit,
      },
      tagged: {
        name: 'tagged',
        label: 'Tagged',
        type: 'text',
        initialValue: dto.tagged,
      },
      isoPos: {
        name: 'isoPos',
        label: 'Isolated Position',
        type: 'select',
        options: isoPosOptions,
        initialValue: dto.isoPos?.id || null,
      },
      normPos: {
        name: 'normPos',
        label: 'Normal Position',
        type: 'select',
        options: normPosOptions,
        initialValue: dto.normPos?.id || null,
      },
      specificLocation: {
        name: 'specificLocation',
        label: 'Specific Location',
        type: 'text',
        initialValue: dto.specificLocation,
      },
      standard: {
        name: 'standard',
        label: 'Standard',
        type: 'text',
        initialValue: dto.standard,
      },
      generalLocation: {
        name: 'generalLocation',
        label: 'General Location',
        type: 'text',
        initialValue: dto.generalLocation,
      },
      // Add other fields here...
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      equipmentIdList: {
        name: 'equipmentIdList',
        label: 'Equipment IDs',
        type: 'multi-select',
        initialValue: dto.equipmentIdList,
      },
      normalPosition: {
        name: 'normalPosition',
        label: 'Normal Position',
        type: 'text',
        initialValue: dto.normalPosition,
      },
      isolatedPosition: {
        name: 'isolatedPosition',
        label: 'Isolated Position',
        type: 'text',
        initialValue: dto.isolatedPosition,
      },
      oldId: {
        name: 'oldId',
        label: 'Old ID',
        type: 'text',
        initialValue: dto.oldId,
      },
      objectType: {
        name: 'objectType',
        label: 'Object Type',
        type: 'text',
        initialValue: dto.objectType,
      },
      isUpdated: {
        name: 'isUpdated',
        label: 'Is Updated',
        type: 'text',
        initialValue: dto.isUpdated,
      },
      fileIds: {
        name: 'fileIds',
        label: 'File IDs',
        type: 'text',
        initialValue: dto.fileIds,
      },
      conflictStatus: {
        name: 'conflictStatus',
        label: 'Conflict Status',
        type: 'text',
        initialValue: dto.conflictStatus,
      },
      equipmentList: {
        name: 'equipmentList',
        label: 'Equipment List',
        type: 'text',
      },
      lotos: { name: 'lotos', label: 'Lotos', type: 'text' },
      name: {
        name: 'name',
        label: 'Name',
        type: 'text',
        initialValue: dto.name,
      },
      isVerified: {
        name: 'isVerified',
        label: 'Is Verified',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: dto.isVerified?.toString(),
      },
      zeroEnergyMethod: {
        name: 'zeroEnergyMethod',
        label: 'Zero Energy Method',
        type: 'text',
        initialValue: dto.zeroEnergyMethod,
      },

      zeroEnergy: {
        name: 'zeroEnergy',
        label: 'Zero Energy',
        type: 'text',
        initialValue: dto.zeroEnergy,
      },
      relatedLotoPointIds: {
        name: 'relatedLotoPointIds',
        label: 'Related LOTO Point IDs',
        type: 'multi-select',
        initialValue: dto.relatedLotoPointIds,
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: [],
        initialValue: dto.location?.id || null,
      },
      eqType: {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: [],
        initialValue: dto.eqType?.id || null,
      },
      counterpartId: {
        name: 'counterpartId',
        label: 'Counterpart ID',
        type: 'text',
        initialValue: dto.counterpartId?.toString() || null,
      },
    };

    return fields.map((fieldName) => allFields[fieldName]);
  }

  // Add this method to the LotoPointDto class
  static toTableColumns(
    fields: LotoPointFieldName[] = [
      'unit',
      'tagNumber',
      'description',
      'specificLocation',
      'tagged',
      'lotos',
      'isoPos',
      'normPos',
    ]
  ): Column[] {
    const allColumns: { [key in LotoPointFieldName]: Column } = {
      unit: { id: 'unit', header: 'Unit', accessorKey: 'unit' },
      tagNumber: {
        id: 'tagNumber',
        header: 'Tag Number',
        accessorKey: 'tagNumber',
      },
      description: {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
      },
      specificLocation: {
        id: 'specificLocation',
        header: 'Specific Location',
        accessorKey: 'specificLocation',
      },
      tagged: { id: 'tagged', header: 'Tagging Status', accessorKey: 'tagged' },
      lotos: {
        id: 'lotos',
        header: 'LOTOs',
        accessorFn: (item: any) => {
          if (Array.isArray(item.lotos)) {
            return item.lotos.map((loto: any) => loto.workScope).join(', ');
          }
          return '';
        },
      },
      isoPos: { id: 'isoPos', header: 'ISO Pos', accessorKey: 'isoPos.name' },
      normPos: {
        id: 'normPos',
        header: 'Norm Pos',
        accessorKey: 'normPos.name',
      },
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      standard: { id: 'standard', header: 'Standard', accessorKey: 'standard' },
      generalLocation: {
        id: 'generalLocation',
        header: 'General Location',
        accessorKey: 'generalLocation',
      },
      equipmentIdList: {
        id: 'equipmentIdList',
        header: 'Equipment IDs',
        accessorKey: 'equipmentIdList',
      },
      normalPosition: {
        id: 'normalPosition',
        header: 'Normal Position',
        accessorKey: 'normalPosition',
      },
      isolatedPosition: {
        id: 'isolatedPosition',
        header: 'Isolated Position',
        accessorKey: 'isolatedPosition',
      },
      oldId: { id: 'oldId', header: 'Old ID', accessorKey: 'oldId' },
      objectType: {
        id: 'objectType',
        header: 'Object Type',
        accessorKey: 'objectType',
      },
      isUpdated: {
        id: 'isUpdated',
        header: 'Is Updated',
        accessorKey: 'isUpdated',
      },
      fileIds: { id: 'fileIds', header: 'File IDs', accessorKey: 'fileIds' },
      conflictStatus: {
        id: 'conflictStatus',
        header: 'Conflict Status',
        accessorKey: 'conflictStatus',
      },
      equipmentList: {
        id: 'equipmentList',
        header: 'Equipment List',
        accessorKey: 'equipmentList',
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: LotoPointDto) => (item.isVerified ? 'Yes' : 'No'),
        conditionalStyling: (item: any, column: Column) =>
          item.isVerified
            ? { 'background-color': '#90EE90' }
            : { 'background-color': '#FFCCCB' },
      },
      zeroEnergyMethod: {
        id: 'zeroEnergyMethod',
        header: 'Zero Energy Method',
        accessorKey: 'zeroEnergyMethod',
      },

      zeroEnergy: {
        id: 'zeroEnergy',
        header: 'Zero Energy',
        accessorKey: 'zeroEnergy.method',
      },
      relatedLotoPointIds: {
        id: 'relatedLotoPointIds',
        header: 'Related LOTO Point IDs',
        accessorKey: 'relatedLotoPointIds',
      },
      location: {
        id: 'location',
        header: 'Location',
        accessorKey: 'location.name',
      },
      eqType: {
        id: 'eqType',
        header: 'Equipment Type',
        accessorKey: 'eqType.name',
      },
      counterpartId: {
        id: 'counterpartId',
        header: 'Counterpart ID',
        accessorKey: 'counterpartId',
      },
    };

    return fields.map((fieldName) => allColumns[fieldName]);
  }

  static isValidKey(key: string): key is keyof LotoPointModel {
    const validKeys: (keyof LotoPointModel)[] = [
      'id',
      'unit',
      'tagged',
      'tagNumber',
      'description',
      'isoPos',
      'normPos',
      'specificLocation',
      'standard',
      'generalLocation',
      'equipmentIdList',
      'normalPosition',
      'isolatedPosition',
      'equipmentList',
      'oldId',
      'objectType',
      'isUpdated',
      'fileIds',
      'conflictStatus',
      'lotos',
      'isVerified',
      'zeroEnergyMethod',
      'counterpartId',
    ];
    return validKeys.includes(key as keyof LotoPointModel);
  }

  toIdModel(): LotoPointIdDto {
    const equipmentIds = this.equipmentList?.map((equipment) => equipment.id) || null;

    return new LotoPointIdDto({
      id: this.id,
      unit: this.unit,
      isVerified: this.isVerified,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos?.id || null,
      isoPosId: this.isoPos?.id || null,
      normPos: this.normPos?.id || null,
      normPosId: this.normPos?.id || null,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: equipmentIds,
      equipmentList: equipmentIds, // Both fields should have the same IDs
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      // fileIds: this.fileIds.split(',').map(id => id.trim()).filter(id => id !== ''),
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos?.map((loto) => loto.id) || null,
      lotoIds: this.lotos?.map((loto) => loto.id) || null, // Both fields should have the same IDs
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy ? {
        id: this.zeroEnergy.id || null,
        zeroEnergyTemplateId: typeof this.zeroEnergy.zeroEnergyTemplate === 'number'
          ? this.zeroEnergy.zeroEnergyTemplate
          : this.zeroEnergy.zeroEnergyTemplate?.id || null,
        templateEquipmentIds: this.zeroEnergy.templateEquipment?.map((eq: any) => eq.id).filter((id: any) => id != null) || []
      } : null,
      location: this.location?.id || null,
      eqType: this.eqType?.id || null,
      counterpartId: this.counterpartId || null,
    });
  }
  toOption(): Option {
    const label: string =
      this.tagNumber && this.description
        ? `${this.tagNumber} - ${this.description}`
        : this.tagNumber || this.description || 'No Tag Number or Description';
    return {
      value: this.id,
      label: label,
    };
  }

  applyPresetValue(equipment: LotoPointDto): LotoPointDto {
    Object.keys(equipment).forEach((key) => {
      if (LotoPointDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            if (value.id) {
              (this[key] as any) = value;
            }
          } else {
            (this[key] as any) = value;
          }
        }
      }
    });
    return this;
  }

  // You can add methods here for any LOTO point-specific operations
}
