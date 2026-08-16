import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Compact projection returned by GET /api/pwa/secured/insulation/active. Mirrors the
 * PwaInsulationItemDto on the hub — only fields the contractor needs.
 */
export interface InsulationItem {
  id: number;
  title: string;
  notes: string | null;
  specificLocation: string | null;
  locationName: string | null;
  equipmentTag: string | null;
  submitterName: string | null;
  dateObserved: string | null;
  timeObserved: string | null;
  maximoWonum: string | null;
  maximoStatus: string | null;
}

interface NgApiResponse<T> { responseData: T; message: string; timestamp: string; }

@Injectable({ providedIn: 'root' })
export class InsulationApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/insulation`;

  listActive(): Observable<NgApiResponse<InsulationItem[]>> {
    return this.http.get<NgApiResponse<InsulationItem[]>>(`${this.base}/active`);
  }

  markComplete(id: number): Observable<NgApiResponse<boolean>> {
    return this.http.post<NgApiResponse<boolean>>(`${this.base}/${id}/complete`, {});
  }
}
