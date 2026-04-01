import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { DiagramPlacementDto } from '../models/diagram-placement-dto.model';

@Injectable({ providedIn: 'root' })
export class DiagramPlacementApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/diagram-placements`;

  getByDiagram(diagramId: number): Observable<SpringApiResponse<DiagramPlacementDto[]>> {
    return this.http.get<SpringApiResponse<DiagramPlacementDto[]>>(`${this.baseUrl}/by-diagram/${diagramId}`);
  }

  bulkSave(diagramId: number, dtos: DiagramPlacementDto[]): Observable<SpringApiResponse<DiagramPlacementDto[]>> {
    return this.http.post<SpringApiResponse<DiagramPlacementDto[]>>(`${this.baseUrl}/bulk-save/${diagramId}`, dtos);
  }

  update(id: number, dto: DiagramPlacementDto): Observable<SpringApiResponse<DiagramPlacementDto>> {
    return this.http.put<SpringApiResponse<DiagramPlacementDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
