import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SyncAuditEntityType, SyncAuditComparison } from './sync-audit.models';

@Injectable({ providedIn: 'root' })
export class SyncAuditApiService {
  private baseUrl = `${environment.apiUrl}/sync-audit`;

  constructor(private http: HttpClient) {}

  getEntityTypes(): Observable<SpringApiResponse<SyncAuditEntityType[]>> {
    return this.http.get<SpringApiResponse<SyncAuditEntityType[]>>(
      `${this.baseUrl}/entity-types`
    );
  }

  getEntities(entityType: string): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(
      `${this.baseUrl}/entities/${entityType}`
    );
  }

  getComparison(entityType: string, entityId: number): Observable<SpringApiResponse<SyncAuditComparison>> {
    return this.http.get<SpringApiResponse<SyncAuditComparison>>(
      `${this.baseUrl}/comparison/${entityType}/${entityId}`
    );
  }
}
