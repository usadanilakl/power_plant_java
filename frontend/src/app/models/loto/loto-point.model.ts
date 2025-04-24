import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { JsonpClientBackend } from '@angular/common/http';
import { LotoDto } from './loto.model';
import { ValidatorFn, Validators } from '@angular/forms';
import { Option } from '../option.model';
import { LotoPointIdDto } from './loto-point-id.model';

type LotoPointFieldName = keyof LotoPointModel;

export interface LotoPointModel {
  id: number;
  unit: string;
  tagged: string;
  tagNumber: string;
  description: string;
  isoPos: ValueDto;
  normPos: ValueDto;
  specificLocation: string;
  standard: string;
  generalLocation: string;
  equipmentIdList: number[];
  normalPosition: string;
  isolatedPosition: string;
  equipmentList: Set<EquipmentDto>;
  oldId: string;
  objectType: string;
  isUpdated: number;
  fileIds: string;
  conflictStatus: string;
  lotos: LotoDto[];
}

export interface LotoPointFormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multi-select';
  validators?: ValidatorFn[];
  options?: { value: string; label: string }[];
  initialValue?: any;
}

export class LotoPointDto implements LotoPointModel {
  id: number;
  unit: string;
  tagged: string;
  tagNumber: string;
  description: string;
  isoPos: ValueDto;
  normPos: ValueDto;
  specificLocation: string;
  standard: string;
  generalLocation: string;
  equipmentIdList: number[];
  normalPosition: string;
  isolatedPosition: string;
  equipmentList: Set<EquipmentDto>;
  oldId: string;
  objectType: string;
  isUpdated: number;
  fileIds: string;
  conflictStatus: string;
  lotos: LotoDto[];

  constructor(data: Partial<LotoPointModel> = {}) {
    this.id = data.id || 0;
    this.unit = data.unit || '';
    this.tagged = data.tagged || '';
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
    this.isoPos = data.isoPos || new ValueDto();
    this.normPos = data.normPos || new ValueDto();
    this.specificLocation = data.specificLocation || '';
    this.standard = data.standard || '';
    this.generalLocation = data.generalLocation || '';
    this.equipmentIdList = data.equipmentIdList || [];
    this.normalPosition = data.normalPosition || '';
    this.isolatedPosition = data.isolatedPosition || '';
    this.equipmentList = data.equipmentList || new Set<EquipmentDto>();
    this.oldId = data.oldId || '';
    this.objectType = data.objectType || '';
    this.isUpdated = data.isUpdated || 0;
    this.fileIds = data.fileIds || '';
    this.conflictStatus = data.conflictStatus || '';
    this.lotos = data.lotos || [];
  }

  // Serialization method
  // Serialization method
  toJson(): any {
    return {
      id: this.id || 0,
      unit: this.unit || '',
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
            .filter(equipment => equipment != null)
            .map(equipment => equipment.toJson())
        : [],
      oldId: this.oldId || '',
      objectType: this.objectType || '',
      isUpdated: this.isUpdated || 0,
      fileIds: this.fileIds || '',
      conflictStatus: this.conflictStatus || '',
      lotos: this.lotos.map(loto => loto.toJson())
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): LotoPointDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoPointDto.fromJson');
      return new LotoPointDto();
    }
  
