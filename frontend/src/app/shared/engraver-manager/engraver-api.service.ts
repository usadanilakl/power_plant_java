import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { EngraverTemplateDto } from './models/engraver-template.model';

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
  processBatch(ids: number[], template: string, openLightBurn = true, withQr = false, layoutVersion = 'standard', characteristicNames: string[] = []): Observable<SpringApiResponse<EngraverBatchResponse>> {
    let params = `openLightBurn=${openLightBurn}&withQr=${withQr}&template=${encodeURIComponent(template)}&layoutVersion=${layoutVersion}`;
    if (characteristicNames.length > 0) {
      params += '&' + characteristicNames.map(n => `characteristicNames=${encodeURIComponent(n)}`).join('&');
    }
    return this.http.post<SpringApiResponse<EngraverBatchResponse>>(
      `${this.apiUrl}/process-batch?${params}`,
      ids
    );
  }

  /**
   * Process a batch using inline item data (edited in dialog, not saved to DB).
   */
  processBatchInline(items: { tagNumber: string; description: string; characteristicsJson: string }[], template: string, openLightBurn = true, withQr = false, layoutVersion = 'standard', characteristicNames: string[] = []): Observable<SpringApiResponse<EngraverBatchResponse>> {
    let params = `openLightBurn=${openLightBurn}&withQr=${withQr}&template=${encodeURIComponent(template)}&layoutVersion=${layoutVersion}`;
    if (characteristicNames.length > 0) {
      params += '&' + characteristicNames.map(n => `characteristicNames=${encodeURIComponent(n)}`).join('&');
    }
    return this.http.post<SpringApiResponse<EngraverBatchResponse>>(
      `${this.apiUrl}/process-batch-inline?${params}`,
      items
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

  // ── Engraver Template CRUD ──

  private templateUrl = `${environment.apiUrl}/engraver-templates`;

  getEngraverTemplates(): Observable<SpringApiResponse<EngraverTemplateDto[]>> {
    return this.http.get<SpringApiResponse<EngraverTemplateDto[]>>(`${this.templateUrl}/get-all`);
  }

  createEngraverTemplate(dto: Partial<EngraverTemplateDto>): Observable<SpringApiResponse<EngraverTemplateDto>> {
    return this.http.post<SpringApiResponse<EngraverTemplateDto>>(this.templateUrl, dto);
  }

  updateEngraverTemplate(id: number, dto: Partial<EngraverTemplateDto>): Observable<SpringApiResponse<EngraverTemplateDto>> {
    return this.http.put<SpringApiResponse<EngraverTemplateDto>>(`${this.templateUrl}/${id}`, dto);
  }

  deleteEngraverTemplate(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.templateUrl}/${id}`);
  }

  uploadTemplateFile(id: number, file: File): Observable<SpringApiResponse<EngraverTemplateDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<EngraverTemplateDto>>(`${this.templateUrl}/${id}/upload-file`, formData);
  }
}
