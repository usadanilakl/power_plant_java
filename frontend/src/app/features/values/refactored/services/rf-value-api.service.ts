import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RfValueDto, RfCategoryDto, SpringApiResponse } from '../models/rf-value.model';
import { environment } from '../../../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class RfValueApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/rf-values`;

  // ==================== CREATE ====================

  createValue(categoryAlias: string, valueName: string, valueAlias?: string): Observable<RfValueDto> {
    return this.http.post<SpringApiResponse<RfValueDto>>(this.baseUrl, {
      categoryAlias,
      valueName,
      valueAlias
    }).pipe(map(response => response.responseData));
  }

  // ==================== READ ====================

  getValuesByCategory(categoryAlias: string): Observable<RfValueDto[]> {
    return this.http.get<SpringApiResponse<RfValueDto[]>>(
      `${this.baseUrl}/category/${categoryAlias}`
    ).pipe(map(response => response.responseData));
  }

  getAllValues(): Observable<RfValueDto[]> {
    return this.http.get<SpringApiResponse<RfValueDto[]>>(
      `${this.baseUrl}/all`
    ).pipe(map(response => response.responseData));
  }

  getValueById(valueId: number): Observable<RfValueDto> {
    return this.http.get<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/${valueId}`
    ).pipe(map(response => response.responseData));
  }

  getAllCategories(): Observable<RfCategoryDto[]> {
    return this.http.get<SpringApiResponse<RfCategoryDto[]>>(
      `${this.baseUrl}/categories`
    ).pipe(map(response => response.responseData));
  }

  getValuesByCategories(categoryAliases: string[]): Observable<Map<string, RfValueDto[]>> {
    return this.http.post<SpringApiResponse<{[key: string]: RfValueDto[]}>>(
      `${this.baseUrl}/categories/bulk`,
      { categoryAliases }
    ).pipe(map(response => new Map(Object.entries(response.responseData))));
  }

  // ==================== UPDATE ====================

  updateValue(valueId: number, name: string, alias?: string): Observable<RfValueDto> {
    return this.http.put<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/${valueId}`,
      { name, alias }
    ).pipe(map(response => response.responseData));
  }

  // ==================== DELETE ====================

  deleteValue(valueId: number, transferToValueId?: number): Observable<void> {
    const url = transferToValueId
      ? `${this.baseUrl}/${valueId}?transferToValueId=${transferToValueId}`
      : `${this.baseUrl}/${valueId}`;
    return this.http.delete<SpringApiResponse<void>>(url).pipe(map(() => undefined));
  }

  // ==================== VALIDATION ====================

  canDeleteValue(valueId: number): Observable<boolean> {
    return this.http.get<SpringApiResponse<boolean>>(
      `${this.baseUrl}/${valueId}/can-delete`
    ).pipe(map(response => response.responseData));
  }

  getValueDependencies(valueId: number): Observable<Map<string, number>> {
    return this.http.get<SpringApiResponse<{[key: string]: number}>>(
      `${this.baseUrl}/${valueId}/dependencies`
    ).pipe(map(response => new Map(Object.entries(response.responseData))));
  }
}
