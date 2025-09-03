import { BaseDto, BaseModel } from './base.model';
import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { UserDto } from '../user.model';
import { BasePermitIdDto } from './base-permit-id.model';

export interface BasePermitModel extends BaseModel {
  workScope: string;
  system: ValueDto;
  equipment: EquipmentDto[];
  requestor: UserDto;
  controlAuthority: UserDto;
  permitType: ValueDto;
  docNum: number;
  permitStatus: ValueDto;
  temp: boolean;
}

export class BasePermitDto extends BaseDto implements BasePermitModel {
  workScope: string;
  system: ValueDto;
  equipment: EquipmentDto[];
  requestor: UserDto;
  controlAuthority: UserDto;
  permitType: ValueDto;
  docNum: number;
  permitStatus: ValueDto;
  temp: boolean;

  constructor(data: Partial<BasePermitModel> = {}) {
    super(data);
    this.workScope = data.workScope || '';
    this.system = data.system || new ValueDto();
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || new UserDto();
    this.controlAuthority = data.controlAuthority || new UserDto();
    this.permitType = data.permitType || new ValueDto();
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || new ValueDto();
    this.temp = data.temp || false;
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      workScope: this.workScope ?? '',
      system: this.system?.toJson() ?? null,
      equipment: this.equipment?.map(eq => eq?.toJson() ?? null).filter(Boolean) ?? [],
      requestor: new UserDto(this.requestor)?.toJson() ?? null,
      controlAuthority: new UserDto(this.controlAuthority)?.toJson() ?? null,
      permitType: this.permitType?.toJson() ?? null,
      docNum: this.docNum ?? 0,
      permitStatus: new ValueDto(this.permitStatus)?.toJson() ?? null,
      temp: this.temp ?? false
    };
  }

  // Override fromJson method
  static override fromJson(json: any): BasePermitDto {
    if (!json) {
      console.warn('Received null or undefined json in BasePermitDto.fromJson');
      return new BasePermitDto();
    }

    return new BasePermitDto({
      ...super.fromJson(json),
      workScope: json.workScope || '',
      system: ValueDto.fromJson(json.system),
      equipment: (json.equipment || []).map((eq: any) => EquipmentDto.fromJson(eq)),
      requestor: UserDto.fromJson(json.requestor),
      controlAuthority: UserDto.fromJson(json.controlAuthority),
      permitType: ValueDto.fromJson(json.permitType),
      docNum: json.docNum || 0,
      permitStatus: ValueDto.fromJson(json.permitStatus),
      temp: json.temp || false
    });
  }

  toIdModel(): BasePermitIdDto {
    return new BasePermitIdDto({
      ...this.toJson(),
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      system: this.system.id,
      equipment: this.equipment.map(eq => eq.id),
      requestor: this.requestor.id,
      controlAuthority: this.controlAuthority.id,
      permitType: this.permitType.id,
      permitStatus: this.permitStatus.id
    });
  }

}