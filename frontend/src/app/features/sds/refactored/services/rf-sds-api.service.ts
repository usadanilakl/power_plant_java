import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

@Injectable({ providedIn: 'root' })
export class RfSdsApiService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}/ng/sds-chemicals`;

  private itemUpdatedSubject = new Subject<SdsChemicalDto>();
  itemUpdated$ = this.itemUpdatedSubject.asObservable();

  private itemDeletedSubject = new Subject<number>();
  itemDeleted$ = this.itemDeletedSubject.asObservable();

  getAll(): Observable<SpringApiResponse<SdsChemicalDto[]>> {
    return this.http.get<SpringApiResponse<SdsChemicalDto[]>>(`${this.apiUrl}/get-all`);
  }

  getActive(): Observable<SpringApiResponse<SdsChemicalDto[]>> {
    return this.http.get<SpringApiResponse<SdsChemicalDto[]>>(`${this.apiUrl}/active`);
  }

  getByStatus(status: string): Observable<SpringApiResponse<SdsChemicalDto[]>> {
    return this.http.get<SpringApiResponse<SdsChemicalDto[]>>(`${this.apiUrl}/by-status/${status}`);
  }

  getUnprocessed(): Observable<SpringApiResponse<SdsChemicalDto[]>> {
    return this.http.get<SpringApiResponse<SdsChemicalDto[]>>(`${this.apiUrl}/unprocessed`);
  }

  getById(id: number): Observable<SpringApiResponse<SdsChemicalDto>> {
    return this.http.get<SpringApiResponse<SdsChemicalDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  save(dto: SdsChemicalDto): Observable<SpringApiResponse<SdsChemicalDto>> {
    if (dto.id) {
      return this.http.put<SpringApiResponse<SdsChemicalDto>>(`${this.apiUrl}/${dto.id}`, dto.toJson()).pipe(
        tap(res => { if (res.responseData) this.itemUpdatedSubject.next(SdsChemicalDto.fromJson(res.responseData)); })
      );
    }
    return this.http.post<SpringApiResponse<SdsChemicalDto>>(`${this.apiUrl}`, dto.toJson()).pipe(
      tap(res => { if (res.responseData) this.itemUpdatedSubject.next(SdsChemicalDto.fromJson(res.responseData)); })
    );
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.itemDeletedSubject.next(id))
    );
  }

  changeStatus(id: number, status: string): Observable<SpringApiResponse<SdsChemicalDto>> {
    return this.http.post<SpringApiResponse<SdsChemicalDto>>(`${this.apiUrl}/${id}/change-status/${status}`, {}).pipe(
      tap(res => { if (res.responseData) this.itemUpdatedSubject.next(SdsChemicalDto.fromJson(res.responseData)); })
    );
  }

  getSuggestedAddress(): Observable<SpringApiResponse<{ bookNumber: number; sectionNumber: number }>> {
    return this.http.get<SpringApiResponse<{ bookNumber: number; sectionNumber: number }>>(`${this.apiUrl}/suggest-address`);
  }

  dumpPdfs(files: { fileName: string; contentType: string; base64Content: string }[]): Observable<SpringApiResponse<number>> {
    return this.http.post<SpringApiResponse<number>>(`${this.apiUrl}/dump`, files);
  }

  getAttachments(id: number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.apiUrl}/${id}/attachments`);
  }

  uploadAttachment(id: number, file: { fileName: string; contentType: string; base64Content: string }): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/${id}/attachments`, file);
  }

  deleteAttachment(id: number, attachmentId: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}/attachments/${attachmentId}`);
  }
}
