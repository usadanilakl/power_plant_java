import { BaseDto } from '../base/base.model';

export class LotoStandardIdDto extends BaseDto {
  description: string | null;
  lotoPointIds: number[] | null;

  constructor(data: Partial<LotoStandardIdDto> = {}) {
    super(data);
    this.description = data.description || null;
    this.lotoPointIds = data.lotoPointIds || null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      lotoPointIds: this.lotoPointIds
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoStandardIdDto {
    return new LotoStandardIdDto({
      ...super.fromJson(json),
      description: json.description,
      lotoPointIds: json.lotoPointIds || null
    });
  }
}