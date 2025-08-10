import { BaseDto } from '../base/base.model';

export class LotoStandardIdDto extends BaseDto {
  description: string | null;
  lotoPoints: number[] | null;

  constructor(data: Partial<LotoStandardIdDto> = {}) {
    super(data);
    this.description = data.description || null;
    this.lotoPoints = data.lotoPoints || null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      lotoPoints: this.lotoPoints
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoStandardIdDto {
    return new LotoStandardIdDto({
      ...super.fromJson(json),
      description: json.description,
      lotoPoints: json.lotoPoints || null
    });
  }
}