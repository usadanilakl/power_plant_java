import { BaseDto, BaseModel } from '../base/base.model';
import { LotoDto } from './loto.model';
import { ValueDto } from '../value.model';
import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';

export interface LotoBoxModel extends BasePermitModel {
  number: number;
  loto: LotoDto | null;
  lotoAccessoryStatus: ValueDto;
}

export class LotoBoxDto extends BasePermitDto implements LotoBoxModel {
  number: number;
  loto: LotoDto | null;
  lotoAccessoryStatus: ValueDto;

  constructor(data: Partial<LotoBoxModel> = {}, isNested: boolean = false) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = isNested ? null : (data.loto ? new LotoDto({...data.loto, lotoBox: null}) : null);
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ? new ValueDto(data.lotoAccessoryStatus) : new ValueDto();
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      number: this.number,
      loto: this.loto?.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson()
    };
  }

  // Override fromJson method
  static override fromJson(json: any, isNested: boolean = false): LotoBoxDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoBoxDto.fromJson');
      return new LotoBoxDto();
    }

    return new LotoBoxDto({
      ...super.fromJson(json),
      number: json.number,
      loto: isNested ? null : (json.loto ? LotoDto.fromJson({...json.loto, lotoBox: null}) : null),
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus)
    }, isNested);
  }
}