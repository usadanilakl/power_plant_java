import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoPointIdDto } from '../../../../models/loto/loto-point-id.model';
import { FileDto } from '../../../../models/file/file.model';


@Injectable({
  providedIn: 'root',
})
export class RfLotoPointApiService {
  private apiUrl = `${environment.apiUrl}/loto-points`;

  constructor(private http: HttpClient) {}

  getLotoPoints(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  searchLotoPoints(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }
  searchLpByBaseTagNumber(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/search-by-base-tag-number`,
      criteria,
      { params }
    );
  }

  getLotoPointById(id: string): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.get<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  createLotoPoint(
    lotoPoint: LotoPointDto
  ): Observable<SpringApiResponse<LotoPointDto>> {
    const lotoPointIdDto = lotoPoint.toIdModel();
    return this.http.post<SpringApiResponse<LotoPointDto>>(
      this.apiUrl,
      lotoPointIdDto
    );
  }

  updateLotoPoint(
    lotoPoint: Partial<LotoPointIdDto | LotoPointDto>
  ): Observable<SpringApiResponse<LotoPointDto>> {
    let lotoPointIdDto: LotoPointIdDto;

    console.log('updateLotoPoint received:', lotoPoint);
    console.log('Has toIdModel?', typeof (lotoPoint as any).toIdModel === 'function');

    // Check if it has the toIdModel method (duck typing)
    if (typeof (lotoPoint as any).toIdModel === 'function') {
      console.log('Converting using toIdModel');
      lotoPointIdDto = (lotoPoint as LotoPointDto).toIdModel();
    } else if (this.isLotoPointIdDto(lotoPoint)) {
      console.log('Already an IdDto');
      lotoPointIdDto = lotoPoint as LotoPointIdDto;
    } else {
      console.log('Creating new LotoPointDto and converting');
      // Create a proper LotoPointDto instance and convert it
      // Use 'as any' to bypass type checking since we're handling the conversion
      const dto = new LotoPointDto(lotoPoint as any);
      lotoPointIdDto = dto.toIdModel();
    }

    console.log('Sending to backend:', lotoPointIdDto);

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}`,
      lotoPointIdDto,
      { headers }
    );
  }

  /**
   * Save LOTO point - creates if new, updates if existing
   */
  saveLotoPoint(lotoPoint: LotoPointDto): Observable<SpringApiResponse<LotoPointDto>> {
    if (lotoPoint.id) {
      return this.updateLotoPoint(lotoPoint);
    } else {
      return this.createLotoPoint(lotoPoint);
    }
  }

  // Type guard function
  private isLotoPointIdDto(object: any): object is LotoPointIdDto {
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
          return false; // Found a nested object, so it's not a LotoPointIdDto
        }
      }
    }

    return true; // No nested objects found, likely a LotoPointIdDto
  }

  deleteLotoPoint(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLotoPointsByFileId(
    fileId: number
  ): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(
      `${this.apiUrl}/file/${fileId}`
    );
  }

  getRelatedImages(id: number): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(
      `${this.apiUrl}/${id}/related-images`
    );
  }
  getRelatedFiles(
    lotoPointId: number
  ): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(
      `${this.apiUrl}/${lotoPointId}/related-files`
    );
  }

  getUniqueValuesOfColumn(
    column: string
  ): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(
      `${this.apiUrl}/unique-values/${column}`
    );
  }

  // getFilteredUniqueValuesOfColumn(
  //   column: string,
  //   filters: { [key: string]: string },
  //   page: number = 1,
  //   pageSize: number = 50,
  //   andLogicEnabled: boolean = true
  // ): Observable<SpringPaginatedResponse<LotoPointDto>> {
  //   const params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('pageSize', pageSize.toString())
  //     .set('andLogicEnabled', andLogicEnabled.toString());

  //   return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
  //     `${this.apiUrl}/unique-values/${column}/filtered`,
  //     filters,
  //     { params }
  //   );
  // }

  getFilteredUniqueValuesOfColumn(
    column: string,
    searchCriterica: SearchCriteria,
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
      searchCriterica,
      { params }
    );
  }
}