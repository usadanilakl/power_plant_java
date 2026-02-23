import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../../models/api/spring-pagenated.response.model';
import { SpringApiResponse } from '../../../../../models/api/spring-api-response.model';
import { JhaDto } from '../../../../../models/permits/jha.model';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root',
})
export class RfJhaApiService {
  private apiUrl = `${environment.baseApiUrl}/jha-api`;

  private jhaUpdatedSubject = new Subject<JhaDto>();
  jhaUpdated$ = this.jhaUpdatedSubject.asObservable();

  private jhaDeletedSubject = new Subject<number>();
  jhaDeleted$ = this.jhaDeletedSubject.asObservable();

  constructor(private http: HttpClient) {}

  getJhas(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<JhaDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<JhaDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  searchJhas(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<JhaDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<JhaDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  getJhaById(id: number): Observable<SpringApiResponse<JhaDto>> {
    return this.http.get<SpringApiResponse<JhaDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  getEmpty(): Observable<SpringApiResponse<JhaDto>> {
    return this.http.get<SpringApiResponse<JhaDto>>(
      `${this.apiUrl}/empty`
    );
  }

  saveJha(dto: JhaDto): Observable<SpringApiResponse<JhaDto>> {
    const saveObservable = dto.id
      ? this.http.put<SpringApiResponse<JhaDto>>(this.apiUrl, dto.toJson())
      : this.http.post<SpringApiResponse<JhaDto>>(this.apiUrl, dto.toJson());

    return saveObservable.pipe(
      tap(response => {
        if (response.responseData) {
          const updated = JhaDto.fromJson(response.responseData);
          this.jhaUpdatedSubject.next(updated);
        }
      })
    );
  }

  deleteJha(id: number): Observable<SpringApiResponse<JhaDto>> {
    return this.http.delete<SpringApiResponse<JhaDto>>(
      `${this.apiUrl}/${id}`
    ).pipe(
      tap(() => {
        this.jhaDeletedSubject.next(id);
      })
    );
  }

  changeStatus(id: number, status: string): Observable<SpringApiResponse<JhaDto>> {
    return this.http.get<SpringApiResponse<JhaDto>>(
      `${this.apiUrl}/change-status/${id}/${status}`
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = JhaDto.fromJson(response.responseData);
          this.jhaUpdatedSubject.next(updated);
        }
      })
    );
  }

  triggerSync(): Observable<SpringApiResponse<number>> {
    return this.http.post<SpringApiResponse<number>>(
      `${this.apiUrl}/sync`,
      {}
    );
  }

  getAttachments(id: number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(
      `${this.apiUrl}/${id}/attachments`
    );
  }

  revokeJha(id: number): Observable<SpringApiResponse<JhaDto>> {
    return this.http.post<SpringApiResponse<JhaDto>>(
      `${this.apiUrl}/revoke/${id}`,
      {}
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = JhaDto.fromJson(response.responseData);
          this.jhaUpdatedSubject.next(updated);
        }
      })
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
