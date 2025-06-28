import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { LotoPointIdDto } from '../../models/loto/loto-point-id.model';

@Injectable({
  providedIn: 'root'
})
export class LotoPointService {
  private apiUrl = `${environment.apiUrl}/loto-points`;

  constructor(private http: HttpClient) {}

  getLotoPoints(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LotoPointDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoPointDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLotoPoints(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoPointDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }
  searchLpByBaseTagNumber(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(`${this.apiUrl}/search-by-base-tag-number`, criteria, { params });
  }

  getLotoPointById(id: string): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.get<SpringApiResponse<LotoPointDto>>(`${this.apiUrl}/${id}`);
  }

  createLotoPoint(lotoPoint: LotoPointDto): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.post<SpringApiResponse<LotoPointDto>>(this.apiUrl, lotoPoint);
  }

  updateLotoPoint(lotoPoint: Partial<LotoPointIdDto | LotoPointDto>): Observable<SpringApiResponse<LotoPointDto>> {
    let lotoPointIdDto: LotoPointIdDto;
  
    if (lotoPoint instanceof LotoPointDto) {
      lotoPointIdDto = lotoPoint.toIdModel();
    } else if (this.isLotoPointIdDto(lotoPoint)) {
      lotoPointIdDto = lotoPoint;
    } else {
      // If it's neither, create a new LotoPointDto and convert it
      const fullLotoPoint = new LotoPointDto();
      Object.assign(fullLotoPoint, lotoPoint);
      lotoPointIdDto = fullLotoPoint.toIdModel();
    }
  
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put<SpringApiResponse<LotoPointDto>>(`${this.apiUrl}`, lotoPointIdDto, { headers });
  }
  
  // Type guard function
  private isLotoPointIdDto(object: any): object is LotoPointIdDto {
    return 'id' in object && 'tagNumber' in object; // Add more properties if needed
  }

  deleteLotoPoint(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLotoPointsByFileId(fileId: number): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(`${this.apiUrl}/file/${fileId}`);
  }

  
  getRelatedImages(id: number): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(`${this.apiUrl}/${id}/related-images`);
  }

  
}