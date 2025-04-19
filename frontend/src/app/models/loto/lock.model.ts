import { BaseDto, BaseModel } from '../base/base.model';
import { LotoDto } from './loto.model';
import { ValueDto } from '../value.model';

export interface LockModel extends BaseModel {
  number: number;
  loto: LotoDto;
  lotoAccessoryStatus: ValueDto;
}

export class LockDto extends BaseDto implements LockModel {
  number: number;
  loto: LotoDto;
  lotoAccessoryStatus: ValueDto;

  constructor(data: Partial<LockModel> = {}) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = data.loto ?? new LotoDto();
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ?? new ValueDto();
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      number: this.number,
      loto: this.loto.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson()
    };
  }

  // Override fromJson method
  static override fromJson(json: any): LockDto {
    if (!json) {
      console.warn('Received null or undefined json in LockDto.fromJson');
      return new LockDto();
    }

    return new LockDto({
      ...super.fromJson(json),
      number: json.number ?? 0,
      loto: LotoDto.fromJson(json.loto),
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus)
    });
  }
}