import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { InstrumentDto } from '../../models/instrumentation/instrument.model';

export interface BulkUploadResult {
  created: number;
  updated: number;
  failed: number;
  total: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentBulkUploadApiService {
  private apiUrl = `${environment.apiUrl}/instruments/bulk`;

  constructor(private http: HttpClient) {}

  preview(file: File): Observable<SpringApiResponse<InstrumentDto[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<InstrumentDto[]>>(`${this.apiUrl}/preview`, formData);
  }

  upload(file: File): Observable<SpringApiResponse<BulkUploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<BulkUploadResult>>(`${this.apiUrl}/upload`, formData);
  }
}
