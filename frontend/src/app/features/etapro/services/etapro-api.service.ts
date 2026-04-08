import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';

export interface ScrapeResult {
  success: boolean;
  message: string;
  sessionId: string | null;
  readingCount: number;
}

export interface ScrapeStatus {
  processRunning: boolean;
  scrapeInProgress: boolean;
  lastStatus: string;
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

  getPointsByCategory(category: string): Observable<SpringApiResponse<EtaProPointDto[]>> {
    return this.http.get<SpringApiResponse<EtaProPointDto[]>>(`${this.apiUrl}/points/category/${category}`);
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

  // ── Process control ────────────────────────────────────────

  startProcess(): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/process/start`, {});
  }

  stopProcess(): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/process/stop`, {});
  }

  // ── Scraping ───────────────────────────────────────────────

  triggerScrape(startTime: string, endTime: string): Observable<SpringApiResponse<ScrapeResult>> {
    return this.http.post<SpringApiResponse<ScrapeResult>>(
      `${this.apiUrl}/scrape?startTime=${startTime}&endTime=${endTime}`, {}
    );
  }

  getScrapeStatus(): Observable<SpringApiResponse<ScrapeStatus>> {
    return this.http.get<SpringApiResponse<ScrapeStatus>>(`${this.apiUrl}/scrape/status`);
  }

  // ── Readings ───────────────────────────────────────────────

  getReadings(pointId: string, startTime: string, endTime: string): Observable<SpringApiResponse<EtaProReadingDto[]>> {
    return this.http.get<SpringApiResponse<EtaProReadingDto[]>>(
      `${this.apiUrl}/readings?pointId=${pointId}&startTime=${startTime}&endTime=${endTime}`
    );
  }

  getLatestReadings(): Observable<SpringApiResponse<EtaProReadingDto[]>> {
    return this.http.get<SpringApiResponse<EtaProReadingDto[]>>(`${this.apiUrl}/readings/latest`);
  }

  getReadingsPaginated(params: {
    pointId?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }): Observable<SpringPaginatedResponse<EtaProReadingDto>> {
    const queryParts: string[] = [];
    if (params.pointId) queryParts.push(`pointId=${params.pointId}`);
    if (params.startTime) queryParts.push(`startTime=${params.startTime}`);
    if (params.endTime) queryParts.push(`endTime=${params.endTime}`);
    queryParts.push(`page=${params.page || 1}`);
    queryParts.push(`pageSize=${params.pageSize || 50}`);
    return this.http.get<SpringPaginatedResponse<EtaProReadingDto>>(
      `${this.apiUrl}/readings/paginated?${queryParts.join('&')}`
    );
  }
}
