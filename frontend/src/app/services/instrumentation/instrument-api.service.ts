import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { InstrumentDto } from '../../models/instrumentation/instrument.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentApiService {
  private apiUrl = `${environment.apiUrl}/instruments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<InstrumentDto[]>> {
    return this.http.get<SpringApiResponse<InstrumentDto[]>>(`${this.apiUrl}/get-all`);
  }

  getByStatus(status: string): Observable<SpringApiResponse<InstrumentDto[]>> {
    return this.http.get<SpringApiResponse<InstrumentDto[]>>(`${this.apiUrl}/get-by-status/${status}`);
  }

  getById(id: string): Observable<SpringApiResponse<InstrumentDto>> {
    return this.http.get<SpringApiResponse<InstrumentDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  create(dto: InstrumentDto): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/create`, dto);
  }
}
