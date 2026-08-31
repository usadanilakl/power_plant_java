import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AirTestDto {
  id?: number | null;
  monitoredAreaId: number;
  /** ISO instant. The moment of the READING, not of the upload. */
  testedAt?: string | null;
  testedBy?: string | null;
  meterModel?: string | null;
  meterSerial?: string | null;
  oxygen?: string | null;
  lel?: string | null;
  hydrogenSulfide?: string | null;
  carbonMonoxide?: string | null;
  ammonia?: string | null;
  result?: string | null;
  notes?: string | null;
}

export interface MonitoredAreaDto {
  id?: number | null;
  name: string;
  /** CONFINED_SPACE | HOT_WORK | MANUAL */
  sourceType?: string | null;
  sourcePermitId?: number | null;
  spaceName?: string | null;
  workAreaId?: number | null;
  workAreaName?: string | null;
  requiresMonitoring?: boolean | null;
  manuallyRemoved?: boolean | null;
  testIntervalHours?: number | null;
  notes?: string | null;
  lastTest?: AirTestDto | null;
  /** Computed server-side. True when never tested — that is the most overdue state, not the safest. */
  overdue?: boolean | null;
  hoursSinceLastTest?: number | null;
}

interface SpringApiResponse<T> { responseData: T; message: string; }

@Injectable({ providedIn: 'root' })
export class AirMonitoringService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/air-monitoring`;

  areas(includeInactive = false): Observable<SpringApiResponse<MonitoredAreaDto[]>> {
    return this.http.get<SpringApiResponse<MonitoredAreaDto[]>>(
      `${this.url}/areas`, { params: { includeInactive } as any });
  }

  /** Rebuild the derived entries from the currently open Confined Space and Hot Work permits. */
  refresh(): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.url}/refresh`, null);
  }

  saveArea(area: MonitoredAreaDto): Observable<SpringApiResponse<MonitoredAreaDto>> {
    return this.http.post<SpringApiResponse<MonitoredAreaDto>>(`${this.url}/areas`, area);
  }

  removeArea(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.url}/areas/${id}`);
  }

  restoreArea(id: number): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.url}/areas/${id}/restore`, null);
  }

  tests(areaId: number): Observable<SpringApiResponse<AirTestDto[]>> {
    return this.http.get<SpringApiResponse<AirTestDto[]>>(`${this.url}/areas/${areaId}/tests`);
  }

  recordTest(test: AirTestDto): Observable<SpringApiResponse<AirTestDto>> {
    return this.http.post<SpringApiResponse<AirTestDto>>(`${this.url}/tests`, test);
  }
}
