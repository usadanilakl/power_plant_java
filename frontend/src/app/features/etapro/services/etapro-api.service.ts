import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProScrapeJobDto } from '../../../models/etapro/etapro-scrape-job.model';
import { EtaProLogEntryDto } from '../../../models/etapro/etapro-log-entry.model';

export interface LiveStatus {
  active: boolean;
  pointIds?: string[];
  startedAt?: string;
  lastCycleAt?: string;
  lastCycleCount?: number;
  processRunning?: boolean;
  engineStatus?: string;
}

export interface PointImportResult {
  added: number;
  skipped: number;
  errorCount: number;
  errors: string[];
}

export interface EpLogPullStatus {
  requestId: number;
  state: 'IDLE' | 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  rangeStart?: string | null;
  rangeEnd?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  imported?: number | null;
  scraped?: number | null;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EtaProApiService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}/ng/etapro`;

  private pointUpdatedSubject = new Subject<EtaProPointDto>();
  pointUpdated$ = this.pointUpdatedSubject.asObservable();

  private pointDeletedSubject = new Subject<number>();
  pointDeleted$ = this.pointDeletedSubject.asObservable();

  // ── Points ─────────────────────────────────────────────────

  getPoints(): Observable<SpringApiResponse<EtaProPointDto[]>> {
    return this.http.get<SpringApiResponse<EtaProPointDto[]>>(`${this.apiUrl}/points`);
  }

  getActivePoints(): Observable<SpringApiResponse<EtaProPointDto[]>> {
    return this.http.get<SpringApiResponse<EtaProPointDto[]>>(`${this.apiUrl}/points/active`);
  }

  createPoint(dto: EtaProPointDto): Observable<SpringApiResponse<EtaProPointDto>> {
    return this.http.post<SpringApiResponse<EtaProPointDto>>(`${this.apiUrl}/points`, dto.toJson()).pipe(
      tap(res => { if (res.responseData) this.pointUpdatedSubject.next(EtaProPointDto.fromJson(res.responseData)); })
    );
  }

  updatePoint(dto: EtaProPointDto): Observable<SpringApiResponse<EtaProPointDto>> {
    return this.http.put<SpringApiResponse<EtaProPointDto>>(`${this.apiUrl}/points`, dto.toJson()).pipe(
      tap(res => { if (res.responseData) this.pointUpdatedSubject.next(EtaProPointDto.fromJson(res.responseData)); })
    );
  }

  savePoint(dto: EtaProPointDto): Observable<SpringApiResponse<EtaProPointDto>> {
    return dto.id ? this.updatePoint(dto) : this.createPoint(dto);
  }

  deletePoint(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/points/${id}`).pipe(
      tap(() => this.pointDeletedSubject.next(id))
    );
  }

  // ── Paginated / Search ─────────────────────────────────────

  getPointsPaginated(page: number = 1, pageSize: number = 50):
      Observable<SpringPaginatedResponse<EtaProPointDto>> {
    return this.http.get<SpringPaginatedResponse<EtaProPointDto>>(
      `${this.apiUrl}/points/paginated?page=${page}&pageSize=${pageSize}`
    );
  }

  searchPoints(criteria: SearchCriteria, pageSize: number = 50):
      Observable<SpringPaginatedResponse<EtaProPointDto>> {
    const page = criteria.page ?? 1;
    return this.http.post<SpringPaginatedResponse<EtaProPointDto>>(
      `${this.apiUrl}/points/search?page=${page}&pageSize=${pageSize}`,
      criteria
    );
  }

  getPointUniqueValues(column: string, criteria: SearchCriteria, page: number = 1, pageSize: number = 50):
      Observable<SpringPaginatedResponse<string>> {
    return this.http.post<SpringPaginatedResponse<string>>(
      `${this.apiUrl}/points/unique-values?column=${column}&page=${page}&pageSize=${pageSize}`,
      criteria
    );
  }

  importPoints(file: File): Observable<SpringApiResponse<PointImportResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<PointImportResult>>(
      `${this.apiUrl}/points/import`, formData
    );
  }

  // ── History jobs ───────────────────────────────────────────

  submitHistoryJob(pointIds: string[], rangeStart: string, rangeEnd: string):
      Observable<SpringApiResponse<EtaProScrapeJobDto>> {
    return this.http.post<SpringApiResponse<EtaProScrapeJobDto>>(
      `${this.apiUrl}/jobs`, { pointIds, rangeStart, rangeEnd }
    );
  }

  listJobs(page = 1, pageSize = 20):
      Observable<SpringPaginatedResponse<EtaProScrapeJobDto>> {
    return this.http.get<SpringPaginatedResponse<EtaProScrapeJobDto>>(
      `${this.apiUrl}/jobs?page=${page}&pageSize=${pageSize}`
    );
  }

  getJob(id: number): Observable<SpringApiResponse<EtaProScrapeJobDto>> {
    return this.http.get<SpringApiResponse<EtaProScrapeJobDto>>(`${this.apiUrl}/jobs/${id}`);
  }

  cancelJob(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/jobs/${id}`);
  }

  // ── Live ───────────────────────────────────────────────────

  startLive(pointIds: string[]): Observable<SpringApiResponse<LiveStatus>> {
    return this.http.post<SpringApiResponse<LiveStatus>>(`${this.apiUrl}/live/start`, { pointIds });
  }

  stopLive(): Observable<SpringApiResponse<LiveStatus>> {
    return this.http.post<SpringApiResponse<LiveStatus>>(`${this.apiUrl}/live/stop`, {});
  }

  getLiveStatus(): Observable<SpringApiResponse<LiveStatus>> {
    return this.http.get<SpringApiResponse<LiveStatus>>(`${this.apiUrl}/live/status`);
  }

  // ── Readings ───────────────────────────────────────────────

  getReadings(pointId: string, startTime: string, endTime: string):
      Observable<SpringApiResponse<EtaProReadingDto[]>> {
    return this.http.get<SpringApiResponse<EtaProReadingDto[]>>(
      `${this.apiUrl}/readings?pointId=${pointId}&startTime=${startTime}&endTime=${endTime}`
    );
  }

  getLatestReadings(): Observable<SpringApiResponse<EtaProReadingDto[]>> {
    return this.http.get<SpringApiResponse<EtaProReadingDto[]>>(`${this.apiUrl}/readings/latest`);
  }

  // ── EPLog (Operator/Event Log) ─────────────────────────────

  /** Queue a manual pull (async). With a range, backfills that window; without, pulls incrementally. */
  pullEpLog(rangeStart?: string, rangeEnd?: string): Observable<SpringApiResponse<EpLogPullStatus>> {
    const body = (rangeStart && rangeEnd) ? { rangeStart, rangeEnd } : {};
    return this.http.post<SpringApiResponse<EpLogPullStatus>>(`${this.apiUrl}/eplog/pull`, body);
  }

  /** Poll the async pull status. */
  getEpLogPullStatus(): Observable<SpringApiResponse<EpLogPullStatus>> {
    return this.http.get<SpringApiResponse<EpLogPullStatus>>(`${this.apiUrl}/eplog/pull/status`);
  }

  getEpLog(page = 1, pageSize = 50, startTime?: string, endTime?: string):
      Observable<SpringPaginatedResponse<EtaProLogEntryDto>> {
    let url = `${this.apiUrl}/eplog?page=${page}&pageSize=${pageSize}`;
    if (startTime && endTime) url += `&startTime=${startTime}&endTime=${endTime}`;
    return this.http.get<SpringPaginatedResponse<EtaProLogEntryDto>>(url);
  }
}
