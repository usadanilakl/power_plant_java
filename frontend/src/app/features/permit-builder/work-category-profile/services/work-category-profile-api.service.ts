import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WorkCategoryProfileDto } from '../../../../models/permits/work-category-profile.model';

interface SpringApiResponse<T> {
  responseData: T;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WorkCategoryProfileApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/work-category-profiles`;

  getAll(): Observable<WorkCategoryProfileDto[]> {
    return this.http.get<SpringApiResponse<WorkCategoryProfileDto[]>>(`${this.baseUrl}/get-all`).pipe(
      map(response => (response.responseData || []).map(d => WorkCategoryProfileDto.fromJson(d)))
    );
  }

  getById(id: number): Observable<WorkCategoryProfileDto> {
    return this.http.get<SpringApiResponse<WorkCategoryProfileDto>>(`${this.baseUrl}/get-by-id/${id}`).pipe(
      map(response => WorkCategoryProfileDto.fromJson(response.responseData))
    );
  }

  getByWorkCategoryId(categoryId: number): Observable<WorkCategoryProfileDto | null> {
    return this.http.get<SpringApiResponse<WorkCategoryProfileDto>>(`${this.baseUrl}/by-work-category/${categoryId}`).pipe(
      map(response => response.responseData ? WorkCategoryProfileDto.fromJson(response.responseData) : null)
    );
  }

  save(dto: WorkCategoryProfileDto): Observable<WorkCategoryProfileDto> {
    return this.http.post<SpringApiResponse<WorkCategoryProfileDto>>(this.baseUrl, dto.toJson()).pipe(
      map(response => WorkCategoryProfileDto.fromJson(response.responseData))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<SpringApiResponse<string>>(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }
}
