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
   * Process a batch of LOTO point IDs for engraving.
   * Generates CSV and opens LightBurn.
   * @param ids LOTO point IDs to process
   * @param openLightBurn Whether to open LightBurn after generating CSV
   * @param withQr Whether to include QR codes and use QR template
   */
  processBatch(ids: number[], openLightBurn = true, withQr = false): Observable<SpringApiResponse<EngraverBatchResponse>> {
    return this.http.post<SpringApiResponse<EngraverBatchResponse>>(
      `${this.apiUrl}/process-batch?openLightBurn=${openLightBurn}&withQr=${withQr}`,
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
   * @param withQr Whether to open QR template or text-only template
   */
  openLightBurn(withQr = false): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/open-lightburn?withQr=${withQr}`, {});
  }
}
