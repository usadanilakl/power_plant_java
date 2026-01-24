import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface EngraverBatchResponse {
  csvPath: string;
  itemCount: number;
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
   * Process a batch of LOTO point IDs for engraving.
   * Generates CSV and opens LightBurn.
   */
  processBatch(ids: number[], openLightBurn = true): Observable<SpringApiResponse<EngraverBatchResponse>> {
    return this.http.post<SpringApiResponse<EngraverBatchResponse>>(
      `${this.apiUrl}/process-batch?openLightBurn=${openLightBurn}`,
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
   * Open LightBurn with the existing CSV file.
   */
  openLightBurn(): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/open-lightburn`, {});
  }
}
