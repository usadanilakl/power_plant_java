import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  RedTagStandard,
  RedTagPointMatch,
  RedTagImportResult,
} from '../../models/loto/red-tag-standard.model';
import { LotoStandardDto } from '../../models/loto/loto-standard.model';

/**
 * API client for Red Tag standards — the digitized LOTO standards imported
 * from the external Red Tag system. Backend: `/ng/red-tag-standards`.
 */
@Injectable({ providedIn: 'root' })
export class RedTagStandardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/red-tag-standards`;

  getAll(): Observable<SpringApiResponse<RedTagStandard[]>> {
    return this.http.get<SpringApiResponse<RedTagStandard[]>>(this.apiUrl);
  }

  getById(id: number): Observable<SpringApiResponse<RedTagStandard>> {
    return this.http.get<SpringApiResponse<RedTagStandard>>(`${this.apiUrl}/${id}`);
  }

  /** Per-row reconciliation: suggested LOTO points (or none) for each PNID. */
  getMatches(id: number): Observable<SpringApiResponse<RedTagPointMatch[]>> {
    return this.http.get<SpringApiResponse<RedTagPointMatch[]>>(`${this.apiUrl}/${id}/matches`);
  }

  update(id: number, standard: Partial<RedTagStandard>): Observable<SpringApiResponse<RedTagStandard>> {
    return this.http.put<SpringApiResponse<RedTagStandard>>(`${this.apiUrl}/${id}`, standard);
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /** Manual on-demand seed import. Idempotent — existing standards are skipped. */
  importSeed(): Observable<SpringApiResponse<RedTagImportResult>> {
    return this.http.post<SpringApiResponse<RedTagImportResult>>(`${this.apiUrl}/import`, {});
  }

  /** Generate a native LotoStandard from the selected LOTO point ids. */
  generateStandard(
    id: number,
    name: string,
    lotoPointIds: number[],
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${id}/generate-standard`,
      { name, lotoPointIds },
    );
  }
}
