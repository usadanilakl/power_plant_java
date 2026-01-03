import { BaseDto } from '../base/base.model';

export class LotoStandardIdDto extends BaseDto {
  description: string | null;
  lotoPoints: number[] | null;
  groups: number[] | null;

  constructor(data: Partial<LotoStandardIdDto> = {}) {
    super(data);
    this.description = data.description || null;
    this.lotoPoints = data.lotoPoints || null;
    this.groups = data.groups || null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      lotoPoints: this.lotoPoints,
      groups: this.groups
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoStandardIdDto {
    return new LotoStandardIdDto({
      ...super.fromJson(json),
      description: json.description,
      lotoPoints: json.lotoPoints || null,
      groups: json.groups || null
    });
  }
}