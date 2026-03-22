import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { DiagramDto } from '../models/diagram.model';

@Injectable({ providedIn: 'root' })
export class DiagramApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/diagrams`;

  getAll(): Observable<SpringApiResponse<DiagramDto[]>> {
    return this.http.get<SpringApiResponse<DiagramDto[]>>(`${this.baseUrl}/get-all`);
  }

  getById(id: number): Observable<SpringApiResponse<DiagramDto>> {
    return this.http.get<SpringApiResponse<DiagramDto>>(`${this.baseUrl}/get-by-id/${id}`);
  }

  create(dto: DiagramDto): Observable<SpringApiResponse<DiagramDto>> {
    return this.http.post<SpringApiResponse<DiagramDto>>(this.baseUrl, dto);
  }

  update(id: number, dto: DiagramDto): Observable<SpringApiResponse<DiagramDto>> {
    return this.http.put<SpringApiResponse<DiagramDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
