import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { JsonpClientBackend } from '@angular/common/http';

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
      conflictStatus: this.conflictStatus || ''
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
      conflictStatus: json.conflictStatus || ''
    });
  }

  // You can add methods here for any LOTO point-specific operations
}