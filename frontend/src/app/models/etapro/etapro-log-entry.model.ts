import { BaseDto, BaseModel } from '../base/base.model';

export interface EtaProLogEntryModel extends BaseModel {
  description: string | null;
  area: string | null;
  location: string | null;
  createdByName: string | null;
  createTime: string | null;
  deactivatedBy: string | null;
  deactivateTime: string | null;
  crew: string | null;
  dedupKey: string | null;
  scrapeSessionId: string | null;
}

export class EtaProLogEntryDto extends BaseDto implements EtaProLogEntryModel {
  description: string | null;
  area: string | null;
  location: string | null;
  createdByName: string | null;
  createTime: string | null;
  deactivatedBy: string | null;
  deactivateTime: string | null;
  crew: string | null;
  dedupKey: string | null;
  scrapeSessionId: string | null;

  constructor(data: Partial<EtaProLogEntryModel> = {}) {
    super(data);
    this.description = data.description ?? null;
    this.area = data.area ?? null;
    this.location = data.location ?? null;
    this.createdByName = data.createdByName ?? null;
    this.createTime = data.createTime ?? null;
    this.deactivatedBy = data.deactivatedBy ?? null;
    this.deactivateTime = data.deactivateTime ?? null;
    this.crew = data.crew ?? null;
    this.dedupKey = data.dedupKey ?? null;
    this.scrapeSessionId = data.scrapeSessionId ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description || null,
      area: this.area || null,
      location: this.location || null,
      createdByName: this.createdByName || null,
      createTime: this.createTime || null,
      deactivatedBy: this.deactivatedBy || null,
      deactivateTime: this.deactivateTime || null,
      crew: this.crew || null,
      dedupKey: this.dedupKey || null,
      scrapeSessionId: this.scrapeSessionId || null,
    };
  }

  static override fromJson(json: any): EtaProLogEntryDto {
    if (!json) return new EtaProLogEntryDto();
    return new EtaProLogEntryDto({
      ...json,
      description: json.description || null,
      area: json.area || null,
      location: json.location || null,
      createdByName: json.createdByName || null,
      createTime: json.createTime || null,
      deactivatedBy: json.deactivatedBy || null,
      deactivateTime: json.deactivateTime || null,
      crew: json.crew || null,
      dedupKey: json.dedupKey || null,
      scrapeSessionId: json.scrapeSessionId || null,
    });
  }
}
