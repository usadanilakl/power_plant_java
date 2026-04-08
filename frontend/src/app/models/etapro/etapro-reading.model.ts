import { BaseDto, BaseModel } from '../base/base.model';

export interface EtaProReadingModel extends BaseModel {
  pointId: string | null;
  readingTime: string | null;
  readingValue: number | null;
  quality: string | null;
  scrapeSessionId: string | null;
}

export class EtaProReadingDto extends BaseDto implements EtaProReadingModel {
  pointId: string | null;
  readingTime: string | null;
  readingValue: number | null;
  quality: string | null;
  scrapeSessionId: string | null;

  constructor(data: Partial<EtaProReadingModel> = {}) {
    super(data);
    this.pointId = data.pointId ?? null;
    this.readingTime = data.readingTime ?? null;
    this.readingValue = data.readingValue ?? null;
    this.quality = data.quality ?? null;
    this.scrapeSessionId = data.scrapeSessionId ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      pointId: this.pointId || null,
      readingTime: this.readingTime || null,
      readingValue: this.readingValue,
      quality: this.quality || null,
      scrapeSessionId: this.scrapeSessionId || null,
    };
  }

  static override fromJson(json: any): EtaProReadingDto {
    if (!json) return new EtaProReadingDto();
    return new EtaProReadingDto({
      ...json,
      pointId: json.pointId || null,
      readingTime: json.readingTime || null,
      readingValue: json.readingValue ?? null,
      quality: json.quality || null,
      scrapeSessionId: json.scrapeSessionId || null,
    });
  }
}
