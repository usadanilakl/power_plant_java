import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { LotoBoxDto } from '../../models/loto/loto-box.model';

@Injectable({
  providedIn: 'root'
})
export class LotoBoxService {
  private apiUrl = `${environment.apiUrl}/loto-boxes`;

  constructor(private http: HttpClient) {}

  getLotoBoxes(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LotoBoxDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoBoxDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLotoBoxes(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoBoxDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoBoxDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }

  getLotoBoxById(id: string): Observable<SpringApiResponse<LotoBoxDto>> {
    return this.http.get<SpringApiResponse<LotoBoxDto>>(`${this.apiUrl}/${id}`);
  }

  createLotoBox(lotoBox: LotoBoxDto): Observable<SpringApiResponse<LotoBoxDto>> {
    return this.http.post<SpringApiResponse<LotoBoxDto>>(this.apiUrl, lotoBox);
  }

  updateLotoBox(id: string, lotoBox: LotoBoxDto): Observable<SpringApiResponse<LotoBoxDto>> {
    return this.http.put<SpringApiResponse<LotoBoxDto>>(`${this.apiUrl}/${id}`, lotoBox);
  }

  deleteLotoBox(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLotoBoxesByLotoId(lotoId: number): Observable<SpringApiResponse<LotoBoxDto[]>> {
    return this.http.get<SpringApiResponse<LotoBoxDto[]>>(`${this.apiUrl}/loto/${lotoId}`);
  }

  // If there are any LotoBox-specific operations, you can add them here
}
