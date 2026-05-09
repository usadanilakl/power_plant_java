import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

@Injectable({ providedIn: 'root' })
export class RfInventoryApiService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}/ng/inventory-items`;

  private itemUpdatedSubject = new Subject<InventoryItemDto>();
  itemUpdated$ = this.itemUpdatedSubject.asObservable();

  private itemDeletedSubject = new Subject<number>();
  itemDeleted$ = this.itemDeletedSubject.asObservable();

  getAll(): Observable<SpringApiResponse<InventoryItemDto[]>> {
    return this.http.get<SpringApiResponse<InventoryItemDto[]>>(`${this.apiUrl}/get-all`);
  }

  getByType(type: string): Observable<SpringApiResponse<InventoryItemDto[]>> {
    return this.http.get<SpringApiResponse<InventoryItemDto[]>>(`${this.apiUrl}/by-type/${type}`);
  }

  getByStatus(status: string): Observable<SpringApiResponse<InventoryItemDto[]>> {
    return this.http.get<SpringApiResponse<InventoryItemDto[]>>(`${this.apiUrl}/by-status/${status}`);
  }

  getById(id: number): Observable<SpringApiResponse<InventoryItemDto>> {
    return this.http.get<SpringApiResponse<InventoryItemDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  getByQrToken(qrToken: string): Observable<SpringApiResponse<InventoryItemDto>> {
    return this.http.get<SpringApiResponse<InventoryItemDto>>(`${this.apiUrl}/by-qr/${qrToken}`);
  }

  save(dto: InventoryItemDto): Observable<SpringApiResponse<InventoryItemDto>> {
    if (dto.id) {
      return this.http.put<SpringApiResponse<InventoryItemDto>>(`${this.apiUrl}/${dto.id}`, dto.toJson()).pipe(
        tap(res => { if (res.responseData) this.itemUpdatedSubject.next(InventoryItemDto.fromJson(res.responseData)); })
      );
    }
    return this.http.post<SpringApiResponse<InventoryItemDto>>(`${this.apiUrl}`, dto.toJson()).pipe(
      tap(res => { if (res.responseData) this.itemUpdatedSubject.next(InventoryItemDto.fromJson(res.responseData)); })
    );
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.itemDeletedSubject.next(id))
    );
  }

  changeStatus(id: number, status: string): Observable<SpringApiResponse<InventoryItemDto>> {
    return this.http.post<SpringApiResponse<InventoryItemDto>>(`${this.apiUrl}/${id}/change-status/${status}`, {}).pipe(
      tap(res => { if (res.responseData) this.itemUpdatedSubject.next(InventoryItemDto.fromJson(res.responseData)); })
    );
  }

  getUsage(id: number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.apiUrl}/${id}/usage`);
  }

  recordUsage(id: number, body: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/${id}/usage`, body);
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
