import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { LotoBoxDto } from '../../../../models/loto/loto-box.model';

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

  // LED Control Methods - These go through database and update ESP device

  /**
   * Get all LOTO boxes with their LED color state from database
   */
  getAllBoxes(): Observable<SpringApiResponse<LotoBoxDto[]>> {
    return this.http.get<SpringApiResponse<LotoBoxDto[]>>(`${this.apiUrl}/all`);
  }

  /**
   * Update box LED color - saves to database and updates ESP device
   */
  updateBoxLedColor(boxNumber: number, r: number, g: number, b: number, brightness: number = 255): Observable<SpringApiResponse<LotoBoxDto>> {
    const params = new HttpParams()
      .set('r', r.toString())
      .set('g', g.toString())
      .set('b', b.toString())
      .set('brightness', brightness.toString());
    return this.http.put<SpringApiResponse<LotoBoxDto>>(`${this.apiUrl}/number/${boxNumber}/led-color`, null, { params });
  }

  /**
   * Sync all boxes to ESP device using current database state
   */
  syncAllBoxesToEsp(): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/sync-to-esp`, null);
  }

  getAvailableBoxes(): Observable<SpringApiResponse<LotoBoxDto[]>> {
    return this.http.get<SpringApiResponse<LotoBoxDto[]>>(`${this.apiUrl}/available`);
  }

  getBoxGrid(): Observable<SpringApiResponse<LotoBoxDto[]>> {
    return this.http.get<SpringApiResponse<LotoBoxDto[]>>(`${this.apiUrl}/grid`);
  }

  getWledQueueStatus(): Observable<SpringApiResponse<{pending: number, expired: number}>> {
    return this.http.get<SpringApiResponse<{pending: number, expired: number}>>(`${this.apiUrl}/wled-queue-status`);
  }

  // Box-and-lock management

  bulkAddLocks(boxId: number, startNumber: number, count: number, isSingleLock: boolean, lockType: string = 'LOCK'): Observable<SpringApiResponse<LotoBoxDto>> {
    const params = new HttpParams()
      .set('startNumber', startNumber.toString())
      .set('count', count.toString())
      .set('isSingleLock', String(isSingleLock))
      .set('lockType', lockType);
    return this.http.post<SpringApiResponse<LotoBoxDto>>(`${this.apiUrl}/${boxId}/locks`, null, { params });
  }

  deactivateBox(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  seedInventory(): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/seed-inventory`, null);
  }
}
