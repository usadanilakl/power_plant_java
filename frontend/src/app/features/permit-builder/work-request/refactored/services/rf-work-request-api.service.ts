import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../../models/api/spring-pagenated.response.model';
import { SpringApiResponse } from '../../../../../models/api/spring-api-response.model';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root',
})
export class RfWorkRequestApiService {
  private apiUrl = `${environment.baseApiUrl}/work-requests-api`;

  private workRequestUpdatedSubject = new Subject<WorkRequestDto>();
  workRequestUpdated$ = this.workRequestUpdatedSubject.asObservable();

  private workRequestDeletedSubject = new Subject<number>();
  workRequestDeleted$ = this.workRequestDeletedSubject.asObservable();

  constructor(private http: HttpClient) {}

  getWorkRequests(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<WorkRequestDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<WorkRequestDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  searchWorkRequests(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<WorkRequestDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<WorkRequestDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  getWorkRequestById(id: number): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.get<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  getEmpty(): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.get<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/empty`
    );
  }

  saveWorkRequest(dto: WorkRequestDto): Observable<SpringApiResponse<WorkRequestDto>> {
    const saveObservable = dto.id
      ? this.http.put<SpringApiResponse<WorkRequestDto>>(this.apiUrl, dto.toJson())
      : this.http.post<SpringApiResponse<WorkRequestDto>>(this.apiUrl, dto.toJson());

    return saveObservable.pipe(
      tap(response => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.workRequestUpdatedSubject.next(updated);
        }
      })
    );
  }

  deleteWorkRequest(id: number): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.delete<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/${id}`
    ).pipe(
      tap(() => {
        this.workRequestDeletedSubject.next(id);
      })
    );
  }

  changeStatus(id: number, status: string): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.get<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/change-status/${id}/${status}`
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.workRequestUpdatedSubject.next(updated);
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

  getByStatus(status: string): Observable<SpringApiResponse<WorkRequestDto[]>> {
    return this.http.get<SpringApiResponse<WorkRequestDto[]>>(
      `${this.apiUrl}/by-status/${status}`
    );
  }

  getAttachments(id: number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(
      `${this.apiUrl}/${id}/attachments`
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

  // ====================== Action Methods ======================

  requestMoreDetails(id: number, message?: string): Observable<SpringApiResponse<WorkRequestDto>> {
    const payload = message ? { message } : {};
    return this.http.post<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/request-details/${id}`,
      payload
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.workRequestUpdatedSubject.next(updated);
        }
      })
    );
  }

  cancelWorkRequest(id: number): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.post<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/cancel/${id}`,
      {}
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.workRequestUpdatedSubject.next(updated);
        }
      })
    );
  }

  revokeWorkRequest(id: number): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.post<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/revoke/${id}`,
      {}
    ).pipe(
      tap(response => {
        if (response.responseData) {
          const updated = WorkRequestDto.fromJson(response.responseData);
          this.workRequestUpdatedSubject.next(updated);
        }
      })
    );
  }
}
