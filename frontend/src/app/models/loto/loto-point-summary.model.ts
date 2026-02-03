import { BaseModel } from '../base/base.model';

/**
 * Lightweight model for LOTO Point menu display
 * Contains only essential fields needed for grouping and display
 * Significantly reduces payload size compared to full LotoPointDto
 */
export interface LotoPointSummaryModel extends BaseModel {
  tagNumber: string;
  description: string;
  isVerified: boolean;
  isLabeled: boolean;
  isLockable: boolean;
  isProcessed: boolean;

  // Grouping fields
  equipmentType: string;
  location: string;
  system: string;
  unit: string;
  zeroEnergyMethod: string | null;
  fileName: string;

  // Equipment IDs for conflict detection
  equipmentIds: number[];
}

export class LotoPointSummaryDto implements LotoPointSummaryModel {
  id!: number;
  name!: string;
  objectType!: string;
  isVerified!: boolean;
  isLabeled!: boolean;
  isLockable!: boolean;
  isProcessed!: boolean;

  tagNumber!: string;
  description!: string;
  equipmentType!: string;
  location!: string;
  system!: string;
  unit!: string;
  zeroEnergyMethod!: string | null;
  fileName!: string;
  equipmentIds!: number[];

  constructor(data: Partial<LotoPointSummaryDto> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.objectType = data.objectType ?? 'LotoPointSummary';
    this.isVerified = data.isVerified ?? false;
    this.isLabeled = data.isLabeled ?? false;
    this.isLockable = data.isLockable ?? false;
    this.isProcessed = data.isProcessed ?? false;

    this.tagNumber = data.tagNumber ?? '';
    this.description = data.description ?? '';
    this.equipmentType = data.equipmentType ?? '';
    this.location = data.location ?? '';
    this.system = data.system ?? '';
    this.unit = data.unit ?? '';
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    this.fileName = data.fileName ?? '';
    this.equipmentIds = data.equipmentIds ?? [];
  }

  static fromJson(json: any): LotoPointSummaryDto {
    if (!json) {
      return new LotoPointSummaryDto();
    }

    return new LotoPointSummaryDto({
      id: json.id,
      name: json.name || json.tagNumber || '',
      objectType: json.objectType || 'LotoPointSummary',
      isVerified: json.isVerified ?? false,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      tagNumber: json.tagNumber || '',
      description: json.description || '',
      equipmentType: json.equipmentType || '',
      location: json.location || '',
      system: json.system || '',
      unit: json.unit || '',
      zeroEnergyMethod: json.zeroEnergyMethod,
      fileName: json.fileName || '',
      equipmentIds: json.equipmentIds || []
    });
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      isVerified: this.isVerified,
      isLabeled: this.isLabeled,
      isLockable: this.isLockable,
      isProcessed: this.isProcessed,
      tagNumber: this.tagNumber,
      description: this.description,
      equipmentType: this.equipmentType,
      location: this.location,
      system: this.system,
      unit: this.unit,
      zeroEnergyMethod: this.zeroEnergyMethod,
      fileName: this.fileName,
      equipmentIds: this.equipmentIds
    };
  }
}
