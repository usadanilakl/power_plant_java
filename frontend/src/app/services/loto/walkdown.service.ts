import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { WalkdownChecklistDto } from '../../models/loto/walkdown-checklist.model';

@Injectable({ providedIn: 'root' })
export class WalkdownService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  listForLoto(lotoId: number): Observable<SpringApiResponse<WalkdownChecklistDto[]>> {
    return this.http.get<SpringApiResponse<WalkdownChecklistDto[]>>(`${this.apiUrl}/lotos/${lotoId}/walkdowns`);
  }

  request(lotoId: number, notes?: string): Observable<SpringApiResponse<WalkdownChecklistDto>> {
    return this.http.post<SpringApiResponse<WalkdownChecklistDto>>(
      `${this.apiUrl}/lotos/${lotoId}/walkdowns`, { notes: notes ?? null });
  }

  checkPoint(walkdownId: number, pointId: number, checked: boolean, notes?: string): Observable<SpringApiResponse<WalkdownChecklistDto>> {
    return this.http.put<SpringApiResponse<WalkdownChecklistDto>>(
      `${this.apiUrl}/walkdowns/${walkdownId}/check-point/${pointId}`,
      { checked, notes: notes ?? null });
  }

  complete(walkdownId: number, notes?: string): Observable<SpringApiResponse<WalkdownChecklistDto>> {
    return this.http.put<SpringApiResponse<WalkdownChecklistDto>>(
      `${this.apiUrl}/walkdowns/${walkdownId}/complete`, { notes: notes ?? null });
  }
}
