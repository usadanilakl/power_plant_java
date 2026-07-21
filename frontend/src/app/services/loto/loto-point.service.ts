import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { LotoPointIdDto } from '../../models/loto/loto-point-id.model';
import { FileDto } from '../../models/file/file.model';

@Injectable({
  providedIn: 'root'
})
export class LotoPointService {
  private apiUrl = `${environment.apiUrl}/loto-points`;

  constructor(private http: HttpClient) {}

  getLotoPoints(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoPointDto>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLotoPoints(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(`${this.apiUrl}/search`, criteria, { params });
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
      console.error('Invalid parameter type, expected LotoPointDto or LotoPointIdDto');
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
    // Iterate over all fields
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const value = object[key];
        // Check if the value is an object, but not an array or null
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return false; // Found a nested object, so it's not a LotoPointIdDto
        }
      }
    }
  
    return true; // No nested objects found, likely a LotoPointIdDto
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
  getRelatedFiles(lotoPointId: number): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(`${this.apiUrl}/${lotoPointId}/related-files`);
  }

  /**
   * Attach one or more pictures to a LOTO point via multipart batch upload.
   * Returns the refreshed LotoPointDto so the caller can drop the returned
   * dto into state and see the new thumbnails without a follow-up GET.
   * <p>
   * Backend deduplicates by SHA-256 and populates FileObject metadata
   * (name = LOTO description with " (N)" suffix when >1, system = LOTO
   * system) for each uploaded file — see NgLotoPointService.uploadPictures.
   * <p>
   * Do NOT set Content-Type manually — the browser sets
   * "multipart/form-data; boundary=..." including the boundary token,
   * which we can't reproduce.
   */
  uploadPictures(lotoPointId: number, files: File[]): Observable<SpringApiResponse<LotoPointDto>> {
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);
    return this.http.post<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/${lotoPointId}/pictures`, form
    );
  }

  /**
   * List FileObjects in the plant file library with fileType.name="Picture" —
   * the pool from which the "attach existing picture" picker draws. Backend
   * hard-caps {@code pageSize} at 200 rows and supports server-side
   * substring name search so the picker stays fast as the library grows.
   *
   * @param search optional case-insensitive substring; null/empty returns
   *               the newest page unfiltered.
   * @param page   1-indexed (backend contract). Default 1.
   * @param pageSize per-request cap (server clamps to 200). Default 200.
   */
  getPictureLibrary(
    search: string | null = null,
    page: number = 1,
    pageSize: number = 200
  ): Observable<SpringApiResponse<FileDto[]>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.http.get<SpringApiResponse<FileDto[]>>(
      `${this.apiUrl}/pictures/library`, { params }
    );
  }

  /**
   * Link an EXISTING FileObject (already uploaded, already in the plant
   * file library) to a LOTO point. Same M2M join as uploadPictures without
   * the upload — used by the "attach existing picture" picker so the same
   * photo can back multiple LOTO points. Idempotent server-side.
   */
  linkPicture(lotoPointId: number, fileId: number): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.post<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/${lotoPointId}/pictures/link/${fileId}`, null
    );
  }

  /**
   * Detach a picture from a LOTO point (unlinks the M2M row; does NOT
   * delete the underlying FileObject — see backend removePicture docs).
   */
  removePicture(lotoPointId: number, fileId: number): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.delete<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/${lotoPointId}/pictures/${fileId}`
    );
  }
}