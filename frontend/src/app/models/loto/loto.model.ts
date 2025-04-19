import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';
import { LotoPointDto } from './loto-point.model';
import { LockDto } from './lock.model';
import { LotoBoxDto } from './loto-box.model';

export interface LotoModel extends BasePermitModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  box: LotoBoxDto;
}

export class LotoDto extends BasePermitDto implements LotoModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  box: LotoBoxDto;

  constructor(data: Partial<LotoModel> = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map(lock => new LockDto(lock)) ?? [];
    this.box = data.box ? new LotoBoxDto(data.box) : new LotoBoxDto();
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      lotoPoints: this.lotoPoints.map(point => point.toJson()),
      locks: this.locks.map(lock => lock.toJson()),
      box: this.box.toJson()
    };
  }

  // Override fromJson method
  static override fromJson(json: any): LotoDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoDto.fromJson');
      return new LotoDto();
    }

    return new LotoDto({
      ...super.fromJson(json),
      lotoPoints: (json.lotoPoints ?? []).map((point: any) => LotoPointDto.fromJson(point)),
      locks: (json.locks ?? []).map((lock: any) => LockDto.fromJson(lock)),
      box: LotoBoxDto.fromJson(json.box)
    });
  }
}