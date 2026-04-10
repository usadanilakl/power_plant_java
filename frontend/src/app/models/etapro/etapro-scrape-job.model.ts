import { BaseDto, BaseModel } from '../base/base.model';

export type JobMode = 'HISTORY' | 'LIVE';
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';

export interface EtaProScrapeJobModel extends BaseModel {
  mode: JobMode | null;
  status: JobStatus | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  pointIds: string[];
  batchesTotal: number;
  batchesCompleted: number;
  readingsImported: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export class EtaProScrapeJobDto extends BaseDto implements EtaProScrapeJobModel {
  mode: JobMode | null;
  status: JobStatus | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  pointIds: string[];
  batchesTotal: number;
  batchesCompleted: number;
  readingsImported: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;

  constructor(data: Partial<EtaProScrapeJobModel> = {}) {
    super(data);
    this.mode = data.mode ?? null;
    this.status = data.status ?? null;
    this.rangeStart = data.rangeStart ?? null;
    this.rangeEnd = data.rangeEnd ?? null;
    this.pointIds = data.pointIds ?? [];
    this.batchesTotal = data.batchesTotal ?? 0;
    this.batchesCompleted = data.batchesCompleted ?? 0;
    this.readingsImported = data.readingsImported ?? 0;
    this.startedAt = data.startedAt ?? null;
    this.completedAt = data.completedAt ?? null;
    this.errorMessage = data.errorMessage ?? null;
  }

  get progressPercent(): number {
    if (this.batchesTotal === 0) return 0;
    return Math.round((this.batchesCompleted / this.batchesTotal) * 100);
  }

  static override fromJson(json: any): EtaProScrapeJobDto {
    if (!json) return new EtaProScrapeJobDto();
    return new EtaProScrapeJobDto({
      ...json,
      pointIds: Array.isArray(json.pointIds) ? json.pointIds : [],
    });
  }
}
