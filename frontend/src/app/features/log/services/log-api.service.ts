import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { CommentDto } from '../../../models/base/comment.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root',
})
export class LogApiService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getPaginated(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<CommentDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<CommentDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  search(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<CommentDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());
    return this.http.post<SpringPaginatedResponse<CommentDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  getUniqueValuesOfColumn(
    column: string
  ): Observable<SpringPaginatedResponse<string>> {
    return this.http.get<SpringPaginatedResponse<string>>(
      `${this.apiUrl}/unique-values/${column}`
    );
  }

  getFilteredUniqueValuesOfColumn(
    column: string,
    searchCriteria: SearchCriteria,
    page: number = 1,
    pageSize: number = 50,
    andLogicEnabled: boolean = true
  ): Observable<SpringPaginatedResponse<string>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('andLogicEnabled', andLogicEnabled.toString());
    return this.http.post<SpringPaginatedResponse<string>>(
      `${this.apiUrl}/unique-values/${column}/filtered`,
      searchCriteria,
      { params }
    );
  }
}
