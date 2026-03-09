import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoDto } from '../../models/loto/loto.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { LotoIdDto } from '../../models/loto/loto-id.model';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { FileDto } from '../../models/file/file.model';

@Injectable({
  providedIn: 'root'
})
export class LotoService {

  private apiUrl = `${environment.apiUrl}/lotos`;

  constructor(private http: HttpClient) {}

  getLotos(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<LotoDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoDto>>(`${this.apiUrl}/paginated`, { params });
  }

  searchLotos(criteria: SearchCriteria, pageSize: number): Observable<SpringPaginatedResponse<LotoDto[]>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }

  getLotoById(id: string): Observable<SpringApiResponse<LotoDto>> {
    return this.http.get<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${id}`);
  }

  createLoto(loto: LotoDto): Observable<SpringApiResponse<LotoDto>> {
    return this.http.post<SpringApiResponse<LotoDto>>(this.apiUrl, loto);
  }

  updateLoto(loto: LotoIdDto): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}`, loto);
  }

  save(lotos: LotoDto[]): Observable<SpringApiResponse<LotoDto[]>> {
    const lotoIdDtos = lotos.map(loto => new LotoDto(loto).toIdModel())
    return this.http.post<SpringApiResponse<LotoDto[]>>(this.apiUrl+"/save-all", lotoIdDtos);
  }

  deleteLoto(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getLotosByEquipmentId(equipmentId: number): Observable<SpringApiResponse<LotoDto[]>> {
    return this.http.get<SpringApiResponse<LotoDto[]>>(`${this.apiUrl}/equipment/${equipmentId}`);
  }

  getRelatedDocuments(id: number): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(`${this.apiUrl}/${id}/related-documents`);
  }

  
  getRelatedImages(id: number): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(`${this.apiUrl}/${id}/related-images`);
  }
  getRelatedFiles(lotoStandardId: number): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(`${this.apiUrl}/${lotoStandardId}/related-files`);
  }
  getActiveLotoPoints(): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(`${this.apiUrl}/active`);
  }
  addLotoPointToLoto(pointId: number, lotoId: number): Observable<SpringApiResponse<LotoDto>> {
      return this.http.post<SpringApiResponse<LotoDto>>(`${this.apiUrl}/add/${pointId}/to/${lotoId}`, {});
  }
  removeLotoPointFromLoto(id: number, id1: number): Observable<SpringApiResponse<LotoDto>> {
      return this.http.delete<SpringApiResponse<LotoDto>>(`${this.apiUrl}/remove/${id}/from/${id1}`);
  }
  reorderLotoPoints(currentLotoId: number, lotoPointsIds: number[]): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${currentLotoId}/reorder-loto-points`, lotoPointsIds);
  }

  previewImport(file: File): Observable<SpringApiResponse<any[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<any[]>>(`${this.apiUrl}/import/preview`, formData);
  }

  importLotos(file: File): Observable<SpringApiResponse<LotoDto[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SpringApiResponse<LotoDto[]>>(`${this.apiUrl}/import`, formData);
  }
}