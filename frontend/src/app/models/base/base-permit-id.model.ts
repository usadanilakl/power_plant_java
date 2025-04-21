import { BaseDto } from './base.model';

export class BasePermitIdDto extends BaseDto {
  workScope: string;
  system: number;
  equipment: number [];
  requestor: number;
  controlAuthority: number;
  permitType: number;
  docNum: number;
  permitStatus: number;
  temp: boolean;

  constructor(data: Partial<BasePermitIdDto> = {}) {
    super(data);
    this.workScope = data.workScope || '';
    this.system = data.system || 0;
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || 0;
    this.controlAuthority = data.controlAuthority || 0;
    this.permitType = data.permitType || 0;
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || 0;
    this.temp = data.temp || false;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      workScope: this.workScope,
      system: this.system,
      equipment: this.equipment,
      requestor: this.requestor,
      controlAuthority: this.controlAuthority,
      permitType: this.permitType,
      docNum: this.docNum,
      permitStatus: this.permitStatus,
      temp: this.temp
    };
  }

  static override fromJson(json: any): BasePermitIdDto {
    if (!json) {
      console.warn('Received null or undefined json in BasePermitIdDto.fromJson');
      return new BasePermitIdDto();
    }

    return new BasePermitIdDto({
      ...super.fromJson(json),
      workScope: json.workScope || '',
      system: json.system || 0,
      equipment: json.equipment || [],
      requestor: json.requestor || 0,
      controlAuthority: json.controlAuthority || 0,
      permitType: json.permitType || 0,
      docNum: json.docNum || 0,
      permitStatus: json.permitStatus || 0,
      temp: json.temp || false
    });
  }
}