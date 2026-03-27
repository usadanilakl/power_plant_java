import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import {
  LogDiagnosticsEventsResponse,
  LogDiagnosticsIncident,
  LogDiagnosticsIncidentDetail,
  LogDiagnosticsIncidentsResponse,
  LogDiagnosticsOverview,
} from './log-diagnostics.models';

@Injectable({
  providedIn: 'root',
})
export class LogDiagnosticsApiService {
  private apiUrl = `${environment.apiUrl}/log-diagnostics`;

  constructor(private http: HttpClient) {}

  getOverview(
    windowMinutes: number,
    limit: number
  ): Observable<SpringApiResponse<LogDiagnosticsOverview>> {
    const params = new HttpParams()
      .set('windowMinutes', windowMinutes.toString())
      .set('limit', limit.toString());

    return this.http.get<SpringApiResponse<LogDiagnosticsOverview>>(
      `${this.apiUrl}/overview`,
      { params }
    );
  }

  getEvents(filters: {
    windowMinutes: number;
    limit: number;
    level?: string;
    text?: string;
    sourceFile?: string;
    requestId?: string;
    syncRunId?: string;
    machineId?: string;
  }): Observable<SpringApiResponse<LogDiagnosticsEventsResponse>> {
    let params = new HttpParams()
      .set('windowMinutes', filters.windowMinutes.toString())
      .set('limit', filters.limit.toString());

    const optionalFilters: Record<string, string | undefined> = {
      level: filters.level,
      text: filters.text,
      sourceFile: filters.sourceFile,
      requestId: filters.requestId,
      syncRunId: filters.syncRunId,
      machineId: filters.machineId,
    };

    Object.entries(optionalFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params = params.set(key, value.trim());
      }
    });

    return this.http.get<SpringApiResponse<LogDiagnosticsEventsResponse>>(
      `${this.apiUrl}/events`,
      { params }
    );
  }

  getIncidents(filters: {
    windowMinutes: number;
    limit: number;
    status?: string;
  }): Observable<SpringApiResponse<LogDiagnosticsIncidentsResponse>> {
    let params = new HttpParams()
      .set('windowMinutes', filters.windowMinutes.toString())
      .set('limit', filters.limit.toString());

    if (filters.status && filters.status.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return this.http.get<SpringApiResponse<LogDiagnosticsIncidentsResponse>>(
      `${this.apiUrl}/incidents`,
      { params }
    );
  }

  getIncidentDetail(
    incidentId: string,
    windowMinutes: number,
    timelineLimit: number
  ): Observable<SpringApiResponse<LogDiagnosticsIncidentDetail>> {
    const params = new HttpParams()
      .set('windowMinutes', windowMinutes.toString())
      .set('timelineLimit', timelineLimit.toString());

    return this.http.get<SpringApiResponse<LogDiagnosticsIncidentDetail>>(
      `${this.apiUrl}/incidents/${incidentId}`,
      { params }
    );
  }

  updateIncidentStatus(
    incidentId: string,
    status: 'open' | 'acknowledged' | 'resolved',
    windowMinutes: number
  ): Observable<SpringApiResponse<LogDiagnosticsIncident>> {
    const params = new HttpParams().set('windowMinutes', windowMinutes.toString());
    return this.http.post<SpringApiResponse<LogDiagnosticsIncident>>(
      `${this.apiUrl}/incidents/${incidentId}/status`,
      { status },
      { params }
    );
  }
}
