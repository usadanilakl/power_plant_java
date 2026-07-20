import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';

/** Backend NgPlantMapBackgroundService.BackgroundResult — a servable URL + cache token + dimensions. */
export interface BackgroundResult {
  url: string;
  ext: string;
  token: number;
  width: number;
  height: number;
}

/**
 * The 2D plant map's reference/underlay image — a real synced file (not base64), keyed by diagram id. GET lazily
 * pulls the bytes onto this device if a peer uploaded them, and returns 204 (null body) when the diagram has none.
 */
@Injectable({ providedIn: 'root' })
export class PlantMapBackgroundApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/plant-map`;

  /** null when the diagram has no background (204). */
  get(diagramId: number): Observable<SpringApiResponse<BackgroundResult> | null> {
    return this.http.get<SpringApiResponse<BackgroundResult> | null>(`${this.base}/${diagramId}/background`);
  }

  upload(diagramId: number, file: File): Observable<SpringApiResponse<BackgroundResult>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<SpringApiResponse<BackgroundResult>>(`${this.base}/${diagramId}/background`, fd);
  }

  delete(diagramId: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.base}/${diagramId}/background`);
  }
}
