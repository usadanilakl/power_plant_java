
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { EquipmentDto } from '../models/equipment/equipment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';
import { FileDto } from '../models/file/file.model';
import { RfShape } from '../shared/image/refactored/models/fr-shape.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/equipment`;

  // Subject to broadcast equipment updates to all listening components
  private equipmentUpdatedSubject = new Subject<EquipmentDto>();
  equipmentUpdated$ = this.equipmentUpdatedSubject.asObservable();

  // Subject to broadcast equipment deletions
  private equipmentDeletedSubject = new Subject<number>();
  equipmentDeleted$ = this.equipmentDeletedSubject.asObservable();

  constructor(private http: HttpClient) {}

  getEquipment(page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<EquipmentDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<EquipmentDto[]>>(`${this.apiUrl}/paginated`, { params });
  }

  getEquipmentById(id: number): Observable<SpringApiResponse<EquipmentDto>> {
    return this.http.get<SpringApiResponse<EquipmentDto>>(`${this.apiUrl}/${id}`);
  }
  getEquipmentForAnotherUnit(tagNumber: string | null | undefined): Observable<SpringApiResponse<EquipmentDto>> {
    return this.http.post<SpringApiResponse<EquipmentDto>>(`${this.apiUrl}/get-other-unit-equipment`, { tagNumber:tagNumber });
  }

  searchEquipment(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<EquipmentDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<EquipmentDto>>(`${this.apiUrl}/search`, criteria, { params });
  }
  searchEqByBaseTagNumber(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<EquipmentDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<EquipmentDto>>(`${this.apiUrl}/search-by-base-tag-number`, criteria, { params });
  }

  updateEquipment(equipment: EquipmentDto): Observable<SpringApiResponse<EquipmentDto>> {
    return this.http.put<SpringApiResponse<EquipmentDto>>(`${this.apiUrl}`, equipment.toIdModel()).pipe(
      tap(response => {
        if (response.responseData) {
          // Broadcast the updated equipment to all listeners
          const updatedEquipment = EquipmentDto.fromJson(response.responseData);
          this.equipmentUpdatedSubject.next(updatedEquipment);
        }
      })
    );
  }

  deleteEquipment(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Broadcast the deletion to all listeners
        this.equipmentDeletedSubject.next(id);
      })
    );
  }

  getByEquipmentType(equipmentType: string): Observable<SpringApiResponse<EquipmentDto[]>> {
    return this.http.get<SpringApiResponse<EquipmentDto[]>>(`${this.apiUrl}/by-type/${equipmentType}`);
  }
  copyEquipment(id: number, fileId: number): Observable<SpringApiResponse<EquipmentDto>> {
    return this.http.post<SpringApiResponse<EquipmentDto>>(`${this.apiUrl}/copy`, {eqId: id, fileId: fileId });
  }

  getRelatedFiles(id: number): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(`${this.apiUrl}/${id}/related-files`);
  }
}