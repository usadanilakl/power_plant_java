import { BasePermitIdDto } from '../base/base-permit-id.model';
import { BaseDto } from '../base/base.model';

export class LotoPointIdDto extends BaseDto {
  unit: string;
  tagged: string;
  tagNumber: string;
  description: string;
  isoPosId: number | null;
  normPosId: number | null;
  specificLocation: string;
  standard: string;
  generalLocation: string;
  equipmentIdList: number[];
  normalPosition: string;
  isolatedPosition: string;
  oldId: string;
  isUpdated: number;
  fileIds: string[];
  conflictStatus: string;
  lotoIds: number[];

  constructor(data: Partial<LotoPointIdDto> = {}) {
    super(data);
    this.unit = data.unit || '';
    this.tagged = data.tagged || '';
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
    this.isoPosId = data.isoPosId || null;
    this.normPosId = data.normPosId || null;
    this.specificLocation = data.specificLocation || '';
    this.standard = data.standard || '';
    this.generalLocation = data.generalLocation || '';
    this.equipmentIdList = data.equipmentIdList || [];
    this.normalPosition = data.normalPosition || '';
    this.isolatedPosition = data.isolatedPosition || '';
    this.oldId = data.oldId || '';
    this.objectType = data.objectType || '';
    this.isUpdated = data.isUpdated || 0;
    this.fileIds = data.fileIds || [];
    this.conflictStatus = data.conflictStatus || '';
    this.lotoIds = data.lotoIds || [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPosId: this.isoPosId,
      normPosId: this.normPosId,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotoIds: this.lotoIds
    };
  }

  static override fromJson(json: any): LotoPointIdDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoPointIdDto.fromJson');
      return new LotoPointIdDto();
    }

    return new LotoPointIdDto({
      ...super.fromJson(json),
      unit: json.unit,
      tagged: json.tagged,
      tagNumber: json.tagNumber,
      description: json.description,
      isoPosId: json.isoPosId,
      normPosId: json.normPosId,
      specificLocation: json.specificLocation,
      standard: json.standard,
      generalLocation: json.generalLocation,
      equipmentIdList: json.equipmentIdList || [],
      normalPosition: json.normalPosition,
      isolatedPosition: json.isolatedPosition,
      oldId: json.oldId,
      objectType: json.objectType,
      isUpdated: json.isUpdated,
      fileIds: json.fileIds || [],
      conflictStatus: json.conflictStatus,
      lotoIds: json.lotoIds || []
    });
  }
}