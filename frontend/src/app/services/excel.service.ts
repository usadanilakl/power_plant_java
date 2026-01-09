import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../models/api/spring-api-response.model";
import { SearchCriteria } from "../models/api/search-criteria.model";

export type ExportEntityType = 'loto-point' | 'file' | 'loto-standard';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = `${environment.apiUrl}/excel`;

  constructor(private http: HttpClient) {}

  // ==================== LOTO POINT ====================
  exportLotoPointAll(): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.apiUrl}/loto-point/export-all`);
  }

  exportLotoPointByQuery(criteria: SearchCriteria): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/loto-point/export-by-query`, criteria);
  }

  exportLotoPointByIds(ids: number[]): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/loto-point/export-by-ids`, ids);
  }

  // ==================== FILE ====================
  exportFileAll(): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.apiUrl}/file/export-all`);
  }

  exportFileByQuery(criteria: SearchCriteria): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/file/export-by-query`, criteria);
  }

  exportFileByIds(ids: number[]): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/file/export-by-ids`, ids);
  }

  // ==================== LOTO STANDARD ====================
  exportLotoStandardAll(): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.apiUrl}/loto-standard/export-all`);
  }

  exportLotoStandardByQuery(criteria: SearchCriteria): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/loto-standard/export-by-query`, criteria);
  }

  exportLotoStandardByIds(ids: number[]): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/loto-standard/export-by-ids`, ids);
  }

  // ==================== LEGACY (backward compatibility) ====================
  /** @deprecated Use exportLotoPointAll() instead */
  exportAll(): Observable<SpringApiResponse<string>> {
    return this.exportLotoPointAll();
  }

  /** @deprecated Use exportLotoPointByQuery() instead */
  exportByQuery(criteria: SearchCriteria): Observable<SpringApiResponse<string>> {
    return this.exportLotoPointByQuery(criteria);
  }

  /** @deprecated Use exportLotoPointByIds() instead */
  exportByIds(ids: number[]): Observable<SpringApiResponse<string>> {
    return this.exportLotoPointByIds(ids);
  }
}