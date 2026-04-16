import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import {
  ConflictSummary,
  ConflictSearchRequest,
  DuplicateGroup,
  MergeRequest,
} from '../../../models/loto/loto-conflict.model';

@Injectable({
  providedIn: 'root',
})
export class LotoConflictApiService {
  private apiUrl = `${environment.apiUrl}/loto-points/conflicts`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<SpringApiResponse<ConflictSummary>> {
    return this.http.get<SpringApiResponse<ConflictSummary>>(
      `${this.apiUrl}/summary`
    );
  }

  getConflictsByType(
    request: ConflictSearchRequest
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/by-type`,
      request
    );
  }

  getDuplicateGroups(): Observable<SpringApiResponse<DuplicateGroup[]>> {
    return this.http.get<SpringApiResponse<DuplicateGroup[]>>(
      `${this.apiUrl}/duplicate-groups`
    );
  }

  mergeDuplicates(
    request: MergeRequest
  ): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.post<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/merge`,
      request
    );
  }
}
