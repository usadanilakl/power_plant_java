import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { DiagramConnectionDto } from '../models/diagram-connection-dto.model';

@Injectable({ providedIn: 'root' })
export class DiagramConnectionApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/diagram-connections`;

  getByDiagram(diagramId: number): Observable<SpringApiResponse<DiagramConnectionDto[]>> {
    return this.http.get<SpringApiResponse<DiagramConnectionDto[]>>(`${this.baseUrl}/by-diagram/${diagramId}`);
  }

  bulkSave(diagramId: number, dtos: DiagramConnectionDto[]): Observable<SpringApiResponse<DiagramConnectionDto[]>> {
    return this.http.post<SpringApiResponse<DiagramConnectionDto[]>>(`${this.baseUrl}/bulk-save/${diagramId}`, dtos);
  }

  update(id: number, dto: DiagramConnectionDto): Observable<SpringApiResponse<DiagramConnectionDto>> {
    return this.http.put<SpringApiResponse<DiagramConnectionDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
