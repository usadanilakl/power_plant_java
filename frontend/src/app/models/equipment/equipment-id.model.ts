import { BaseDto } from '../base/base.model';

export class EquipmentIdDto extends BaseDto {
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqTypeId: number;
  files: string[];
  vendorId: number;
  locationId: number;
  systemId: number;
  coordinates: string;
  originalPictureSize: string;
  mainFile: string;
  lotoPointIds: number[];
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;

  constructor(data: Partial<EquipmentIdDto> = {}) {
    super(data);
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
    this.specificLocation = data.specificLocation || '';
    this.eqTypeId = data.eqTypeId || 0;
    this.files = data.files || [];
    this.vendorId = data.vendorId || 0;
    this.locationId = data.locationId || 0;
    this.systemId = data.systemId || 0;
    this.coordinates = data.coordinates || '';
    this.originalPictureSize = data.originalPictureSize || '';
    this.mainFile = data.mainFile || '';
    this.lotoPointIds = data.lotoPointIds || [];
    this.isUpdated = data.isUpdated || '';
    this.conflictStatus = data.conflictStatus || '';
    this.isVerified = data.isVerified || false;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      tagNumber: this.tagNumber,
      description: this.description,
      specificLocation: this.specificLocation,
      eqTypeId: this.eqTypeId,
      files: this.files,
      vendorId: this.vendorId,
      locationId: this.locationId,
      systemId: this.systemId,
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      mainFile: this.mainFile,
      lotoPointIds: this.lotoPointIds,
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified
    };
  }

  static override fromJson(json: any): EquipmentIdDto {
    if (!json) {
      console.warn('Received null or undefined json in EquipmentIdDto.fromJson');
      return new EquipmentIdDto();
    }

    return new EquipmentIdDto({
      ...super.fromJson(json),
      tagNumber: json.tagNumber,
      description: json.description,
      specificLocation: json.specificLocation,
      eqTypeId: json.eqTypeId,
      files: json.files || [],
      vendorId: json.vendorId,
      locationId: json.locationId,
      systemId: json.systemId,
      coordinates: json.coordinates,
      originalPictureSize: json.originalPictureSize,
      mainFile: json.mainFile,
      lotoPointIds: json.lotoPointIds || [],
      isUpdated: json.isUpdated,
      conflictStatus: json.conflictStatus,
      isVerified: json.isVerified
    });
  }
}