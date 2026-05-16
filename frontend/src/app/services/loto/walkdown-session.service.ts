import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { WalkdownSessionDto } from '../../models/loto/walkdown-session.model';

@Injectable({ providedIn: 'root' })
export class WalkdownSessionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/loto/walkdown-sessions`;

  listForLoto(lotoId: number): Observable<SpringApiResponse<WalkdownSessionDto[]>> {
    return this.http.get<SpringApiResponse<WalkdownSessionDto[]>>(`${this.apiUrl}/by-loto/${lotoId}`);
  }

  get(sessionId: number): Observable<SpringApiResponse<WalkdownSessionDto>> {
    return this.http.get<SpringApiResponse<WalkdownSessionDto>>(`${this.apiUrl}/${sessionId}`);
  }

  start(lotoId: number, crewName: string, notes?: string | null): Observable<SpringApiResponse<WalkdownSessionDto>> {
    return this.http.post<SpringApiResponse<WalkdownSessionDto>>(
      `${this.apiUrl}/by-loto/${lotoId}`,
      { crewName, notes: notes ?? null });
  }

  checkPoint(sessionId: number, pointId: number, checked: boolean, notes?: string | null): Observable<SpringApiResponse<WalkdownSessionDto>> {
    return this.http.put<SpringApiResponse<WalkdownSessionDto>>(
      `${this.apiUrl}/${sessionId}/point/${pointId}/check`,
      { checked, notes: notes ?? null });
  }

  complete(sessionId: number, notes?: string | null): Observable<SpringApiResponse<WalkdownSessionDto>> {
    return this.http.post<SpringApiResponse<WalkdownSessionDto>>(
      `${this.apiUrl}/${sessionId}/complete`,
      { notes: notes ?? null });
  }
}
