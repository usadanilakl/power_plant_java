import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { InstrumentLogDto } from '../../models/instrumentation/instrument-log.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentLogApiService {
  private apiUrl = `${environment.apiUrl}/instrument-logs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<InstrumentLogDto[]>> {
    return this.http.get<SpringApiResponse<InstrumentLogDto[]>>(`${this.apiUrl}/get-all`);
  }

  getByInstrument(tagNumber: string): Observable<SpringApiResponse<InstrumentLogDto[]>> {
    return this.http.get<SpringApiResponse<InstrumentLogDto[]>>(`${this.apiUrl}/get-by-instrument/${tagNumber}`);
  }

  getById(id: string): Observable<SpringApiResponse<InstrumentLogDto>> {
    return this.http.get<SpringApiResponse<InstrumentLogDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }
}
