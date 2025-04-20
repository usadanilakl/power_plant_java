import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LockDto } from '../../models/loto/lock.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class LockService {
  private apiUrl = `${environment.apiUrl}/locks`;

  constructor(private http: HttpClient) {}

  getLocks(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LockDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LockDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLocks(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LockDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LockDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }

  getLockById(id: string): Observable<SpringApiResponse<LockDto>> {
    return this.http.get<SpringApiResponse<LockDto>>(`${this.apiUrl}/${id}`);
  }

  createLock(lock: LockDto): Observable<SpringApiResponse<LockDto>> {
    return this.http.post<SpringApiResponse<LockDto>>(this.apiUrl, lock);
  }

  updateLock(id: string, lock: LockDto): Observable<SpringApiResponse<LockDto>> {
    return this.http.put<SpringApiResponse<LockDto>>(`${this.apiUrl}/${id}`, lock);
  }

  deleteLock(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLocksByLotoId(lotoId: number): Observable<SpringApiResponse<LockDto[]>> {
    return this.http.get<SpringApiResponse<LockDto[]>>(`${this.apiUrl}/loto/${lotoId}`);
  }

  // If there are any Lock-specific operations, you can add them here
}