    return new LotoPointDto({
      id: json.id || 0,
      unit: json.unit || '',
      tagged: json.tagged || '',
      tagNumber: json.tagNumber || '',
      description: json.description || '',
      isoPos: json.isoPos ? ValueDto.fromJson(json.isoPos) : new ValueDto(),
      normPos: json.normPos ? ValueDto.fromJson(json.normPos) : new ValueDto(),
      specificLocation: json.specificLocation || '',
      standard: json.standard || '',
      generalLocation: json.generalLocation || '',
      equipmentIdList: Array.isArray(json.equipmentIdList) ? json.equipmentIdList : [],
      normalPosition: json.normalPosition || '',
      isolatedPosition: json.isolatedPosition || '',
      equipmentList: new Set(
        Array.isArray(json.equipmentList)
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
          : []
      ),
      oldId: json.oldId || '',
      objectType: json.objectType || '',
      isUpdated: json.isUpdated || 0,
      fileIds: json.fileIds || '',
      conflictStatus: json.conflictStatus || '',
      lotos: Array.isArray(json.lotos)? json.lotos.map((lotoJson: any) => LotoDto.fromJson(lotoJson)): []
    });
  }

  
  static toFormFields(
    dto: LotoPointDto, 
    isoPosOptions: Option[], 
    normPosOptions: Option[],
    fields: LotoPointFieldName[] = ['tagNumber', 'description', 'unit', 'tagged', 'isoPos', 'normPos', 'specificLocation', 'standard', 'generalLocation']
  ): LotoPointFormField[] {
    const allFields: { [key in LotoPointFieldName]: LotoPointFormField } = {
      tagNumber: { name: 'tagNumber', label: 'Tag Number', type: 'text', validators: [Validators.required], initialValue: dto.tagNumber },
      description: { name: 'description', label: 'Description', type: 'text', validators: [Validators.required], initialValue: dto.description },
      unit: { name: 'unit', label: 'Unit', type: 'text', initialValue: dto.unit },
      tagged: { name: 'tagged', label: 'Tagged', type: 'text', initialValue: dto.tagged },
      isoPos: {
        name: 'isoPos',
        label: 'Isolated Position',
        type: 'select',
        options: isoPosOptions,
        initialValue: dto.isoPos?.id || null
      },
      normPos: {
        name: 'normPos',
        label: 'Normal Position',
        type: 'select',
        options: normPosOptions,
        initialValue: dto.normPos?.id || null
      },
      specificLocation: { name: 'specificLocation', label: 'Specific Location', type: 'text', initialValue: dto.specificLocation },
      standard: { name: 'standard', label: 'Standard', type: 'text', initialValue: dto.standard },
      generalLocation: { name: 'generalLocation', label: 'General Location', type: 'text', initialValue: dto.generalLocation },
      // Add other fields here...
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      equipmentIdList: { name: 'equipmentIdList', label: 'Equipment IDs', type: 'multi-select', initialValue: dto.equipmentIdList },
      normalPosition: { name: 'normalPosition', label: 'Normal Position', type: 'text', initialValue: dto.normalPosition },
      isolatedPosition: { name: 'isolatedPosition', label: 'Isolated Position', type: 'text', initialValue: dto.isolatedPosition },
      oldId: { name: 'oldId', label: 'Old ID', type: 'text', initialValue: dto.oldId },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      isUpdated: { name: 'isUpdated', label: 'Is Updated', type: 'text', initialValue: dto.isUpdated },
      fileIds: { name: 'fileIds', label: 'File IDs', type: 'text', initialValue: dto.fileIds },
      conflictStatus: { name: 'conflictStatus', label: 'Conflict Status', type: 'text', initialValue: dto.conflictStatus },
      equipmentList: { name: 'equipmentList', label: 'Equipment List', type: 'text',   },
      lotos: { name: 'lotos', label: 'Lotos', type: 'text',   }
    };
  
    return fields.map(fieldName => allFields[fieldName]);
  }

  static isValidKey(key: string): key is keyof LotoPointModel {
    const validKeys: (keyof LotoPointModel)[] = [
      'id', 'unit', 'tagged', 'tagNumber', 'description', 'isoPos', 'normPos',
      'specificLocation', 'standard', 'generalLocation', 'equipmentIdList',
      'normalPosition', 'isolatedPosition', 'equipmentList', 'oldId',
      'objectType', 'isUpdated', 'fileIds', 'conflictStatus', 'lotos'
    ];
    return validKeys.includes(key as keyof LotoPointModel);
  }

  toIdModel(): LotoPointIdDto {
    return new LotoPointIdDto({
      id: this.id,
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPosId: this.isoPos?.id || null,
      normPosId: this.normPos?.id || null,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds.split(',').map(id => id.trim()).filter(id => id !== ''),
      conflictStatus: this.conflictStatus,
      lotoIds: this.lotos.map(loto => loto.id)
    });
  }



  // You can add methods here for any LOTO point-specific operations
}