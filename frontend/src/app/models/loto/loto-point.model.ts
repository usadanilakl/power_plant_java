import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';

export interface LotoPointModel {
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
  toJson(): any {
    return {
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos.toJson(),
      normPos: this.normPos.toJson(),
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      equipmentList: Array.from(this.equipmentList).map(equipment => equipment.toJson()),
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): LotoPointDto {
    return new LotoPointDto({
      unit: json.unit,
      tagged: json.tagged,
      tagNumber: json.tagNumber,
      description: json.description,
      isoPos: ValueDto.fromJson(json.isoPos),
      normPos: ValueDto.fromJson(json.normPos),
      specificLocation: json.specificLocation,
      standard: json.standard,
      generalLocation: json.generalLocation,
      equipmentIdList: json.equipmentIdList,
      normalPosition: json.normalPosition,
      isolatedPosition: json.isolatedPosition,
      equipmentList: new Set(json.equipmentList.map((equipment: any) => EquipmentDto.fromJson(equipment))),
      oldId: json.oldId,
      objectType: json.objectType,
      isUpdated: json.isUpdated,
      fileIds: json.fileIds,
      conflictStatus: json.conflictStatus
    });
  }

  // You can add methods here for any LOTO point-specific operations
}