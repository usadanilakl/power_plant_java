import { BaseDto } from '../base/base.model';
import { EquipmentDto } from './equipment.model';

export class EquipmentIdDto extends BaseDto {
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  eqTypeId: number | null;
  files: string[] | null;
  vendorId: number | null;
  locationId: number | null;
  systemId: number | null;
  coordinates: string | null;
  originalPictureSize: string | null;
  rotation: number | null;
  mainFile: string | null;
  mainFileId: number | null;
  lotoPointIds: number[] | null;
  isUpdated: string | null;
  conflictStatus: string | null;

  constructor(data: Partial<EquipmentIdDto> = {}) {
    super(data);
    this.tagNumber = data.tagNumber || null;
    this.description = data.description || null;
    this.specificLocation = data.specificLocation || null;
    this.eqTypeId = data.eqTypeId || null;
    this.files = data.files || null;
    this.vendorId = data.vendorId || null;
    this.locationId = data.locationId || null;
    this.systemId = data.systemId || null;
    this.coordinates = data.coordinates || null;
    this.originalPictureSize = data.originalPictureSize || null;
    this.rotation = data.rotation || null;
    this.mainFile = data.mainFile || null;
    this.mainFileId = data.mainFileId || null;
    this.lotoPointIds = data.lotoPointIds || null;
    this.isUpdated = data.isUpdated || null;
    this.conflictStatus = data.conflictStatus || null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      tagNumber: this.tagNumber || null,
      description: this.description || null,
      specificLocation: this.specificLocation || null,
      eqTypeId: this.eqTypeId || null,
      files: this.files || null,
      vendorId: this.vendorId || null,
      locationId: this.locationId || null,
      systemId: this.systemId || null,
      coordinates: this.coordinates || null,
      originalPictureSize: this.originalPictureSize || null,
      rotation: this.rotation || null,
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPointIds: this.lotoPointIds || null,
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
    };
  }

  static override fromJson(json: any): EquipmentIdDto {
    if (!json) {
      console.warn('Received null or undefined json in EquipmentIdDto.fromJson');
      return new EquipmentIdDto();
    }

    return new EquipmentIdDto({
      ...super.fromJson(json),
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      specificLocation: json.specificLocation || null,
      eqTypeId: json.eqTypeId || null,
      files: json.files || null,
      vendorId: json.vendorId || null,
      locationId: json.locationId || null,
      systemId: json.systemId || null,
      coordinates: json.coordinates || null,
      originalPictureSize: json.originalPictureSize || null,
      rotation: json.rotation || null,
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPointIds: json.lotoPointIds || null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
    });
  }
}