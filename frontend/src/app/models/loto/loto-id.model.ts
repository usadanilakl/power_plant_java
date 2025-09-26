import { BasePermitIdDto } from '../base/base-permit-id.model';

export class LotoIdDto extends BasePermitIdDto {
  lotoPoints: number[];
  locks: number[];
  lotoBox: number | null;
  equipmentSystem: string;
  lotoRequestor: string;
  date: string;

  constructor(data: Partial<LotoIdDto> = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints || [];
    this.locks = data.locks || [];
    this.lotoBox = data.lotoBox || null;
    this.equipmentSystem = data.equipmentSystem || '';
    this.lotoRequestor = data.lotoRequestor || '';
    this.date = data.date || '';
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      lotoPoints: this.lotoPoints,
      locks: this.locks,
      lotoBox: this.lotoBox,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    };
  }

  static override fromJson(json: any): LotoIdDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoIdDto.fromJson');
      return new LotoIdDto();
    }

    return new LotoIdDto({
      ...super.fromJson(json),
      lotoPoints: json.lotoPoints || [],
      locks: json.locks || [],
      lotoBox: json.lotoBox || null,
      equipmentSystem: json.equipmentSystem || '',
      lotoRequestor: json.lotoRequestor || '',
      date: json.date || ''
    });
  }
}