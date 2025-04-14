import { ValueDto } from '../value.model';
import { LotoPointDto } from '../loto/loto-point.model';

export interface EquipmentModel {
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: ValueDto;
  files: string[];
  vendor: ValueDto;
  location: ValueDto;
  system: ValueDto;
  coordinates: string;
  originalPictureSize: string;
  mainFile: string;
  lotoPoints: Set<LotoPointDto>;
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;
}

export class EquipmentDto implements EquipmentModel {
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: ValueDto;
  files: string[];
  vendor: ValueDto;
  location: ValueDto;
  system: ValueDto;
  coordinates: string;
  originalPictureSize: string;
  mainFile: string;
  lotoPoints: Set<LotoPointDto>;
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;

  constructor(data: Partial<EquipmentModel> = {}) {
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
    this.specificLocation = data.specificLocation || '';
    this.eqType = data.eqType || new ValueDto();
    this.files = data.files || [];
    this.vendor = data.vendor || new ValueDto();
    this.location = data.location || new ValueDto();
    this.system = data.system || new ValueDto();
    this.coordinates = data.coordinates || '';
    this.originalPictureSize = data.originalPictureSize || '';
    this.mainFile = data.mainFile || '';
    this.lotoPoints = data.lotoPoints || new Set<LotoPointDto>();
    this.isUpdated = data.isUpdated || '';
    this.conflictStatus = data.conflictStatus || '';
    this.isVerified = data.isVerified || false;
  }

  // Serialization method
  toJson(): any {
    return {
      tagNumber: this.tagNumber,
      description: this.description,
      specificLocation: this.specificLocation,
      eqType: this.eqType.toJson(),
      files: this.files,
      vendor: this.vendor.toJson(),
      location: this.location.toJson(),
      system: this.system.toJson(),
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      mainFile: this.mainFile,
      lotoPoints: Array.from(this.lotoPoints).map(point => point.toJson()),
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): EquipmentDto {
    return new EquipmentDto({
      tagNumber: json.tagNumber,
      description: json.description,
      specificLocation: json.specificLocation,
      eqType: ValueDto.fromJson(json.eqType),
      files: json.files,
      vendor: ValueDto.fromJson(json.vendor),
      location: ValueDto.fromJson(json.location),
      system: ValueDto.fromJson(json.system),
      coordinates: json.coordinates,
      originalPictureSize: json.originalPictureSize,
      mainFile: json.mainFile,
      lotoPoints: new Set(json.lotoPoints.map((point: any) => LotoPointDto.fromJson(point))),
      isUpdated: json.isUpdated,
      conflictStatus: json.conflictStatus,
      isVerified: json.isVerified
    });
  }

  // You can add methods here for any equipment-specific operations
}