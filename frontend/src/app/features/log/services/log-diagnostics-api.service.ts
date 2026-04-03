import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { LogEventsResponse } from './log-diagnostics.models';

@Injectable({
  providedIn: 'root',
})
export class LogDiagnosticsApiService {
  private apiUrl = `${environment.apiUrl}/log-diagnostics`;

  constructor(private http: HttpClient) {}

  getEvents(filters: {
    windowMinutes: number;
    limit: number;
    level?: string;
    text?: string;
    sourceFile?: string;
    subsystem?: string;
    eventCode?: string;
    requestId?: string;
    syncRunId?: string;
    machineId?: string;
  }): Observable<SpringApiResponse<LogEventsResponse>> {
    let params = new HttpParams()
      .set('windowMinutes', filters.windowMinutes.toString())
      .set('limit', filters.limit.toString());

    const optionalFilters: Record<string, string | undefined> = {
      level: filters.level,
      text: filters.text,
      sourceFile: filters.sourceFile,
      subsystem: filters.subsystem,
      eventCode: filters.eventCode,
      requestId: filters.requestId,
      syncRunId: filters.syncRunId,
      machineId: filters.machineId,
    };

    Object.entries(optionalFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params = params.set(key, value.trim());
      }
    });

    return this.http.get<SpringApiResponse<LogEventsResponse>>(
      `${this.apiUrl}/events`,
      { params }
    );
  }
}
