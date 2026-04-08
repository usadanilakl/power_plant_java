import { BaseDto, BaseModel } from '../base/base.model';

export interface EtaProPointModel extends BaseModel {
  pointId: string | null;
  description: string | null;
  unit: string | null;
  category: string | null;
  active: boolean;
}

export class EtaProPointDto extends BaseDto implements EtaProPointModel {
  pointId: string | null;
  description: string | null;
  unit: string | null;
  category: string | null;
  active: boolean;

  constructor(data: Partial<EtaProPointModel> = {}) {
    super(data);
    this.pointId = data.pointId ?? null;
    this.description = data.description ?? null;
    this.unit = data.unit ?? null;
    this.category = data.category ?? null;
    this.active = data.active ?? true;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      pointId: this.pointId || null,
      description: this.description || null,
      unit: this.unit || null,
      category: this.category || null,
      active: this.active,
    };
  }

  static override fromJson(json: any): EtaProPointDto {
    if (!json) return new EtaProPointDto();
    return new EtaProPointDto({
      ...json,
      pointId: json.pointId || null,
      description: json.description || null,
      unit: json.unit || null,
      category: json.category || null,
      active: json.active ?? true,
    });
  }
}
