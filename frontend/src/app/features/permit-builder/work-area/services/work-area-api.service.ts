import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WorkAreaDto, WorkAreaMapShapeDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';

interface SpringApiResponse<T> {
  responseData: T;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WorkAreaApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/work-areas`;
  private shapeUrl = `${environment.apiUrl}/work-area-shapes`;

  // --- Work Area CRUD ---

  getAll(): Observable<WorkAreaDto[]> {
    return this.http.get<SpringApiResponse<WorkAreaDto[]>>(`${this.baseUrl}/get-all`).pipe(
      map(response => (response.responseData || []).map(d => WorkAreaDto.fromJson(d)))
    );
  }

  getById(id: number): Observable<WorkAreaDto> {
    return this.http.get<SpringApiResponse<WorkAreaDto>>(`${this.baseUrl}/get-by-id/${id}`).pipe(
      map(response => WorkAreaDto.fromJson(response.responseData))
    );
  }

  save(dto: WorkAreaDto): Observable<WorkAreaDto> {
    return this.http.post<SpringApiResponse<WorkAreaDto>>(this.baseUrl, dto.toJson()).pipe(
      map(response => WorkAreaDto.fromJson(response.responseData))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<SpringApiResponse<string>>(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  getByAreaType(typeId: number): Observable<WorkAreaDto[]> {
    return this.http.get<SpringApiResponse<WorkAreaDto[]>>(`${this.baseUrl}/by-area-type/${typeId}`).pipe(
      map(response => (response.responseData || []).map(d => WorkAreaDto.fromJson(d)))
    );
  }

  // --- Permit Counts ---

  getWithPermitCounts(): Observable<WorkAreaPermitCounts[]> {
    return this.http.get<SpringApiResponse<WorkAreaPermitCounts[]>>(`${this.baseUrl}/with-permit-counts`).pipe(
      map(response => response.responseData || [])
    );
  }

  getPermitCounts(workAreaId: number): Observable<{ safeWorkCount: number; hotWorkCount: number; confinedSpaceCount: number }> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/permit-counts/${workAreaId}`).pipe(
      map(response => response.responseData)
    );
  }

  // --- Map Shape CRUD ---

  getAllShapes(): Observable<WorkAreaMapShapeDto[]> {
    return this.http.get<SpringApiResponse<WorkAreaMapShapeDto[]>>(`${this.shapeUrl}/get-all`).pipe(
      map(response => response.responseData || [])
    );
  }

  saveShape(dto: WorkAreaMapShapeDto): Observable<WorkAreaMapShapeDto> {
    return this.http.post<SpringApiResponse<WorkAreaMapShapeDto>>(this.shapeUrl, dto).pipe(
      map(response => response.responseData)
    );
  }

  deleteShape(id: number): Observable<void> {
    return this.http.delete<SpringApiResponse<string>>(`${this.shapeUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  // --- Map Image ---

  uploadMapImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<string>>(`${this.baseUrl}/upload-map-image`, formData).pipe(
      map(response => response.responseData)
    );
  }

  getMapImage(): Observable<string | null> {
    return this.http.get<SpringApiResponse<string>>(`${this.baseUrl}/map-image`, { observe: 'response' }).pipe(
      map(response => {
        if (response.status === 204 || !response.body) return null;
        return response.body.responseData;
      })
    );
  }
}
