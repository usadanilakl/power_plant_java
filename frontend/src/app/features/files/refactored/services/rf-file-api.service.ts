
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { FileDto } from '../../../../models/file/file.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

@Injectable({
  providedIn: 'root',
})
export class RfFileApiService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  getFiles(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<FileDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<FileDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  searchFiles(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<FileDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<FileDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  getFileById(id: string): Observable<SpringApiResponse<FileDto>> {
    return this.http.get<SpringApiResponse<FileDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  createFile(
    file: FileDto
  ): Observable<SpringApiResponse<FileDto>> {
    return this.http.post<SpringApiResponse<FileDto>>(
      this.apiUrl,
      file
    );
  }

  updateFile(
    file: Partial<FileDto>
  ): Observable<SpringApiResponse<FileDto>> {
    // Backend expects multipart/form-data with fileDto as a JSON blob
    const formData = new FormData();
    const fileDto = new FileDto(file);
    formData.append('fileDto', new Blob([JSON.stringify(fileDto.toIdModel())], {
      type: 'application/json'
    }));
    // No file attached, just the metadata
    return this.http.put<SpringApiResponse<FileDto>>(
      this.apiUrl,
      formData
    );
  }

  deleteFile(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getFilesByType(
    fileType: string
  ): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(
      `${this.apiUrl}/by-type/${fileType}`
    );
  }

  getRelatedLotoPoints(
    fileId: number
  ): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(
      `${this.apiUrl}/${fileId}/related-loto-points`
    );
  }

  getUniqueValuesOfColumn(
    column: string
  ): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(
      `${this.apiUrl}/unique-values/${column}`
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

  uploadFile(formData: FormData): Observable<SpringApiResponse<FileDto>> {
    return this.http.put<SpringApiResponse<FileDto>>(
      this.apiUrl,
      formData
    );
  }

  downloadFile(id: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/download`,
      { responseType: 'blob' }
    );
  }

  /**
   * Upload multiple PDF files at once
   * All files share the same fileType and vendor
   */
  uploadMultipleFiles(
    files: File[],
    fileTypeId: number,
    vendorId: number
  ): Observable<SpringApiResponse<FileDto[]>> {
    const formData = new FormData();

    // Append each file with the same key 'files'
    files.forEach(file => {
      formData.append('files', file);
    });

    const params = new HttpParams()
      .set('fileTypeId', fileTypeId.toString())
      .set('vendorId', vendorId.toString());

    return this.http.post<SpringApiResponse<FileDto[]>>(
      `${this.apiUrl}/multi-upload`,
      formData,
      { params }
    );
  }
}
