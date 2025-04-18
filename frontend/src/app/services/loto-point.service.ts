import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LotoPointDto } from '../models/loto/loto-point.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class LotoPointService {
  private apiUrl = `${environment.apiUrl}/loto-points`;

  constructor(private http: HttpClient) {}

  getLotoPoints(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LotoPointDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoPointDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLotoPoints(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoPointDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }

  getLotoPointById(id: string): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.get<SpringApiResponse<LotoPointDto>>(`${this.apiUrl}/${id}`);
  }

  createLotoPoint(lotoPoint: LotoPointDto): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.post<SpringApiResponse<LotoPointDto>>(this.apiUrl, lotoPoint);
  }

  updateLotoPoint(id: string, lotoPoint: LotoPointDto): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.put<SpringApiResponse<LotoPointDto>>(`${this.apiUrl}/${id}`, lotoPoint);
  }

  deleteLotoPoint(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLotoPointsByFileId(fileId: number): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(`${this.apiUrl}/file/${fileId}`);
  }
}