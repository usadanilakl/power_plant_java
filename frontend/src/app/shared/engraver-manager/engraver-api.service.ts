import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface EngraverBatchResponse {
  csvPath: string;
  itemCount: number;
  withQr: boolean;
  message: string;
}

export interface EngraverConfigResponse {
  batchSize: number;
  csvPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class EngraverApiService {
  private apiUrl = `${environment.apiUrl}/engrave`;

  constructor(private http: HttpClient) {}

  /**
   * List available LightBurn template files.
   */
  getTemplates(): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(`${this.apiUrl}/templates`);
  }

  /**
   * Process a batch of LOTO point IDs for engraving.
   * Generates CSV and opens LightBurn with the selected template.
   */
  processBatch(ids: number[], template: string, openLightBurn = true, withQr = false): Observable<SpringApiResponse<EngraverBatchResponse>> {
    const params = `openLightBurn=${openLightBurn}&withQr=${withQr}&template=${encodeURIComponent(template)}`;
    return this.http.post<SpringApiResponse<EngraverBatchResponse>>(
      `${this.apiUrl}/process-batch?${params}`,
      ids
    );
  }

  /**
   * Get engraver configuration (batch size, CSV path).
   */
  getConfig(): Observable<SpringApiResponse<EngraverConfigResponse>> {
    return this.http.get<SpringApiResponse<EngraverConfigResponse>>(`${this.apiUrl}/config`);
  }

  /**
   * Open LightBurn with the existing CSV file and a specific template.
   */
  openLightBurn(template: string): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(
      `${this.apiUrl}/open-lightburn?template=${encodeURIComponent(template)}`, {}
    );
  }

  /**
   * Mark LOTO points as labeled after engraving.
   */
  markLabeled(ids: number[]): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/mark-labeled`, ids);
  }
}
