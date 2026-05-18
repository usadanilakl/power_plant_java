import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoDto, PersonnelSignEntry } from '../../models/loto/loto.model';
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
  getActiveWithBox(): Observable<SpringApiResponse<LotoDto[]>> {
    return this.http.get<SpringApiResponse<LotoDto[]>>(`${this.apiUrl}/active-with-box`);
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

  // LOTO Permit Workflow
  createFromStandard(standardId: number, permitData?: LotoIdDto, boxNumber?: number): Observable<SpringApiResponse<LotoDto>> {
    let params = new HttpParams();
    if (boxNumber != null) params = params.set('boxNumber', boxNumber.toString());
    return this.http.post<SpringApiResponse<LotoDto>>(`${this.apiUrl}/create-from-standard/${standardId}`, permitData ?? {}, { params });
  }

  createFromScratch(permitData?: LotoIdDto, boxNumber?: number): Observable<SpringApiResponse<LotoDto>> {
    let params = new HttpParams();
    if (boxNumber != null) params = params.set('boxNumber', boxNumber.toString());
    return this.http.post<SpringApiResponse<LotoDto>>(`${this.apiUrl}/create-from-scratch`, permitData ?? {}, { params });
  }

  changeStatus(lotoId: number, status: string): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/status`, { status });
  }

  signOn(lotoId: number, entry: PersonnelSignEntry): Observable<SpringApiResponse<LotoDto>> {
    return this.http.post<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/sign-on`, entry);
  }

  signOff(lotoId: number, name: string, comments: string): Observable<SpringApiResponse<LotoDto>> {
    return this.http.post<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/sign-off`, { name, comments });
  }

  getPersonnel(lotoId: number): Observable<SpringApiResponse<PersonnelSignEntry[]>> {
    return this.http.get<SpringApiResponse<PersonnelSignEntry[]>>(`${this.apiUrl}/${lotoId}/personnel`);
  }

  assignLocks(lotoId: number, lockAssignments: any[]): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/assign-locks`, lockAssignments);
  }

  // ----- Lifecycle events -----

  approveForHanging(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/ca-approve-hanging`, {}, options);
  }

  caActivate(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/ca-activate`, {}, options);
  }

  markPointHung(lotoId: number, pointId: number, acknowledged: string[] = [], notes?: string | null): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/hung`,
      { acknowledged, notes: notes ?? null });
  }

  unmarkPointHung(lotoId: number, pointId: number): Observable<SpringApiResponse<LotoDto>> {
    return this.http.delete<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/hung`);
  }

  markPointVerified(lotoId: number, pointId: number, acknowledged: string[] = [], notes?: string | null, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/verified`,
      { acknowledged, notes: notes ?? null },
      options);
  }

  unmarkPointVerified(lotoId: number, pointId: number): Observable<SpringApiResponse<LotoDto>> {
    return this.http.delete<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/verified`);
  }

  markPointWalkdown(lotoId: number, pointId: number, notes?: string | null): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/walkdown`,
      { notes: notes ?? null });
  }

  unmarkPointWalkdown(lotoId: number, pointId: number): Observable<SpringApiResponse<LotoDto>> {
    return this.http.delete<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/walkdown`);
  }

  markPointRemoved(lotoId: number, pointId: number, acknowledged: string[] = [], notes?: string | null): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/removed`,
      { acknowledged, notes: notes ?? null });
  }

  unmarkPointRemoved(lotoId: number, pointId: number): Observable<SpringApiResponse<LotoDto>> {
    return this.http.delete<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/removed`);
  }

  /** Pull a point for test/modification — flags it needs-rehang and clears its hung/verified state. */
  pullPointForTest(lotoId: number, pointId: number, reason?: string | null): Observable<SpringApiResponse<LotoDto>> {
    return this.http.post<SpringApiResponse<LotoDto>>(
      `${this.apiUrl}/${lotoId}/lifecycle/point/${pointId}/pull-for-test`,
      { reason: reason ?? null });
  }

  updateInstancePrerequisites(lotoId: number, prerequisites: Record<number, { requiredPointIds: number[]; safetyConditions: string[] }>): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/prerequisites`, prerequisites);
  }

  markHung(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/hung`, {}, options);
  }

  markVerified(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/verified`, {}, options);
  }

  transferRequestor(lotoId: number, fromUser: string | null, toUser: string, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/transfer`, { fromUser, toUser }, options);
  }

  acceptRequestor(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/accept`, {}, options);
  }

  cancelTransfer(lotoId: number): Observable<SpringApiResponse<LotoDto>> {
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/cancel-transfer`, {});
  }

  releaseByRequestor(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/release-requestor`, {}, options);
  }

  releaseByControlAuthority(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/release-ca`, {}, options);
  }

  removeLocks(lotoId: number, stepUpToken?: string | null): Observable<SpringApiResponse<LotoDto>> {
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.put<SpringApiResponse<LotoDto>>(`${this.apiUrl}/${lotoId}/lifecycle/remove-locks`, {}, options);
  }
}