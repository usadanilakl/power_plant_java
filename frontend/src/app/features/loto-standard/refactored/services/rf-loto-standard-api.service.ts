import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoStandardIdDto } from '../../../../models/loto/loto-standard-id.model';

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardApiService {
  private apiUrl = `${environment.apiUrl}/loto-standards`;

  constructor(private http: HttpClient) {}

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
    console.log('createLotoStandard received:', lotoStandard);
    console.log('Has toIdDto?', typeof (lotoStandard as any).toIdDto === 'function');

    let lotoStandardIdDto: LotoStandardIdDto;

    // Check if it has the toIdDto method (duck typing)
    if (typeof (lotoStandard as any).toIdDto === 'function') {
      console.log('Converting using toIdDto');
      lotoStandardIdDto = lotoStandard.toIdDto();
    } else {
      console.log('Creating new LotoStandardDto and converting');
      const dto = new LotoStandardDto(lotoStandard as any);
      lotoStandardIdDto = dto.toIdDto();
    }

    console.log('Sending to backend:', lotoStandardIdDto);

    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      this.apiUrl,
      lotoStandardIdDto
    );
  }

  /**
   * Update existing loto standard
   */
  updateLotoStandard(
    lotoStandard: Partial<LotoStandardIdDto | LotoStandardDto>
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    let lotoStandardIdDto: LotoStandardIdDto;

    console.log('updateLotoStandard received:', lotoStandard);
    console.log('Has toIdDto?', typeof (lotoStandard as any).toIdDto === 'function');

    // Check if it has the toIdDto method (duck typing)
    if (typeof (lotoStandard as any).toIdDto === 'function') {
      console.log('Converting using toIdDto');
      lotoStandardIdDto = (lotoStandard as LotoStandardDto).toIdDto();
    } else if (this.isLotoStandardIdDto(lotoStandard)) {
      console.log('Already an IdDto');
      lotoStandardIdDto = lotoStandard as LotoStandardIdDto;
    } else {
      console.log('Creating new LotoStandardDto and converting');
      const dto = new LotoStandardDto(lotoStandard as any);
      lotoStandardIdDto = dto.toIdDto();
    }

    console.log('Sending to backend:', lotoStandardIdDto);

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
   * Type guard to check if object is LotoStandardIdDto
   */
  private isLotoStandardIdDto(object: any): object is LotoStandardIdDto {
    // Iterate over all fields
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const value = object[key];
        // Check if the value is an object, but not an array or null
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return false; // Found a nested object, so it's not a LotoStandardIdDto
        }
      }
    }

    return true; // No nested objects found, likely a LotoStandardIdDto
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
}
