import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProScrapeJobDto } from '../../../models/etapro/etapro-scrape-job.model';

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
}
