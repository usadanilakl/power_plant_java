import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';

export interface ReportDto {
  id: number;
  name: string;
  description: string;
  category: string;
  definitionVersion: number;
  definitionJson: string;
  defaultParamsJson: string;
  outputConfigJson: string;
}

export interface ReportExecutionDto {
  id: number;
  reportId: number;
  reportName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';
  paramsJson: string;
  summaryJson: string;
  resultPayloadJson: string;
  progress: number;
  instancesFound: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  errorMessage: string;
}

export interface ReportPreviewResult {
  summary: { instancesFound: number; aggregations: Record<string, number> };
  payload: { instances: EventInstance[] };
}

export interface EventInstance {
  index: number;
  triggerTime: string;
  endTime: string;
  durationSeconds: number;
  measurements: Record<string, number>;
  chartData: Record<string, { time: string; value: number }[]>;
}

@Injectable({ providedIn: 'root' })
export class EtaProReportApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}/ng/etapro/reports`;

  // ── Report CRUD ─────────────────────────────────────────

  listReports(page = 1, pageSize = 20): Observable<SpringPaginatedResponse<ReportDto>> {
    return this.http.get<SpringPaginatedResponse<ReportDto>>(
      `${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  getReport(id: number): Observable<SpringApiResponse<ReportDto>> {
    return this.http.get<SpringApiResponse<ReportDto>>(`${this.apiUrl}/${id}`);
  }

  createReport(dto: ReportDto): Observable<SpringApiResponse<ReportDto>> {
    return this.http.post<SpringApiResponse<ReportDto>>(this.apiUrl, dto);
  }

  updateReport(dto: ReportDto): Observable<SpringApiResponse<ReportDto>> {
    return this.http.put<SpringApiResponse<ReportDto>>(this.apiUrl, dto);
  }

  deleteReport(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  // ── Executions ──────────────────────────────────────────

  executeReport(reportId: number, paramsJson?: string): Observable<SpringApiResponse<ReportExecutionDto>> {
    return this.http.post<SpringApiResponse<ReportExecutionDto>>(
      `${this.apiUrl}/${reportId}/execute`,
      { paramsJson: paramsJson || null });
  }

  listExecutions(page = 1, pageSize = 20): Observable<SpringPaginatedResponse<ReportExecutionDto>> {
    return this.http.get<SpringPaginatedResponse<ReportExecutionDto>>(
      `${this.apiUrl}/executions?page=${page}&pageSize=${pageSize}`);
  }

  getExecution(id: number): Observable<SpringApiResponse<ReportExecutionDto>> {
    return this.http.get<SpringApiResponse<ReportExecutionDto>>(
      `${this.apiUrl}/executions/${id}`);
  }

  cancelExecution(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/executions/${id}`);
  }

  // ── Preview ─────────────────────────────────────────────

  previewReport(definitionJson: string, paramsJson?: string): Observable<SpringApiResponse<ReportPreviewResult>> {
    return this.http.post<SpringApiResponse<ReportPreviewResult>>(
      `${this.apiUrl}/preview`,
      { definitionJson, paramsJson: paramsJson || null });
  }
}
