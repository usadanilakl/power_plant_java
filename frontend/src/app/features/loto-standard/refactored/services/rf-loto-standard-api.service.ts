import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { CounterpartStandardPreviewDto } from '../../../../models/loto/counterpart-standard-preview.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoStandardIdDto } from '../../../../models/loto/loto-standard-id.model';
import { LotoStandardMapperService } from './rf-loto-standard-mapper.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardApiService {
  private apiUrl = `${environment.apiUrl}/loto-standards`;

  constructor(
    private http: HttpClient,
    private mapper: LotoStandardMapperService
  ) {}

  /**
   * Get paginated loto standards
   */
  getLotoStandards(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<LotoStandardDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoStandardDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  /**
   * Search loto standards with criteria
   */
  searchLotoStandards(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoStandardDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoStandardDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  /**
   * Get single loto standard by ID
   */
  getLotoStandardById(id: string): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.get<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Create new loto standard
   */
  createLotoStandard(
    lotoStandard: LotoStandardDto
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    const lotoStandardIdDto = this.mapper.toIdDto(lotoStandard);

    console.log('createLotoStandard received:', lotoStandard);
    console.log('Sending to backend:', lotoStandardIdDto);

    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      this.apiUrl,
      lotoStandardIdDto
    );
  }

  /**
   * Update existing loto standard
   * Note: lotoPoints are excluded from updates as they are managed separately via
   * addLotoPointToStandard, removeLotoPointFromStandard, and reorderLotoPoints
   */
  updateLotoStandard(
    lotoStandard: Partial<LotoStandardIdDto | LotoStandardDto>
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    // Exclude lotoPoints from update - they are managed separately
    const lotoStandardIdDto = this.mapper.toIdDto(lotoStandard, true);

    console.log('updateLotoStandard received:', lotoStandard);
    console.log('Sending to backend (lotoPoints excluded):', lotoStandardIdDto);

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}`,
      lotoStandardIdDto,
      { headers }
    );
  }

  /**
   * Save loto standard - creates if new, updates if existing
   */
  saveLotoStandard(lotoStandard: LotoStandardDto): Observable<SpringApiResponse<LotoStandardDto>> {
    if (lotoStandard.id) {
      return this.updateLotoStandard(lotoStandard);
    } else {
      return this.createLotoStandard(lotoStandard);
    }
  }

  /**
   * Delete loto standard by ID
   */
  deleteLotoStandard(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get filtered unique values for a column (for dropdown filters)
   */
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

  /**
   * Get loto standards grouped by specified criteria for left menu
   * @param groupBy The grouping criteria: system, unit, etc.
   * @returns Map of group names to arrays of loto standards
   */
  getGroupedLotoStandards(groupBy: string): Observable<SpringApiResponse<{ [key: string]: LotoStandardDto[] }>> {
    const params = new HttpParams().set('groupBy', groupBy);

    return this.http.get<SpringApiResponse<{ [key: string]: LotoStandardDto[] }>>(
      `${this.apiUrl}/grouped`,
      { params }
    );
  }

  /**
   * Add a LOTO point to a standard
   * @param standardId The ID of the standard
   * @param lotoPointId The ID of the LOTO point to add
   */
  addLotoPointToStandard(standardId: number, lotoPointId: number): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/add-loto-point/${lotoPointId}`,
      {}
    );
  }

  /**
   * Remove a LOTO point from a standard
   * @param standardId The ID of the standard
   * @param lotoPointId The ID of the LOTO point to remove
   */
  removeLotoPointFromStandard(standardId: number, lotoPointId: number): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.delete<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/remove-loto-point/${lotoPointId}`
    );
  }

  /**
   * Reorder LOTO points in a standard
   * @param standardId The ID of the standard
   * @param lotoPointIds Ordered array of LOTO point IDs
   */
  reorderLotoPoints(standardId: number, lotoPointIds: number[]): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/reorder-loto-points`,
      lotoPointIds
    );
  }

  /**
   * Generate counterpart standard preview.
   * Returns categorized counterpart LOTO points for each point in the source standard.
   */
  generateCounterpartPreview(standardId: number): Observable<SpringApiResponse<CounterpartStandardPreviewDto>> {
    return this.http.get<SpringApiResponse<CounterpartStandardPreviewDto>>(
      `${this.apiUrl}/${standardId}/counterpart-preview`
    );
  }
}
