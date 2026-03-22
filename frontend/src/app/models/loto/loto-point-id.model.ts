import { BaseDto } from '../base/base.model';

export class LotoPointIdDto extends BaseDto {
  unit: string | null;
  tagged: string | null;
  tagNumber: string | null;
  description: string | null;
  isoPos: number | null;
  normPos: number | null;
  isoPosId: number | null;
  normPosId: number | null;
  specificLocation: string | null;
  standard: string | null;
  generalLocation: string | null;
  equipmentIdList: number[] | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  characteristicsJson: string | null;
  equipmentList: number[] | null;
  oldId: string | null;
  isUpdated: number | null;
  fileIds: string | null;
  conflictStatus: string | null;
  lotos: number[] | null;
  lotoIds: number[] | null;
  zeroEnergyMethod: string | null;
  zeroEnergy: {
    id: number | null;
    zeroEnergyTemplateId: number | null;
    templateEquipmentIds: number[];
    editShared?: boolean;
  } | null;
  location: number | null;
  eqType: number | null;
  counterpartId: number | null;
  isLabeled: boolean | null;
  isLockable: boolean | null;
  isProcessed: boolean | null;
  processingStatus: number | null;

  constructor(data: Partial<LotoPointIdDto> = {}) {
    // console.log('Creating LotoPointIdDto',data);
    super(data);

    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = data.isoPos ?? null;
    this.normPos = data.normPos ?? null;
    this.isoPosId = data.isoPosId ?? null;
    this.normPosId = data.normPosId ?? null;
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.characteristicsJson = data.characteristicsJson ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.lotoIds = data.lotoIds ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod?? null;
    this.zeroEnergy = data.zeroEnergy ?? null;
    this.location = data.location ?? null;
    this.eqType = data.eqType ?? null;
    this.counterpartId = data.counterpartId ?? null;
    this.isLabeled = data.isLabeled ?? null;
    this.isLockable = data.isLockable ?? null;
    this.isProcessed = data.isProcessed ?? null;
    this.processingStatus = data.processingStatus ?? null;
  }


// export class LotoPointIdDto extends BaseDto {
//   unit: string;
//   tagged: string;
//   tagNumber: string;
//   description: string;
//   isoPos: number | null;
//   normPosId: number | null;
//   specificLocation: string;
//   standard: string;
//   generalLocation: string;
//   equipmentIdList: number[];
//   normalPosition: string;
//   isolatedPosition: string;
//   oldId: string;
//   isUpdated: number;
//   fileIds: string;
//   conflictStatus: string;
//   lotoIds: number[];

//   constructor(data: Partial<LotoPointIdDto> = {}) {
//     super(data);
//     this.unit = data.unit || '';
//     this.tagged = data.tagged || '';
//     this.tagNumber = data.tagNumber || '';
//     this.description = data.description || '';
//     this.isoPos = data.isoPos || null;
//     this.normPosId = data.normPosId || null;
//     this.specificLocation = data.specificLocation || '';
//     this.standard = data.standard || '';
//     this.generalLocation = data.generalLocation || '';
//     this.equipmentIdList = data.equipmentIdList || [];
//     this.normalPosition = data.normalPosition || '';
//     this.isolatedPosition = data.isolatedPosition || '';
//     this.oldId = data.oldId || '';
//     this.objectType = data.objectType || '';
//     this.isUpdated = data.isUpdated || 0;
//     this.fileIds = data.fileIds || '';
//     this.conflictStatus = data.conflictStatus || '';
//     this.lotoIds = data.lotoIds || [];
//   }



  override toJson(): any {
    return {
      ...super.toJson(),
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos,
      normPos: this.normPos,
      isoPosId: this.isoPosId,
      normPosId: this.normPosId,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      characteristicsJson: this.characteristicsJson,
      equipmentList: this.equipmentList,
      oldId: this.oldId,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos,
      lotoIds: this.lotoIds,
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy,
      location: this.location,
      eqType: this.eqType,
      counterpartId: this.counterpartId,
      isLabeled: this.isLabeled,
      isLockable: this.isLockable,
      isProcessed: this.isProcessed,
      processingStatus: this.processingStatus,
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
      isoPos: json.isoPos,
      normPos: json.normPos,
      isoPosId: json.isoPosId,
      normPosId: json.normPosId,
      specificLocation: json.specificLocation,
      standard: json.standard,
      generalLocation: json.generalLocation,
      equipmentIdList: json.equipmentIdList || [],
      normalPosition: json.normalPosition,
      isolatedPosition: json.isolatedPosition,
      characteristicsJson: json.characteristicsJson || null,
      equipmentList: json.equipmentList || [],
      oldId: json.oldId,
      isUpdated: json.isUpdated,
      fileIds: json.fileIds || "",
      conflictStatus: json.conflictStatus,
      lotos: json.lotos || [],
      lotoIds: json.lotoIds || [],
      zeroEnergyMethod: json.zeroEnergyMethod,
      zeroEnergy: json.zeroEnergy,
      location: json.location,
      eqType: json.eqType,
      counterpartId: json.counterpartId,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      processingStatus: json.processingStatus ?? null,
    });
  }
}