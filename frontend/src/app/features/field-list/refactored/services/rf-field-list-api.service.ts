import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';

@Injectable({ providedIn: 'root' })
export class RfFieldListApiService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.baseApiUrl}/ng/field-list-items`;

  private itemUpdatedSubject = new Subject<FieldListItemDto>();
  itemUpdated$ = this.itemUpdatedSubject.asObservable();

  private itemDeletedSubject = new Subject<number>();
  itemDeleted$ = this.itemDeletedSubject.asObservable();

  getAll(): Observable<SpringApiResponse<FieldListItemDto[]>> {
    return this.http.get<SpringApiResponse<FieldListItemDto[]>>(`${this.apiUrl}/get-all`);
  }

  getByListType(listType: string): Observable<SpringApiResponse<FieldListItemDto[]>> {
    return this.http.get<SpringApiResponse<FieldListItemDto[]>>(`${this.apiUrl}/by-list-type/${listType}`);
  }

  getByStatus(status: string): Observable<SpringApiResponse<FieldListItemDto[]>> {
    return this.http.get<SpringApiResponse<FieldListItemDto[]>>(`${this.apiUrl}/by-status/${status}`);
  }

  getById(id: number): Observable<SpringApiResponse<FieldListItemDto>> {
    return this.http.get<SpringApiResponse<FieldListItemDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  save(dto: FieldListItemDto): Observable<SpringApiResponse<FieldListItemDto>> {
    if (dto.id) {
      return this.http.put<SpringApiResponse<FieldListItemDto>>(`${this.apiUrl}/${dto.id}`, dto.toJson()).pipe(
        tap(res => { if (res.responseData) this.itemUpdatedSubject.next(FieldListItemDto.fromJson(res.responseData)); })
      );
    }
    return this.http.post<SpringApiResponse<FieldListItemDto>>(`${this.apiUrl}`, dto.toJson()).pipe(
      tap(res => { if (res.responseData) this.itemUpdatedSubject.next(FieldListItemDto.fromJson(res.responseData)); })
    );
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.itemDeletedSubject.next(id))
    );
  }
}
