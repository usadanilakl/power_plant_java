import { BaseDto, BaseModel } from '../base/base.model';

export interface EspDeviceModel extends BaseModel {
  ipAddress: string;
  name: string;
  isActive: boolean;
  description: string;
}

export class EspDeviceDto extends BaseDto implements EspDeviceModel {
  ipAddress: string;
  isActive: boolean;
  description: string;

  constructor(data: Partial<EspDeviceModel> = {}) {
    super(data);
    this.ipAddress = data.ipAddress || '';
    this.name = data.name || '';
    this.isActive = data.isActive ?? true;
    this.description = data.description || '';
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      ipAddress: this.ipAddress,
      name: this.name,
      isActive: this.isActive,
      description: this.description
    };
  }

  static override fromJson(json: any): EspDeviceDto {
    if (!json) {
      return new EspDeviceDto();
    }

    return new EspDeviceDto({
      ...super.fromJson(json),
      ipAddress: json.ipAddress,
      name: json.name,
      isActive: json.isActive,
      description: json.description
    });
  }
}
