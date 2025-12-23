import { BaseDto, BaseModel } from '../../base/base.model';
import { EquipmentDto } from '../../equipment/equipment.model';
import { ValueDto } from '../../value.model';
import { ZeroEnergyModel } from './zero-energy.model';

export interface LotoPointExtendedModel extends BaseModel {
  unit: string | null;
  tagged: string | null;
  tagNumber: string | null;
  description: string | null;
  isoPos: ValueDto | null;
  normPos: ValueDto | null;
  specificLocation: string | null;
  generalLocation: string | null;
  equipmentIdList: number[] | null;
  equipmentList: EquipmentDto[] | null;
  fileIds: string | null;
  zeroEnergy: ZeroEnergyModel | null;
}

export class LotoPointExtendedDto
  extends BaseDto
  implements LotoPointExtendedModel
{
  unit: string | null = null;
  tagged: string | null = null;
  tagNumber: string | null = null;
  description: string | null = null;
  isoPos: ValueDto | null = null;
  normPos: ValueDto | null = null;
  specificLocation: string | null = null;
  generalLocation: string | null = null;
  equipmentIdList: number[] | null = null;
  equipmentList: EquipmentDto[] | null = null;
  isUpdated: number | null = null;
  fileIds: string | null = null;
  conflictStatus: string | null = null;
  zeroEnergyMethod: string | null = null;
  standard: string | null = null;
  normalPosition: string | null = null;
  isolatedPosition: string | null = null;
  oldId: string | null = null;
  lotos: any[] | null = null;
  zeroEnergy: ZeroEnergyModel | null = null;

  constructor(data: Partial<LotoPointExtendedModel> = {}) {
    super(data);

    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = super.setNestedObjectById(data.isoPos, new ValueDto());
    this.normPos = super.setNestedObjectById(data.normPos, new ValueDto());
    this.specificLocation = data.specificLocation ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.fileIds = data.fileIds ?? null;
    this.zeroEnergy = data.zeroEnergy ?? null;
  }

  /**
   * Converts the DTO to an ID model for API requests
   */
  toIdModel(): any {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      isVerified: this.isVerified,
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos?.id ?? null,
      normPos: this.normPos?.id ?? null,
      specificLocation: this.specificLocation,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      fileIds: this.fileIds,
      zeroEnergyId: this.zeroEnergy?.id ?? null,
    };
  }

  /**
   * Static method to create instance from API response
   */
  static fromResponse(data: any): LotoPointExtendedDto {
    return new LotoPointExtendedDto(data);
  }

  /**
   * Check if required fields are valid
   */
  isValid(): boolean {
    return !!(
      this.tagNumber &&
      this.description &&
      this.specificLocation &&
      this.isoPos?.id &&
      this.normPos?.id
    );
  }
}
