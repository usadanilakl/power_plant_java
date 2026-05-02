import { BaseDto, BaseModel } from '../base/base.model';
import { LotoDto } from './loto.model';
import { ValueDto } from '../value.model';

export interface LockModel extends BaseModel {
  number: number;
  loto: LotoDto;
  lotoAccessoryStatus: ValueDto;
  tagLabel: string;
  assignedLotoPointId: number | null;
  lockType: string;
  homeBoxNumber: number | null;
  isSingleLock: boolean;
}

export class LockDto extends BaseDto implements LockModel {
  number: number;
  loto: LotoDto;
  lotoAccessoryStatus: ValueDto;
  tagLabel: string;
  assignedLotoPointId: number | null;
  lockType: string;
  homeBoxNumber: number | null;
  isSingleLock: boolean;

  constructor(data: Partial<LockModel> = {}) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = data.loto ?? new LotoDto();
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ?? new ValueDto();
    this.tagLabel = data.tagLabel ?? '';
    this.assignedLotoPointId = data.assignedLotoPointId ?? null;
    this.lockType = data.lockType ?? 'LOCK';
    this.homeBoxNumber = data.homeBoxNumber ?? null;
    this.isSingleLock = data.isSingleLock ?? false;
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      number: this.number,
      loto: this.loto.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson(),
      tagLabel: this.tagLabel,
      assignedLotoPointId: this.assignedLotoPointId,
      lockType: this.lockType,
      homeBoxNumber: this.homeBoxNumber,
      isSingleLock: this.isSingleLock,
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
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus),
      tagLabel: json.tagLabel ?? '',
      assignedLotoPointId: json.assignedLotoPointId ?? null,
      lockType: json.lockType ?? 'LOCK',
      homeBoxNumber: json.homeBoxNumber ?? null,
      isSingleLock: json.isSingleLock ?? false,
    });
  }
}