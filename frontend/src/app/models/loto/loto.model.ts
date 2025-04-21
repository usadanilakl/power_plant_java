import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';
import { LotoPointDto } from './loto-point.model';
import { LockDto } from './lock.model';
import { LotoBoxDto } from './loto-box.model';
import { LotoIdDto } from './loto-id.model';

export interface LotoModel extends BasePermitModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;
}

export class LotoDto extends BasePermitDto implements LotoModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;

  constructor(data: Partial<LotoModel> = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map(lock => new LockDto(lock)) ?? [];
    this.lotoBox = data.lotoBox ? new LotoBoxDto(data.lotoBox, true) : null;
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      lotoPoints: this.lotoPoints.map(point => point.toJson()),
      locks: this.locks.map(lock => lock.toJson()),
      lotoBox: this.lotoBox?.toJson()
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
      lotoBox: json.lotoBox ? LotoBoxDto.fromJson(json.lotoBox, true) : null
    });
  }

  override toIdModel(): LotoIdDto {
    const baseIdModel = super.toIdModel();
    return new LotoIdDto({
      ...baseIdModel,
      lotoPoints: this.lotoPoints.map(point => point.id),
      locks: this.locks.map(lock => lock.id),
      lotoBox: this.lotoBox ? this.lotoBox.id : null
    });
  }
}
