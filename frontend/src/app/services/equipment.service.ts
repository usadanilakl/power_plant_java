
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EquipmentDto } from '../models/equipment/equipment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/equipment`;

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

  searchEquipment(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<EquipmentDto[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<EquipmentDto[]>>(`${this.apiUrl}/search`, criteria, { params });
  }
  searchEqByBaseTagNumber(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<SpringPaginatedResponse<EquipmentDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<EquipmentDto>>(`${this.apiUrl}/search-by-base-tag-number`, criteria, { params });
  }

  updateEquipment(equipment: EquipmentDto): Observable<SpringApiResponse<EquipmentDto>> {
    return this.http.put<SpringApiResponse<EquipmentDto>>(`${this.apiUrl}`, equipment.toIdModel());
  }

  deleteEquipment(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getByEquipmentType(equipmentType: string): Observable<SpringApiResponse<EquipmentDto[]>> {
    return this.http.get<SpringApiResponse<EquipmentDto[]>>(`${this.apiUrl}/by-type/${equipmentType}`);
  }
}